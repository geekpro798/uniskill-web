import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    
    // 1. 获取排序参数
    const sortBy = searchParams.get("sortBy") || "popularity";
    const order = searchParams.get("order") || "desc";

    // 2. 数据库映射规则 (Legacy DB Support)
    const sortMap: Record<string, string> = {
        popularity: "total_calls",
        recency: "deployed_at",
        pricing: "credits_per_call"
    };
    const dbSortField = sortMap[sortBy] || "total_calls";

    try {
        const { data: skills, error } = await supabase
            .from("skills")
            .select(`
                skill_uid, 
                skill_name, 
                display_name, 
                description, 
                category, 
                tags, 
                status, 
                state, 
                owner_uid,
                credits_per_call, 
                total_calls, 
                gradient_from, 
                gradient_to,
                emoji,
                deployed_at,
                markdown_manifest
            `)
            .in("status", ["Official", "Community"])
            .eq("state", "active")
            .order(dbSortField, { ascending: order === "asc" });

        if (error) throw error;

        // 3. 混合解析逻辑 (Hybrid Metadata Parsing)
        const formattedSkills = (skills || []).map(skill => {
            const manifest = skill.markdown_manifest || "";
            let visual_metadata: any = {};
            let implementation: any = { type: 'api' }; 
            
            if (manifest) {
                // 1. 提取视觉定义
                const iconMatch = manifest.match(/suggested_icon:\s*([^\s\n\r]+)/);
                const themeMatch = manifest.match(/theme_color:\s*([^\s\n\r]+)/);
                if (iconMatch) visual_metadata.suggested_icon = iconMatch[1]?.replace(/['"]/g, '').trim();
                if (themeMatch) visual_metadata.theme_color = themeMatch[1]?.replace(/['"]/g, '').trim();

                // 2. 🌟 强化版 CLI 检测 (Robust CLI Discovery)
                // 规则 A: 显式声明 type: cli 或 runtime: cli
                const cliTypeMatch = manifest.match(/type:\s*["']?cli["']?/i);
                // 规则 B: 提及 lark-cli 环境变量或二进制 (作为补充判定)
                const isLarkCli = manifest.toLowerCase().includes('lark-cli');
                
                if (cliTypeMatch || isLarkCli) {
                    implementation.type = 'cli';
                    
                    // 尝试解析并补全渲染所需的预览路径
                    const binaryMatch = manifest.match(/binary:\s*["']?([^"'\s\n\r]+)["']?/i);
                    const commandMatch = manifest.match(/command:\s*["']?([^"'\n\r]+)["']?/i);
                    implementation.binary = binaryMatch?.[1] || (isLarkCli ? 'lark-cli' : 'exec');
                    implementation.command = commandMatch?.[1] || 'sh';
                }
            }

            // 补充：基于名称的硬编码兜底 (确保飞书系列哪怕同步失败也能识别样式)
            const name = (skill.skill_name || "").toLowerCase();
            if (name.includes("lark_") || name.includes("feishu_")) {
                implementation.type = 'cli';
                if (!implementation.binary) implementation.binary = 'lark-cli';
            }

            return {
                skill_uid: skill.skill_uid,
                skill_name: skill.skill_name,
                display_name: skill.display_name,
                description: skill.description,
                category: skill.category,
                tags: skill.tags,
                status: skill.status,
                state: skill.state,
                owner_uid: skill.owner_uid,
                credits_per_call: skill.credits_per_call,
                total_calls: skill.total_calls,
                invocations: skill.total_calls || 0,
                gradient_from: skill.gradient_from,
                gradient_to: skill.gradient_to,
                gradientFrom: skill.gradient_from,
                gradientTo: skill.gradient_to,
                emoji: skill.emoji,
                deployed_at: skill.deployed_at,
                implementation: implementation,
                visuals: visual_metadata 
            };
        });

        return NextResponse.json(formattedSkills);
    } catch (error) {
        console.error("[API Error] Failed to fetch optimized skills:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
