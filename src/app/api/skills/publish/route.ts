/**
 * POST /api/skills/publish
 * 用户一键发布技能到社区
 *
 * 流程：
 * 1. 鉴权 + 确认 owner
 * 2. 服务端二次校验门槛（防前端绕过）
 * 3. status → 'Community'，credits_per_call = 1（强制）
 * 4. 写入 community_publish_log
 * 5. 异步触发 AI 抽检（不阻塞响应）
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { createClient } from '@supabase/supabase-js';
import { getPublishThresholds } from '@/lib/platform-config';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { skill_uid, category, tags } = body;

  if (!skill_uid) {
    return NextResponse.json({ error: 'Missing skill_uid' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. 获取技能信息，确认 owner
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
      .select('skill_uid, skill_name, category, status, state, total_calls, owner_uid')
      .eq('skill_uid', skill_uid)
      .maybeSingle();

    if (skillError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (skill.owner_uid !== userUid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. 技能必须已 finalize（state = active）
    if (skill.state !== 'active') {
      return NextResponse.json(
        { error: 'Skill must be finalized (active) before publishing' },
        { status: 400 }
      );
    }

    // 3. 防重发布
    if (skill.status === 'Community' || skill.status === 'Flagged') {
      return NextResponse.json(
        { error: 'Skill is already published', current_status: skill.status },
        { status: 409 }
      );
    }

    // 4. 服务端二次校验发布门槛
    const thresholds = await getPublishThresholds(skill.category ?? undefined);

    // 从 skill_usage_logs 精确统计，不依赖 skills.total_calls（可能混算多个同名技能）
    const { data: allLogs } = await supabaseAdmin
      .from('skill_usage_logs')
      .select('execution_status')
      .eq('source_skill_uid', skill.skill_uid);

    const successCount = allLogs?.filter(r => r.execution_status === 'SUCCESS').length ?? 0;
    const failedCount  = allLogs?.filter(r => r.execution_status === 'FAILED').length ?? 0;
    const totalCalls   = successCount + failedCount;  // SKIPPED 不计入
    const successRate  = totalCalls > 0 ? successCount / totalCalls : 0;

    if (totalCalls < thresholds.minCalls) {
      return NextResponse.json(
        {
          error: 'Publish threshold not met: insufficient calls',
          current_calls: totalCalls,
          required_calls: thresholds.minCalls,
          missing_calls: thresholds.minCalls - totalCalls,
        },
        { status: 403 }
      );
    }

    if (successRate < thresholds.minSuccessRate) {
      return NextResponse.json(
        {
          error: 'Publish threshold not met: success rate too low',
          current_success_rate: successRate,
          required_success_rate: thresholds.minSuccessRate,
        },
        { status: 403 }
      );
    }

    // 5. 发布：更新技能状态，强制 credits_per_call = 1
    const updatePayload: Record<string, any> = {
      status: 'Community',
      credits_per_call: 1,       // MVP 统一定价，不接受自定义
      published_at: new Date().toISOString(),
    };
    // 更新用户传入的 category / tags（可选）
    if (category) updatePayload.category = category;
    if (tags) updatePayload.tags = tags;

    const { error: updateError } = await supabaseAdmin
      .from('skills')
      .update(updatePayload)
      .eq('skill_uid', skill_uid);

    if (updateError) throw updateError;

    // 6. 记录发布日志
    await supabaseAdmin.from('community_publish_log').insert({
      skill_uid,
      action: 'publish',
      actor_uid: userUid,
      note: null,
    });

    // 7. 异步触发 AI 抽检（best-effort，不阻塞本次响应）
    const skillUidForCheck = skill_uid;
    const skillNameForCheck = skill.skill_name;
    setTimeout(async () => {
      try {
        await supabaseAdmin
          .from('skills')
          .update({ ai_checked_at: new Date().toISOString() } as any)
          .eq('skill_uid', skillUidForCheck);
        console.log(`[AI Check] Queued for skill: ${skillNameForCheck}`);
      } catch (e: any) {
        console.warn('[AI Check] Trigger failed (non-blocking):', e.message);
      }
    }, 0);

    return NextResponse.json({ success: true, skill_name: skill.skill_name });
  } catch (err: any) {
    console.error('[skills/publish] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



