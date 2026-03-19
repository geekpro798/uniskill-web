// scripts/test-feishu.ts
// Quick script to verify Feishu notification connectivity and card formatting
// (用于快速验证飞书通知连通性及卡片样式的测试脚本)

import { dispatchPaymentNotification, dispatchAccountCreatedNotification } from '../src/utils/notifications/notifier';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local correctly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🚀 [Test] Starting Feishu Notification Test...');
console.log('📍 [Test] Webhook URL:', process.env.FEISHU_WEBHOOK_URL ? '✅ Configured' : '❌ MISSING (Check .env.local)');

if (!process.env.FEISHU_WEBHOOK_URL) {
    console.error('🛑 [Test] ABORTED: Please set FEISHU_WEBHOOK_URL in .env.local first.');
    process.exit(1);
}

// 1. Test Payment Notification
console.log('--- Testing Payment Notification ---');
dispatchPaymentNotification({
    userUid: "us-test-88888",
    orderId: "TEST_ORDER_LARK_001",
    type: "tier_upgrade",
    addedCredits: 10000,
    newBalance: 10500,
    finalTier: "PRO",
    isGatewaySynced: true
});

// 2. Test Account Creation Notification
console.log('--- Testing Account Creation Notification ---');
dispatchAccountCreatedNotification({
    userUid: "us-new-user-777",
    githubId: "999888777",
    name: "测试新同学 (Test User)",
    email: "welcome@uniskill.ai",
    initialCredits: 500
});

console.log('✅ [Test] Dispatch command sent! Please check your Feishu group.');
console.log('📝 [Test] Note: Since this is Fire-and-Forget, the script might exit before the network request completes in some environments.');

// Keep process alive for a moment to ensure fetch completes in this script context
setTimeout(() => {
    console.log('🏁 [Test] Script finished.');
    process.exit(0);
}, 2000);
