// src/lib/adminAuth.ts
// Admin 鉴权工具 — 支持 GitHub OAuth 和 Email+Password 两种登录方式

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createClient } from '@supabase/supabase-js';

export interface AdminUser {
  user_uid: string;
  role: 'super_admin' | 'admin' | 'viewer';
  name?: string | null;
  added_by: string | null;
  created_at: string;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** 校验当前 session 是否为运营人员。
 *  GitHub OAuth → 通过 profiles.user_uid 查 admin_users
 *  Email+Password → 通过 admin_users 中自动生成的 user_uid 查
 */
export async function getAdminRole(): Promise<{ userUid: string; role: 'super_admin' | 'admin' | 'viewer'; name?: string | null } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userUid = (session.user as any).userUid as string;
  if (!userUid) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('admin_users')
    .select('role, name')
    .eq('user_uid', userUid)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return null;
  return { userUid, role: data.role, name: data.name };
}

/** 校验最小角色要求 */
export function requireRole(
  admin: { role: string } | null,
  minRole: 'super_admin' | 'admin' | 'viewer'
): boolean {
  if (!admin) return false;
  const ranks = { super_admin: 3, admin: 2, viewer: 1 };
  return (ranks[admin.role as keyof typeof ranks] || 0) >= (ranks[minRole] || 0);
}
