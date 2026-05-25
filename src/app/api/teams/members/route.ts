// src/app/api/teams/members/route.ts
// 团队成员管理 API — 邀请白名单 + 成员管理

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";
import { getUserTeamMembership } from "@/lib/teams";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkMembership(userUid: string, userEmail: string | null | undefined, teamUid: string) {
  const membership = await getUserTeamMembership(userUid, teamUid);
  if (membership) return membership;

  if (userEmail) {
    const supabase = getSupabaseAdmin();
    const { data: team } = await supabase
      .from("teams")
      .select("admin_email")
      .eq("team_uid", teamUid)
      .eq("admin_email", userEmail.toLowerCase().trim())
      .maybeSingle();
    if (team) return { role: "owner" };
  }

  return null;
}

// GET — 列出成员 + 待处理邀请
export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const teamUid = url.searchParams.get("team_uid");
  if (!teamUid) {
    return NextResponse.json({ error: "team_uid required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const [membershipsRes, invitationsRes] = await Promise.all([
    supabase.from("team_members").select("user_uid, role, joined_at").eq("team_uid", teamUid),
    supabase.from("team_invitations").select("*").eq("team_uid", teamUid).eq("status", "pending"),
  ]);

  const memberships = membershipsRes.data || [];
  const invitations = invitationsRes.data || [];

  // 收集 profile 信息
  const allUids = memberships.map((m) => m.user_uid);
  let profiles: any[] = [];
  if (allUids.length > 0) {
    const res = await supabase
      .from("profiles")
      .select("user_uid, username, avatar_url, email")
      .in("user_uid", allUids);
    profiles = res.data || [];
  }
  const profileMap = new Map(profiles.map((p) => [p.user_uid, p]));

  const members = memberships.map((m) => {
    const p = profileMap.get(m.user_uid);
    return {
      user_uid: m.user_uid,
      role: m.role,
      joined_at: m.joined_at,
      username: p?.username || null,
      email: p?.email || null,
      avatar_url: p?.avatar_url || null,
    };
  });

  return NextResponse.json({ members, invitations });
}

// POST — 添加成员到白名单（创建邀请）
export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userUid = (session.user as any).userUid as string;
  const userEmail = session.user?.email;
  const body = await req.json().catch(() => null);
  if (!body?.team_uid || !body?.email) {
    return NextResponse.json({ error: "team_uid and email required" }, { status: 400 });
  }

  const { team_uid, email } = body;

  const membership = await checkMembership(userUid, userEmail, team_uid);
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return NextResponse.json({ error: "Only owner/admin can add members" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase().trim();

  // 检查是否已有邀请
  const { data: existingInvite } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("team_uid", team_uid)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingInvite) {
    if (existingInvite.status === "pending") {
      return NextResponse.json({ error: "Invitation already sent to this email" }, { status: 409 });
    }
    // 重新激活过期/取消的邀请
    await supabase
      .from("team_invitations")
      .update({ status: "pending", invited_by_uid: userUid, created_at: new Date().toISOString() })
      .eq("id", existingInvite.id);
    return NextResponse.json({ success: true, invitation: { ...existingInvite, status: "pending" } });
  }

  // 检查是否已是成员
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("user_uid, username, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (targetProfile) {
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_uid", team_uid)
      .eq("user_uid", targetProfile.user_uid)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: "User is already a team member" }, { status: 409 });
    }

    const { data: team } = await supabase
      .from("teams")
      .select("admin_uid")
      .eq("team_uid", team_uid)
      .maybeSingle();

    if (team?.admin_uid === targetProfile.user_uid) {
      return NextResponse.json({ error: "Cannot add the team owner as a member" }, { status: 409 });
    }
  }

  // 创建邀请
  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .insert({
      team_uid,
      email: normalizedEmail,
      role: body.role || "member",
      invited_by_uid: userUid,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    invitation,
    message: targetProfile
      ? "User already has an account — they will be added on next login."
      : "Invitation sent. The user will join automatically when they sign in.",
  });
}

// DELETE — 移除成员 或 取消邀请
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userUid = (session.user as any).userUid as string;
  const userEmail = session.user?.email;
  const url = new URL(req.url);
  const teamUid = url.searchParams.get("team_uid");
  const targetUid = url.searchParams.get("user_uid");
  const invitationId = url.searchParams.get("invitation_id");

  if (!teamUid) {
    return NextResponse.json({ error: "team_uid required" }, { status: 400 });
  }

  if (!targetUid && !invitationId) {
    return NextResponse.json({ error: "user_uid or invitation_id required" }, { status: 400 });
  }

  const membership = await checkMembership(userUid, userEmail, teamUid);
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return NextResponse.json({ error: "Only owner/admin can remove members" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  // 取消邀请
  if (invitationId) {
    const { error } = await supabase
      .from("team_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId)
      .eq("team_uid", teamUid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cancelled_invitation: invitationId });
  }

  // 移除成员
  const { data: team } = await supabase
    .from("teams")
    .select("admin_uid")
    .eq("team_uid", teamUid)
    .maybeSingle();

  if (team?.admin_uid === targetUid) {
    return NextResponse.json({ error: "Cannot remove the team owner" }, { status: 403 });
  }

  const { data: targetMembership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_uid", teamUid)
    .eq("user_uid", targetUid)
    .maybeSingle();

  if (membership.role === "admin" && targetMembership?.role === "admin") {
    return NextResponse.json({ error: "Only the owner can remove an admin" }, { status: 403 });
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_uid", teamUid)
    .eq("user_uid", targetUid);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, removed: targetUid });
}

// PATCH — 变更成员角色
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userUid = (session.user as any).userUid as string;
  const userEmail = session.user?.email;
  const body = await req.json().catch(() => null);
  if (!body?.team_uid || !body?.user_uid || !body?.role) {
    return NextResponse.json({ error: "team_uid, user_uid, and role required" }, { status: 400 });
  }

  const { team_uid, user_uid: targetUid, role: newRole } = body;

  if (!["admin", "member", "viewer"].includes(newRole)) {
    return NextResponse.json({ error: "Invalid role. Allowed: admin, member, viewer" }, { status: 400 });
  }

  const membership = await checkMembership(userUid, userEmail, team_uid);
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can change member roles" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const { data: team } = await supabase
    .from("teams")
    .select("admin_uid")
    .eq("team_uid", team_uid)
    .maybeSingle();

  if (team?.admin_uid === targetUid) {
    return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("team_members")
    .update({ role: newRole })
    .eq("team_uid", team_uid)
    .eq("user_uid", targetUid)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, member: updated });
}
