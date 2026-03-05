# UniSkill: The Universal Skill Layer for AI Agents

**Empower your AI agents with real-time intelligence and universal connectivity through a single, managed infrastructure.**

[UniSkill](https://www.google.com/search?q=https://uniskill.ai) is a core skills layer designed for the next generation of AI agents. It standardizes how agents interact with the web, providing high-performance tools for searching, scraping, and connecting to any API with centralized billing and security.

---

## ⚡️ Quickstart: Initialize in 30 Seconds

The fastest way to prepare your environment is using our automated setup script.

```bash
# Get your API Key at uniskill.ai and execute the setup
curl -fsSL https://uniskill.ai/setup-skills.sh | bash -s -- your_api_key

```

*This command automatically configures your `UNISKILL_KEY` environment variable in your shell profile (`.zshrc` or `.bashrc`).*

---

## ✨ Core Skills

UniSkill provides a standardized catalog of skills optimized for LLM context windows:

* **`uniskill_search`**: Real-time web search that returns clean, agent-friendly Markdown content.
* **`uniskill_scrape`**: Converts any URL into structured Markdown, stripping away ads, scripts, and navigation noise.
* **`uniskill_connect`**: A basic API connector for proxying standard REST APIs with centralized authentication (1 credit per call).

---

## 🛠 Usage Example (Python)

Once your environment is initialized, you can trigger any skill with a simple POST request.

```python
import os
import requests

# Logic: Retrieve the API key from the environment set by setup-skills.sh
api_key = os.getenv("UNISKILL_KEY")

def trigger_search_skill(query):
    # Logic: Unified UniSkill Gateway endpoint for intelligence skills
    url = "https://api.uniskill.ai/v1/search"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Logic: Configure the request payload for optimized LLM context
    payload = {
        "query": query,
        "count": 5
    }

    # Logic: Execute the skill call through the global gateway
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Empower your agent with real-time knowledge
print(trigger_search_skill("Latest breakthroughs in autonomous AI agents 2026"))

```

---

## 🚀 Why UniSkill?

* **Markdown-First**: We believe agents process Markdown better. All our outputs are pre-formatted for maximum reasoning efficiency.
* **Unified Billing**: Forget managing 10+ subscriptions. Use one balance for all search, scrape, and proxy needs.
* **Extreme Performance**: Built on a KV-first architecture using Cloudflare Workers for sub-millisecond credit validation and reliability.
* **Instant Start**: Authenticate via GitHub OAuth and receive **500 free credits** to start building immediately.

---

## 📂 Repository Structure

* `uniskill-web`: Next.js dashboard for key management, billing, and usage analytics.
* `uniskill-gateway`: The high-performance Cloudflare Workers gateway for skill distribution.
* `uniskill-docs`: Technical documentation and API references for all available skills.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
