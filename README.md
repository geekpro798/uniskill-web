# UniSkill: The Universal Tool Layer for AI Agents 🚀

**Empower your AI agents with real-time intelligence and universal connectivity through a single, managed infrastructure.**

[UniSkill](https://uniskill.ai) is a Registry-driven tool execution layer for AI agents. It standardizes how agents interact with the web, providing high-performance tools (searching, scraping, math, etc.) with centralized billing, security, and data formatting.

---

## ⚡️ Quickstart: Unified Tool Execution

UniSkill standardizes every tool call into a single, billable protocol. No more managing 10+ disparate API keys.

### 1. Simple Search Execution (Python)

```python
import requests

# Unified UniSkill Gateway endpoint
URL = "https://api.uniskill.ai/v1/execute"
HEADERS = {"Authorization": "Bearer us-xxxx"}

payload = {
    "skill_name": "uniskill_search",
    "params": {
        "query": "Latest breakthroughs in agentic AI"
    }
}

response = requests.post(URL, json=payload, headers=HEADERS)
print(response.json())
```

### 2. Standardized Metadata Response
Every skill returns a consistent structure, including transparent usage metadata for agents:
```json
{
  "success": true,
  "articles": [...],
  "_uniskill": {
    "cost": 5.0,
    "remaining": 495.0,
    "request_id": "...",
    "version": "v1.0.0"
  }
}
```

---

## ✨ Core Concepts

*   **Registry-Driven Architecture**: AI tools (Skills) are defined in the central `registry/` directory. Metadata defines the pricing, parameters, and cleaning logic.
*   **Markdown-First Data**: LLM agents iterate faster on Markdown. All UniSkill outputs are pre-formatted for maximum reasoning efficiency.
*   **Unified Edge Billing**: One balance for all search, scrape, and utility needs. Deductions are handled at the edge with sub-millisecond latency.
*   **Plugin Hooks**: Automated data cleaning to strip HTML noise and compress token usage before data reaches your agent.

---

## 📂 Repository Structure

*   `uniskill-web`: This repository. Contains the dashboard, community registry, and billing management.
*   `uniskill-gateway`: High-performance Cloudflare Workers gateway for secure skill execution.
*   `registry/skills`: The "Source of Truth" for all available AI tools.

---

## 🛠 Adding New Skills

Adding a tool is as simple as adding a Markdown file:

1.  Create `registry/skills/custom_tool.md`.
2.  Define implementation YAML (endpoint, headers, cost).
3.  Deploy. The gateway instantly provides a `/v1/execute/custom_tool` route.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
