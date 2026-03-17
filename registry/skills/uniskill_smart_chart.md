---
skill_name: uniskill_smart_chart
display_name: Smart Chart Generator
emoji: "📊"
status: Official
category: workspace_data
tags:
  - chart
  - visualization
  - data
  - image
gradientFrom: from-blue-600
gradientTo: to-purple-600
credits_per_call: 5
usd_per_call: 0.10
---

# uniskill_smart_chart

## Description
Converts raw data arrays into beautiful, ready-to-share chart images. A headless rendering engine that converts structured JSON data into high-quality, shareable chart image URLs (PNG).

## Parameters
```json
{
  "type": "object",
  "properties": {
    "chartType": {
      "type": "string",
      "enum": ["bar", "line", "pie", "doughnut", "radar"],
      "description": "The type of chart to generate (bar, line, pie, doughnut, radar)."
    },
    "title": {
      "type": "string",
      "description": "The main title displayed at the top of the chart."
    },
    "labels": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "An array of strings representing the X-axis categories (e.g., [\"Mon\", \"Tue\", \"Wed\"])."
    },
    "datasets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string",
            "description": "The label for the dataset."
          },
          "data": {
            "type": "array",
            "items": {
              "type": "number"
            },
            "description": "The numeric data points for the dataset."
          }
        },
        "required": ["label", "data"]
      },
      "description": "An array of data objects containing label and data arrays (e.g., [{\"label\": \"Stars\", \"data\": [10, 20, 30]}])."
    },
    "theme": {
      "type": "string",
      "enum": ["light", "dark"],
      "description": "Color theme (light or dark). Defaults to light.",
      "default": "light"
    }
  },
  "required": ["chartType", "labels", "datasets"]
}
```

## Returns
```json
{
  "imageUrl": "https://api.uniskill.ai/v1/chart/render/xxxx.png"
}
```

## Implementation YAML
```yaml
# Logic: Point directly to UniSkill's internal chart rendering engine
# 逻辑：直接指向 UniSkill 内部的高性能图表渲染引擎
endpoint: "https://api.uniskill.ai/v1/chart/render"
method: "POST"
payload:
  chart_type: "{{chartType}}"
  title: "{{title}}"
  labels: "{{labels}}"
  datasets: "{{datasets}}"
  theme: "{{theme}}"

# Logic: Returns a JSON object containing the direct imageUrl (PNG format)
# 逻辑：返回包含直接 imageUrl (PNG 格式) 的 JSON 对象
```
