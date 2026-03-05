// src/lib/auth.ts
// Core authentication business logic for UniSkill
// UniSkill 核心认证业务逻辑：首次登录自动生成 API Key 并同步到 Supabase & Cloudflare KV

import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/* ─── 用户 Profile 类型定义 ─────────────────────────────────────────── */
export interface UserProfile {
    id: string;
    github_id: string;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    key_hash: string;
    credits: number;
    created_at: string;
}

/* ─── 首次注册返回类型 ───────────────────────────────────────────────── */
export interface RegistrationResult {
    profile: UserProfile;
    rawKey?: string; // 仅首次注册时返回，之后不可再查
}

/* ─── handleUserRegistration：处理用户首次登录 ─────────────────────────
   流程：
   1. 查询 Supabase 检查用户是否已存在
   2. 若已存在 → 直接返回现有 profile（不含 rawKey）
   3. 若新用户 → 生成 API Key → SHA-256 哈希 → 存 Supabase → 同步 Cloudflare KV
   ─────────────────────────────────────────────────────────────────────── */
export async function handleUserRegistration(
    githubProfile: {
        id: string | number;
        email?: string | null;
        name?: string | null;
        image?: string | null;
    }
): Promise<RegistrationResult> {
    const githubId = githubProfile.id.toString();

    // ─── Step 1: 检查用户是否已存在 ───────────────────────────────────
    const { data: existingUser, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("github_id", githubId)
        .maybeSingle(); // 使用 maybeSingle 避免 "no rows" 报错

    if (fetchError) {
        console.error("[auth] Failed to query user (fetchError):", fetchError);
        throw new Error(`Database query failed: ${fetchError.message}`);
    }

    // 用户已存在，直接返回（不重新生成 Key）
    if (existingUser) {
        console.log("[auth] User already exists in DB:", existingUser.github_id);
        return { profile: existingUser as UserProfile };
    }

    console.log("[auth] New user detected, creating profile for:", githubId);

    // 0. Initialize Admin client (Service Role) to bypass RLS
    // 初始化 Admin 客户端（使用 Service Role 密钥）以绕过 RLS 限制执行行政操作
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Generate the raw API key and its unique hash ONCE
    const rawKey = `us-${crypto.randomUUID()}`;
    const tokenHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    // 2. Insert into Supabase (using Admin client)
    const { data: newProfile, error: dbError } = await supabaseAdmin
        .from("profiles")
        .insert({
            github_id: githubId,
            email: githubProfile.email ?? null,
            name: githubProfile.name ?? null,
            avatar_url: githubProfile.image ?? null,
            key_hash: tokenHash,
            credits: 500,
        })
        .select()
        .single();

    if (dbError) {
        console.error("[auth] Failed to insert user (dbError):", dbError);
        throw new Error(`Database insert failed: ${dbError.message}`);
    }


    console.log("[auth] Inserted new profile successfully. Profile ID:", newProfile?.id);

    // 3a. 在 credit_events 表写入初始赠送记录，供 Recent Activity 组件展示 (using Admin client)
    try {
        const { error: eventError } = await supabaseAdmin
            .from("credit_events")
            .insert({
                github_id: Number(githubId),   // bigint 列，转为数字
                skill_name: "Welcome Bonus",
                amount: 500,
            });
        if (eventError) {
            console.warn("[auth] Failed to insert welcome credit_event:", eventError.message);
        } else {
            console.log("[auth] Welcome credit_event record created successfully.");
        }
    } catch (e) {
        console.warn("[auth] credit_events insert exception:", e);
    }

    // 3. Sync to Cloudflare KV
    // 同步到 Cloudflare KV
    if (!dbError) {
        try {
            const gatewayUrl = process.env.GATEWAY_URL ?? "https://your-gateway.workers.dev";
            console.log(`[auth] Initiating KV sync to ${gatewayUrl}/admin/provision...`);

            const syncRes = await fetch(`${gatewayUrl}/admin/provision`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.ADMIN_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ hash: tokenHash, credits: 500 }),
            });

            if (!syncRes.ok) {
                const errText = await syncRes.text();
                console.error(`[auth] KV sync FAILED [Status ${syncRes.status}]: ${errText}`);
                console.error(`[auth] Check if GATEWAY_URL (${gatewayUrl}) is correct and ADMIN_KEY is valid.`);
            } else {
                console.log("[auth] Cloudflare KV sync successful!");
            }
        } catch (kvError: any) {
            console.error("[auth] KV sync FATAL ERROR (Connection Refused?):", kvError.message);
            console.error(`[auth] Is the gateway running at ${process.env.GATEWAY_URL ?? "localhost:8787"}?`);
        }
    }

    // ─── Step 6: 返回结果，rawKey 仅此一次返回给前端展示 ───────────
    return {
        profile: newProfile as UserProfile,
        rawKey, // ⚠️ 不存库，用户需立即复制保存
    };
}
