import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// 1. Load credentials
const SCRIPT_DIR = __dirname;
dotenv.config({ path: path.join(SCRIPT_DIR, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
const SKILLS_DIR = path.join(SCRIPT_DIR, "..", "registry", "skills");

async function run() {
    console.log("🚀 Starting Bulk Registry Pricing Update...");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("❌ Error: Missing Supabase credentials.");
        process.exit(1);
    }

    // 2. Fetch latest pricing from DB
    console.log("🗄️ Fetching pricing data from Supabase...");
    const { data: dbSkills, error } = await supabase
        .from("skills")
        .select("skill_name, credits_per_call, usd_per_call");

    if (error) {
        console.error("❌ Failed to fetch from DB:", error.message);
        process.exit(1);
    }

    const pricingMap = new Map(dbSkills.map(s => [s.skill_name, s]));
    console.log(`✅ Loaded ${dbSkills.length} skills from database.\n`);

    // 3. Scan local .md files
    if (!fs.existsSync(SKILLS_DIR)) {
        console.error(`❌ Registry directory not found: ${SKILLS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith(".md"));
    console.log(`📦 Found ${files.length} skill files to process.\n`);

    for (const file of files) {
        const filePath = path.join(SKILLS_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");

        try {
            const { data: frontmatter, content } = matter(fileContent);
            const skillName = frontmatter.skill_name || frontmatter.id;
            const dbPricing = pricingMap.get(skillName);

            if (!dbPricing) {
                console.warn(`⚠️ Skill [${skillName}] not found in database. Skipping...`);
                continue;
            }

            console.log(`🔍 Updating: ${skillName}`);

            const updatedFrontmatter = { ...frontmatter };

            // Rename cost_per_call to credits_per_call
            const oldCost = updatedFrontmatter.cost_per_call;
            delete updatedFrontmatter.cost_per_call;
            
            // Inject values from DB (Ensures alignment with Supabase)
            updatedFrontmatter.credits_per_call = dbPricing.credits_per_call ?? oldCost ?? 0;
            // USD minimum is 0.001 - enforce here to match DB constraint
            const rawUsd = dbPricing.usd_per_call ?? 0;
            updatedFrontmatter.usd_per_call = rawUsd > 0 ? Math.max(rawUsd, 0.001) : 0.001;

            // Re-stringify and write back
            const newContent = matter.stringify(content, updatedFrontmatter);
            fs.writeFileSync(filePath, newContent);
            console.log(`✅ Success: ${file}`);

        } catch (err: any) {
            console.error(`❌ Error processing [${file}]:`, err.message);
        }
    }

    console.log("\n🎉 Bulk Update Complete!");
}

run();
