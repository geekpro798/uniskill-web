// src/app/api/teams/credit-events/route.ts
// Fetch credit events for all team members

import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export interface CreditEvent {
    id: string;
    request_id: string;
    skill_name: string;
    amount: number;
    created_at: string;
    user_uid: string;
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions as any) as Session | null;
    if (!session?.user?.userUid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const teamUid = url.searchParams.get("team_uid");
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "100", 10)));

    if (!teamUid) {
        return NextResponse.json({ error: "team_uid required" }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // Get all team member UIDs
        const { data: memberships } = await supabase
            .from("team_members")
            .select("user_uid")
            .eq("team_uid", teamUid);

        const memberUids = (memberships || []).map((m) => m.user_uid);

        // Also include the team admin
        const { data: team } = await supabase
            .from("teams")
            .select("admin_uid")
            .eq("team_uid", teamUid)
            .maybeSingle();

        if (team?.admin_uid && !memberUids.includes(team.admin_uid)) {
            memberUids.push(team.admin_uid);
        }

        if (memberUids.length === 0) {
            return NextResponse.json({ events: [] });
        }

        const { data, error } = await supabase
            .from("credit_events")
            .select("id, request_id, skill_name, amount, created_at, user_uid")
            .in("user_uid", memberUids)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            const code = (error as any)?.code ?? "";
            if (code === "42P01" || code === "PGRST116") {
                return NextResponse.json({ events: [] });
            }
            throw error;
        }

        return NextResponse.json({ events: (data as CreditEvent[]) ?? [] });
    } catch (err) {
        console.error("[team credit-events GET] error:", err);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}
