/**
 * POST /api/skills/unpublish
 * 用户主动撤回社区发布，技能回到 Private 状态
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { skill_uid } = body;

  if (!skill_uid) {
    return NextResponse.json({ error: 'Missing skill_uid' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    let userUid = (session.user as any).userUid;
    if (!userUid) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_uid')
        .eq('github_id', session.user.id)
        .maybeSingle();
      if (profile) userUid = profile.user_uid;
    }

    const { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .select('skill_uid, skill_name, status, owner_uid')
      .eq('skill_uid', skill_uid)
      .maybeSingle();

    if (skillError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (skill.owner_uid !== userUid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 只有 Community 或 Flagged 状态才能撤回
    if (!['Community', 'Flagged'].includes(skill.status)) {
      return NextResponse.json(
        { error: 'Skill is not currently published' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('skills')
      .update({ status: 'Private' })
      .eq('skill_uid', skill_uid);

    if (updateError) throw updateError;

    // 记录操作日志
    await supabaseAdmin.from('community_publish_log').insert({
      skill_uid,
      action: 'unpublish',
      actor_uid: userUid,
      note: 'User voluntarily withdrew from community',
    });

    return NextResponse.json({ success: true, skill_name: skill.skill_name });
  } catch (err: any) {
    console.error('[skills/unpublish] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
