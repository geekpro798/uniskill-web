// src/lib/auth.ts
// Core authentication business logic for UniSkill
// UniSkill 核心认证业务逻辑：首次登录自动生成 API Key 并同步到 Supabase & Cloudflare KV

import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { dispatchAccountCreatedNotification } from "@/utils/notifications/notifier";

/* ─── 用户 Profile 类型定义 ─────────────────────────────────────────── */
export interface UserProfile {
    id: string;      // Supabase internal ID
    user_uid: string; // Global stable UID
    github_id: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    github_url: string | null;
    authorized_wallet: string | null; // Secp256k1 EOA 钱包地址（Particle MPC 生成）
    credits: number;
    tier: string;
    created_at: string;
}

/* ─── 首次注册返回类型 ───────────────────────────────────────────────── */
export interface RegistrationResult {
    profile: UserProfile;
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
        username?: string | null;
        image?: string | null;
        github_url?: string | null;
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

        // 🌟 Sync GitHub URL if missing for existing users
        if (!existingUser.github_url && githubProfile.github_url) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            await supabaseAdmin
                .from("profiles")
                .update({ github_url: githubProfile.github_url })
                .eq("github_id", githubId);
        }

        // 处理待处理的团队邀请（白名单自动加入）
        if (existingUser.email) {
            const { processPendingInvitations } = await import('@/lib/teams');
            const joinedTeams = await processPendingInvitations(existingUser.user_uid, existingUser.email);
            if (joinedTeams.length > 0) {
                console.log(`[auth] Existing user auto-joined ${joinedTeams.length} team(s): ${existingUser.user_uid}`);
                const { syncUserTeamsToGateway } = await import('@/lib/teams');
                syncUserTeamsToGateway(existingUser.user_uid).catch(() => {});
            }
        }

        return { profile: existingUser as UserProfile };
    }

    console.log("[auth] New user detected, creating profile for:", githubId);

    // 0. Initialize Admin client (Service Role) to bypass RLS
    // 初始化 Admin 客户端（使用 Service Role 密钥）以绕过 RLS 限制执行行政操作
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 对于新的“主权身份”架构，注册流程仅初始化基础 Profile
    // 信用点数、等级等信息在此设定，而钱包绑定（authorized_wallet）将由用户在 Dashboard 中完成
    
    // 2. Insert into Supabase (using Admin client)
    const { data: newProfile, error: dbError } = await supabaseAdmin
        .from("profiles")
        .insert({
            github_id: githubId,
            email: githubProfile.email ?? null,
            username: githubProfile.username ?? null,
            avatar_url: githubProfile.image ?? null,
            github_url: githubProfile.github_url ?? null,
            // authorized_wallet 默认为 null，由数据库 Schema 处理
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
                user_uid: newProfile.user_uid,
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

    // 3. Sync to Cloudflare KV (至关重要：确保新用户的 Key 立即生效)
    const rawGatewayUrl = process.env.GATEWAY_URL ?? "http://localhost:8787";
    // 自动清理末尾的 /v1，然后统一补上，避免出现 /v1/v1/ 的双重路径问题
    const gatewayBaseUrl = rawGatewayUrl.replace(/\/v1\/?$/, "");
    const targetUrl = `${gatewayBaseUrl}/v1/admin/sync_cache`;

    try {
        console.log(`[auth] [KV Sync] Attempting to sync new user: ${newProfile.user_uid} to ${targetUrl}`);

        // 🌟 Add 5-second timeout to prevent server hang if Gateway is down
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const syncRes = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.ADMIN_KEY}`,
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                user_uid: newProfile.user_uid,
                total_credits: 500,
                new_tier: "FREE",
                authorized_wallet: null
            }),
        });

        clearTimeout(timeoutId);

        if (!syncRes.ok) {
            const errText = await syncRes.text();
            console.error(`[auth] [KV Sync] FAILED [Status ${syncRes.status}] [URL ${targetUrl}]: ${errText}`);
        } else {
            const resData = await syncRes.json();
            console.log(`[auth] [KV Sync] SUCCESS for UID: ${newProfile.user_uid}`, resData);
        }
    } catch (kvError: any) {
        if (kvError.name === 'AbortError') {
            console.error(`[auth] [KV Sync] TIMEOUT (5s) for UID: ${newProfile.user_uid} at ${targetUrl}`);
        } else {
            console.error("[auth] [KV Sync] FATAL ERROR:", kvError.message);
            console.error(`[auth] [KV Sync] Failed to sync to: ${targetUrl}`);
        }
    }

    // 4. Dispatch Account Created Notification (Fire-and-Forget)
    // 放在最后，确保主流程（DB + KV）已完成
    if (newProfile) {
        dispatchAccountCreatedNotification({
            userUid: newProfile.user_uid,
            githubId: newProfile.github_id,
            name: newProfile.username,
            email: newProfile.email,
            initialCredits: 500
        });
    }

    // 5. 处理待处理的团队邀请（白名单自动加入）
    const finalProfile = newProfile || (existingUser as UserProfile);
    if (finalProfile?.email) {
        const { processPendingInvitations } = await import('@/lib/teams');
        const joinedTeams = await processPendingInvitations(finalProfile.user_uid, finalProfile.email);
        if (joinedTeams.length > 0) {
            console.log(`[auth] Auto-joined ${joinedTeams.length} team(s) for ${finalProfile.user_uid}`);
            // 同步团队列表到 Gateway KV
            const { syncUserTeamsToGateway } = await import('@/lib/teams');
            syncUserTeamsToGateway(finalProfile.user_uid).catch(() => {});
        }
    }

    // ─── Step 6: 返回结果 ───────────
    return {
        profile: newProfile as UserProfile,
    };
}
