---
skill_name: uniskill_geo
display_name: Location & Map Engine
emoji: "\U0001F5FA️"
status: Official
category: utility
tags:
  - geo
  - map
  - location
  - timezone
  - geocoding
gradientFrom: from-emerald-500
gradientTo: to-teal-700
credits_per_call: 2
usd_per_call: 0.001
---

# Location & Map Context Engine

## Description
A context-aware spatial engine that resolves place names (e.g., "Tokyo Tower") or IP addresses into precise coordinates. It provides vital environmental context hints (local time) and generates a static map preview. If no target is provided, it intelligently detects the user's current location via their IP.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "target": {
      "type": "string",
      "description": "The place name (e.g., 'New York', 'Tokyo Minato-ku') or IP address to locate. Leave empty to automatically detect the user's current location."
    }
  }
}
```

## AI Inference Advice
- **Static Maps**: The response will include a `map_url`. Directly embed this in your response using markdown syntax (e.g., `![Location Map](url)`) to provide the user with a visual anchor.
- **Context Hints**: The response will include a `context_hints` block with `local_time`. Use this to proactively inform the user if their intended action is affected by the local time (e.g., "It is currently 2 AM there, so the store is likely closed").
- **Implicit Routing**: If the user asks "What's the weather here?" or "What time is it for me?", call this skill with an empty `target` to obtain their coordinates, then pass those to the relevant weather or time skill.

## Setup Instructions
(Optional) To enable the generation of static map URLs, provide your Mapbox API key in `wrangler.toml` (Cloudflare) and `.env.local` (Next.js) under the variable `MAPBOX_API_KEY`. If left empty, the skill will still function but will not return a map preview.

## Implementation YAML
```yaml
# Logic: A context-aware Native Skill handled by the Gateway.
type: native
method: "POST"
```
