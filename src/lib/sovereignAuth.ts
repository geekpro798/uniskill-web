// src/lib/sovereignAuth.ts
// 主权身份验证核心库 — 基于 EIP-191 签名 + ecrecover 的无状态请求认证
// Sovereign Identity verification library using EIP-191 signatures + ecrecover

import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

// ── 常量定义 ──────────────────────────────────────────────────────────────────
// 防重放时间窗口：允许请求时间戳与服务器当前时间相差最多 ±5 分钟
// 这是业界标准做法，既允许客户端时钟轻微漂移，又能防止签名被录制后重放
const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 300_000ms = 5 分钟

// ── 类型定义 ──────────────────────────────────────────────────────────────────
export interface SovereignHeaders {
    wallet:    string; // X-USK-Wallet:    声明的 EOA 钱包地址 (0x...)
    timestamp: string; // X-USK-Timestamp: Unix 毫秒时间戳
    skill:     string; // X-USK-Skill:     被调用的 Skill 名称
    signature: string; // X-USK-Signature: EIP-191 个人签名 (0x<65字节>)
}

export interface VerifiedIdentity {
    userUid:  string;
    wallet:   string;
    credits:  number;
    tier:     string;
}

// ── 签名消息构建 ───────────────────────────────────────────────────────────────
/**
 * 构建标准签名消息字符串
 *
 * 消息设计原则：
 * 1. 包含 Skill 名称，防止一次签名被复用到其他 Skill
 * 2. 包含 Timestamp，结合服务端时间窗口实现防重放
 * 3. 结构固定，双方（客户端/服务端）约定相同格式，确保 ecrecover 可逆
 *
 * @param skill     被调用的 Skill 唯一标识符
 * @param timestamp Unix 毫秒时间戳字符串
 */
export function buildSignMessage(skill: string, timestamp: string): string {
    return `UniSkill Request\nSkill: ${skill}\nTimestamp: ${timestamp}`;
}

// ── Header 提取 ────────────────────────────────────────────────────────────────
/**
 * 从 HTTP 请求中提取并基本校验四个 X-USK Header
 *
 * @returns SovereignHeaders 对象，或 null（表示 Header 缺失，调用方应返回 400）
 */
export function extractSovereignHeaders(req: Request): SovereignHeaders | null {
    const wallet    = req.headers.get('x-usk-wallet');
    const timestamp = req.headers.get('x-usk-timestamp');
    const skill     = req.headers.get('x-usk-skill');
    const signature = req.headers.get('x-usk-signature');

    if (!wallet || !timestamp || !skill || !signature) {
        return null;
    }
    return { wallet, timestamp, skill, signature };
}

// ── 核心验证函数 ───────────────────────────────────────────────────────────────
/**
 * 验证主权身份：防重放 + 签名恢复 + 地址比对
 *
 * 【EIP-191 签名原理 (Personal Sign)】
 * 以太坊 Personal Sign 在签名前会自动在消息前追加前缀：
 *   "\x19Ethereum Signed Message:\n{len}{message}"
 * 目的是区分"链上交易签名"与"任意消息签名"，防止签名被误用于执行交易。
 * ethers.js 的 verifyMessage() 自动处理这个前缀，直接输入原始消息即可。
 *
 * 【ecrecover 数学原语】
 * 给定签名 (r, s, v) 和消息哈希 hash，ecrecover 通过椭圆曲线运算还原出签名者的公钥，
 * 再由公钥推导出以太坊地址（keccak256(publicKey)[12:]）。
 * 如果签名被篡改，恢复出的地址将是随机的，与声明的钱包地址不匹配，请求被拒绝。
 *
 * 【防重放时间窗口】
 * 签名本身是无状态的（不存储在数据库中），所以用时间戳 + 短窗口来防重放：
 * 攻击者必须在 5 分钟内重放截获的签名，否则时间戳过期直接拒绝。
 * 对于更严格的场景，可在 Redis 中存储已使用的签名哈希（nonce 机制），但增加了状态依赖。
 *
 * @param headers  提取到的四个 X-USK Header
 * @throws Error   验证失败时抛出描述性错误（调用方转换为 403 响应）
 * @returns        恢复出的已验证钱包地址（lowercase）
 */
export function verifySovereignSignature(headers: SovereignHeaders): string {
    const { wallet, timestamp, skill, signature } = headers;

    // ── Step 1：防重放校验 ────────────────────────────────────────────────────
    // 解析时间戳（客户端应使用 Date.now() 生成 Unix 毫秒时间戳）
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime)) {
        throw new Error('Invalid timestamp format');
    }

    const now = Date.now();
    const drift = Math.abs(now - requestTime);

    if (drift > REPLAY_WINDOW_MS) {
        // 时间差超出 5 分钟，拒绝请求（防止录制回放攻击）
        throw new Error(`Timestamp expired: drift=${drift}ms, allowed=${REPLAY_WINDOW_MS}ms`);
    }

    // ── Step 2：重建签名消息 ──────────────────────────────────────────────────
    // 客户端和服务端必须使用完全相同的消息字符串，否则 ecrecover 无法还原正确地址
    const message = buildSignMessage(skill, timestamp);

    // ── Step 3：EIP-191 签名恢复 (ecrecover) ─────────────────────────────────
    // ethers.verifyMessage 内部执行：
    //   1. hash = keccak256("\x19Ethereum Signed Message:\n" + len(message) + message)
    //   2. (r, s, v) = 解析 signature 的 65 字节
    //   3. publicKey = ecrecover(hash, v, r, s)
    //   4. address   = "0x" + keccak256(publicKey)[12:].hex()
    let recoveredAddress: string;
    try {
        recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (e) {
        throw new Error('Signature parsing failed: malformed signature');
    }

    // ── Step 4：地址声称比对 ──────────────────────────────────────────────────
    // 防止攻击者用自己的私钥签名，但在 Header 里声称是别人的地址
    // recoveredAddress 是唯一真实的签名者，必须与 X-USK-Wallet 一致
    if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
        throw new Error(
            `Address mismatch: claimed=${wallet}, recovered=${recoveredAddress}`
        );
    }

    return recoveredAddress.toLowerCase();
}

// ── 用户查找 ───────────────────────────────────────────────────────────────────
/**
 * 通过已验证的钱包地址从 profiles 表查找用户
 *
 * profiles.authorized_wallet 字段必须建有 UNIQUE + INDEX 才能高效查找：
 *   CREATE UNIQUE INDEX idx_profiles_wallet ON profiles(authorized_wallet);
 *
 * @param walletAddress  已经过签名验证的钱包地址（lowercase）
 * @returns              用户身份信息，或 null（地址未注册）
 */
export async function getUserByWallet(
    walletAddress: string
): Promise<VerifiedIdentity | null> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('profiles')
        .select('user_uid, credits, tier')
        .eq('authorized_wallet', walletAddress)
        .maybeSingle();

    if (error) {
        console.error('[SovereignAuth] Supabase lookup error:', error);
        return null;
    }

    if (!data) return null;

    return {
        userUid: data.user_uid,
        wallet:  walletAddress,
        credits: data.credits,
        tier:    data.tier,
    };
}
