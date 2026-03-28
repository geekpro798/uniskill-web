import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    
    // 1. 获取排序参数 (Sort Params)
    const sortBy = searchParams.get("sortBy") || "popularity";
    const order = searchParams.get("order") || "desc";

    // 2. 数据库映射规则 (Database Mapping) - 修正：DB 真实列名为 total_calls, credits_per_call, deployed_at
    const sortMap: Record<string, string> = {
        popularity: "total_calls",
        recency: "deployed_at",
        pricing: "credits_per_call"
    };
    const dbSortField = sortMap[sortBy] || "total_calls";

    try {
        // 核心变革：按需索取元数据，包含 markdown_manifest 用于提取视觉特性
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

        if (error) {
            throw error;
        }

        // 3. 逻辑转换：提取视觉特性并保持 payload 轻量
        const formattedSkills = (skills || []).map(skill => {
            // 提取 manifest 中的视觉定义 (suggested_icon, theme_color)
            let visual_metadata: any = {};
            if (skill.markdown_manifest) {
                const iconMatch = skill.markdown_manifest.match(/suggested_icon:\s*([^\s\n\r]+)/);
                const themeMatch = skill.markdown_manifest.match(/theme_color:\s*([^\s\n\r]+)/);
                if (iconMatch) visual_metadata.suggested_icon = iconMatch[1].replace(/['"]/g, '').trim();
                if (themeMatch) visual_metadata.theme_color = themeMatch[1].replace(/['"]/g, '').trim();
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
                visuals: visual_metadata // 🌟 仅返回提取后的精简视觉元数据
            };
        });

        return NextResponse.json(formattedSkills);
    } catch (error) {
        console.error("[API] Failed to fetch lean skills with visuals from Supabase:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
