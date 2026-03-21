import { NextResponse } from 'next/server';
import yaml from 'js-yaml';

/**
 * 🌟 轻量级 JSON 寻址引擎 (Lightweight jq-style path evaluator)
 * 例如把 '.current_condition[0].temp_C' 转化为 obj['current_condition'][0]['temp_C']
 */
function evaluateJsonPath(obj: any, path: string) {
  if (!path) return undefined;
  const cleanPath = path.trim().startsWith('.') ? path.trim().slice(1) : path.trim();
  const parts = cleanPath.split(/[\.\[\]]+/).filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * UniSkill Sandbox Execution Engine (v7.0 - 真实网络调度版)
 * 职责：
 * 1. 真正解析 Implementation YAML，发起真实网络请求。
 * 2. 执行字段映射 (Response Mapping)。
 * 3. 返回真实执行日志，供前端显示。
 */
export async function POST(req: Request) {
  try {
    const { manifest, payload } = await req.json();

    if (!manifest) {
      return NextResponse.json({ error: "Missing markdown manifest" }, { status: 400 });
    }

    const startTime = Date.now();

    // 1. JSON 格式校验 (Validate Payload)
    let parsedPayload: any = {};
    try {
      if (typeof payload === 'object') {
        parsedPayload = payload;
      } else {
        parsedPayload = JSON.parse(payload || '{}');
      }
    } catch (e) {
      return NextResponse.json({ 
        status: "error",
        error: "Invalid JSON payload. Please provide a valid JSON object."
      }, { status: 400 });
    }

    // 2. 提取 Parameters 并执行必填项检查
    const paramMatch = manifest.match(/#+\s*Parameters\s+```json\s+([\s\S]*?)```/i);
    let schema: any = { required: [] as string[] };
    if (paramMatch) {
      try { schema = JSON.parse(paramMatch[1].trim()); } catch(e) {}
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (parsedPayload[field] === undefined || parsedPayload[field] === "") {
          return NextResponse.json({
            status: "error",
            error: `Missing required parameter: '${field}'`
          }, { status: 400 });
        }
      }
    }

    // 3. 🌟 真正的执行引擎：解析 Implementation 块
    const implMatch = manifest.match(/#+\s*(?:Implementation|Implementation YAML)\s+```yaml\s+([\s\S]*?)```/i);
    let executionResult: any = { note: "Mock response. No valid implementation block found." };
    let statusCode = 200;

    if (implMatch) {
        try {
            const config: any = yaml.load(implMatch[1].trim());
            
            if (config && (config.url || config.endpoint)) {
                let url = config.url || config.endpoint;
                const method = config.method || 'GET';
                const headers = config.headers || {};
                
                // 🌟 动态参数注入：将 {{location}} 替换为真实参数
                for (const [key, value] of Object.entries(parsedPayload)) {
                    url = url.replace(new RegExp(`{{${key}}}`, 'g'), encodeURIComponent(String(value)));
                }

                // 🌟 发起真实的外部请求！
                const apiRes = await fetch(url, {
                    method,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'UniSkill-Sandbox/1.0',
                        ...headers
                    }
                });
                
                if (!apiRes.ok) {
                   throw new Error(`Upstream API returned ${apiRes.status}`);
                }

                const rawData = await apiRes.json();
                
                // 🌟 执行 Response Mapping
                if (config.response_mapping && typeof config.response_mapping === 'object') {
                    const mappedData: any = {};
                    let hasMapping = false;

                    for (const [k, v] of Object.entries(config.response_mapping)) {
                        if (v && typeof v === 'string') {
                            mappedData[k] = evaluateJsonPath(rawData, v);
                            hasMapping = true;
                        }
                    }
                    executionResult = hasMapping ? mappedData : rawData;
                } else {
                    executionResult = rawData;
                }
            }
        } catch (e: any) {
            executionResult = { error: `Remote API call failed: ${e.message}` };
            statusCode = 502;
        }
    }

    const endTime = Date.now();

    // 4. 返回包含真实外部数据的执行日志
    return NextResponse.json({
      status: statusCode === 200 ? "success" : "error",
      tool_invoked: `sandbox-execution-${Math.random().toString(36).substring(7)}`,
      latency_ms: endTime - startTime,
      result: {
        data: executionResult,
        input_received: parsedPayload
      }
    }, { status: statusCode });

  } catch (error: any) {
    console.error("[Sandbox Error]", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
