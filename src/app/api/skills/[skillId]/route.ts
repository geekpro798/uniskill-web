import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ skillId: string }> }
) {
    const { skillId } = await params;

    try {
        // 核心：从数据库拉取全量原始数据
        const { data: skill, error } = await supabase
            .from("skills")
            .select("*")
            .eq("skill_name", skillId)
            .maybeSingle();

        if (error) throw error;
        if (!skill) {
            return NextResponse.json({ error: "Skill not found" }, { status: 404 });
        }

        // 🌟 核心解析：从 Markdown Manifest 中实时提取运行时元数据
        const manifest = skill.markdown_manifest || "";
        let implementation: any = { type: 'api' }; 

        if (manifest) {
            // 规则 A: 显式声明检测
            const cliTypeMatch = manifest.match(/type:\s*["']?cli["']?/i);
            const isLarkCli = manifest.toLowerCase().includes('lark-cli');
            
            if (cliTypeMatch || isLarkCli) {
                implementation.type = 'cli';
                const binaryMatch = manifest.match(/binary:\s*["']?([^"'\s\n\r]+)["']?/i);
                const commandMatch = manifest.match(/command:\s*["']?([^"'\n\r]+)["']?/i);
                implementation.binary = binaryMatch?.[1] || (isLarkCli ? 'lark-cli' : 'exec');
                implementation.command = commandMatch?.[1] || 'sh';
            }
        }

        // 规则 B: 标识符硬编码兜底 (确保飞书/Lark 系列必选走工业详情页)
        const name = (skill.skill_name || "").toLowerCase();
        if (name.includes("lark_") || name.includes("feishu_")) {
            implementation.type = 'cli';
            if (!implementation.binary) implementation.binary = 'lark-cli';
        }

        // 组装最终结果
        const formattedSkill = {
            ...skill,
            invocations: skill.total_calls || 0,
            implementation: implementation // 🌟 关键：透传解析出的运行时信息
        };

        return NextResponse.json(formattedSkill);
    } catch (error) {
        console.error(`[API] Failed to fetch skill details for ${skillId}:`, error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
