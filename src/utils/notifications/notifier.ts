// src/utils/notifications/notifier.ts
// Notification dispatcher using Adapter Pattern
// 通用通知调度中心：适配器模式实现，解耦 Webhook 与具体 IM 平台

/**
 * 通用的支付通知负载接口
 * (Generic payment notification payload interface)
 */
export interface PaymentNotificationPayload {
    userUid: string;
    orderId: string;
    type: 'tier_upgrade' | 'top_up';
    addedCredits: number;
    newBalance: number;
    finalTier: string;
    isGatewaySynced: boolean;
}

/**
 * 飞书适配器实现：负责将通用负载转换为飞书互动卡片并发送
 * (Feishu adapter: converts generic payload to Feishu interactive card and sends it)
 */
async function sendToFeishu(payload: PaymentNotificationPayload): Promise<void> {
    const feishuUrl = process.env.FEISHU_WEBHOOK_URL;
    if (!feishuUrl) {
        // console.warn('[Notifier] FEISHU_WEBHOOK_URL not configured, skipping Feishu notification.');
        return;
    }

    const { 
        userUid, 
        orderId, 
        type, 
        addedCredits, 
        newBalance, 
        finalTier, 
        isGatewaySynced 
    } = payload;

    const theme = type === 'tier_upgrade' ? 'blue' : 'green';
    const typeLabel = type === 'tier_upgrade' ? '💎 套餐升级 (Tier Upgrade)' : '💰 积分充值 (Top-up)';

    // 构建飞书互动卡片 JSON
    const feishuData = {
        msg_type: "interactive",
        card: {
            header: {
                title: {
                    content: theme === 'blue' ? "🎉 UniSkill 套餐升级成功" : "🎉 UniSkill 积分充值成功",
                    tag: "plain_text"
                },
                template: theme
            },
            elements: [
                {
                    tag: "div",
                    fields: [
                        {
                            is_short: true,
                            text: { content: `**用户 UID:**\n${userUid}`, tag: "lark_md" }
                        },
                        {
                            is_short: true,
                            text: { content: `**订单 ID:**\n${orderId}`, tag: "lark_md" }
                        }
                    ]
                },
                {
                    tag: "div",
                    fields: [
                        {
                            is_short: true,
                            text: { content: `**产品类型:**\n${typeLabel}`, tag: "lark_md" }
                        },
                        {
                            is_short: true,
                            text: { content: `**本次到账:**\n+${addedCredits.toLocaleString()} Credits`, tag: "lark_md" }
                        }
                    ]
                },
                {
                    tag: "div",
                    fields: [
                        {
                            is_short: true,
                            text: { content: `**当前等级:**\n${finalTier.toUpperCase()}`, tag: "lark_md" }
                        },
                        {
                            is_short: true,
                            text: { content: `**充值后余额:**\n${newBalance.toLocaleString()} Credits`, tag: "lark_md" }
                        }
                    ]
                },
                {
                    tag: "hr"
                },
                {
                    tag: "div",
                    text: {
                        content: `✅ **网关缓存同步:** ${isGatewaySynced ? "成功 (Success)" : "失败 (Failed)"}\n⏰ **处理时间:** ${new Date().toISOString()}`,
                        tag: "lark_md"
                    }
                }
            ]
        }
    };

    try {
        const response = await fetch(feishuUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feishuData)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Notifier] Feishu Webhook failed [${response.status}]: ${errText}`);
        }
    } catch (error) {
        console.error('[Notifier] Error sending to Feishu:', error);
    }
}

/**
 * 对外暴露的唯一调度入口 (Fire-and-Forget 异步派发)
 * (The single exposed dispatcher entry point - Fire-and-Forget)
 */
export function dispatchPaymentNotification(payload: PaymentNotificationPayload): void {
    // 异步执行，不使用 await 阻塞调用方 (Fire-and-Forget)
    
    // 1. 发送到飞书
    sendToFeishu(payload).catch(err => {
        console.error('[Notifier] Feishu dispatch background error:', err);
    });

    // 2. 预留：发送到 Slack
    // if (process.env.SLACK_WEBHOOK_URL) {
    //     sendToSlack(payload).catch(console.error);
    // }

    // 3. 预留：发送邮件回执
    // sendEmailReceipt(payload).catch(console.error);
    
    process.stdout.write(`[Notifier] Payment notification dispatched for Order ${payload.orderId}\n`);
}
