// src/lib/teams.ts
// Phase 2: 团队业务逻辑层 — 封装所有 Supabase 查询

import { createClient } from '@supabase/supabase-js';
import type { TeamInfo, TeamMember } from '@/types/teams';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** 按 slug 查询团队公开信息 */
export async function getTeamBySlug(slug: string): Promise<TeamInfo | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('teams')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .maybeSingle();
  return data as TeamInfo | null;
}

/** 获取团队所有成员（JOIN profiles 拿用户名和头像） */
export async function getTeamMembers(teamUid: string): Promise<TeamMember[]> {
  const supabase = getSupabaseAdmin();

  // 并行获取团队信息和成员列表
  const [{ data: team }, { data: memberships }] = await Promise.all([
    supabase.from('teams').select('admin_uid, admin_email, name').eq('team_uid', teamUid).maybeSingle(),
    supabase.from('team_members').select('user_uid, role, joined_at').eq('team_uid', teamUid),
  ]);

  const ownerUid = (team as any)?.admin_uid as string | undefined;
  const ownerEmail = (team as any)?.admin_email as string | undefined;
  const teamName = (team as any)?.name as string | undefined;

  const membershipList = memberships || [];

  // 收集所有需要查 profile 的 user_uid
  const allUids = membershipList.map((m) => m.user_uid);
  const ownerInList = ownerUid && allUids.includes(ownerUid);

  let profiles: any[] = [];
  if (allUids.length > 0) {
    const res = await supabase
      .from('profiles')
      .select('user_uid, username, avatar_url, email')
      .in('user_uid', allUids);
    profiles = res.data || [];
  }

  const profileMap = new Map(profiles.map((p) => [p.user_uid, p]));

  const result: TeamMember[] = membershipList.map((m) => {
    const p = profileMap.get(m.user_uid);
    // 如果是 owner 且没有 profile，用 admin_email 填充
    const isOwner = m.user_uid === ownerUid;
    return {
      user_uid: m.user_uid,
      role: m.role,
      joined_at: m.joined_at,
      username: p?.username || (isOwner ? (ownerEmail || null) : null),
      email: p?.email || (isOwner ? (ownerEmail || null) : null),
      avatar_url: p?.avatar_url || null,
    };
  });

  // 如果 owner 不在 team_members 中，补充一条合成记录
  // ownerUid 可能为空（邮箱注册未绑定 GitHub），此时用 admin_email 作为标识
  if ((ownerUid && !ownerInList) || (!ownerUid && ownerEmail && membershipList.length === 0)) {
    result.unshift({
      user_uid: ownerUid || '',
      role: 'owner',
      joined_at: '',
      username: ownerEmail || null,
      email: ownerEmail || null,
      avatar_url: null,
    });
  }

  return result;
}

/** 获取团队成员总数 */
export async function getTeamMemberCount(teamUid: string): Promise<number> {
  const supabase = getSupabaseAdmin();

  const [{ count }, { data: team }] = await Promise.all([
    supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_uid', teamUid),
    supabase.from('teams').select('admin_uid').eq('team_uid', teamUid).maybeSingle(),
  ]);

  let total = count || 0;

  // 如果 owner 不在 team_members 中，+1
  const ownerUid = (team as any)?.admin_uid as string | undefined;
  if (ownerUid && total > 0) {
    const { count: ownerCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_uid', teamUid)
      .eq('user_uid', ownerUid);
    if (!ownerCount) total += 1;
  } else if (ownerUid && total === 0) {
    total = 1; // 只有 owner
  }

  return total;
}

/** 检查用户在团队中的角色，未加入返回 null */
export async function getUserTeamMembership(
  userUid: string,
  teamUid: string
): Promise<{ role: string } | null> {
  const supabase = getSupabaseAdmin();

  // 先查 team_members 表
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_uid', teamUid)
    .eq('user_uid', userUid)
    .maybeSingle();

  if (membership) return membership;

  // 如果不在 team_members 中，检查是否是团队创建者 (admin_uid)
  const { data: team } = await supabase
    .from('teams')
    .select('admin_uid')
    .eq('team_uid', teamUid)
    .eq('admin_uid', userUid)
    .maybeSingle();

  if (team) return { role: 'owner' };

  return null;
}

/** 获取用户所属的团队列表 */
export async function getUserTeams(userUid: string): Promise<TeamInfo[]> {
  const supabase = getSupabaseAdmin();

  // 并行查询：team_members 中的团队 + 用户作为 admin_uid 创建的团队
  const [membershipsRes, ownedRes] = await Promise.all([
    supabase.from('team_members').select('team_uid').eq('user_uid', userUid),
    supabase.from('teams').select('*').eq('admin_uid', userUid),
  ]);

  const memberTeamUids = (membershipsRes.data || []).map((m) => m.team_uid);
  const ownedTeams = (ownedRes.data || []) as TeamInfo[];

  // 合并去重：team_members 中不在 owned 里的团队
  const ownedUids = new Set(ownedTeams.map((t) => t.team_uid));
  const additionalUids = memberTeamUids.filter((uid) => !ownedUids.has(uid));

  if (additionalUids.length > 0) {
    const { data: additionalTeams } = await supabase
      .from('teams')
      .select('*')
      .in('team_uid', additionalUids);
    ownedTeams.push(...((additionalTeams || []) as TeamInfo[]));
  }

  return ownedTeams;
}

/** 用户是否团队管理员 (owner 或 admin) */
export async function isTeamAdmin(userUid: string, teamUid: string): Promise<boolean> {
  const membership = await getUserTeamMembership(userUid, teamUid);
  return membership?.role === 'owner' || membership?.role === 'admin';
}

/** 同步用户的团队列表到 Gateway KV（user:profile.teams） */
export async function syncUserTeamsToGateway(userUid: string): Promise<void> {
  try {
    const teams = await getUserTeams(userUid);
    const teamUids = teams.map((t) => t.team_uid);

    const gatewayUrl = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:8787';
    const adminKey = process.env.ADMIN_KEY || '';

    await fetch(`${gatewayUrl}/v1/admin/sync_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_uid: userUid,
        teams: teamUids,
        type: 'teams_sync',
      }),
    });
  } catch (e) {
    console.warn('[teams] Failed to sync teams to gateway:', e);
  }
}
