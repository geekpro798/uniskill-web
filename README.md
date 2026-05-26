# UniSkill

**AI Agent 的统一技能层。** 一个钱包地址，连接你的 Claude / Cursor / Windsurf 到搜索、爬虫、飞书、天气等所有技能。告别管理 10+ API Key。

---

## 架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│                      你的 AI 智能体                               │
│              Claude Desktop · Cursor · Windsurf                  │
│                    （MCP 协议 / REST）                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              UniSkill Gateway（Cloudflare Workers）               │
│                                                                  │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐    │
│  │ MCP Session  │   │  Skill Exec   │   │  Auth / Billing  │    │
│  │ (Durable OB) │   │  (Parser +    │   │  (EIP-191 签名   │    │
│  │ SSE 长连接    │   │   Template)   │   │   + Credits 扣费) │    │
│  └──────────────┘   └───────────────┘   └──────────────────┘    │
└─────────────┬────────────────┬──────────────────┬────────────────┘
              │                │                  │
              ▼                ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Cloudflare KV  │  │   Supabase   │  │  Native Handlers │
│  技能注册表      │  │  用户 / 计费  │  │  search scrape   │
│  private/official│  │  / 团队 / 日志│  │  weather math    │
│  /market/team   │  │              │  │  feishu chart     │
└─────────────────┘  └──────────────┘  └──────────────────┘
```

**一次技能调用的完整链路：**

```
Agent 发起调用 → Gateway 验证 EIP-191 签名 → 查 KV 加载 Skill 定义
→ Rate Limit 检查 → Executor 执行 → 扣 Credits → 返回结果 + 计费元数据
```

---

## 核心概念

| 概念 | 说明 |
|------|------|
| **Skill** | 用 Markdown 定义的 AI 工具。声明参数、实现方式、计费价格。一个 `.md` 文件就是一个技能。 |
| **Gateway** | 基于 Cloudflare Workers 的边缘网关。统一鉴权、计费、路由，所有技能调用的唯一入口。 |
| **MCP Session** | 基于 Cloudflare Durable Objects 的长连接会话。为 Claude/Cursor 等智能体提供 `tools/list` 和 `tools/call` 的标准 MCP 接口。 |
| **Sovereign Identity** | 基于 Particle Network MPC-TSS 的非托管钱包。你是私钥的唯一控制者，无需记忆助记词。 |
| **Credits** | 预付费积分，每次技能调用按 `base_fee_cents` 扣点。新用户注册即送 500 Credits。 |

---

## 快速体验

**5 分钟，从零到你的 AI Agent 调用第一个技能。**

1. 打开 **[uniskill.ai](https://uniskill.ai)**，点击 **Sign in with GitHub**
2. 进入 Dashboard，点击 **激活钱包** 完成 MPC 身份创建
3. 在 Dashboard 首页复制 **一键安装命令**，粘贴到终端运行
4. 重启 Claude Desktop（或 Cursor / Windsurf）
5. 对 Claude 说：**"帮我搜索最新的 AI Agent 框架"**

完成。你的 Agent 现在可以通过 UniSkill 调用搜索、爬虫、天气、数学等所有技能。

---

## 技能系统

每个技能是一个 Markdown 文件，Frontmatter 声明元数据，正文定义参数和实现。

```markdown
---
display_name: "智能搜索"
skill_name: uniskill_search
emoji: "🔍"
category: "web_data"
suggested_icon: "search"
theme_color: "blue"
---

# Description
高性能 Web 搜索引擎，返回结构化新闻、文章和知识图谱结果。

# Parameters
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "搜索关键词" },
    "num": { "type": "integer", "description": "返回条数，默认 5" }
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

**技能可见性：**

| visibility | 范围 | 示例 |
|------------|------|------|
| `private` | 仅创作者本人 | 个人封装的内部 API |
| `official` | 所有用户 | uniskill_search、uniskill_weather |
| `market` | 所有用户（社区贡献） | 第三方发布的技能 |

**网关加载优先级：** `private → official → market`
（同名技能，private 覆盖 official，official 覆盖 market）

