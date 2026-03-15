---
skill_name: uniskill_math
display_name: Math Engine
emoji: "\U0001F9EE"
status: Official
category: utilities
tags:
  - math
  - calculation
  - native
  - no-hallucination
gradientFrom: from-fuchsia-500
gradientTo: to-purple-600
credits_per_call: 0
usd_per_call: 0.001
---

# Uniskill Math Engine

## Description
A highly accurate scientific calculation engine that evaluates complex mathematical expressions. Use this to bypass LLM hallucination on arithmetic and algebraic logic.
* **100% Zero Hallucination** calculations.
* Perfect for financial, engineering, or structural queries.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "expr": {
      "type": "string",
      "description": "The mathematical expression to evaluate. Supports basic operators (+, -, *, /) as well as complex functions (e.g., '1.2 * (2 + 4.5)', '5.08 cm to inch', 'sin(45 deg) ^ 2')."
    }
  },
  "required": ["expr"]
}
```

## Setup Instructions
No setup or API key is required. This is a native UniSkill engine powered by high-performance cloud runtime.

## Implementation YAML
```yaml
# Logic: Identification for applying UniSkill native optimizations
type: native
endpoint: "internal"
method: "POST"
```
