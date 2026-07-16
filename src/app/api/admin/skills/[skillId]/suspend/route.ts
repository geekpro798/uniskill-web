/**
 * POST /api/admin/skills/[skillId]/suspend  — 管理员下架技能
 * POST /api/admin/skills/[skillId]/restore  — 管理员恢复上架
 */

import { NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/admin/skills/[skillId]/suspend
export async function POST(
  req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { skillId } = await params;
  const body = await req.json();
  const { reason } = body;

  if (!reason?.trim()) {
    return NextResponse.json(
      { error: 'A suspend reason is required' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('skill_uid, skill_name, status')
      .eq('skill_uid', skillId)
      .maybeSingle();

    if (skillError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (skill.status === 'Suspended') {
      return NextResponse.json(
        { error: 'Skill is already suspended' },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from('skills')
      .update({
        status: 'Suspended',
        suspend_reason: reason.trim(),
      })
      .eq('skill_uid', skillId);

    if (updateError) throw updateError;

    // 记录操作日志
    await supabase.from('community_publish_log').insert({
      skill_uid: skillId,
      action: 'suspend',
      actor_uid: (admin as any).user_uid ?? null,
      note: reason.trim(),
    });

    return NextResponse.json({ success: true, skill_name: skill.skill_name });
  } catch (err: any) {
    console.error('[admin/skills/suspend] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
