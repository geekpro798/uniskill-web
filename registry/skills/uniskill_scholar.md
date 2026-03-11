---
id: "uniskill_scholar"
name: "Semantic Scholar"
emoji: "🎓"
status: "Official"
costPerCall: 0
category: "web_search"
tags: ["paper", "academic", "research", "semantic-scholar"]
gradientFrom: "from-sky-600"
gradientTo: "to-indigo-600"
---

# Semantic Scholar Academic Engine

## Description
A powerful gateway to global peer-reviewed scientific literature. Use this to retrieve accurate paper metadata, abstracts, citation counts, and authors. Crucial for academic research, medical analysis, or deep technical investigations.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The research topic, exact paper title, or author name to search for (e.g., 'Attention Is All You Need', 'CRISPR cas9 review')."
    },
    "limit": {
      "type": "integer",
      "description": "The maximum number of academic papers to retrieve (default: 5, max: 20).",
      "default": 5
    }
  },
  "required": ["query"]
}
```

## Setup Instructions
No setup or API key is required. This uses the Semantic Scholar Academic Graph API mapped through UniSkill's high-speed proxy.

## Implementation YAML
```yaml
# Logic: Point to Semantic Scholar's public Academic Graph API with a specific field mask to keep JSON payloads small
type: proxy
endpoint: "https://api.semanticscholar.org/graph/v1/paper/search?query={{query}}&limit={{limit|5}}&fields=title,authors,abstract,year,citationCount,url"
method: "GET"
headers:
  "User-Agent": "UniSkill-Gateway/1.0 (info@uniskill.ai)"
```
