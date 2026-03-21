// uniskill 统一注册中心同步脚本 (v2.1 - 架构对齐版)
// Logic: 职责：解析 registry/skills 下的 Markdown，同步至 KV 和 Supabase。
// 升级点：增加了 state 自动激活、DID 确定性生成以及网关缓存强制刷新。

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// 1. Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT_DIR = __dirname;
dotenv.config({ path: path.join(SCRIPT_DIR, "..", ".env.local") });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8787";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || process.env.INTERNAL_API_SECRET;

const SKILLS_DIR = path.join(SCRIPT_DIR, "..", "registry", "skills");
const SYSTEM_UID = "00000000-0000-0000-0000-000000000001";

// 2. Initialize Supabase Client
const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

async function putToKV(key: string, value: string) {
    try {
        const tmpFile = path.join("/tmp", `kv_${key.replace(/:/g, "_")}.json`);
        fs.writeFileSync(tmpFile, value);

        execSync(`npx -y wrangler kv key put --namespace-id ${NAMESPACE_ID} "${key}" --path "${tmpFile}" --remote`, {
            stdio: "inherit"
        });

        fs.unlinkSync(tmpFile);
    } catch (err: any) {
        console.error(`❌ Ranger KV Put failed for [${key}]:`, err.message);
    }
}

async function syncRegistry() {
    console.log("🚀 Starting Unified Registry Sync (KV + Supabase)...\n");

    if (!ACCOUNT_ID || !NAMESPACE_ID) {
        console.error("❌ Error: Missing Cloudflare credentials (ACCOUNT_ID/NAMESPACE_ID).");
        process.exit(1);
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("❌ Error: Missing Supabase credentials.");
        process.exit(1);
    }

    if (!fs.existsSync(SKILLS_DIR)) {
        console.error(`❌ Error: Registry directory not found at ${SKILLS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(SKILLS_DIR).filter(file => file.endsWith(".md"));
    console.log(`📦 Found ${files.length} skill files to sync.\n`);

    const allTools: any[] = [];

    for (const file of files) {
        const filePath = path.join(SKILLS_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");

        try {
            // A. Parse MD and Frontmatter (2.0 Standard)
            const { data: frontmatter, content } = matter(fileContent);
            const skill_name = frontmatter.skill_name || frontmatter.id; // Compatibility

            if (!skill_name) throw new Error("Missing 'skill_name' in frontmatter");

            const display_name = frontmatter.display_name || frontmatter.name || skill_name;
            // Support both old (cost_per_call) and new (credits_per_call) field names
            const credits_per_call = frontmatter.credits_per_call ?? frontmatter.cost_per_call ?? 0;
            const usd_per_call = Math.max(frontmatter.usd_per_call ?? 0.001, 0.001); // Enforce minimum
            const tags = frontmatter.tags || [];
            const category = (frontmatter.category || "utilities")
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "_")
                .replace(/&/g, "and");
            const status = (frontmatter.status || "Official").toLowerCase();

            // Extract Description
            const descMatch = content.match(/## Description\s+([\s\S]*?)(?=\n##|$)/i);
            const description = descMatch ? descMatch[1].trim() : "";

            // Extract Parameters
            const paramMatch = content.match(/## Parameters\s+```json\s+([\s\S]*?)```/i);
            const parameters = paramMatch ? JSON.parse(paramMatch[1]) : { type: "object", properties: {} };

            // Extract Implementation
            const implMatch = content.match(/## Implementation YAML\s+```yaml\s+([\s\S]*?)```/i);
            if (!implMatch) throw new Error("Missing '## Implementation YAML' block");
            const implementationJson = yaml.load(implMatch[1]);

            allTools.push({
                name: skill_name,
                description: description,
                inputSchema: parameters
            });

            // 🌟 核心升级：生成确定性 DID 指纹 (Generate Deterministic DID)
            const did = `did:usk:skill:official:${skill_name}`;

            console.log(`🔍 Processing: ${skill_name} (${display_name}) | DID: ${did}`);

            // B. Sync to Cloudflare KV (For Gateway Runtime)
            const unifiedSkill = {
                skill_name,
                source: status,
                did, // 🌟 注入指纹
                meta: {
                    display_name,
                    emoji: frontmatter.emoji || "🧩",
                    cost: credits_per_call,
                    credits_per_call,
                    usd_per_call,
                    category: category,
                    tags: tags,
                    parameters: parameters
                },
                // Flattening for direct access
                display_name,
                credits_per_call,
                cost_per_call: credits_per_call, // backward compat
                usd_per_call,
                config: implementationJson,
                docs: {
                    short: description,
                    full_md: fileContent
                }
            };

            let gatewayKey = `skill:official:${skill_name}`;
            if (status === "market") gatewayKey = `skill:market:${skill_name}`;

            console.log(`📡 [KV] Syncing ${gatewayKey}...`);
            await putToKV(gatewayKey, JSON.stringify(unifiedSkill));

            // C. Sync to Supabase (For Discovery & Billing)
            console.log(`🗄️ [DB] Upserting ${skill_name} to skills table...`);
            const { error: dbError } = await supabase
                .from("skills")
                .upsert({
                    skill_name: skill_name,
                    display_name: display_name,
                    emoji: frontmatter.emoji || "🧩",
                    description: description,
                    tags: tags,
                    credits_per_call: credits_per_call,
                    usd_per_call: usd_per_call,
                    category: category,
                    status: frontmatter.status || "Official",
                    state: 'active', // 🌟 核心：官方同步直接激活
                    did: did,        // 🌟 核心：注入指纹
                    gradient_from: frontmatter.gradientFrom || "from-slate-600",
                    gradient_to: frontmatter.gradientTo || "from-slate-400",
                    parameters: parameters,
                    owner_uid: SYSTEM_UID,
                    deployed_at: new Date().toISOString()
                }, {
                    onConflict: "skill_name"
                });

            if (dbError) {
                console.error(`❌ [DB] Error upserting ${skill_name}:`, dbError.message);
            } else {
                console.log(`✅ [DB] Success: ${skill_name}`);
            }

        } catch (error: any) {
            console.error(`❌ Failed to sync [${file}]:`, error.message);
        }
    }

    console.log(`📡 [KV] Bundling entire menu into single cache key...`);
    await putToKV("mcp_registry:tools_cache", JSON.stringify(allTools));

    // E. 🌟 核心升级：触发边缘网关热更新广播 (Trigger Hot-Reload Broadcast)
    console.log(`\n📡 Sending sync signal to Gateway Admin API...`);
    try {
        const signalRes = await fetch(`${GATEWAY_URL}/v1/admin/refresh-tools`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_SECRET_KEY}`
            }
        });
        if (signalRes.ok) {
            console.log("✅ Gateway cache warmed up and broadcast triggered!");
        } else {
            console.warn(`⚠️ Gateway returned ${signalRes.status} ${await signalRes.text()}`);
        }
    } catch (e: any) {
        console.warn(`⚠️ Gateway unreachable (${e.message}), but DB/KV are updated.`);
    }

    console.log("\n🎉 Unified Sync Complete!");
}

syncRegistry().catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
});
