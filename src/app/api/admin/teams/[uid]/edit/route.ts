// src/app/api/admin/teams/[uid]/edit/route.ts
// POST /api/admin/teams/[uid]/edit — 编辑企业（团队）信息

import { NextResponse } from 'next/server';
import { getAdminRole, requireRole } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/password';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!requireRole(admin, 'admin')) {
    return NextResponse.json({ error: '仅管理员及以上可编辑企业' }, { status: 403 });
  }

  const { uid } = await params;
  const supabase = getSupabaseAdmin();

  const body = await req.json();
  const {
    company_name,
    contact_name,
    contact_phone,
    biz_contact_email,
    contactEmailSameAsAdmin,
    plan,
    status,
    max_members,
    max_skills,
    max_credits_month,
    monthly_fee_usd,
    admin_email,
    admin_password,
    notes,
  } = body;

  const adminEmail = contactEmailSameAsAdmin !== false
    ? (biz_contact_email || '').trim().toLowerCase()
    : (admin_email || '').trim().toLowerCase();
  const bizEmail = (biz_contact_email || '').trim().toLowerCase();

  if (!company_name?.trim()) {
    return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
  }

  // 查找团队
  const { data: team, error: findError } = await supabase
    .from('teams')
    .select('*')
    .eq('team_uid', uid)
    .maybeSingle();

  if (findError || !team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // 更新团队
  const updateData: any = {
    name: company_name.trim(),
    contact_name: contact_name || null,
    contact_email: bizEmail || null,
    contact_phone: contact_phone || null,
    plan: plan || 'mode1',
    status: status || 'active',
    max_members: max_members ?? 50,
    max_skills: max_skills ?? 100,
    max_credits_month: max_credits_month ?? 100000,
    monthly_fee_usd: monthly_fee_usd ?? 99,
    notes: notes || null,
  };

  if (adminEmail) {
    updateData.admin_email = adminEmail;
  }

  if (admin_password?.trim()) {
    if ((admin_password as string).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    updateData.password_hash = hashPassword(admin_password as string);
  }

  const { error: updateError } = await supabase
    .from('teams')
    .update(updateData)
    .eq('team_uid', uid);

  if (updateError) {
    return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 });
  }

  // 记录审计日志
  await supabase.from('audit_logs').insert({
    team_uid: uid,
    user_uid: admin.userUid,
    action: 'enterprise.edit',
    resource_type: 'team',
    resource_id: uid,
    details: {
      company_name: company_name.trim(),
      plan,
      status,
      admin_email: admin_email || null,
      password_changed: !!admin_password?.trim(),
    },
  });

  return NextResponse.json({ success: true });
}
