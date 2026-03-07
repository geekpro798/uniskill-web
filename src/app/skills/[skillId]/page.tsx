import React from 'react';
import { SkillDetail } from '@/components/SkillDetail'; // 逻辑：引入我们之前写好的通用详情页组件
import { notFound } from 'next/navigation';

// 逻辑：定义 Next.js 页面接收的动态参数接口
interface PageProps {
    params: {
        skillId: string;
    };
}

/**
 * Logic: Next.js Server Component to fetch data before sending HTML to client
 * 逻辑：Next.js 服务端组件，在服务器端完成数据拉取，对 SEO 极其友好
 */
export default async function SkillPage({ params }: PageProps) {
    const { skillId } = await params; // Next.js 15+ 模式，params 是异步的

    try {
        console.log(`[FRONTEND DEBUG] Loading Skill: ${skillId}`);
        // 逻辑：兼容本地联调，优先使用环境变量中的 GATEWAY_URL
        const gatewayUrl = process.env.GATEWAY_URL || 'https://api.uniskill.ai';
        console.log(`[FRONTEND DEBUG] Fetching from: ${gatewayUrl}/v1/skills/${skillId}`);

        const res = await fetch(`${gatewayUrl}/v1/skills/${skillId}`, {
            cache: 'no-store'
        });

        console.log(`[FRONTEND DEBUG] Response Status: ${res.status}`);

        if (!res.ok) {
            if (res.status === 404) {
                console.warn(`[FRONTEND DEBUG] Skill Not Found (404) at Gateway`);
                notFound();
            }
            throw new Error(`Failed to fetch skill data (Status: ${res.status})`);
        }

        const data = await res.json();
        console.log(`[FRONTEND DEBUG] Data success: ${data.success}`);

        if (!data.success) {
            console.warn(`[FRONTEND DEBUG] API reported failure: ${data.error}`);
            notFound();
        }

        // 逻辑：将拉取到的核心规范和权限标识传递给统一的客户端 UI 组件
        return (
            <main className="min-h-screen bg-[#0a0f1e]">
                <SkillDetail
                    skillId={skillId}
                    skill={data.spec}
                    isOfficial={data.is_official}
                    isOwner={data.is_owner}
                />
            </main>
        );

    } catch (error) {
        console.error("Error loading skill:", error);
        // 逻辑：当网关出现异常时的错误降级 UI
        return (
            <div className="flex items-center justify-center min-h-screen text-red-600 font-mono">
                <p>System Error: Unable to load skill data at this time.</p>
            </div>
        );
    }
}
