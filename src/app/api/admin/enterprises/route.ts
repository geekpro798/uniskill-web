// src/app/api/admin/enterprises/route.ts
// Admin API: 企业账号列表 & 创建

import { NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/enterprises — 列出所有企业账号
export async function GET(req: Request) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('enterprise_accounts')
    .select('*');

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`company_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
  }

  // 多取一条判断是否有下一页，避免 COUNT(*) 全表扫描
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  return NextResponse.json({
    data: items,
    pagination: {
      page,
      limit,
      hasMore,
    },
  });
}

// POST /api/admin/enterprises — 创建企业账号 + 自动开通团队
export async function POST(req: Request) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();

  const body = await req.json();
  const {
    company_name,
    company_slug,
    contact_name,
    contact_email,
    contact_phone,
    plan = 'mode1',
    max_members = 50,
    max_skills = 100,
    max_credits_month = 100000,
    monthly_fee_usd = 99,
    notes,
    initial_admin_email,
    initial_admin_github_id,
  } = body;

  // 基础校验
  if (!company_name?.trim() || !company_slug?.trim()) {
    return NextResponse.json(
      { error: 'company_name and company_slug are required' },
      { status: 400 }
    );
  }

  // 检查 slug 唯一性
  const { data: existing } = await supabase
    .from('enterprise_accounts')
    .select('id')
    .eq('company_slug', company_slug.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Slug "${company_slug}" is already taken` },
      { status: 409 }
    );
  }

  // Step 1: 创建团队
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: company_name.trim(),
      slug: company_slug.toLowerCase().trim(),
    })
    .select()
    .single();

  if (teamError) {
    return NextResponse.json({ error: `Team creation failed: ${teamError.message}` }, { status: 500 });
  }

  // Step 2: 创建企业账号
  const { data: enterprise, error: entError } = await supabase
    .from('enterprise_accounts')
    .insert({
      company_name: company_name.trim(),
      company_slug: company_slug.toLowerCase().trim(),
      contact_name: contact_name || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      plan,
      status: 'active',
      team_uid: team.team_uid,
      max_members,
      max_skills,
      max_credits_month,
      monthly_fee_usd,
      notes: notes || null,
      created_by: admin.userUid,
      contract_start: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (entError) {
    // 回滚 team
    await supabase.from('teams').delete().eq('team_uid', team.team_uid);
    return NextResponse.json({ error: `Enterprise creation failed: ${entError.message}` }, { status: 500 });
  }

  // Step 3: 关联初始管理员（如果提供了）
  let adminProfile = null;
  if (initial_admin_email || initial_admin_github_id) {
    let profileQuery = supabase.from('profiles').select('*');

    if (initial_admin_github_id) {
      profileQuery = profileQuery.eq('github_id', String(initial_admin_github_id));
    } else if (initial_admin_email) {
      profileQuery = profileQuery.eq('email', initial_admin_email);
    }

    const { data: foundProfile } = await profileQuery.maybeSingle();

    if (foundProfile) {
      // 添加为团队 owner
      await supabase.from('team_members').insert({
        team_uid: team.team_uid,
        user_uid: foundProfile.user_uid,
        role: 'owner',
      });

      adminProfile = foundProfile;
    }
  }

  // Step 4: 记录审计日志
  await supabase.from('audit_logs').insert({
    enterprise_uid: enterprise.account_uid,
    team_uid: team.team_uid,
    user_uid: admin.userUid,
    action: 'enterprise.create',
    resource_type: 'enterprise',
    resource_id: enterprise.account_uid,
    details: {
      company_name: company_name.trim(),
      plan,
      admin_email: initial_admin_email || null,
    },
  });

  // Step 5: 同步到 Gateway KV
  if (adminProfile) {
    try {
      const gatewayUrl = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:8787';
      await fetch(`${gatewayUrl}/v1/admin/sync_cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_uid: adminProfile.user_uid,
          type: 'enterprise_activation',
          enterprise_uid: enterprise.account_uid,
          team_uid: team.team_uid,
        }),
      });
    } catch (e) {
      console.warn('[Enterprise Create] Gateway sync warning:', e);
    }
  }

  // Step 6: 生成 onboarding URL（企业客户短路径 /t/{slug}）
  const onboardingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/t/${team.slug}`;

  return NextResponse.json({
    success: true,
    enterprise,
    team,
    admin: adminProfile
      ? { user_uid: adminProfile.user_uid, email: adminProfile.email, username: adminProfile.username }
      : null,
    onboarding_url: onboardingUrl,
  });
}
