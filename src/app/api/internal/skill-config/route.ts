// uniskill-web/src/app/api/internal/skill-config/route.ts
// Logic: Internal API for Gateway to fetch skill implementation details

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

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

        const mdContent = fs.readFileSync(filePath, "utf-8");

        // 逻辑：通过正则精准提取 Implementation YAML 区块
        const implMatch = mdContent.match(/## Implementation YAML\s+```yaml\s+([\s\S]*?)\s+```/);

        if (!implMatch || !implMatch[1]) {
            return NextResponse.json({ error: "Implementation missing in MD" }, { status: 500 });
        }

        // 逻辑：将 YAML 字符串解析为 JSON 对象返回给网关
        const implementation = yaml.load(implMatch[1]);

        return NextResponse.json({ implementation });

    } catch (error) {
        console.error("Internal API Error:", error);
        return NextResponse.json({ error: "Failed to parse skill config" }, { status: 500 });
    }
}
