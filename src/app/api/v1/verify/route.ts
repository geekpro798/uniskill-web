// src/app/api/v1/verify/route.ts
// 身份验证接口 — 从 API Key Hash 比对迁移至 EIP-191 钱包签名验证
// Identity verification: migrated from API Key hash comparison to EIP-191 wallet signature

import { NextRequest, NextResponse } from 'next/server';
import {
    extractSovereignHeaders,
    verifySovereignSignature,
    getUserByWallet,
} from '@/lib/sovereignAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/verify
 *
 * 请求方式已从 JSON body { key: "us-xxx" } 切换为四个 HTTP Header：
 *   X-USK-Wallet:     声明的 EOA 钱包地址
 *   X-USK-Timestamp:  Unix 毫秒时间戳
 *   X-USK-Skill:      被调用的 Skill 名称
 *   X-USK-Signature:  EIP-191 个人签名
 *
 * 旧的 us-uuid API Key 格式已永久废弃，发送旧格式将返回 400。
 */
export async function POST(req: NextRequest) {
    // ── Step 1：提取四个必须的 X-USK Header ────────────────────────────────
    const headers = extractSovereignHeaders(req);

    if (!headers) {
        return NextResponse.json(
            {
                error: 'Missing sovereign identity headers',
                required: ['X-USK-Wallet', 'X-USK-Timestamp', 'X-USK-Skill', 'X-USK-Signature'],
                note: 'Legacy us-uuid API Keys are no longer accepted.',
            },
            { status: 400 }
        );
    }

    // ── Step 2：验证签名（防重放 + ecrecover + 地址比对）──────────────────
    let verifiedAddress: string;
    try {
        verifiedAddress = verifySovereignSignature(headers);
    } catch (err: any) {
        console.warn('[Verify] Signature verification failed:', err.message);
        return NextResponse.json(
            { error: 'Signature verification failed', detail: err.message },
            { status: 403 }
        );
    }

    // ── Step 3：数据库查找已注册的钱包持有者 ────────────────────────────────
    const identity = await getUserByWallet(verifiedAddress);

    if (!identity) {
        return NextResponse.json(
            { error: 'Wallet address not registered. Please link your wallet in Dashboard Settings.' },
            { status: 403 }
        );
    }

    // ── Step 4：验证通过，返回用户身份 ─────────────────────────────────────
    return NextResponse.json({
        success:  true,
        userUid:  identity.userUid,
        wallet:   identity.wallet,
        credits:  identity.credits,
        tier:     identity.tier,
    });
}
