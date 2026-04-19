// src/app/api/payment/create-checkout/route.ts
// 服务端动态创建 Whop Checkout Session，正确附加 user_uid 到 metadata
// Server-side Whop checkout session creation with metadata injection

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

// ── Whop Plan ID 映射（与前端 PRODUCT_MAP 保持一致）──────────────────────
const VALID_PLANS = new Set([
    'plan_RoIYmx6jHwqXg', // Starter
    'plan_8Age3NspOIYdD', // Pro
    'plan_oue4bGBI3Y0LN', // Scale
    'plan_UFreWJKV7UlA7', // 10K Top-up
    'plan_FRuKKZHZqIm27', // 50K Top-up
]);

export async function POST(req: NextRequest): Promise<Response> {
    // ── Step 1：验证用户登录状态 ──────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();

    // ── Step 2：校验 planId 合法性 ─────────────────────────────────────────
    if (!planId || !VALID_PLANS.has(planId)) {
        return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // ── Step 3：直接从 session 获取 userUid（已在登录时注入）───────────────
    const userUid = (session.user as any)?.userUid as string | undefined;

    if (!userUid) {
        return NextResponse.json({ error: 'User UID not found in session' }, { status: 404 });
    }

    // ── Step 4：调用 Whop API 创建 Checkout Configuration ────────────────
    // 正确端点：POST https://api.whop.com/api/v1/checkout_configurations
    // metadata 字段由服务端注入，Webhook 收到 payment.succeeded 时从中读取 user_uid
    try {
        const whopRes = await fetch('https://api.whop.com/api/v1/checkout_configurations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan_id:  planId,
                metadata: { user_uid: userUid },
            }),
        });

        const whopData = await whopRes.json();
        console.log(`[Checkout] Whop API response [${whopRes.status}]:`, JSON.stringify(whopData, null, 2));

        if (!whopRes.ok) {
            return NextResponse.json(
                { error: 'Failed to create checkout session', detail: whopData },
                { status: 502 }
            );
        }

        // 尝试多个可能的 URL 字段（调试阶段先打印所有字段）
        const checkoutUrl =
            whopData.purchase_url     ||
            whopData.url              ||
            whopData.checkout_url     ||
            (whopData.id ? `https://whop.com/checkout/${whopData.id}` : undefined);

        if (!checkoutUrl) {
            console.error('[Checkout] Cannot find URL in response:', whopData);
            return NextResponse.json(
                { error: 'No checkout URL returned', fields: Object.keys(whopData) },
                { status: 502 }
            );
        }

        console.log(`[Checkout] URL for UID=${userUid}, plan=${planId}: ${checkoutUrl}`);
        return NextResponse.json({ url: checkoutUrl });

    } catch (err: any) {
        console.error('[Checkout] Request failed:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
