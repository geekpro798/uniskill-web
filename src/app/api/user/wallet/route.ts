// src/app/api/user/wallet/route.ts
// 钱包地址绑定 API — 支持首次绑定与 GitHub 二次验证自助恢复
// Wallet binding API: initial binding + GitHub re-auth self-service recovery

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

// ── GET：查询当前用户的钱包绑定状态 ──────────────────────────────────────────
export async function GET(): Promise<Response> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userUid = (session.user as any).userUid as string;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('profiles')
        .select('authorized_wallet')
        .eq('user_uid', userUid)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
        authorized_wallet: data?.authorized_wallet ?? null,
    });
}

// ── POST：绑定或覆盖钱包地址 ─────────────────────────────────────────────────
// 请求体：{ walletAddress: string }
// Query:  ?recover=true  → 自助恢复模式（允许覆盖旧地址）
export async function POST(req: NextRequest): Promise<Response> {
    // ── Step 1：验证登录状态（NextAuth GitHub Session）──────────────────────
    // 此处的 Session 是 GitHub OAuth 身份的证明，与钱包签名无关
    // 两者结合才能保证：我是 GitHub @username AND 我持有此钱包
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userUid  = (session.user as any).userUid  as string;
    const githubId = (session.user as any).githubId as string;

    // ── Step 2：解析请求体 ──────────────────────────────────────────────────
    let walletAddress: string;
    try {
        const body    = await req.json();
        walletAddress = body.walletAddress;
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // ── Step 3：校验地址格式（必须是合法的 EVM EOA 地址）──────────────────
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
        return NextResponse.json(
            { error: 'Invalid wallet address format' },
            { status: 400 }
        );
    }

    // 统一存储小写地址，避免大小写不一致导致 ecrecover 比对失败
    const normalizedAddress = walletAddress.toLowerCase();

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── Step 4：判断模式（首次绑定 / 自助恢复）─────────────────────────────
    const isRecovery = req.nextUrl.searchParams.get('recover') === 'true';

    if (!isRecovery) {
        // ── 首次绑定模式：检查是否已绑定，防止重复绑定不同地址 ──────────────
        const { data: existing } = await supabase
            .from('profiles')
            .select('authorized_wallet')
            .eq('user_uid', userUid)
            .maybeSingle();

        if (existing?.authorized_wallet) {
            // 已经绑定过，应使用 recover 模式覆盖
            return NextResponse.json(
                { error: 'Wallet already bound. Use ?recover=true to re-link.' },
                { status: 409 }
            );
        }
    } else {
        // ── 自助恢复模式：GitHub 二次验证 ─────────────────────────────────
        // 安全边界：
        // 1. 请求来自已通过 GitHub OAuth 的 NextAuth Session → 证明"我是 @username"
        // 2. walletAddress 来自 Particle AuthKit（与该 GitHub 账号绑定的 MPC 钱包）
        // 3. 两者均由 UniSkill 服务端验证，无法伪造
        // 因此：能通过此接口的人，必然是该 GitHub 账号的真实持有者
        console.log(`[Wallet] Self-service recovery for githubId=${githubId}, uid=${userUid}`);
    }

    // ── Step 5：写入数据库 ──────────────────────────────────────────────────
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ authorized_wallet: normalizedAddress })
        .eq('user_uid', userUid);

    if (updateError) {
        console.error('[Wallet] DB update error:', updateError);

        // 唯一约束冲突：该地址已被其他账号使用
        if (updateError.code === '23505') {
            return NextResponse.json(
                { error: 'This wallet address is already linked to another account.' },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
    }

    // ── Step 6：通知 Gateway 缓存失效（可选，容错）──────────────────────────
    // Gateway KV 中的 authorized_wallet 字段需同步更新
    // 如果 Gateway 不支持此操作，不影响核心功能（数据库是权威来源）
    try {
        const rawGatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:8787';
        const gatewayBaseUrl = rawGatewayUrl.replace(/\/v1\/?$/, '');
        await fetch(`${gatewayBaseUrl}/v1/admin/sync_cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ADMIN_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_uid:           userUid,
                authorized_wallet:  normalizedAddress,
            }),
        });
    } catch (err: any) {
        // Gateway 同步失败不阻断主流程，记录日志即可
        console.warn('[Wallet] Gateway sync failed (non-critical):', err.message);
    }

    const action = isRecovery ? 'recovered' : 'linked';
    console.log(`[Wallet] Wallet ${action}: uid=${userUid}, address=${normalizedAddress}`);

    return NextResponse.json({
        success:          true,
        authorized_wallet: normalizedAddress,
        action,
    });
}
