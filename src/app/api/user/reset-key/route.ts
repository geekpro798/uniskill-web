// src/app/api/user/reset-key/route.ts
// API endpoint to reset the user's API key
// 功能：重置用户 API Key，更新数据库并同步到网关，确保护旧 Key 立即失效

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: Request) {
    // 1. 获取当前登录用户的 Session
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.userUid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userUid = session.user.userUid;

    // 2. 初始化 Supabase Admin (Service Role) 以更新敏感哈希
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. 生成全新的 API Key
    const rawKey = `us-${crypto.randomUUID()}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    
    // 生成新的预览字符串
    const keyParts = rawKey.split('-');
    const uuidPart = keyParts[1];
    const keyPreview = `us-${uuidPart.substring(0, 4)}••••••••${rawKey.substring(rawKey.length - 4)}`;

    try {
        // 4. 更新数据库中的 Hash 和 Preview
        const { data: updatedProfile, error: dbError } = await supabaseAdmin
            .from("profiles")
            .update({
                key_hash: keyHash,
                key_preview: keyPreview
            })
            .eq("user_uid", userUid)
            .select()
            .single();

        if (dbError) {
            console.error("[reset-key] DB Update Error:", dbError);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }

        // 5. 将新 Hash 同步到 Cloudflare KV (至关重要)
        // 网关侧会根据 user_uid 覆盖原有的 key_hash，从而实现旧 Key 的瞬间作废
        const gatewayUrl = process.env.GATEWAY_URL ?? "https://your-gateway.workers.dev";
        try {
            const syncRes = await fetch(`${gatewayUrl}/v1/admin/sync_cache`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.ADMIN_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_uid: userUid,
                    total_credits: updatedProfile.credits,
                    new_tier: updatedProfile.tier,
                    key_hash: keyHash
                }),
            });

            if (!syncRes.ok) {
                const errText = await syncRes.text();
                console.error(`[reset-key] Gateway Sync FAILED [${syncRes.status}]: ${errText}`);
            }
        } catch (kvErr: any) {
            console.error("[reset-key] Gateway Connection Error:", kvErr.message);
        }

        // 6. 成功返回：只在重置成功的瞬间返回一次明文 Key
        return NextResponse.json({
            rawKey,
            keyPreview
        });

    } catch (err: any) {
        console.error("[reset-key] Fatal Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
