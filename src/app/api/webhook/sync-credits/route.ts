// src/app/api/webhook/sync-credits/route.ts
// Secure webhook to sync credits from Cloudflare to Supabase
// 安全 Webhook：将 Cloudflare 的积分同步至 Supabase

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    console.log("[Webhook] Received sync-credits request");

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role to bypass RLS 使用 Service Role 绕过权限限制
    );
    const authHeader = req.headers.get("Authorization");

    // 1. Verify Admin Secret 验证管理员密钥
    if (authHeader !== `Bearer ${process.env.ADMIN_KEY}`) {
        console.warn("[Webhook] Unauthorized request. Header mismatch.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        console.log("[Webhook] Payload received:", body);

        const { hash, newBalance } = body;

        if (!hash) {
            console.error("[Webhook] Missing hash in payload");
            return NextResponse.json({ error: "Missing hash" }, { status: 400 });
        }

        // 2. Update Supabase credits directly 更新 Supabase 中的积分余额
        console.log(`[Webhook] Attempting to update credits to ${newBalance} for hash: ${hash}`);
        const { data, error } = await supabase
            .from('profiles')
            .update({ credits: newBalance })
            .eq('token_hash', hash)
            .select();

        if (error) {
            console.error("[Webhook] Supabase update error:", error);
            throw error;
        }

        console.log("[Webhook] Successfully updated database. Data:", data);
        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error("[Webhook] Sync failed with exception:", err);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
