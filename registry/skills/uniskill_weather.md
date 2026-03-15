---
skill_name: uniskill_weather
display_name: Global Weather
emoji: "\U0001F324️"
status: Official
category: utilities
tags:
  - weather
  - wttr
  - forecast
gradientFrom: from-blue-400
gradientTo: to-cyan-400
credits_per_call: 1
usd_per_call: 0.001
---

# uniskill_weather

## Description
Get real-time weather conditions and forecasts for any city in the world. Powered by wttr.in.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "location": {
      "type": "string",
      "description": "The city or region name (e.g., 'London', 'Beijing', '30.27,120.15')."
    }
  },
  "required": ["location"]
}
```

## Implementation YAML
```yaml
# Logic: Using wttr.in JSON format (j1)
type: official_optimized
endpoint: "https://wttr.in/{{location}}?format=j1"
method: "GET"

# Logic: Hook to trigger the specialized weather cleaning plugin
plugin_hook: "WTTR_WEATHER_FORMATTER"
```
