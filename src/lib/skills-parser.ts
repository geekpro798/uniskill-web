// uniskill-web/src/lib/skills-parser.ts
// Logic: Unified utility for parsing skill definitions from local registry.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const REGISTRY_PATH = path.join(process.cwd(), "registry", "skills");

export interface SkillData {
    skill_name: string;
    display_name: string;
    emoji: string;
    status: string;
    credits_per_call: number; // Renamed from cost_per_call
    usd_per_call: number;     // New field
    payment_type: 'credits' | 'usd'; // New field
    category: string;
    tags: string[];
    description: string;
    gradientFrom: string;
    gradientTo: string;
    parameters: any;
    returns: any;
    implementation: any;
}

export function parseSkillFile(skillId: string): SkillData | null {
    const filePath = path.join(REGISTRY_PATH, `${skillId}.md`);

    if (!fs.existsSync(filePath)) return null;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);

    // 逻辑：通过正则精准提取 "## Description" 下方的纯文本描述
    const descMatch = content.match(/## Description\n([\s\S]*?)(?=\n##|$)/);
    const description = descMatch ? descMatch[1].trim() : "";

    // 逻辑：提取参数、返回示例和实现方案
    const paramsMatch = content.match(/## Parameters\s+```json\s+([\s\S]*?)\s+```/);
    const returnsMatch = content.match(/## Returns\s+```json\s+([\s\S]*?)\s+```/);
    const implMatch = content.match(/## Implementation YAML\s+```yaml\s+([\s\S]*?)\s+```/);

    const parameters = paramsMatch ? JSON.parse(paramsMatch[1]) : {};
    const returns = returnsMatch ? JSON.parse(returnsMatch[1]) : null;
    const implementation = implMatch ? implMatch[1] : "";

    return {
        skill_name: frontmatter.skill_name || skillId,
        display_name: frontmatter.display_name || skillId,
        emoji: frontmatter.emoji || "🧩",
        status: frontmatter.status || "Official",
        credits_per_call: frontmatter.credits_per_call ?? frontmatter.cost_per_call ?? 0,
        usd_per_call: frontmatter.usd_per_call || 0,
        payment_type: frontmatter.payment_type || 'credits',
        category: frontmatter.category || "utilities",
        tags: frontmatter.tags || [],
        description: description,
        gradientFrom: frontmatter.gradientFrom || "from-slate-600",
        gradientTo: frontmatter.gradientTo || "from-slate-400",
        parameters,
        returns,
        implementation
    };
}

export function getAllSkills(): SkillData[] {
    if (!fs.existsSync(REGISTRY_PATH)) return [];

    const files = fs.readdirSync(REGISTRY_PATH).filter(f => f.endsWith(".md"));
    return files.map(file => {
        const id = file.replace(".md", "");
        return parseSkillFile(id)!;
    }).filter(Boolean);
}
