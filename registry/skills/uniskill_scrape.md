---
skill_name: uniskill_scrape
display_name: Web Scraper
emoji: "\U0001F577️"
status: Official
category: web_search
tags:
  - scrape
  - extraction
  - data
gradientFrom: from-emerald-500
gradientTo: to-teal-400
credits_per_call: 15
usd_per_call: 0.001
---

# uniskill_scrape

## Description
Extract clean, LLM-friendly Markdown content from any website URL. Powered by Jina Reader.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "The URL of the webpage to scrape."
    }
  },
  "required": ["url"]
}
```

## Implementation YAML
```yaml
# Logic: Point directly to UniSkill's internal robust gateway
# 逻辑：直接指向 UniSkill 内部极其强健的 API 网关专线
endpoint: "https://api.uniskill.ai/v1/scrape"
method: "POST"
```
