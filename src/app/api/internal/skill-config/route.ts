// uniskill-web/src/app/api/internal/skill-config/route.ts
// Logic: Internal API for Gateway to fetch skill implementation details

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { parseSkillFile } from "@/lib/skills-parser";

export async function GET(request: NextRequest) {
    // 逻辑：获取网关请求的技能 ID
    const searchParams = request.nextUrl.searchParams;
    const skillId = searchParams.get("id");

    // 逻辑：极简的内网鉴权，防止恶意用户获取真实的 API Key 映射逻辑
    const internalSecret = request.headers.get("x-internal-secret");
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!skillId) {
        return NextResponse.json({ error: "Missing skill id" }, { status: 400 });
    }

    try {
        // 逻辑：定位到统一的官方技能存放目录
        const filePath = path.join(process.cwd(), "registry", "skills", `${skillId}.md`);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Skill not found" }, { status: 404 });
        }

        // 🔵 核心变革：使用统一的 Parser 获取完整结构 (包含 meta, config, docs)
        const skillData = parseSkillFile(skillId);

        if (!skillData) {
            return NextResponse.json({ error: "Skill not found in registry" }, { status: 404 });
        }

        // 逻辑：构造大一统 JSON 结构返回给网关
        return NextResponse.json({
            skill_name: skillData.skill_name,
            source: skillData.status.toLowerCase(),
            meta: {
                display_name: skillData.display_name,
                emoji: skillData.emoji,
                cost: skillData.credits_per_call, // Main cost field is credits for now
                credits_per_call: skillData.credits_per_call,
                usd_per_call: skillData.usd_per_call,
                payment_type: skillData.payment_type,
                category: skillData.category,
                tags: skillData.tags
            },
            // Maintain backward compatibility for the gateway
            display_name: skillData.display_name,
            cost_per_call: skillData.credits_per_call, 
            credits_per_call: skillData.credits_per_call,
            usd_per_call: skillData.usd_per_call,
            payment_type: skillData.payment_type,
            config: typeof skillData.implementation === 'string'
                ? yaml.load(skillData.implementation)
                : skillData.implementation,
            docs: {
                short: skillData.description,
                full_md: fs.readFileSync(path.join(process.cwd(), "registry", "skills", `${skillId}.md`), "utf-8")
            }
        });

    } catch (error) {
        console.error("Internal API Error:", error);
        return NextResponse.json({ error: "Failed to parse skill config" }, { status: 500 });
    }
}