---

## MCP 集成

UniSkill 原生支持 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)，让 Claude Desktop、Cursor、Windsurf 等智能体直接发现和调用你的技能。

### 一键安装脚本

Dashboard 中的安装命令自动完成：

1. 检测你本地安装的 AI 客户端（Claude Desktop / Cursor / Windsurf）
2. 生成对应的 MCP 配置文件
3. 注入你的 Session Key，确保长期有效

### tools/list → tools/call 流程

```
Client                    MCPSession (Durable Object)           KV / Executor
  │                              │                                  │
  │──── tools/list ─────────────►│                                  │
  │                              │──── 查 KV private/official/ ───►│
  │                              │      market 三层技能              │
  │◄─── { tools: [...] } ───────│                                  │
  │                              │                                  │
  │──── tools/call ─────────────►│                                  │
  │     { name, arguments }      │──── 验签 + 计费 + 执行 ────────►│
  │◄─── { content: [...] } ─────│                                  │
```

### Session Key

- 一次在 Dashboard 签发，长期有效
- 存储在本地 MCP 配置文件中，不会离开你的机器
- 断线后 Durable Object 自动重连，无需重新授权
- 可在 Dashboard 随时吊销

---

## 身份与鉴权

### 登录方式

GitHub OAuth 一键登录。不存密码，不用注册表单。

### 主权身份（Sovereign Identity）

基于 [Particle Network MPC-TSS](https://particle.network/)：

- 登录后激活钱包，生成一个由你控制的 EOA 地址
- 私钥通过 MPC 分片存储，任何单一方（包括 UniSkill）都无法掌握完整私钥
- 无需助记词——换设备时重新 GitHub 授权即可恢复

### 钱包恢复

1. 新设备登录同一 GitHub 账号
2. Dashboard → 激活钱包 → 系统检测到已有绑定 → 自动恢复
3. 你的地址、Credits、技能全部保留

### 鉴权链路

```
Agent 请求 → EIP-191 签名（Session Key 私钥）→ Gateway 验证
→ 从签名恢复地址 → 匹配 KV 中 user:profile 的 authorized_wallet
→ 验证通过 → 执行技能
```

---

## Cloudflare 基建

### KV 命名空间

```
skill:private:{uid}:{name}     # 个人技能
skill:official:{name}          # 官方技能
skill:market:{name}            # 市场技能
skill:team:{team_uid}:{name}   # 团队技能（规划中）
user:profile:{uid}             # 用户配置（credits/tier/wallet/teams）
```

### Durable Objects

- **MCPSession** — 管理 MCP 长连接会话，维持 `tools/list` → `tools/call` 状态
- 每个会话绑定唯一 `session_id`，支持断线重连
- 5 秒心跳保活

### Worker Routes

```
api.uniskill.ai/*    → Gateway Worker
```

---

## 本地开发

```bash
# 前置条件
Node.js >= 20
Wrangler CLI（npm i -g wrangler）
Supabase CLI（可选，仅迁移时需要）

# 1. 环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase URL/Key、Cloudflare Account ID 等

# 2. 启动 Web
npm install
npm run dev
# → http://localhost:3000

# 3. 启动 Gateway（另开终端，在 uniskill-gateway 目录）
npx wrangler dev --remote
# → http://localhost:8787
```

**关键目录：**

```
src/app/         # Next.js App Router（API routes + 页面）
src/lib/         # 业务逻辑（auth / teams / cloudflare）
src/components/  # 共享 UI 组件
supabase/        # 数据库迁移脚本
registry/        # 技能注册表（Markdown 定义的所有 Skill）
```

---

## 路线图

| 状态 | 内容 |
|------|------|
| ✅ 已上线 | 个人开发者、技能市场、MCP 集成、MPC 主权钱包 |
| 🔧 进行中 | 企业团队计费联调、CF Tunnel 内网代理基建 |
| 📋 规划中 | 企业团队正式上线、企业网关、野生 Agent、技能创作者激励 |

---

## 许可证

MIT © UniSkill
