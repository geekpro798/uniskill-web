/**
 * GET /api/admin/skills
 * 管理员查看社区技能列表，支持按状态过滤
 * 用于：社区治理监控台
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

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);

  const status = url.searchParams.get('status') || 'all';       // all | Community | Flagged | Suspended
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('skills')
      .select(`
        skill_uid,
        skill_name,
        display_name,
        description,
        category,
        status,
        state,
        owner_uid,
        owner_anonymous,
        total_calls,
        ai_risk_score,
        ai_checked_at,
        suspend_reason,
        published_at,
        credits_per_call,
        emoji
      `, { count: 'exact' });

    // 状态过滤
    if (status !== 'all') {
      query = query.eq('status', status);
    } else {
      // 默认只显示社区相关状态，排除纯私有/团队
      query = query.in('status', ['Community', 'Flagged', 'Suspended']);
    }

    // 搜索
    if (search) {
      query = query.or(
        `skill_name.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    // Flagged 置顶，其余按发布时间倒序
    query = query
      .order('status', { ascending: true })   // Flagged < Suspended < Community（字母序）
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // 批量获取各技能举报数
    const skillUids = (data || []).map(s => s.skill_uid);
    let reportCountMap: Record<string, number> = {};

    if (skillUids.length > 0) {
      const { data: reportCounts } = await supabase
        .from('skill_reports')
        .select('skill_uid')
        .in('skill_uid', skillUids)
        .eq('status', 'pending');

      (reportCounts || []).forEach(r => {
        reportCountMap[r.skill_uid] = (reportCountMap[r.skill_uid] || 0) + 1;
      });
    }

    const enriched = (data || []).map(skill => ({
      ...skill,
      pending_reports: reportCountMap[skill.skill_uid] || 0,
    }));

    return NextResponse.json({
      data: enriched,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err: any) {
    console.error('[admin/skills] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
