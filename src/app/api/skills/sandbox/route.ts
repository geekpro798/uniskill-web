import { NextResponse } from 'next/server';

/**
 * UniSkill Sandbox Execution Simulator (沙箱执行与校验引擎)
 * 职责：
 * 1. 接收前端传来的 Markdown 源码和用户的测试 Payload。
 * 2. 提取 Markdown 中的 Parameters (JSON Schema)。
 * 3. 校验 Payload 的合法性（JSON 格式化校验等）。
 * 4. 模拟边缘节点的执行延迟，返回真实的日志格式。
 */
export async function POST(req: Request) {
  try {
    const { manifest, payload } = await req.json();

    if (!manifest) {
      return NextResponse.json({ error: "Missing markdown manifest" }, { status: 400 });
    }

    const startTime = Date.now();

    // 1. 解析用户的输入 Payload
    let parsedPayload;
    try {
      if (typeof payload === 'object') {
        parsedPayload = payload;
      } else {
        parsedPayload = JSON.parse(payload || '{}');
      }
    } catch (e) {
      // 如果用户输入非法 JSON，拦截报错
      return NextResponse.json({ 
        status: "error",
        error: "Invalid JSON payload. Please provide a valid JSON object."
      }, { status: 400 });
    }

    // 2. 从源码中提取 Parameters 规范
    const paramMatch = manifest.match(/## Parameters\s+```json\s+([\s\S]*?)```/i);
    let schema = { required: [] as string[] };
    try {
      if (paramMatch) schema = JSON.parse(paramMatch[1]);
    } catch (e) {
      console.warn("[Sandbox] Manifest schema is invalid.");
    }

    // 3. 简单的必填项校验 (Basic Required Fields Validation)
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (parsedPayload[field] === undefined) {
          return NextResponse.json({
            status: "error",
            error: `Missing required parameter: '${field}'`
          }, { status: 400 });
        }
      }
    }

    // 4. 模拟边缘网关处理耗时 (50ms - 200ms)
    const simulatedLatency = Math.floor(Math.random() * 150) + 50;
    await new Promise(resolve => setTimeout(resolve, simulatedLatency));

    const endTime = Date.now();

    // 5. 返回真实的执行日志
    return NextResponse.json({
      status: "success",
      tool_invoked: `sandbox-execution-${Math.random().toString(36).substring(7)}`,
      latency_ms: endTime - startTime,
      result: {
        data: "Mock response generated successfully based on manifest.",
        input_received: parsedPayload
      }
    });

  } catch (error: any) {
    console.error("[Sandbox Error]", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
