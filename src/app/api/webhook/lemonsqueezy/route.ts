// src/app/api/webhook/lemonsqueezy/route.ts
// Smart fulfillment webhook with idempotency and high-water mark upgrade logic
// 智能发货 Webhook：含幂等性校验与高水位等级升级逻辑

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dispatchPaymentNotification } from '@/utils/notifications/notifier';

export const dynamic = 'force-dynamic';

// ── 等级权重定义：用于高水位线逻辑 (Tier Weights) ──
const TIER_WEIGHTS: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    scale: 3,
};

// ── 商品映射配置 (Product Mapping) ──
const PRODUCT_MAP: Record<string, { type: 'tier' | 'topup', credits: number, targetTier?: string }> = {
    // 等级包 (Tier Packages) - 包含等级提升 + 积分
    "1363205": { type: 'tier', credits: 10000, targetTier: 'starter' },
    "1363220": { type: 'tier', credits: 35000, targetTier: 'pro' },
    "1363223": { type: 'tier', credits: 150000, targetTier: 'scale' },
    
    // 纯充值包 (Top-up Packages) - 仅包含积分
    "1418079": { type: 'topup', credits: 10000 },
    "1418251": { type: 'topup', credits: 50000 },
};

export async function POST(req: Request) {
    // 0. Bootstrap Log (v1.2.1 - 2026-03-19)
    console.log(`[LS Webhook] >>> NEW REQUEST RECEIVED (v1.2.1) <<<`);

    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
    const signature = req.headers.get('X-Signature') || "";
    const rawBody = await req.text();

    // 1. Verify Webhook Signature (Security)
    if (webhookSecret) {
        const hmac = crypto.createHmac('sha256', webhookSecret);
        const digest = hmac.update(rawBody).digest('hex');
        if (signature !== digest) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
    }

    try {
        const payload = JSON.parse(rawBody);
        
        // --- 核心调试日志：打印收到原始数据 ---
        console.log("[LS Webhook] Received payload meta:", JSON.stringify(payload.meta, null, 2));

        const eventName = payload.meta?.event_name;
        
        // 仅处理订单创建成功事件
        if (eventName !== 'order_created') {
            return NextResponse.json({ message: `Ignored event: ${eventName}` });
        }

        const data = payload.data;
        if (!data || !data.attributes) {
            console.error("[LS Webhook] Invalid payload structure: data or attributes missing");
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // 兼容性获取 Variant ID (根据 LS 文档，有时在 attributes 下，有时在 first_order_item 下)
        const variantId = (data.attributes.variant_id || data.attributes.first_order_item?.variant_id)?.toString();
        const orderId = data.id; // LS Order ID
        const customData = payload.meta.custom_data || {};
        const userUid = customData.user_uid;

        if (!variantId) {
            console.error("[LS Webhook] Missing variant_id in payload:", JSON.stringify(data.attributes, null, 2));
            return NextResponse.json({ error: "Missing variant_id" }, { status: 400 });
        }

        if (!userUid) {
            console.error("[LS Webhook] Missing user_uid in custom_data");
            return NextResponse.json({ error: "Missing user_uid" }, { status: 400 });
        }

        const productInfo = PRODUCT_MAP[variantId];
        if (!productInfo) {
            console.warn(`[LS Webhook] Variant ${variantId} not recognized. Current PRODUCT_MAP keys:`, Object.keys(PRODUCT_MAP));
            return NextResponse.json({ error: "Unknown variant" }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // --- Step A: Idempotency Check (Insert First) ---
        // 利用 credit_events.request_id 的 UNIQUE 约束防止重复加款
        const { error: insertError } = await supabase.from('credit_events').insert({
            user_uid: userUid,
            amount: productInfo.credits,
            skill_name: productInfo.type === 'tier' ? `UPGRADE:${productInfo.targetTier}` : 'TOPUP',
            request_id: `LS_ORDER_${orderId}`
        });

        if (insertError) {
            // PostgreSQL 错误代码 23505 代表唯一性冲突 (unique_violation)
            if ((insertError as any).code === '23505') {
                console.log(`[LS Webhook] Duplicate order ignored: ${orderId}`);
                return NextResponse.json({ message: "Already processed" });
            }
            throw insertError;
        }

        // --- Step B: Fetch Current Profile ---
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('credits, tier')
            .eq('user_uid', userUid)
            .single();

        if (fetchError || !profile) {
            throw new Error(`Profile not found for UID: ${userUid}`);
        }

        // --- Step C: Logic for Upgrade & Credits ---
        let finalTier = profile.tier || 'FREE';
        const addedCredits = productInfo.credits;

        if (productInfo.type === 'tier' && productInfo.targetTier) {
            // 高水位线规则：购买等级 > 当前等级时，执行升级
            const currentWeight = TIER_WEIGHTS[finalTier.toLowerCase()] || 0;
            const targetWeight = TIER_WEIGHTS[productInfo.targetTier.toLowerCase()] || 0;
            
            if (targetWeight > currentWeight) {
                finalTier = productInfo.targetTier.toUpperCase();
            }
        }

        const newBalance = (profile.credits || 0) + addedCredits;

        // --- Step D: Atomic Update ---
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                credits: newBalance,
                tier: finalTier 
            })
            .eq('user_uid', userUid);

        if (updateError) throw updateError;

        // --- Step E: Direct Cloudflare KV Sync (REMOVED) ---
        // We now strictly use the Gateway's sync_cache endpoint to manage its own cache.

        // --- Step F: Push Final State to Gateway Cache (Sync) ---
        const rawGatewayUrl = process.env.GATEWAY_URL ?? "http://localhost:8787";
        const gatewayBaseUrl = rawGatewayUrl.replace(/\/v1\/?$/, "");
        const targetUrl = `${gatewayBaseUrl}/v1/admin/sync_cache`;

        let isGatewaySynced = false;
        if (gatewayBaseUrl) {
            console.log(`[LS Webhook] Syncing Gateway Cache: ${targetUrl}, UID=${userUid}`);
            
            try {
                const syncRes = await fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.ADMIN_KEY}`
                    },
                    body: JSON.stringify({
                        user_uid: userUid,
                        total_credits: newBalance,
                        new_tier: finalTier
                    })
                });

                if (!syncRes.ok) {
                    const errText = await syncRes.text();
                    console.error(`[LS Webhook] Gateway sync FAILED [Status ${syncRes.status}]: ${errText}`);
                } else {
                    console.log(`[LS Webhook] Gateway sync successful!`);
                    isGatewaySynced = true;
                }
            } catch (e: any) {
                console.error("[LS Webhook] Gateway sync notification failed:", e.message);
            }
        }

        // --- Step G: Dispatch Asynchronous Notification (Fire-and-Forget) ---
        // 旁路异步通知，不阻塞主流程
        dispatchPaymentNotification({
            userUid,
            orderId,
            type: productInfo.type === 'tier' ? 'tier_upgrade' : 'top_up',
            addedCredits,
            newBalance,       // 数据库更新后的最新余额
            finalTier,        // 数据库更新后的最终等级
            isGatewaySynced
        });

        // 极速响应：主线跑完，立刻返回 200
        return new Response('Success', { status: 200 });

    } catch (err: any) {
        console.error("[LS Webhook] Processing failed:", err);
        return new Response(`Error: ${err.message}`, { status: 500 });
    }
}
