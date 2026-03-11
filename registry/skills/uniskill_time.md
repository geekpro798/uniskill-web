---
id: "uniskill_time"
name: "Time & Timezone Engine"
emoji: "🕒"
status: "Official"
costPerCall: 0
category: "utilities"
tags: ["time", "timezone", "native", "no-hallucination"]
gradientFrom: "from-orange-500"
gradientTo: "to-amber-500"
---

# Time Engine

## Description
A precise atomic tool for retrieving current time across any global timezone. Crucial for overcoming LLM's inability to access realtime system clocks or handle complex daylight saving time (DST) offsets.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "timezone": {
      "type": "string",
      "description": "The target timezone in IANA format (e.g., 'America/New_York', 'Asia/Shanghai', 'UTC'). Leave empty or use 'UTC' for Coordinated Universal Time."
    }
  },
  "required": ["timezone"]
}
```

## Setup Instructions
No setup or API key is required. This is a native UniSkill engine powered by high-performance edge runtime.

## Implementation YAML
```yaml
# Logic: Identification for applying UniSkill native optimizations
type: native
endpoint: "internal"
method: "POST"
```
