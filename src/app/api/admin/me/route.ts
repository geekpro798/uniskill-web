// src/app/api/admin/me/route.ts
// 查询当前登录用户的 admin 角色
import { NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/adminAuth';

export async function GET() {
  const admin = await getAdminRole();
  if (!admin) {
    return NextResponse.json({ role: null }, { status: 403 });
  }
  return NextResponse.json({ userUid: admin.userUid, role: admin.role });
}
