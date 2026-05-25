// src/app/api/admin/users/route.ts
// 管理运营人员列表 + 添加运营人员
// 权限：super_admin 可管理，admin/viewer 只读列表

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getAdminRole, requireRole } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import { generateRandomPassword, hashPassword } from '@/lib/password';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/users — 列出所有运营人员
export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUid = (session?.user as any)?.userUid as string | undefined;
  if (!sessionUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  // 一次查询拿全量 admin_users（表很小，无需分页），同时在内存中校验当前用户身份
  const { data: adminUsers, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const currentUser = adminUsers.find(
    (a) => a.user_uid === sessionUid && a.status === 'active'
  );
  if (!currentUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 关联 profiles 表拿用户名和邮箱（仅对有 user_uid 的）
  const userUids = adminUsers.filter(a => a.user_uid).map(a => a.user_uid);
  const { data: profiles } = userUids.length > 0
    ? await supabase.from('profiles').select('user_uid, username, avatar_url').in('user_uid', userUids)
    : { data: [] };

  const profileMap = new Map((profiles || []).map(p => [p.user_uid, p]));

  const result = adminUsers.map(a => {
    const p = a.user_uid ? profileMap.get(a.user_uid) : null;
    return {
      user_uid: a.user_uid || null,
      email: a.email || null,
      name: a.name || null,
      phone: a.phone || null,
      role: a.role,
      status: a.status || 'active',
      added_by: a.added_by || null,
      last_active_at: a.last_active_at || null,
      updated_by: a.updated_by || null,
      updated_at: a.updated_at || null,
      created_at: a.created_at,
      username: p?.username || null,
      avatar_url: p?.avatar_url || null,
    };
  });

  return NextResponse.json({ data: result, currentRole: currentUser.role, currentUserUid: sessionUid });
}

// POST /api/admin/users — 添加运营人员（仅 super_admin）
export async function POST(req: Request) {
  const admin = await getAdminRole();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!requireRole(admin, 'super_admin')) {
    return NextResponse.json({ error: '仅超级管理员可添加运营人员' }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, phone, role = 'admin' } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!email?.trim() || !email.includes('@')) {
    return NextResponse.json({ error: '有效的邮箱地址为必填项' }, { status: 400 });
  }
  if (!['admin', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'role must be admin or viewer' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = getSupabaseAdmin();

  // 检查是否已存在
  const { data: existing } = await supabase
    .from('admin_users')
    .select('id, email')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: '该邮箱已是运营人员' }, { status: 409 });
  }

  // 生成初始密码
  const password = generateRandomPassword();
  const password_hash = hashPassword(password);

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      user_uid: crypto.randomUUID(),
      email: normalizedEmail,
      name: name.trim(),
      phone: phone?.trim() || null,
      password_hash,
      role,
      status: 'active',
      added_by: admin.name || admin.userUid,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 密码只在响应中返回一次
  return NextResponse.json({
    success: true,
    adminUser: {
      id: data.id,
      email: data.email,
      name: data.name || null,
      phone: data.phone || null,
      role: data.role,
      status: data.status,
      created_at: data.created_at,
    },
    initialPassword: password,
  });
}
