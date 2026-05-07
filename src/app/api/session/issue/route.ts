// src/app/api/session/issue/route.ts
// Session Key 签发 API — 将前端生成的临时密钥对注册到 Gateway KV
// 安全边界：
//   1. 用户必须已通过 GitHub OAuth 登录（NextAuth Session）
//   2. 用户必须已激活 Sovereign Wallet (authorized_wallet 不为 null)
//   3. Private Key 从不经过服务端，仅在浏览器本地生成并下载

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createClient } from '@supabase/supabase-js';
import { isAddress } from 'ethers';

export const dynamic = 'force-dynamic';

// 允许的 Session Key 有效期（毫秒）
const VALID_DURATIONS_MS: Record<string, number> = {
    '7d':  7  * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
};

// ── POST: 注册新 Session Key ──────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<Response> {
    // ── Step 1: 验证登录状态 ──────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userUid = (session.user as any).userUid as string;

    // ── Step 2: 解析请求体 ──────────────────────────────────────────────
    let sessionPubKey: string;
    let duration: string;
    let label: string;

    try {
        const body = await req.json();
        sessionPubKey = ((body.sessionPubKey as string) || '').toLowerCase().trim();
        duration      = (body.duration as string) || '30d';
        label         = ((body.label as string) || 'Local Agent').trim();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // ── Step 3: 校验 Session Public Key 格式（必须是合法 Ethereum 地址）──
    if (!sessionPubKey || !isAddress(sessionPubKey)) {
        return NextResponse.json(
            { error: 'Invalid sessionPubKey: must be a valid 42-char 0x Ethereum address' },
            { status: 400 }
        );
    }

    if (!VALID_DURATIONS_MS[duration]) {
        return NextResponse.json(
            { error: 'Invalid duration. Allowed values: 7d, 30d, 90d' },
            { status: 400 }
        );
    }

    if (label.length > 64) {
        return NextResponse.json({ error: 'Label too long (max 64 chars)' }, { status: 400 });
    }

    // ── Step 4: 查询用户 authorized_wallet（身份锚点）───────────────────
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: dbError } = await supabaseAdmin
        .from('profiles')
        .select('authorized_wallet')
        .eq('user_uid', userUid)
        .maybeSingle();

    if (dbError) {
        console.error('[Session Issue] DB error:', dbError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!profile?.authorized_wallet) {
        return NextResponse.json(
            { error: 'Sovereign wallet not yet activated. Please link your wallet first.' },
            { status: 403 }
        );
    }

    // ── Step 5: 计算过期时间 ──────────────────────────────────────────────
    const expiresAt = Date.now() + VALID_DURATIONS_MS[duration];

    // ── Step 6: 调用 Gateway 注册 Session Key ───────────────────────────
    const rawGatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:8787';
    const gatewayBaseUrl = rawGatewayUrl.replace(/\/v1\/?$/, '');

    try {
        const regRes = await fetch(`${gatewayBaseUrl}/v1/session/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ADMIN_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionPubKey,
                userUid,
                walletAddress: profile.authorized_wallet,
                expiresAt,
                label,
            }),
        });

        if (!regRes.ok) {
            const errText = await regRes.text();
            console.error('[Session Issue] Gateway registration failed:', regRes.status, errText);
            return NextResponse.json({ error: 'Failed to register session key with Gateway' }, { status: 502 });
        }
    } catch (err: any) {
        console.error('[Session Issue] Gateway unreachable:', err.message);
        return NextResponse.json({ error: 'Gateway unreachable. Please try again later.' }, { status: 502 });
    }

    console.log(`[Session Issue] OK: sessionPubKey=${sessionPubKey} uid=${userUid} label="${label}" exp=${new Date(expiresAt).toISOString()}`);

    return NextResponse.json({
        success:        true,
        sessionPubKey,
        walletAddress:  profile.authorized_wallet,
        userUid,
        expiresAt,
        label,
        gatewayUrl:     gatewayBaseUrl,
    });
}

// ── DELETE: 吊销 Session Key ──────────────────────────────────────────────
export async function DELETE(req: NextRequest): Promise<Response> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let sessionPubKey: string;
    try {
        const body = await req.json();
        sessionPubKey = ((body.sessionPubKey as string) || '').toLowerCase().trim();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!sessionPubKey) {
        return NextResponse.json({ error: 'Missing sessionPubKey' }, { status: 400 });
    }

    const rawGatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:8787';
    const gatewayBaseUrl = rawGatewayUrl.replace(/\/v1\/?$/, '');

    try {
        const revokeRes = await fetch(`${gatewayBaseUrl}/v1/session/revoke`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${process.env.ADMIN_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionPubKey }),
        });

        // 404 = 已吊销，也视为成功
        if (!revokeRes.ok && revokeRes.status !== 404) {
            console.error('[Session Revoke] Gateway error:', revokeRes.status);
            return NextResponse.json({ error: 'Failed to revoke session key' }, { status: 502 });
        }
    } catch (err: any) {
        console.error('[Session Revoke] Gateway unreachable:', err.message);
        return NextResponse.json({ error: 'Gateway unreachable' }, { status: 502 });
    }

    console.log(`[Session Revoke] OK: sessionPubKey=${sessionPubKey}`);
    return NextResponse.json({ success: true, revoked: sessionPubKey });
}
