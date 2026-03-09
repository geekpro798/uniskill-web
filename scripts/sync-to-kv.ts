// uniskill-web/scripts/sync-to-kv.ts
// Logic: Parse local .md skills and push structured JSON to Cloudflare KV.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";
import dotenv from "dotenv";

// 逻辑：加载环境变量中的 Cloudflare 凭证
dotenv.config({ path: ".env.local" });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

const SKILLS_DIR = path.join(process.cwd(), "registry", "skills");

// 逻辑：Cloudflare KV REST API 基础写入函数
async function putToKV(key: string, value: string, contentType: string = "application/json") {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${key}`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": contentType
        },
        body: value
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`KV API Error on key [${key}]: ${errorData}`);
    }
}

async function syncSkillsToKV() {
    console.log("🚀 Starting UniSkill Registry Sync to Cloudflare KV...\n");

    if (!ACCOUNT_ID || !API_TOKEN || !NAMESPACE_ID) {
        console.error("❌ Error: Missing Cloudflare credentials in .env file.");
        process.exit(1);
    }

    if (!fs.existsSync(SKILLS_DIR)) {
        console.error(`❌ Error: Registry directory not found at ${SKILLS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(SKILLS_DIR).filter(file => file.endsWith(".md"));
    console.log(`📦 Found ${files.length} skill files to sync.\n`);

    for (const file of files) {
        const filePath = path.join(SKILLS_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");

        try {
            // 逻辑：使用 gray-matter 剥离 Frontmatter 和 Markdown 正文
            const { data: frontmatter, content } = matter(fileContent);
            const skillId = frontmatter.id;

            if (!skillId) throw new Error("Missing 'id' in frontmatter");

            // 逻辑：正则提取 Description 正文，用于 UI 展示
            const descMatch = content.match(/## Description\n([\s\S]*?)(?=\n##|$)/);
            const description = descMatch ? descMatch[1].trim() : "";

            // 逻辑：正则提取 Parameters JSON，用于 MCP Schema 和前端表单生成
            const paramMatch = content.match(/## Parameters\n```json\n([\s\S]*?)```/);
            const parameters = paramMatch ? JSON.parse(paramMatch[1]) : { type: "object", properties: {} };

            // 逻辑：正则提取 Implementation YAML，用于 Gateway 底层执行
            const implMatch = content.match(/## Implementation YAML\n```yaml\n([\s\S]*?)```/);
            if (!implMatch) throw new Error("Missing '## Implementation YAML' block");

            // 逻辑：将 YAML 字符串直接转为 JSON，让 Gateway 读取时性能最大化
            const implementationJson = yaml.load(implMatch[1]);

            // 逻辑 1：构建大一统 JSON 结构 (Unified Skill Object)
            const status = (frontmatter.status || "Official").toLowerCase();
            const unifiedSkill = {
                id: skillId,
                source: status,
                meta: {
                    name: frontmatter.name || skillId,
                    emoji: frontmatter.emoji || "🧩",
                    cost: frontmatter.costPerCall || 0,
                    category: frontmatter.category || "utilities",
                    tags: frontmatter.tags || [],
                    parameters: parameters
                },
                config: implementationJson,
                docs: {
                    short: description,
                    full_md: fileContent
                }
            };

            // 逻辑 2：同步到网关要求的统一路径 (彻底取代碎文件)
            let gatewayKey = `skill:official:${skillId}`;
            if (status === "market") {
                gatewayKey = `skill:market:${skillId}`;
            }

            await putToKV(gatewayKey, JSON.stringify(unifiedSkill), "application/json");
            console.log(`✅ Success: Pushed Unified JSON -> ${gatewayKey}`);

            await putToKV(gatewayKey, JSON.stringify(unifiedSkill), "application/json");
            console.log(`✅ Success: Pushed Unified JSON -> ${gatewayKey}`);

        } catch (error: any) {
            console.error(`❌ Failed to parse/sync [${file}]:`, error.message);
        }
    }

    console.log("\n🎉 Sync Complete! All skills are live on Cloudflare Edge.");
}

syncSkillsToKV();
