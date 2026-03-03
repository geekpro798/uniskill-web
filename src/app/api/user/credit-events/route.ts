// src/app/api/user/credit-events/route.ts
// Fetch the latest 5 credit events for the dashboard Recent Activity widget
// 查询登录用户的最近 5 条积分变动记录，供 QuickActivity 组件消费

import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export interface CreditEvent {
    id: string;
    skill_name: string;
    amount: number;        // negative = deduction (rose-400), positive = addition (green-400)
    created_at: string;    // ISO 8601 timestamp
}

export async function GET() {
    // 1. 验证登录态
    const session = await getServerSession(authOptions as any) as Session | null;
    if (!session?.user?.githubId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 初始化 Supabase Service Role 客户端（绕过 RLS）
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 3. 查询 credit_events 表：按时间降序取最新 5 条
        const { data, error } = await supabase
            .from("credit_events")
            .select("id, skill_name, amount, created_at")
            .eq("github_id", session.user.githubId)
            .order("created_at", { ascending: false })
            .limit(5);

        // 若 table 尚不存在（PGRST116 或 42P01），返回空数组而非报错
        if (error) {
            const code = (error as any)?.code ?? "";
            if (code === "42P01" || code === "PGRST116") {
                return NextResponse.json({ events: [] });
            }
            throw error;
        }

        return NextResponse.json({ events: (data as CreditEvent[]) ?? [] });
    } catch (err) {
        console.error("[credit-events GET] error:", err);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}
