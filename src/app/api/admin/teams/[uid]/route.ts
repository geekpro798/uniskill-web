// src/app/api/admin/teams/[uid]/route.ts
// Admin API: 单个企业（团队）查询与更新

import { NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/teams/[uid] — 企业（团队）详情
export async function GET(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { uid } = await params;

  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('team_uid', uid)
    .maybeSingle();

  if (error || !team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // 并行获取关联数据
  const [
    { count: memberCount },
    { count: skillCount },
    { data: recentAudit },
    { data: tunnels },
    { data: members },
  ] = await Promise.all([
    supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_uid', uid),
    supabase.from('skills').select('*', { count: 'exact', head: true }).eq('team_uid', uid),
    supabase.from('audit_logs').select('*').eq('team_uid', uid).order('created_at', { ascending: false }).limit(10),
    supabase.from('team_tunnels').select('*').eq('team_uid', uid),
    supabase.from('team_members').select('user_uid, role, joined_at').eq('team_uid', uid).limit(20),
  ]);

  // 获取成员 profile 信息
  let memberProfiles: any[] = [];
  if (members && members.length > 0) {
    const memberUids = members.map(m => m.user_uid);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_uid, username, email, avatar_url')
      .in('user_uid', memberUids);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_uid, p]));
    memberProfiles = members.map(m => {
      const p = profileMap.get(m.user_uid);
      return {
        user_uid: m.user_uid,
        role: m.role,
        joined_at: m.joined_at,
        username: p?.username || (m.user_uid === (team as any).admin_uid ? ((team as any).admin_email || null) : null),
        email: p?.email || (m.user_uid === (team as any).admin_uid ? ((team as any).admin_email || null) : null),
        avatar_url: p?.avatar_url || null,
      };
    });
  }

  return NextResponse.json({
    team,
    members: memberProfiles,
    stats: {
      memberCount: memberCount || 0,
      skillCount: skillCount || 0,
      tunnelCount: tunnels?.length || 0,
      activeTunnels: tunnels?.filter((t: any) => t.status === 'active').length || 0,
    },
    recentAudit,
    tunnels,
  });
}

// PATCH /api/admin/teams/[uid] — 更新企业（团队）信息
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { uid } = await params;
  const body = await req.json();

  const allowedFields = [
    'name', 'contact_name', 'contact_email', 'contact_phone',
    'max_members', 'max_skills', 'max_credits_month',
    'monthly_fee_usd', 'plan', 'notes',
    'contract_start', 'contract_end', 'credits',
  ];

  const updates: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('team_uid', uid)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('audit_logs').insert({
    team_uid: uid,
    user_uid: admin.userUid,
    action: 'enterprise.update',
    resource_type: 'team',
    resource_id: uid,
    details: { updated_fields: Object.keys(updates) },
  });

  return NextResponse.json({ success: true, team: data });
}
