// src/app/api/admin/teams/route.ts
// Admin API: 企业（团队）列表 & 创建

import { NextResponse } from 'next/server';
import { getAdminRole, requireRole } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/password';
import { randomUUID } from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/teams — 列出所有企业（团队）
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

  let query = supabase.from('teams').select('*');

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,admin_email.ilike.%${search}%`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  // 解析 created_by → 运营人员姓名/邮箱
  const createdByUids = [...new Set(items.map((t: any) => t.created_by).filter(Boolean))];
  const { data: creators } = createdByUids.length > 0
    ? await supabase.from('admin_users').select('user_uid, email, name').in('user_uid', createdByUids)
    : { data: [] };
  const creatorMap = new Map((creators || []).map((c: any) => [c.user_uid, c.name || c.email]));

  const enriched = items.map((t: any) => ({
    ...t,
    created_by_name: creatorMap.get(t.created_by) || null,
  }));

  return NextResponse.json({
    data: enriched,
    currentRole: admin.role,
    pagination: {
      page,
      limit,
      hasMore,
    },
  });
}

// POST /api/admin/teams — 创建企业（团队）
export async function POST(req: Request) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!requireRole(admin, 'admin')) {
    return NextResponse.json({ error: '仅管理员及以上可开通企业' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const body = await req.json();
  const {
    company_name,
    company_slug,
    contact_name,
    contact_email,
    contact_phone,
    contact_password,
    biz_contact_email,
    contactEmailSameAsAdmin,
    plan = 'mode1',
    max_members = 50,
    max_skills = 100,
    max_credits_month = 100000,
    monthly_fee_usd = 99,
    notes,
  } = body;

  const adminEmail = contactEmailSameAsAdmin !== false
    ? (biz_contact_email || '').trim().toLowerCase()
    : (contact_email as string).trim().toLowerCase();
  const bizEmail = (biz_contact_email || contact_email || '').trim().toLowerCase();

  if (!company_name?.trim() || !company_slug?.trim() || !adminEmail || !contact_password?.trim()) {
    return NextResponse.json(
      { error: 'company_name, company_slug, admin email, and contact_password are required' },
      { status: 400 }
    );
  }

  if ((contact_password as string).length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // 检查 slug 唯一性
  const { data: existing } = await supabase
    .from('teams')
    .select('team_uid')
    .eq('slug', company_slug.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Slug "${company_slug}" is already taken` },
      { status: 409 }
    );
  }

  const adminUid = randomUUID();

  // 创建团队（唯一数据源）
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: company_name.trim(),
      slug: company_slug.toLowerCase().trim(),
      created_by: admin.userUid,
      status: 'active',
      plan,
      admin_email: adminEmail,
      password_hash: hashPassword(contact_password as string),
      admin_uid: adminUid,
      contact_name: contact_name || null,
      contact_email: bizEmail || null,
      contact_phone: contact_phone || null,
      max_members: max_members ?? 50,
      max_skills: max_skills ?? 100,
      max_credits_month: max_credits_month ?? 100000,
      monthly_fee_usd: monthly_fee_usd ?? 99,
      credits: 500,
      notes: notes || null,
    })
    .select()
    .single();

  if (teamError) {
    return NextResponse.json({ error: `Team creation failed: ${teamError.message}` }, { status: 500 });
  }

  // 添加企业管理员到 team_members
  await supabase.from('team_members').insert({
    team_uid: team.team_uid,
    user_uid: adminUid,
    role: 'owner',
  });

  // 为 owner 创建 profiles 记录（否则无法调技能、绑钱包）
  const { error: profileError } = await supabase.from('profiles').insert({
    user_uid: adminUid,
    github_id: `email:${adminEmail}`, // 非 GitHub 用户的唯一标识
    email: adminEmail,
    username: adminEmail,
    credits: 0,
    tier: 'FREE',
  });

  if (profileError) {
    console.warn('[Enterprise Create] Profile creation warning:', profileError.message);
  }

  // 记录审计日志
  await supabase.from('audit_logs').insert({
    team_uid: team.team_uid,
    user_uid: admin.userUid,
    action: 'enterprise.create',
    resource_type: 'team',
    resource_id: team.team_uid,
    details: {
      company_name: company_name.trim(),
      plan,
      admin_email: adminEmail,
    },
  });

  // 同步到 Gateway KV
  try {
    const gatewayUrl = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:8787';
    await fetch(`${gatewayUrl}/v1/admin/sync_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_uid: adminUid,
        type: 'enterprise_activation',
        team_uid: team.team_uid,
      }),
    });
  } catch (e) {
    console.warn('[Enterprise Create] Gateway sync warning:', e);
  }

  const onboardingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/t/${team.slug}`;

  return NextResponse.json({
    success: true,
    team,
    admin: { user_uid: adminUid, email: adminEmail },
    onboarding_url: onboardingUrl,
  });
}
