// scripts/test-agent-call.ts
// CLI Agent 签名测试脚本 — 模拟 Sovereign Identity 请求
// Tests the new wallet signature authentication flow for the UniSkill Gateway
//
// 用法:
//   npx ts-node scripts/test-agent-call.ts --skill=web_search --url=http://localhost:8787
//
// 注意: 此脚本生成一次性随机钱包用于测试。
//        生产环境 Agent 应从已绑定的 Session Key 文件读取私钥。

import { ethers } from 'ethers';

// ── 命令行参数解析 ─────────────────────────────────────────────────────────
function getArg(flag: string, defaultVal: string): string {
    const arg = process.argv.find(a => a.startsWith(`--${flag}=`));
    return arg ? arg.split('=').slice(1).join('=') : defaultVal;
}

const SKILL_NAME    = getArg('skill', 'web_search');
const GATEWAY_URL   = getArg('url',   'http://127.0.0.1:8787');
const VERIFY_URL    = getArg('verify', 'http://localhost:3000/api/v1/verify');
const TEST_MODE     = getArg('mode',   'verify'); // 'gateway' | 'verify'

async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   UniSkill Sovereign Identity Test Client    ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    // ── Step 1：生成测试钱包（生产环境替换为从 usk_session_key.json 读取）──
    // 在真实 Agent 场景中，需先完成钱包绑定，再使用已注册地址对应的私钥
    const wallet = ethers.Wallet.createRandom();
    console.log(`[1] Test Wallet Generated`);
    console.log(`    Address:     ${wallet.address}`);
    console.log(`    Private Key: ${wallet.privateKey.slice(0, 10)}...`);
    console.log('');
    console.log('⚠️  NOTE: This is a fresh random wallet — NOT registered in Supabase.');
    console.log('   The verify endpoint will return 403 (wallet not registered).');
    console.log('   To test a full flow, first register this address via /api/user/wallet');
    console.log('');

    // ── Step 2：构建签名消息 ──────────────────────────────────────────────
    // 消息格式必须与 src/lib/sovereignAuth.ts 中的 buildSignMessage 完全一致
    const timestamp = Date.now().toString();
    const message   = `UniSkill Request\nSkill: ${SKILL_NAME}\nTimestamp: ${timestamp}`;

    console.log(`[2] Signing Message`);
    console.log(`    Skill:     ${SKILL_NAME}`);
    console.log(`    Timestamp: ${timestamp}`);
    console.log(`    Message:\n${message.split('\n').map(l => '    | ' + l).join('\n')}`);
    console.log('');

    // ── Step 3：EIP-191 个人签名 ─────────────────────────────────────────
    // ethers wallet.signMessage() 自动添加 "\x19Ethereum Signed Message:\n" 前缀
    // 对应服务端 ethers.verifyMessage() 的 ecrecover 过程
    const signature = await wallet.signMessage(message);
    console.log(`[3] Signature Generated`);
    console.log(`    ${signature.slice(0, 20)}...${signature.slice(-10)}`);
    console.log('');

    // ── Step 4：构建请求 Headers ─────────────────────────────────────────
    const headers: Record<string, string> = {
        'Content-Type':    'application/json',
        'X-USK-Wallet':    wallet.address,
        'X-USK-Timestamp': timestamp,
        'X-USK-Skill':     SKILL_NAME,
        'X-USK-Signature': signature,
    };

    console.log(`[4] Request Headers`);
    Object.entries(headers).forEach(([k, v]) => {
        if (k !== 'Content-Type') {
            const display = v.length > 60 ? v.slice(0, 30) + '...' + v.slice(-10) : v;
            console.log(`    ${k}: ${display}`);
        }
    });
    console.log('');

    // ── Step 5：发送请求 ──────────────────────────────────────────────────
    const targetUrl = TEST_MODE === 'gateway' ? `${GATEWAY_URL}/v1/execute` : VERIFY_URL;
    console.log(`[5] Sending request to: ${targetUrl}`);

    try {
        const res = await fetch(targetUrl, {
            method:  'POST',
            headers,
            body:    TEST_MODE === 'gateway'
                ? JSON.stringify({ skill: SKILL_NAME, input: 'test query' })
                : undefined,
        });

        const body = await res.text();
        let parsed: any;
        try { parsed = JSON.parse(body); } catch { parsed = body; }

        console.log(`\n[6] Response:`);
        console.log(`    Status: ${res.status} ${res.statusText}`);
        console.log(`    Body:   ${JSON.stringify(parsed, null, 2).split('\n').join('\n    ')}`);
        console.log('');

        if (res.status === 200) {
            console.log('✅ Signature verification PASSED');
        } else if (res.status === 403) {
            const detail = parsed?.detail || parsed?.error || '';
            if (detail.includes('not registered')) {
                console.log('⚠️  Wallet not registered — link this wallet in Dashboard Settings first');
            } else {
                console.log('❌ Signature verification FAILED:', detail);
            }
        } else if (res.status === 400) {
            console.log('❌ Missing or malformed headers:', parsed?.error);
        } else {
            console.log(`❓ Unexpected status: ${res.status}`);
        }

    } catch (err: any) {
        console.error('❌ Network error:', err.message);
    }

    // ── 防重放演示：相同签名延迟 1ms 重发 ─────────────────────────────────
    console.log('\n[7] Anti-replay test (same signature, simulated 6-minute delay)');
    console.log('    Modifying timestamp to 6 minutes ago...');
    const oldTimestamp = (Date.now() - 7 * 60 * 1000).toString();
    const oldMessage   = `UniSkill Request\nSkill: ${SKILL_NAME}\nTimestamp: ${oldTimestamp}`;
    const oldSig       = await wallet.signMessage(oldMessage);

    try {
        const replayRes = await fetch(VERIFY_URL, {
            method:  'POST',
            headers: {
                'Content-Type':    'application/json',
                'X-USK-Wallet':    wallet.address,
                'X-USK-Timestamp': oldTimestamp,
                'X-USK-Skill':     SKILL_NAME,
                'X-USK-Signature': oldSig,
            },
        });
        const replayBody = await replayRes.json().catch(() => ({}));
        if (replayRes.status === 403) {
            console.log('✅ Anti-replay protection WORKING — expired timestamp rejected');
        } else {
            console.log('❌ Anti-replay FAILED — should have returned 403');
        }
    } catch (err: any) {
        console.log('Network error during replay test:', err.message);
    }

    console.log('\nDone.');
}

main().catch(console.error);
