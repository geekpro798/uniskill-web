/**
 * POST /api/admin/skills/[skillId]/restore
 * 管理员恢复被下架或被标记的技能（回到 Community 状态）
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { skillId } = await params;
  const body = await req.json().catch(() => ({}));
  const note = body.note ?? 'Restored by admin';

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

    if (!['Suspended', 'Flagged'].includes(skill.status)) {
      return NextResponse.json(
        { error: 'Only Suspended or Flagged skills can be restored' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('skills')
      .update({
        status: 'Community',
        suspend_reason: null,      // 清空下架原因
      })
      .eq('skill_uid', skillId);

    if (updateError) throw updateError;

    await supabase.from('community_publish_log').insert({
      skill_uid: skillId,
      action: 'restore',
      actor_uid: (admin as any).user_uid ?? null,
      note,
    });

    return NextResponse.json({ success: true, skill_name: skill.skill_name });
  } catch (err: any) {
    console.error('[admin/skills/restore] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
