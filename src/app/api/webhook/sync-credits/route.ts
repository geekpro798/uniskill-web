// src/app/api/webhook/sync-credits/route.ts
// Secure webhook to sync credits from Cloudflare to Supabase
// 安全 Webhook：将 Cloudflare 的积分同步至 Supabase，并写入 credit_events 记录

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
    const adminKey = process.env.ADMIN_KEY || "";

    // 1. Verify Admin Secret 验证管理员密钥
    if (authHeader !== `Bearer ${adminKey}`) {
        console.warn(`[Webhook] Unauthorized request. Header mismatch. Received header length: ${authHeader?.length || 0}, Configured key length: ${adminKey.length}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        console.log("[Webhook] Payload received:", body);

        // skillName 和 amount 为新增字段（旧版 gateway 不传则降级处理）
        const { hash, newBalance, skillName, amount } = body;

        if (!hash) {
            console.error("[Webhook] Missing hash in payload");
            return NextResponse.json({ error: "Missing hash" }, { status: 400 });
        }

        // 2. Update Supabase credits directly 更新 Supabase 中的积分余额
        console.log(`[Webhook] Attempting to update credits to ${newBalance} for hash: ${hash}`);
        const { data, error } = await supabase
            .from('profiles')
            .update({ credits: newBalance })
            .eq('key_hash', hash)
            .select('github_id');

        if (error) {
            console.error("[Webhook] Supabase update error:", error);
            throw error;
        }

        // 3. 写入 credit_events 表（供 Dashboard Recent Activity 消费）
        // 需要 github_id，从 profiles 查询结果中取得
        if (skillName && amount !== undefined && data && data.length > 0) {
            const githubId = (data[0] as { github_id: number | string }).github_id;
            if (githubId) {
                const { error: evtError } = await supabase
                    .from('credit_events')
                    .insert({
                        github_id: Number(githubId),
                        skill_name: skillName,
                        amount,          // 负数表示扣减（如 -1）
                        created_at: new Date().toISOString(),
                    });
                if (evtError) {
                    // credit_events 写入失败不影响主流程，仅记录日志
                    console.error("[Webhook] Failed to insert credit_event:", evtError);
                } else {
                    console.log(`[Webhook] credit_events row inserted: github_id=${githubId} skill=${skillName} amount=${amount}`);
                }
            }
        }

        console.log("[Webhook] Successfully updated database. Data:", data);
        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error("[Webhook] Sync failed with exception:", err);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
