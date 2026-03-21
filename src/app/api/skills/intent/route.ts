import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 初始化 DeepSeek 客户端 (Initialize DeepSeek client compatible with OpenAI SDK)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY, 
  baseURL: 'https://api.deepseek.com', // 指向 DeepSeek 官方 API
});

// ============================================================================
// 🧠 核心提示词：意图提取代理 (Intent Extraction Agent)
// 逻辑：强迫大模型成为一个没有感情的“JSON 转换器”，严禁输出任何废话
// ============================================================================
const SYSTEM_PROMPT = `You are a highly precise data extraction agent. 
Your task is to analyze a user's natural language query and extract the required parameters based on a provided JSON Schema.

RULES:
1. You MUST output ONLY valid JSON. No conversational text, no explanations.
2. DO NOT wrap the output in markdown blocks (e.g., remove \`\`\`json and \`\`\`). Just return the raw JSON object.
3. Only extract fields that are defined in the provided JSON schema.
4. If a required field cannot be inferred from the user's query, use a reasonable default or leave it as an empty string.`;

export async function POST(req: Request) {
  try {
    const { manifest, query } = await req.json();

    if (!manifest || !query) {
      return NextResponse.json({ error: 'Missing manifest or query' }, { status: 400 });
    }

    // 1. 提取 Markdown 中的 JSON Schema (Extract Schema from Manifest)
    // 逻辑增强：不限制标题层级，允许标题和代码块之间有空行或描述文字
    const paramMatch = manifest.match(/#+\s*Parameters[\s\S]*?```(?:json)?\s*([\s\S]*?)```/i);
    let schemaStr = "{}";
    if (paramMatch) {
      schemaStr = paramMatch[1].trim();
    } else {
      // 兜底逻辑：如果没找到 Parameters 标题，尝试寻找第一个包含 "type": "object" 的 JSON 块
      const anyObjectBlock = manifest.match(/```(?:json)?\s*([\s\S]*?"type":\s*"object"[\s\S]*?)```/i);
      if (anyObjectBlock) {
        schemaStr = anyObjectBlock[1].trim();
      } else {
        return NextResponse.json({ error: 'No JSON Schema found in manifest. Please ensure you have a ## Parameters section with a ```json block.' }, { status: 400 });
      }
    }

    console.log(`[Intent Extractor] Parsing query: "${query}" against schema.`);

    const userPrompt = `
Here is the JSON Schema for the tool:
${schemaStr}

Here is the user's natural language query:
"${query}"

Extract the parameters from the query according to the schema and output the final JSON object.`;

    // 2. 调用 DeepSeek 执行信息抽取 (Call DeepSeek for extraction)
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat", // 使用 DeepSeek V3
      temperature: 0.1,       // 极低温度，保证 JSON 格式的绝对稳定性
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
    });

    let generatedJson = completion.choices[0].message.content || '{}';

    // 3. 终极格式清洗 (Aggressive formatting cleanup)
    // 逻辑：去除大模型偶尔还是会带上的 markdown 包裹符
    generatedJson = generatedJson.trim();
    if (generatedJson.startsWith('```json')) {
      generatedJson = generatedJson.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (generatedJson.startsWith('```')) {
      generatedJson = generatedJson.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // 测试解析是否合法 (Validate parsed JSON)
    try {
      JSON.parse(generatedJson);
    } catch (e) {
      console.error("[Intent Extractor] AI output is not valid JSON:", generatedJson);
      throw new Error("AI generated an invalid JSON response.");
    }

    return NextResponse.json({ 
      success: true, 
      payload: generatedJson 
    });

  } catch (error: any) {
    console.error('[Intent Extractor Error]', error);
    return NextResponse.json({ 
      error: 'Failed to extract intent via AI',
      details: error.message 
    }, { status: 500 });
  }
}
