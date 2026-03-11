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

// 逻辑：使用 wrangler CLI 写入 KV，此方法最稳健，自动处理 Auth
import { execSync } from "child_process";

async function putToKV(key: string, value: string) {
    try {
        // 使用 temporary 文件避免命令行长度限制或特殊字符转义问题
        const tmpFile = path.join("/tmp", `kv_${key.replace(/:/g, "_")}.json`);
        fs.writeFileSync(tmpFile, value);
        
        execSync(`npx wrangler kv key put --namespace-id ${NAMESPACE_ID} "${key}" --path "${tmpFile}"`, {
            stdio: "inherit"
        });
        
        fs.unlinkSync(tmpFile);
    } catch (err: any) {
        throw new Error(`Wrangler KV Put failed for [${key}]: ${err.message}`);
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

            // 逻辑：正则提取 Description 正文，提高容错性
            const descMatch = content.match(/## Description\s+([\s\S]*?)(?=\n##|$)/i);
            const description = descMatch ? descMatch[1].trim() : "";

            // 逻辑：正则提取 Parameters JSON
            const paramMatch = content.match(/## Parameters\s+```json\s+([\s\S]*?)```/i);
            const parameters = paramMatch ? JSON.parse(paramMatch[1]) : { type: "object", properties: {} };

            // 逻辑：正则提取 Implementation YAML
            const implMatch = content.match(/## Implementation YAML\s+```yaml\s+([\s\S]*?)```/i);
            if (!implMatch) throw new Error("Missing '## Implementation YAML' block");

            const implementationJson = yaml.load(implMatch[1]);

            console.log(`🔍 Processing skill: ${skillId} (from ${file})`);

            // 逻辑 1：构建大一统 JSON 结构 (Unified Skill Object)
            const status = (frontmatter.status || "Official").toLowerCase();
            const unifiedSkill = {
                id: skillId,
                source: status,
                meta: {
                    name: frontmatter.name || skillId,
                    emoji: frontmatter.emoji || "🧩",
                    cost: frontmatter.costPerCall !== undefined ? frontmatter.costPerCall : 0,
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

            // 逻辑 2：同步到网关要求的统一路径
            let gatewayKey = `skill:official:${skillId}`;
            if (status === "market") {
                gatewayKey = `skill:market:${skillId}`;
            }

            console.log(`📡 Uploading to KV: ${gatewayKey} (Cost: ${unifiedSkill.meta.cost})`);
            await putToKV(gatewayKey, JSON.stringify(unifiedSkill));
            console.log(`✅ Success: ${gatewayKey}`);

        } catch (error: any) {
            console.error(`❌ Failed to parse/sync [${file}]:`, error.message);
        }
    }

    console.log("\n🎉 Sync Complete! All skills are live on Cloudflare Edge.");
}

syncSkillsToKV().catch(err => {
    console.error("❌ Fatal Sync Error:", err);
    process.exit(1);
});
