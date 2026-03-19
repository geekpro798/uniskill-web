// src/app/api/user/credits/route.ts
// Internal API to fetch live credits for the logged-in user

import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export async function GET() {
    // 1. 获取当前登录用户的 Session
    const session = await getServerSession(authOptions as any) as Session | null;
    if (!session?.user?.userUid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 初始化 Supabase 客户端 (使用 Service Role 因为跨过了 RLS)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. 根据 user_uid 查询最新积分和等级
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("credits, tier")
            .eq("user_uid", session.user.userUid)
            .single();

        if (error) {
            console.error("[Credits GET] Supabase error:", error);
            throw error;
        }

        return NextResponse.json({ 
            credits: data?.credits ?? 0,
            tier: data?.tier || "FREE"
        });
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
    }
}
