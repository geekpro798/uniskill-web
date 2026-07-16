// src/app/api/admin/enterprises/[uid]/route.ts
// Admin API: 单个企业账号查询与更新

import { NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/enterprises/[uid] — 企业详情
export async function GET(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { uid } = await params;

  const { data: enterprise, error } = await supabase
    .from('enterprise_accounts')
    .select('*')
    .eq('account_uid', uid)
    .maybeSingle();

  if (error || !enterprise) {
    return NextResponse.json({ error: 'Enterprise not found' }, { status: 404 });
  }

  // 并行获取关联数据
  const [
    { data: team },
    { count: memberCount },
    { count: skillCount },
    { data: recentAudit },
    { data: tunnels },
    { data: members },
  ] = await Promise.all([
    supabase.from('teams').select('*').eq('team_uid', enterprise.team_uid).maybeSingle(),
    supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_uid', enterprise.team_uid),
    supabase.from('skills').select('*', { count: 'exact', head: true }).eq('team_uid', enterprise.team_uid),
    supabase.from('audit_logs').select('*').eq('enterprise_uid', uid).order('created_at', { ascending: false }).limit(10),
    supabase.from('team_tunnels').select('*').eq('team_uid', enterprise.team_uid),
    supabase.from('team_members').select('user_uid, role, joined_at').eq('team_uid', enterprise.team_uid).limit(20),
  ]);

  // 获取成员 profile 信息
  let memberProfiles: any[] = [];
  if (members && members.length > 0) {
    const memberUids = members.map(m => m.user_uid);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_uid, username, email, avatar_url')
      .in('user_uid', memberUids);
    memberProfiles = (profiles || []).map(p => {
      const m = members.find(mm => mm.user_uid === p.user_uid);
      return { ...p, role: m?.role, joined_at: m?.joined_at };
    });
  }

  return NextResponse.json({
    enterprise,
    team,
    stats: {
      memberCount: memberCount || 0,
      skillCount: skillCount || 0,
      tunnelCount: tunnels?.length || 0,
      activeTunnels: tunnels?.filter((t: any) => t.status === 'active').length || 0,
    },
    members: memberProfiles,
    recentAudit,
    tunnels,
  });
}

// PATCH /api/admin/enterprises/[uid] — 更新企业信息
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
    'company_name', 'contact_name', 'contact_email', 'contact_phone',
    'max_members', 'max_skills', 'max_credits_month',
    'monthly_fee_usd', 'plan', 'notes',
    'contract_start', 'contract_end',
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
    .from('enterprise_accounts')
    .update(updates)
    .eq('account_uid', uid)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 同步更新 team name
  if (body.company_name && data.team_uid) {
    await supabase
      .from('teams')
      .update({ name: body.company_name })
      .eq('team_uid', data.team_uid);
  }

  await supabase.from('audit_logs').insert({
    enterprise_uid: uid,
    team_uid: data.team_uid,
    user_uid: admin.userUid,
    action: 'enterprise.update',
    resource_type: 'enterprise',
    resource_id: uid,
    details: { updated_fields: Object.keys(updates) },
  });

  return NextResponse.json({ success: true, enterprise: data });
}
