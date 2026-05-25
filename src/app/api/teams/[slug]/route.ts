// src/app/api/teams/[slug]/route.ts
// GET /api/teams/[slug] — 团队公开信息

import { NextResponse } from 'next/server';
import { getTeamBySlug, getTeamMembers, getTeamMemberCount } from '@/lib/teams';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const team = await getTeamBySlug(slug);
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const [members, memberCount] = await Promise.all([
    getTeamMembers(team.team_uid),
    getTeamMemberCount(team.team_uid),
  ]);

  return NextResponse.json({
    team: { ...team, member_count: memberCount },
    members,
  });
}
