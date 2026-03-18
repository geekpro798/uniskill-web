// src/app/api/webhook/lemonsqueezy/route.ts
// Smart fulfillment webhook with idempotency and high-water mark upgrade logic
// 智能发货 Webhook：含幂等性校验与高水位等级升级逻辑

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
    "e1cb85d2-ee60-444d-9400-a4e06a3d7852": { type: 'tier', credits: 10000, targetTier: 'starter' },
    "76565e2c-265d-487f-a148-a0525e372fe1": { type: 'tier', credits: 35000, targetTier: 'pro' },
    "842bc7aa-02cd-4035-a125-99364215fd30": { type: 'tier', credits: 150000, targetTier: 'scale' },
    
    // 纯充值包 (Top-up Packages) - 仅包含积分
    "40c7ab57-66ec-4433-9aee-9980130e568d": { type: 'topup', credits: 10000 },
    "aeff7387-f0cb-4621-8e46-5b0aff77d5de": { type: 'topup', credits: 50000 },
};

export async function POST(req: Request) {
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

        // --- Step E: Notify Gateway (KV Sync) ---
        // 只有当等级发生变化时，才传递 tier 参数给 Gateway 以更新 KV
        const gatewayRes = await fetch(`${process.env.GATEWAY_URL}/v1/admin/topup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ADMIN_KEY}`
            },
            body: JSON.stringify({
                user_uid: userUid,
                credits_to_add: addedCredits,
                tier: finalTier !== profile.tier ? finalTier : undefined
            })
        });

        console.log(`[LS Webhook] Success for ${userUid}. Added ${addedCredits}, Tier: ${finalTier}`);
        return NextResponse.json({ success: true, userUid, newBalance });

    } catch (err: any) {
        console.error("[LS Webhook] Processing failed:", err);
        return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
    }
}
