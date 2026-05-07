// src/app/api/webhook/whop/route.ts
// Whop payment.succeeded Webhook handler with HMAC-SHA256 signature verification
// Whop 支付成功 Webhook 处理器：含签名验证、产品映射发货、高水位等级升级、Gateway 缓存同步

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dispatchPaymentNotification } from '@/utils/notifications/notifier';

export const dynamic = 'force-dynamic';

// ── 等级权重定义：用于高水位线逻辑 (Tier Weights) ──────────────────────────
// 规则：只允许升级，不允许降级。购买套餐权重 > 当前等级权重时才执行升级。
// 例如：当前 Pro，购买 Starter → 权重 1 < 2，跳过等级变更，仅入账积分。
const TIER_WEIGHTS: Record<string, number> = {
    free:    0,
    starter: 1,
    pro:     2,
    scale:   3,
};

// ── Whop 产品映射表 (Product Map) ───────────────────────────────────────────
// 每个 Whop plan_id 对应固定的积分数量和产品类型：
//   tier  — 套餐升级包：含等级提升 + 固定积分（高水位线规则）
//   topup — 纯积分充值包：仅累加积分，不变更等级
//
// 积分数量与定价页完全对应：
//   Starter $9.90  → 10,000 Credits + Starter 等级
//   Pro     $29.90 → 35,000 Credits + Pro 等级
//   Scale   $99.90 → 150,000 Credits + Scale 等级
//   10K 充值 $9.90  → 10,000 Credits（不含等级）
//   50K 充值 $39.90 → 50,000 Credits（不含等级）
const PRODUCT_MAP: Record<string, { type: 'tier' | 'topup'; credits: number; targetTier?: string }> = {
    // ── 套餐升级包 (Tier Packages) - 包含等级提升 + 积分 ──
    'plan_RoIYmx6jHwqXg': { type: 'tier',  credits: 10000,  targetTier: 'starter' },
    'plan_8Age3NspOIYdD': { type: 'tier',  credits: 35000,  targetTier: 'pro'     },
    'plan_oue4bGBI3Y0LN': { type: 'tier',  credits: 150000, targetTier: 'scale'   },

    // ── 纯积分充值包 (Top-up Packages) - 仅包含积分 ──
    'plan_UFreWJKV7UlA7': { type: 'topup', credits: 10000  },
    'plan_FRuKKZHZqIm27': { type: 'topup', credits: 50000  },
};

