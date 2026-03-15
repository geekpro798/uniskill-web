---
skill_name: uniskill_news
display_name: Global News
emoji: "\U0001F4F0"
status: Official
category: web_search
tags:
  - news
  - summary
  - headlines
gradientFrom: from-indigo-500
gradientTo: to-blue-400
credits_per_call: 5
usd_per_call: 0.005
---

# uniskill_news

## Description
Get the latest global news headlines, summaries, and metadata across various categories.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search keyword for specific news topics."
    },
    "category": {
      "type": "string",
      "description": "News category: 'business', 'technology', 'sports', etc."
    },
    "max_results": {
      "type": "integer",
      "description": "Number of articles to return.",
      "default": 8
    }
  }
}
```

## Implementation YAML
```yaml
# Logic: Identification for applying UniSkill official optimizations
type: official_optimized
endpoint: "https://api.tavily.com/search"
method: "POST"

# Logic: Mapping internal credentials
api_key: "{{TAVILY_API_KEY}}"

# Logic: Mapping AI-generated arguments to the API payload
payload:
  query: "{{query}}"
  topic: "news"
  max_results: "{{max_results}}"

# Logic: Hook to trigger the data cleaning plugin
plugin_hook: "NEWS_AGGREGATOR_FORMATTER"
```

## Returns
```json
{
  "articles": [
    {
      "title": "Global Markets Rally on Tech Earnings",
      "summary": "Major indices hit record highs today following stronger-than-expected earnings reports from leading technology companies. AI sector leads the growth.",
      "source": "Reuters",
      "url": "https://www.reuters.com/markets/us/example",
      "published_at": "2026-03-07T08:30:00Z"
    }
  ],
  "metadata": {
    "total_results": 1,
    "query": "tech earnings"
  }
}
