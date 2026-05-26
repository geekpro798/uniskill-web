# UniSkill

**The Universal Skill Layer for AI Agents.** One wallet address connects your Claude / Cursor / Windsurf to search, scraping, weather, math, and every skill. Stop juggling 10+ API keys.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Your AI Agent                               │
│              Claude Desktop · Cursor · Windsurf                  │
│                   (MCP Protocol / REST)                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              UniSkill Gateway（Cloudflare Workers）               │
│                                                                  │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐    │
│  │ MCP Session  │   │  Skill Exec   │   │  Auth / Billing  │    │
│  │ (Durable OB) │   │  (Parser +    │   │  (EIP-191 sig +  │    │
│  │ SSE stream   │   │   Template)   │   │   Credits debit) │    │
│  └──────────────┘   └───────────────┘   └──────────────────┘    │
└─────────────┬────────────────┬──────────────────┬────────────────┘
              │                │                  │
              ▼                ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Cloudflare KV  │  │   Supabase   │  │  Native Handlers │
│  Skill Registry │  │  Users/Billing│  │  search scrape   │
│  private/official│  │  /Teams/Logs │  │  weather math    │
│  /market/team   │  │              │  │  feishu chart     │
└─────────────────┘  └──────────────┘  └──────────────────┘
```

**Request lifecycle:**

```
Agent call → Gateway verifies EIP-191 signature → KV loads Skill manifest
→ Rate limit check → Executor runs → Debit credits → Return result + billing metadata
```

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Skill** | An AI tool defined as a Markdown file. Declares parameters, implementation, and pricing. One `.md` = one skill. |
| **Gateway** | Cloudflare Workers edge gateway. Single entry point for auth, billing, and routing. |
| **MCP Session** | Durable Object-based persistent connection. Exposes standard `tools/list` and `tools/call` for Claude, Cursor, etc. |
| **Sovereign Identity** | Non-custodial wallet via Particle Network MPC-TSS. You control the private key — no seed phrases. |
| **Credits** | Prepaid balance. Each skill call deducts `base_fee_cents`. New users get 500 free credits. |

---

## Quickstart

**5 minutes from zero to your AI agent calling a skill.**

1. Open **[uniskill.ai](https://uniskill.ai)** → **Sign in with GitHub**
2. Dashboard → **Activate Wallet** to create your MPC identity
3. Copy the **one-line install command** from Dashboard, paste in terminal
4. Restart Claude Desktop (or Cursor / Windsurf)
5. Ask Claude: **"Search for the latest AI agent frameworks"**

Done. Your agent can now call search, scrape, weather, math, and every other skill through UniSkill.

---

## Skill System

Every skill is a Markdown file. Frontmatter declares metadata; body defines parameters and implementation.

```markdown
---
display_name: "Web Search"
skill_name: uniskill_search
emoji: "🔍"
category: "web_data"
suggested_icon: "search"
theme_color: "blue"
---

# Description
High-performance web search returning structured news, articles, and knowledge graph results.

# Parameters
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "Search keywords" },
    "num": { "type": "integer", "description": "Number of results, default 5" }
  },
  "required": ["query"]
}

# Implementation
type: cli
command: "python search.py --q {{query}} --n {{num}}"
binary: "python3"

# Cost
base_fee_cents: 5
```

**Skill visibility:**

| visibility | Scope | Example |
|------------|-------|---------|
| `private` | Creator only | Personal internal API wrappers |
| `official` | All users | uniskill_search, uniskill_weather |
| `market` | All users (community) | Third-party published skills |

**Gateway loading priority:** `private → official → market`
(Private overrides official; official overrides market for same-name skills.)

---

## MCP Integration

UniSkill natively supports [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), enabling Claude Desktop, Cursor, and Windsurf to discover and call your skills directly.

### One-Line Install

The install command from your Dashboard automatically:

1. Detects your installed AI client (Claude Desktop / Cursor / Windsurf)
2. Generates the appropriate MCP configuration file
3. Injects your Session Key for persistent access

### tools/list → tools/call

```
Client                    MCPSession (Durable Object)           KV / Executor
  │                              │                                  │
  │──── tools/list ─────────────►│                                  │
  │                              │──── query KV private/official/ ─►│
  │                              │      market tiers                 │
  │◄─── { tools: [...] } ───────│                                  │
  │                              │                                  │
  │──── tools/call ─────────────►│                                  │
  │     { name, arguments }      │──── verify sig + bill + exec ───►│
  │◄─── { content: [...] } ─────│                                  │
```

### Session Key

- Issued once from Dashboard, valid long-term
- Stored locally in your MCP config — never leaves your machine
- Durable Object auto-reconnects on disconnect; no re-auth needed
- Revocable anytime from Dashboard

---

## Identity & Auth

### Sign-in

GitHub OAuth. No passwords, no sign-up forms.

### Sovereign Identity

Powered by [Particle Network MPC-TSS](https://particle.network/):

- Activate your wallet after sign-in to generate an EOA address you control
- Private key is split across MPC shards — no single party (including UniSkill) holds the full key
- No seed phrase — re-authenticate with GitHub on a new device to recover

### Wallet Recovery

1. Sign in with the same GitHub account on a new device
2. Dashboard → Activate Wallet → system detects existing binding → auto-restores
3. Your address, credits, and skills are preserved

### Auth Flow

```
Agent request → EIP-191 signature (Session Key private key) → Gateway verification
→ Recover address from signature → Match against user:profile authorized_wallet in KV
→ Verified → Execute skill
```

---

## Cloudflare Infrastructure

### KV Namespaces

```
skill:private:{uid}:{name}     # Personal skills
skill:official:{name}          # Official skills
skill:market:{name}            # Marketplace skills
skill:team:{team_uid}:{name}   # Team skills (planned)
user:profile:{uid}             # User profile (credits/tier/wallet/teams)
```

### Durable Objects

- **MCPSession** — Manages MCP persistent connections, maintains `tools/list` → `tools/call` state
- Each session bound to a unique `session_id`, supports reconnection
- 5-second heartbeat keepalive

### Worker Routes

```
api.uniskill.ai/*    → Gateway Worker
```

---

## Local Development

```bash
# Prerequisites
Node.js >= 20
Wrangler CLI (npm i -g wrangler)
Supabase CLI (optional, migrations only)

# 1. Environment
cp .env.example .env.local
# Edit .env.local with your Supabase URL/Key, Cloudflare Account ID, etc.

# 2. Start Web
npm install
npm run dev
# → http://localhost:3000

# 3. Start Gateway (separate terminal, in uniskill-gateway directory)
npx wrangler dev --remote
# → http://localhost:8787
```

**Key directories:**

```
src/app/         # Next.js App Router (API routes + pages)
src/lib/         # Business logic (auth / teams / cloudflare)
src/components/  # Shared UI components
supabase/        # Database migration scripts
registry/        # Skill registry (Markdown-based skill definitions)
```

---

## Roadmap

| Status | Scope |
|--------|-------|
| ✅ Live | Individual developers, Skill marketplace, MCP integration, MPC wallet |
| 🔧 In Progress | Team billing integration, CF Tunnel infrastructure |
| 📋 Planned | Team plan launch, Enterprise gateway, Autonomous agents, Creator incentives |

---

## License

MIT © UniSkill