export async function POST(req: NextRequest): Promise<Response> {
    console.log('[Whop Webhook] >>> NEW REQUEST RECEIVED <<<');

    // ── Step 1：读取原始请求体 ─────────────────────────────────────────────
    // 必须在调用 .json() 之前先用 .text() 读取原始字节，
    // 否则签名验证所需的原始内容将无法复原。
    const rawBody = await req.text();

    // ── Step 2：打印所有 Header，确认 Whop 实际使用的签名字段 ───────────────
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((val, key) => { allHeaders[key] = val; });
    console.log('[Whop Webhook] Headers:', JSON.stringify(allHeaders, null, 2));

    const webhookSecret     = process.env.WHOP_WEBHOOK_SECRET || '';
    const incomingSignature = req.headers.get('x-whop-signature') || '';

    if (webhookSecret) {
        // ── Whop 遵循 Standard Webhooks 规范 ─────────────────────────────
        // 签名内容 = "{webhook-id}.{webhook-timestamp}.{rawBody}"
        // 密钥：ws_ 前缀后为十六进制原始字节
        // 签名 Header = "webhook-signature"，值格式为 "v1,<base64(hmac)>"
        const msgId        = req.headers.get('webhook-id')       || '';
        const msgTimestamp = req.headers.get('webhook-timestamp') || '';
        const msgSig       = req.headers.get('webhook-signature') || incomingSignature;

        let isValid = false;
        try {
            // ── 密钥处理（关键）────────────────────────────────────────────
            // Whop SDK 将 secret 传入方式为 btoa(webhookSecret)，
            // Standard Webhooks 库内部执行 atob(webhookKey) 还原，
            // 因此实际使用的 HMAC 密钥是整个 ws_xxx 字符串的 UTF-8 字节。
            // 正确做法：Buffer.from(webhookSecret)（不做任何前缀剥离或 hex 解码）
            const keyBytes = Buffer.from(webhookSecret);
            const toSign   = `${msgId}.${msgTimestamp}.${rawBody}`;
            const hmac     = crypto.createHmac('sha256', keyBytes);
            const computed = 'v1,' + hmac.update(toSign).digest('base64');

            // webhook-signature 可能含多个签名（空格分隔），任一匹配即通过
            isValid = msgSig.split(' ').some(s => s === computed);

            console.log('[Whop Webhook] Expected signature:', computed);
            console.log('[Whop Webhook] Received signature :', msgSig);
        } catch (e) {
            console.error('[Whop Webhook] Signature compute error:', e);
        }

        if (!isValid) {
            console.error('[Whop Webhook] Signature mismatch — request rejected');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        } else {
            console.log('[Whop Webhook] Signature verified OK ✓');
        }
    } else {
        console.warn('[Whop Webhook] WHOP_WEBHOOK_SECRET not set — skipping signature check');
    }

    try {
        const payload   = JSON.parse(rawBody);
        const eventType: string = payload.type;

        console.log('[Whop Webhook] Event type:', eventType);
        console.log('[Whop Webhook] Raw payload:', JSON.stringify(payload, null, 2));

        // ── Step 3：事件过滤 — 仅处理 payment.succeeded ────────────────────
        if (eventType !== 'payment.succeeded') {
            return NextResponse.json({ message: `Ignored event: ${eventType}` });
        }

        const data = payload.data;

        // ── Step 4：提取 plan_id，匹配产品映射表 ─────────────────────────
        // Whop payload 中 plan_id 可能位于多个字段，按优先级逐一尝试：
        const planId: string | undefined =
            data?.plan_id         ||   // 最常见位置
            data?.plan?.id        ||   // 嵌套对象
            data?.product_id      ||   // 备用
            payload?.plan_id;          // 顶层兜底

        console.log('[Whop Webhook] Detected plan_id:', planId);

        const productInfo = planId ? PRODUCT_MAP[planId] : undefined;

        if (!productInfo) {
            // plan_id 不在映射表中：打印完整 payload 供调试，返回 400
            console.error(
                `[Whop Webhook] Unknown or missing plan_id: "${planId}". ` +
                `Known plan IDs: ${Object.keys(PRODUCT_MAP).join(', ')}`
            );
            return NextResponse.json(
                { error: `Unknown plan_id: ${planId}` },
                { status: 400 }
            );
        }

        // ── Step 5：提取 user_uid ─────────────────────────────────────────
        // 优先从 metadata 读取（前端 Checkout URL 附加的 ?metadata[user_uid]=xxx）。
        // 若 metadata 为空（如后台重试、直接访问链接等场景），则用 data.user.email
        // 在 Supabase profiles 表中反查 user_uid 作为兜底，确保订单不丢失。
        let userUid: string | undefined =
            data?.metadata?.user_uid ||
            payload?.metadata?.user_uid;

        if (!userUid) {
            const fallbackEmail: string | undefined = data?.user?.email;
            console.log(`[Whop Webhook] metadata.user_uid missing — trying email fallback: ${fallbackEmail}`);

            if (fallbackEmail) {
                const supabaseForLookup = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );
                const { data: profileRow } = await supabaseForLookup
                    .from('profiles')
                    .select('user_uid')
                    .eq('email', fallbackEmail)
                    .single();

                if (profileRow?.user_uid) {
                    userUid = profileRow.user_uid;
                    console.log(`[Whop Webhook] Email fallback resolved user_uid: ${userUid}`);
                }
            }
        }

        if (!userUid) {
            console.error('[Whop Webhook] Cannot resolve user_uid. Full payload:', JSON.stringify(payload, null, 2));
            return NextResponse.json(
                { error: 'Missing user_uid in metadata' },
                { status: 400 }
            );
        }

        const paymentId: string  = data?.id || `unknown_${Date.now()}`;
        const creditsToAdd       = productInfo.credits;

        console.log(
            `[Whop Webhook] Payment: ${paymentId} | ` +
            `Plan: ${planId} | Type: ${productInfo.type} | ` +
            `Credits: +${creditsToAdd} | UID: ${userUid}`
        );

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // ── Step 6：读取当前用户 Profile ─────────────────────────────────
        // 需提前读取 authorized_wallet 作为 payer_id
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('credits, tier, authorized_wallet')
            .eq('user_uid', userUid)
            .single();

        if (fetchError || !profile) {
            throw new Error(`Profile not found for UID: ${userUid}`);
        }

        // ── Step 7：幂等性保护 (Idempotency Guard) ────────────────────────
        // 利用 credit_events.request_id 列的 UNIQUE 约束：
        // 同一 Whop Payment ID 重复投递时数据库抛出 23505 唯一性冲突，
        // 直接返回 200 跳过处理，避免重复加款。
        const { error: insertError } = await supabase.from('credit_events').insert({
            user_uid:   userUid,
            amount:     creditsToAdd,
            skill_name: productInfo.type === 'tier'
                ? `WHOP_UPGRADE:${productInfo.targetTier}`
                : 'WHOP_TOPUP',
            request_id: `WHOP_PAYMENT_${paymentId}`,
            payer_id:   profile.authorized_wallet || userUid,
        });

        if (insertError) {
            // PostgreSQL 23505 = unique_violation（唯一性冲突）
            if ((insertError as any).code === '23505') {
                console.log(`[Whop Webhook] Duplicate payment ignored: ${paymentId}`);
                return NextResponse.json({ message: 'Already processed' });
            }
            throw insertError;
        }

        // ── Step 8：高水位线等级升级逻辑 + 积分累加 ──────────────────────
        // 高水位线规则：只升不降。
        // 购买套餐等级权重 > 当前等级权重时，执行等级升级；
        // 否则（购买低等级套餐）仅累加积分，等级保持不变。
        // 示例：当前 Pro，购买 Starter → 权重 1 < 2，跳过升级，仅 +10,000 积分。
        let finalTier = (profile.tier || 'FREE') as string;

        if (productInfo.type === 'tier' && productInfo.targetTier) {
            const currentWeight = TIER_WEIGHTS[finalTier.toLowerCase()] ?? 0;
            const targetWeight  = TIER_WEIGHTS[productInfo.targetTier.toLowerCase()] ?? 0;

            if (targetWeight > currentWeight) {
                finalTier = productInfo.targetTier.toUpperCase();
                console.log(`[Whop Webhook] Tier upgraded: ${profile.tier} → ${finalTier}`);
            } else {
                console.log(`[Whop Webhook] Tier unchanged (high-water mark): ${finalTier}`);
            }
        }

        const newBalance = (profile.credits || 0) + creditsToAdd;

        // ── Step 9：原子更新积分与等级 ───────────────────────────────────
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newBalance, tier: finalTier })
            .eq('user_uid', userUid);

        if (updateError) throw updateError;

        console.log(
            `[Whop Webhook] Profile updated: UID=${userUid} | ` +
            `NewBalance=${newBalance} | Tier=${finalTier}`
        );

        // ── Step 10：同步 Gateway 缓存 ───────────────────────────────────
        // 积分/等级更新后立即通知 Cloudflare Gateway Worker 刷新内存缓存，
        // 避免用户下次 API 调用时因缓存过期被错误拒绝。
        const rawGatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:8787';
        const gatewayBaseUrl = rawGatewayUrl.replace(/\/v1\/?$/, '');
        const syncUrl        = `${gatewayBaseUrl}/v1/admin/sync_cache`;

        let isGatewaySynced = false;
        try {
            const syncRes = await fetch(syncUrl, {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${process.env.ADMIN_KEY}`,
                },
                body: JSON.stringify({
                    user_uid:      userUid,
                    total_credits: newBalance,
                    new_tier:      finalTier,
                }),
            });
            if (!syncRes.ok) {
                const errText = await syncRes.text();
                console.error(`[Whop Webhook] Gateway sync FAILED [${syncRes.status}]: ${errText}`);
            } else {
                console.log('[Whop Webhook] Gateway cache sync successful!');
                isGatewaySynced = true;
            }
        } catch (e: any) {
            console.error('[Whop Webhook] Gateway sync error:', e.message);
        }

        // ── Step 11：飞书异步通知（Fire-and-Forget）─────────────────────
        // 旁路发送充值/升级通知至飞书机器人，不阻塞主流程响应
        dispatchPaymentNotification({
            userUid,
            orderId:      paymentId,
            type:         productInfo.type === 'tier' ? 'tier_upgrade' : 'top_up',
            addedCredits: creditsToAdd,
            newBalance,
            finalTier,
            isGatewaySynced,
        });

        // 极速响应：主线完成后立即返回 200，避免 Whop 因超时重试导致重复投递
        return new Response('OK', { status: 200 });

    } catch (err: any) {
        console.error('[Whop Webhook] Processing failed:', err);
        return new Response(`Error: ${err.message}`, { status: 500 });
    }
}
