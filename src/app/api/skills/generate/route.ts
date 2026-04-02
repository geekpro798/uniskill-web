import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 实例化 DeepSeek 客户端 (OpenAI 兼容)
// 注意：基础 URL 必须指向 DeepSeek 的官方 API 地址
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY, 
  baseURL: 'https://api.deepseek.com',
});

// 系统提示词：定义 UniSkill 技能清单的 Markdown 规范
// 这里的逻辑是确保 AI 生成的 Markdown 符合网关的解析要求
const SYSTEM_PROMPT = `You are an expert AI Architect for the UniSkill M2M Gateway. 
Translate user requests into a valid UniSkill Skill Manifest (Markdown).

RULES:
1. Output ONLY valid Markdown.
2. Start with YAML frontmatter: 
   skill_name (lowercase_underscores), 
   display_name, 
   secrets (array),
   visuals: { suggested_icon: "IconName", theme_color: "blue" | "purple" | "emerald" | "pink" | "amber" }
   DO NOT include any 'id' or 'skill_uid' fields; these are handled by the backend.

Visual Identity System (UniSkill Standard):
- Select a PascalCase icon name from the Phosphor Icons library (e.g., 'Globe', 'ChartBar', 'ShieldCheck', 'CloudSun', 'Flask', 'Cpu').
- Choose a theme color that reflects the utility:
  - 'blue': General tools, search, web.
  - 'purple': AI, machine learning, logic.
  - 'emerald': Success, security, growth, finance.
  - 'pink': Creative, media, images.
  - 'amber': Warning, energy, high-performance, crypto.

3. Body must contain sections: '# Description', '# Parameters' (JSON Schema), and '# Implementation' (YAML http mapping).
4. Use 'custom_http' type in implementation. Map variables as {{variable}} and secrets as {{SECRETS.KEY}}.
5. When generating the 'description' field for a new skill, you MUST follow the UniSkill Three-Tier Structure: Identity, Capabilities, and Boundaries. Ensure the Boundaries section explicitly handles potential overlaps with existing tools like Browser or Math skills.

STRICT RULES ON PARAMETERS:
1. LEAN PRINCIPLE: Only include parameters in the '# Parameters' section that are ABSOLUTELY NECESSARY for the API call.
2. CONSUMPTION RULE: Every parameter defined in the JSON Schema MUST be used in the '# Implementation' section (either in the URL, Headers, or Body) using '{{parameter_name}}'.
3. NO ORPHANS: Do not define "nice-to-have" parameters (like 'units' or 'lang') if the 'endpoint' template does not explicitly include them. Orphan parameters cause upstream 500 errors.
4. GET REQUESTS: For GET methods, ensure the 'endpoint' string contains all required variables. Do not rely on the gateway to auto-append query strings unless intended.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    // 逻辑：校验 Prompt 是否为空
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 调用 DeepSeek 接口生成技能架构
    // 设置 temperature 为 0.1 以确保生成的格式极其严格，减少幻觉
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Build a UniSkill tool for: ${prompt}` }
      ],
    });

    const generatedMarkdown = completion.choices[0].message.content || '';

    // 逻辑：清洗 Markdown 代码块包裹，确保返回的是纯净的 Markdown 文本内容
    // 很多模型会习惯性地用 \`\`\`markdown ... \`\`\` 包裹输出，这里需要剥离
    let cleanMarkdown = generatedMarkdown.trim();
    const codeBlockMatch = cleanMarkdown.match(/^```(?:markdown|yaml|json)?\n([\s\S]*?)\n```$/);
    
    if (codeBlockMatch) {
      cleanMarkdown = codeBlockMatch[1].trim();
    }

    return NextResponse.json({ success: true, markdown: cleanMarkdown });

  } catch (error: any) {
    // 业务逻辑：统一错误处理，方便前端 Debug
    console.error('[Magic Architect Error]', error);
    return NextResponse.json({ 
      error: 'DeepSeek generation failed',
      details: error.message 
    }, { status: 500 });
  }
}
