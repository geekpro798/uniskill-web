/**
 * GET /api/skills/publish-eligibility/[skillId]
 * 查询技能的社区发布资格（前端进度条数据来源）
 * 返回：当前调用次数、成功率、是否达标、距达标差多少次
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPublishThresholds } from '@/lib/platform-config';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;

  try {
    // 使用 service role 客户端，绕过 RLS，确保能读到 skill_usage_logs
    const supabaseAdmin = getSupabaseAdmin();

    // 1. 获取技能基础信息
    const { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .select('skill_uid, skill_name, category, status, total_calls')
      .eq('skill_name', skillId)
      .maybeSingle();

    if (skillError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // 2. 获取该品类的发布门槛配置
    const thresholds = await getPublishThresholds(skill.category ?? undefined);

    // 3. 从 skill_usage_logs 精确统计，完全不依赖 skills.total_calls（可能被多个同名技能混算）
    const { data: allLogs } = await supabaseAdmin
      .from('skill_usage_logs')
      .select('execution_status')
      .eq('source_skill_uid', skill.skill_uid);  // 不过滤状态，统计该 UID 的全部调用

    const successCount = allLogs?.filter(r => r.execution_status === 'SUCCESS').length ?? 0;
    const failedCount  = allLogs?.filter(r => r.execution_status === 'FAILED').length ?? 0;
    const totalCalls   = successCount + failedCount;  // SKIPPED 不计入，仅统计真实执行
    const successRate  = totalCalls > 0 ? successCount / totalCalls : 0;

    const eligible =
      totalCalls >= thresholds.minCalls &&
      successRate >= thresholds.minSuccessRate;

    return NextResponse.json({
      skill_name: skill.skill_name,
      current_status: skill.status,
      total_calls: totalCalls,
      success_rate: successRate,
      thresholds: {
        min_calls: thresholds.minCalls,
        min_success_rate: thresholds.minSuccessRate,
      },
      eligible,
      missing_calls: Math.max(0, thresholds.minCalls - totalCalls),
    });
  } catch (err: any) {
    console.error('[publish-eligibility] Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
