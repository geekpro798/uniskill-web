// src/app/api/user/teams/route.ts
// GET /api/user/teams — 当前用户的团队列表

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getUserTeams } from '@/lib/teams';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userUid = (session?.user as any)?.userUid as string | undefined;

  if (!userUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teams = await getUserTeams(userUid);

  return NextResponse.json({ teams });
}
