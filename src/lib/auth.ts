// src/lib/auth.ts
// Core authentication business logic for UniSkill
// UniSkill 核心认证业务逻辑：首次登录自动生成 Token 并同步到 Supabase & Cloudflare KV

import { supabase } from "@/lib/supabase";
import crypto from "crypto";

/* ─── 用户 Profile 类型定义 ─────────────────────────────────────────── */
export interface UserProfile {
    id: string;
    github_id: string;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    token_hash: string;
    credits: number;
    created_at: string;
}

/* ─── 首次注册返回类型 ───────────────────────────────────────────────── */
export interface RegistrationResult {
    profile: UserProfile;
    rawToken?: string; // 仅首次注册时返回，之后不可再查
}

/* ─── handleUserRegistration：处理用户首次登录 ─────────────────────────
   流程：
   1. 查询 Supabase 检查用户是否已存在
   2. 若已存在 → 直接返回现有 profile（不含 rawToken）
   3. 若新用户 → 生成 Token → SHA-256 哈希 → 存 Supabase → 同步 Cloudflare KV
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

    // 用户已存在，直接返回（不重新生成 Token）
    if (existingUser) {
        console.log("[auth] User already exists in DB:", existingUser.github_id);
        return { profile: existingUser as UserProfile };
    }

    console.log("[auth] New user detected, creating profile for:", githubId);

    // ─── Step 2: 生成新的原始 Token ───────────────────────────────────
    // 格式：us- + UUID，例如 us-550e8400-e29b-41d4-a716-446655440000
    const rawToken = `us-${crypto.randomUUID()}`;

    // ─── Step 3: 计算 SHA-256 哈希，仅存哈希值到数据库（安全模式）────
    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    // ─── Step 4: 将新用户 profile 存入 Supabase ──────────────────────
    const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
            github_id: githubId,
            email: githubProfile.email ?? null,
            name: githubProfile.name ?? null,
            avatar_url: githubProfile.image ?? null,
            token_hash: tokenHash,
            credits: 50, // 新用户赠送 50 次调用配额
        })
        .select()
        .single();

    if (insertError) {
        console.error("[auth] Failed to insert user (insertError):", insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log("[auth] Inserted new profile successfully. Profile ID:", newProfile?.id);

    // ─── Step 5: 同步到 Cloudflare KV（通过网关 Admin API）─────────
    try {
        const gatewayUrl = process.env.GATEWAY_URL ?? "https://your-gateway.workers.dev";
        console.log(`[auth] Initiating KV sync to ${gatewayUrl}/admin/provision...`);

        const response = await fetch(`${gatewayUrl}/admin/provision`, {
            method: "POST",
            headers: {
                "X-Admin-Secret": process.env.ADMIN_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                hash: tokenHash,
                credits: 50,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            // KV 同步失败不阻断注册流程，仅记录警告日志
            console.warn(`[auth] Cloudflare KV sync failed: Status ${response.status}, Body: ${errText}`);
        } else {
            console.log("[auth] Cloudflare KV sync successful!");
        }
    } catch (kvError) {
        // 网络错误同样不阻断，后续可补偿同步
        console.warn("[auth] Cloudflare KV sync error (network etc):", kvError);
    }

    // ─── Step 6: 返回结果，rawToken 仅此一次返回给前端展示 ───────────
    return {
        profile: newProfile as UserProfile,
        rawToken, // ⚠️ 不存库，用户需立即复制保存
    };
}
