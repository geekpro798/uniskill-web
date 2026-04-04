---
skill_name: uniskill_auto_workflow
display_name: Auto-Workflow (Agent)
emoji: "🤖"
status: Official
category: devops_infra
tags:
  - workflow
  - automation
  - agent
  - reasoning
gradientFrom: from-indigo-500
gradientTo: to-purple-600
credits_per_call: 10
usd_per_call: 0.20
---

# uniskill_auto_workflow

## Description
The Autonomous Orchestration Engine (Meta-Skill). It receives a high-level goal, plans the necessary steps, and automatically invokes other UniSkill tools to achieve the result. Powered by a ReAct (Reasoning + Acting) loop.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "goal": {
      "type": "string",
      "description": "The complex task or objective you want to achieve (e.g., 'Find the weather in Tokyo and tell me if I should wear a coat')."
    }
  },
  "required": ["goal"]
}
```

## Returns
```json
{
  "result": "The final answer or result of the workflow.",
  "execution_trace": [
    {
      "step": 1,
      "action": "call_tool",
      "tool": "uniskill_weather",
      "params": { "location": "Tokyo" },
      "result": { "temp": 15, "condition": "Clear" },
      "duration_ms": 450,
      "timestamp": "2026-04-03T12:00:00Z"
    },
    {
      "step": 2,
      "action": "finish",
      "result": "The temperature in Tokyo is 15°C and clear. You should wear a light coat.",
      "duration_ms": 800,
      "timestamp": "2026-04-03T12:00:01Z"
    }
  ],
  "iterations_completed": 2,
  "terminated_early": false
}
```

## Implementation YAML
```yaml
# Logic: This is a Meta-Skill handled internally by the UniSkill Gateway
# 逻辑：这是一个由 UniSkill Gateway 内部处理的元技能（Meta-Skill）
# It uses an internal ReAct loop to coordinate other registered skills.
# 它使用内部 ReAct 循环来协调其他已注册的技能。
type: official_native
handler: handleAutoWorkflow
max_iterations: 5
timeout_ms: 25000
base_fee_credits: 10
```
