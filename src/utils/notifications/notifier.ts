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
 * 通用的新账号创建通知负载接口
 * (Generic account creation notification payload interface)
 */
export interface AccountCreatedPayload {
    userUid: string;
    githubId: string;
    name: string | null;
    email: string | null;
    initialCredits: number;
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
        const https = require('https');
        const url = new URL(feishuUrl);
        await new Promise<void>((resolve, reject) => {
            const req = https.request(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
                family: 4 // 强制使用 IPv4 避免本地 localhost DNS 解析到黑洞
            }, (res: any) => {
                let data = '';
                res.on('data', (chunk: any) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        console.error(`[Notifier] Feishu Webhook failed [${res.statusCode}]: ${data}`);
                    }
                    resolve();
                });
            });

            req.on('error', (e: any) => {
                console.error('[Notifier] Error sending to Feishu (https):', e.message);
                reject(e);
            });
            req.on('timeout', () => {
                req.destroy();
                console.error('[Notifier] Feishu Timeout');
                reject(new Error('Timeout'));
            });

            req.write(JSON.stringify(feishuData));
            req.end();
        });
    } catch (error) {
        console.error('[Notifier] Error sending to Feishu:', error);
    }
}

/**
 * 飞书适配器实现：负责发送新账号创建通知
 * (Feishu adapter: sends account creation notification)
 */
async function sendAccountCreatedToFeishu(payload: AccountCreatedPayload): Promise<void> {
    const feishuUrl = process.env.FEISHU_WEBHOOK_URL;
    if (!feishuUrl) return;

    const { userUid, githubId, name, email, initialCredits } = payload;

    const feishuData = {
        msg_type: "interactive",
        card: {
            header: {
                title: {
                    content: "🆕 UniSkill 新用户注册通知",
                    tag: "plain_text"
                },
                template: "violet"
            },
            elements: [
                {
                    tag: "div",
                    fields: [
                        {
                            is_short: true,
                            text: { content: `**用户姓名:**\n${name || '未知'}`, tag: "lark_md" }
                        },
                        {
                            is_short: true,
                            text: { content: `**GitHub ID:**\n${githubId}`, tag: "lark_md" }
                        }
                    ]
                },
                {
                    tag: "div",
                    fields: [
                        {
                            is_short: false,
                            text: { content: `**邮箱地址:**\n${email || '未提供'}`, tag: "lark_md" }
                        }
                    ]
                },
                {
                    tag: "div",
                    fields: [
                        {
                            is_short: true,
                            text: { content: `**用户 UID:**\n${userUid}`, tag: "lark_md" }
                        },
                        {
                            is_short: true,
                            text: { content: `**初始积分:**\n${initialCredits.toLocaleString()} Credits`, tag: "lark_md" }
                        }
                    ]
                },
                {
                    tag: "hr"
                },
                {
                    tag: "div",
                    text: {
                        content: `✨ 欢迎新用户加入 UniSkill 家族！\n⏰ **注册时间:** ${new Date().toISOString()}`,
                        tag: "lark_md"
                    }
                }
            ]
        }
    };

    try {
        const https = require('https');
        const url = new URL(feishuUrl);
        await new Promise<void>((resolve, reject) => {
            const req = https.request(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
                family: 4
            }, (res: any) => {
                let data = '';
                res.on('data', (chunk: any) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        console.error(`[Notifier] Feishu AccountCreated failed [${res.statusCode}]: ${data}`);
                    }
                    resolve();
                });
            });

            req.on('error', (e: any) => {
                console.error('[Notifier] Error sending AccountCreated to Feishu (https):', e.message);
                reject(e);
            });
            req.on('timeout', () => {
                req.destroy();
                console.error('[Notifier] Feishu Timeout');
                reject(new Error('Timeout'));
            });

            req.write(JSON.stringify(feishuData));
            req.end();
        });
    } catch (error) {
        console.error('[Notifier] Error sending AccountCreated to Feishu:', error);
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

/**
 * 对外暴露的唯一账号创建调度入口 (Fire-and-Forget)
 */
export function dispatchAccountCreatedNotification(payload: AccountCreatedPayload): void {
    sendAccountCreatedToFeishu(payload).catch(err => {
        console.error('[Notifier] AccountCreated dispatch background error:', err);
    });
    process.stdout.write(`[Notifier] Account created notification dispatched for UID ${payload.userUid}\n`);
}
