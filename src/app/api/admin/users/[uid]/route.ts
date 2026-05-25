// src/app/api/admin/users/[uid]/route.ts
// 更新运营人员角色/状态/密码 / 删除运营人员（仅 super_admin）

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

// PATCH /api/admin/users/[uid] — 修改角色 / 状态 / 重置密码
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const body = await req.json();
  const { role, status, resetPassword } = body;

  // 重置密码 — 从 session 直接取 userUid，0 次 DB 查询（不调 getAdminRole）
  if (resetPassword) {
    const session = await getServerSession(authOptions);
    const sessionUid = (session?.user as any)?.userUid as string | undefined;
    if (!sessionUid || uid !== sessionUid) {
      return NextResponse.json({ error: '只能重置自己的密码' }, { status: 403 });
    }
    const password = generateRandomPassword();
    const password_hash = hashPassword(password);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('admin_users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('user_uid', uid);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, password });
  }

  // 以下操作需要 admin 权限
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();

  // 修改角色/状态 — 仅 super_admin，需要查 target
  if (!requireRole(admin, 'super_admin')) {
    return NextResponse.json({ error: '仅超级管理员可修改' }, { status: 403 });
  }

  const { data: target } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_uid', uid)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: '运营人员不存在' }, { status: 404 });
  }

  if (target.role === 'super_admin') {
    return NextResponse.json({ error: '不能修改超级管理员' }, { status: 403 });
  }

  const updates: Record<string, any> = {
    updated_by: admin.userUid,
    updated_at: new Date().toISOString(),
  };

  let changed = false;

  if (role) {
    if (!['admin', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    updates.role = role;
    changed = true;
  }

  if (status) {
    if (!['active', 'disabled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    updates.status = status;
    changed = true;
  }

  if (!changed) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('user_uid', uid);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/[uid] — 移除运营人员
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!requireRole(admin, 'super_admin')) {
    return NextResponse.json({ error: '仅超级管理员可移除运营人员' }, { status: 403 });
  }

  const { uid } = await params;

  if (uid === admin.userUid) {
    return NextResponse.json({ error: '不能移除自己' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: target } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_uid', uid)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: '运营人员不存在' }, { status: 404 });
  }

  if (target.role === 'super_admin') {
    return NextResponse.json({ error: '不能移除超级管理员' }, { status: 403 });
  }

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('user_uid', uid);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
