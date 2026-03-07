// uniskill-web/scripts/sync-to-kv.ts
// Logic: Parse local .md skills and push structured JSON to Cloudflare KV.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";
import dotenv from "dotenv";

// 逻辑：加载环境变量中的 Cloudflare 凭证
dotenv.config();

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

const SKILLS_DIR = path.join(process.cwd(), "registry", "skills");

// 逻辑：Cloudflare KV REST API 基础写入函数
async function putToKV(key: string, value: string) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${key}`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json"
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

            // 逻辑：正则提取 Implementation YAML，用于 Gateway 底层执行
            const implMatch = content.match(/## Implementation YAML\n```yaml\n([\s\S]*?)```/);
            if (!implMatch) throw new Error("Missing '## Implementation YAML' block");

            // 逻辑：将 YAML 字符串直接转为 JSON，让 Gateway 读取时性能最大化
            const implementationJson = yaml.load(implMatch[1]);

            // 逻辑 1：组装并推送前端展示需要的 UI 元数据 (加上 meta: 前缀隔离)
            const metadataPayload = {
                ...frontmatter,
                description
            };
            await putToKV(`meta:${skillId}`, JSON.stringify(metadataPayload));
            console.log(`✅ Success: Pushed Metadata -> meta:${skillId}`);

            // 逻辑 2：组装并推送网关执行需要的底层配置 (加上 config: 前缀隔离)
            await putToKV(`config:${skillId}`, JSON.stringify(implementationJson));
            console.log(`✅ Success: Pushed Config   -> config:${skillId}`);

        } catch (error: any) {
            console.error(`❌ Failed to parse/sync [${file}]:`, error.message);
        }
    }

    console.log("\n🎉 Sync Complete! All skills are live on Cloudflare Edge.");
}

syncSkillsToKV();
