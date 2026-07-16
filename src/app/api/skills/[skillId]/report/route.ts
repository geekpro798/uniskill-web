/**
 * POST /api/skills/[skillId]/report
 * 登录用户举报社区技能
 *
 * 规则：
 * - 同一用户对同一技能只能举报一次（DB unique 约束）
 * - 举报数累计 ≥ REPORT_THRESHOLD 自动标记为 Flagged
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { createClient } from '@supabase/supabase-js';

// 自动触发 Flagged 的举报数阈值（可移入 platform_config）
const REPORT_THRESHOLD = 3;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { skillId } = await params;
  const body = await req.json();
  const { report_type, description } = body;

  const VALID_TYPES = ['spam', 'malicious_code', 'copyright', 'other'];
  if (!report_type || !VALID_TYPES.includes(report_type)) {
    return NextResponse.json(
      { error: 'Invalid report_type. Must be one of: ' + VALID_TYPES.join(', ') },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    let reporterUid = (session.user as any).userUid;
    if (!reporterUid) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_uid')
        .eq('github_id', session.user.id)
        .maybeSingle();
      if (profile) reporterUid = profile.user_uid;
    }

    // 查找技能（按 skill_name）
    const { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .select('skill_uid, skill_name, status, owner_uid')
      .eq('skill_name', skillId)
      .maybeSingle();

    if (skillError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // 不能举报自己的技能
    if (skill.owner_uid === reporterUid) {
      return NextResponse.json(
        { error: 'You cannot report your own skill' },
        { status: 400 }
      );
    }

    // 只能举报社区技能
    if (!['Community', 'Flagged'].includes(skill.status)) {
      return NextResponse.json(
        { error: 'Only published community skills can be reported' },
        { status: 400 }
      );
    }

    // 写入举报记录（unique 约束会阻止重复举报）
    const { error: insertError } = await supabaseAdmin
      .from('skill_reports')
      .insert({
        skill_uid: skill.skill_uid,
        reporter_uid: reporterUid,
        report_type,
        description: description ?? null,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        // unique 约束冲突：已举报过
        return NextResponse.json(
          { error: 'You have already reported this skill' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    // 检查举报总数，达到阈值则自动标记 Flagged
    const { count: reportCount } = await supabaseAdmin
      .from('skill_reports')
      .select('id', { count: 'exact', head: true })
      .eq('skill_uid', skill.skill_uid)
      .eq('status', 'pending');

    if ((reportCount ?? 0) >= REPORT_THRESHOLD && skill.status === 'Community') {
      await supabaseAdmin
        .from('skills')
        .update({ status: 'Flagged' })
        .eq('skill_uid', skill.skill_uid);

      await supabaseAdmin.from('community_publish_log').insert({
        skill_uid: skill.skill_uid,
        action: 'flag',
        actor_uid: null, // 系统自动触发
        note: `Auto-flagged after ${reportCount} reports`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[skills/report] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
