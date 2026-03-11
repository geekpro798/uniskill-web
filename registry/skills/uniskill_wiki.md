---
id: "uniskill_wiki"
name: "Wikipedia Engine"
emoji: "📚"
status: "Official"
costPerCall: 1
category: "web_search"
tags: ["wikipedia", "encyclopedia", "knowledge"]
gradientFrom: "from-slate-300"
gradientTo: "to-gray-500"
---

# Wikipedia Knowledge Engine

## Description
A reliable encyclopedia engine for retrieving facts, summaries, and deterministic historical data. Highly recommended for establishing fundamental context and avoiding hallucinated general knowledge.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The exact topic or entity name to search for on Wikipedia (e.g., 'Alan Turing', 'Quantum Computing')."
    },
    "language": {
      "type": "string",
      "description": "The 2-letter language code for the Wikipedia edition to search (e.g., 'en', 'zh', 'es'). Defaults to 'en'.",
      "default": "en"
    }
  },
  "required": ["query"]
}
```

## Setup Instructions
No setup or API key is required. This is an official UniSkill engine powered by high-speed reverse proxy to the Wikimedia Foundation API.

## Implementation YAML
```yaml
# Logic: Point to Wikipedia's public REST API for page summaries
type: proxy
endpoint: "https://{{language|en}}.wikipedia.org/api/rest_v1/page/summary/{{query}}"
method: "GET"
headers:
  "User-Agent": "UniSkill-Gateway/1.0 (info@uniskill.ai)"
```
