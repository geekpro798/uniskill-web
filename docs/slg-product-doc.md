# UniSkill — AI Agent 的统一技能层

## "数龙杯"全球 AI 创新大赛 · 产品说明文档

---

**产品名称**：UniSkill  
**团队名称**：__（请填写）__  
**联系人**：__（请填写）__  
**官网**：[uniskill.ai](https://uniskill.ai)  
**提交日期**：2026 年 5 月  

---

## 1. 产品概述

**UniSkill 是 AI Agent 的统一技能层。** 一个钱包地址，连接 Claude、Cursor、Windsurf 等 AI Agent 到搜索、爬虫、天气、飞书等互联网技能。没有 API Key，没有配额表格。

### 一句话定位

> 让 AI Agent 拥有整个互联网的能力——登录即用，按量计费。

### 当前状态

- ✅ 产品已上线，面向全球开发者开放
- ✅ 技能市场已运营，17+ 官方技能覆盖搜索、爬虫、天气、飞书等
- ✅ 支持 Claude Desktop / Cursor / Windsurf 一键接入
- ✅ 基于 Particle Network MPC-TSS 的非托管钱包身份体系

---

## 2. 用户痛点

### 现状：Agent 开发者被困在 API 集成里

```
开发者 → 找 API → 申请 Key → 管配额 → 写适配代码 → 处理格式 → 维护更新
```

每个 AI Agent 的开发者都在重复同一件事：为搜索、爬虫、天气等基础能力逐个对接 API。这本质上是在搭建一个缺失的中间层——技能网关。

### 痛点拆解

| 痛点 | 现状 | 根因 |
|------|------|------|
| API 碎片化 | 10+ 个 Key 分散在各平台 | 没有统一的 Agent 技能入口 |
| 鉴权混乱 | ApiKey / OAuth / JWT 各不相同 | Agent 没有统一的身份协议 |
| 计费割裂 | 多个平台分别充值和看账单 | 没有统一的按量计费层 |
| 格式不统一 | JSON / XML / HTML 需要各自解析 | 没有 Agent 友好的格式化层 |
| 缺乏 MCP 支持 | 接入 Claude 需要额外开发 | 现有 API 不为 Agent 设计 |

### 游戏场景增量痛点

- **AI NPC 被困在沙箱里**：大模型能对话，但无法获取真实世界信息（天气、攻略、资讯）
- **多语言玩家无法实时沟通**：跨国服需要翻译，但游戏引擎没有内置翻译管线
- **策划需要外部数据辅助设计**：查竞品、做分析依赖人工调研

---

## 3. 解决方案

### 核心思路

在 AI Agent 和万维网之间，加一个标准化的**技能网关层**。

```
Agent（Claude / Cursor / 游戏内 NPC）
        │
        ▼
  UniSkill Gateway（鉴权 · 计费 · 路由）
        │
        ├──→ uniskill_search（搜索）
        ├──→ uniskill_scrape（网页抓取）
        ├──→ uniskill_weather（天气）
        ├──→ uniskill_news（新闻）
        ├──→ lark_im（飞书消息）
        └──→ ...（任意 Markdown 定义的技能）
```

### 一次调用的完整流程

```
1. 登录 GitHub → 激活 MPC 钱包（5 秒）
2. Dashboard 复制一条命令 → 终端粘贴 → 重启 Claude（30 秒）
3. 对 Claude 说"搜索最新 AI 新闻" → 完成（1 秒）

背后发生了什么：
  Agent 发起调用 → EIP-191 签名验证 → KV 加载技能定义
  → Rate Limit 检查 → 执行技能 → 扣费 → 返回格式化结果
```

### 关键技术特性

| 特性 | 说明 |
|------|------|
| **Registry 驱动** | 技能用 Markdown 定义，声明参数+实现+定价，解析即上线 |
| **MCP 原生支持** | 标准 `tools/list` → `tools/call` 协议，Claude/Cursor/Windsurf 零改造接入 |
| **Sovereign Identity** | Particle MPC-TSS 非托管钱包，EIP-191 签名鉴权，无需信任任何第三方 |
| **三层技能隔离** | private（个人）> official（官方）> market（社区），安全可控 |
| **边缘计费** | Cloudflare Workers 边缘节点扣费，亚毫秒延迟 |

---

## 4. 产品演示

### 4.1 Dashboard 首页

*（截图：Dashboard 首页概览 — Credits 余额、技能列表、最近活跃记录）*

### 4.2 一键安装 MCP

*（截图：Dashboard → "一键安装" → 终端命令 → Claude 配置注入完成）*

### 4.3 激活主权钱包

*（截图：激活页面 → Particle MPC 钱包生成 → 地址展示）*

### 4.4 Claude 调用技能

*（截图：Claude Desktop 对话 — 用户输入 "Search the latest AI agent frameworks" → UniSkill 返回结构化搜索结果）*

### 4.5 技能市场

*（截图：17+ 官方技能列表 — search / scrape / weather / news / feishu / crypto / github-tracker）*

---

## 5. 技术创新

### 5.1 Registry-Driven Skill Architecture（技能注册表架构）

```
┌──────────────────────────────────────────┐
│          registry/skills/*.md            │
│                                          │
│  ---                                     │
│  display_name: "智能搜索"                 │
│  skill_name: uniskill_search             │
│  ---                                     │
│  # Parameters                           │
│  { type: "object", properties: {...} }  │
│  # Implementation                        │
│  type: cli                               │
│  command: "python search.py --q {{q}}"  │
│  # Cost                                  │
│  base_fee_cents: 5                       │
└──────────────┬───────────────────────────┘
               │  sync-registry.ts
               ▼
┌──────────────────────────────────────────┐
│         Cloudflare KV                     │
│  skill:official:uniskill_search → {...}  │
│  skill:market:community-skill → {...}    │
│  skill:private:{uid}:my-skill → {...}    │
└──────────────┬───────────────────────────┘
               │  Gateway 运行时加载
               ▼
┌──────────────────────────────────────────┐
│         Agent tools/list 立即可用          │
└──────────────────────────────────────────┘
```

**壁垒**：一个 Markdown 文件 = 一个上线技能。从写完到全平台 Agent 可用，只需一次脚本同步。

### 5.2 Sovereign Identity + EIP-191 鉴权

```
用户登录 GitHub
    │
    ▼
Particle MPC-TSS 生成分片私钥（非托管）
    │
    ▼
EOA 地址绑定到用户 profile
    │
    ▼
Dashboard 签发 Session Key（本地生成密钥对）
    │
    ▼
Agent 请求 → EIP-191 签名 → Gateway 恢复地址 → 匹配 authorized_wallet
```

**壁垒**：去中心化身份 + 传统 Web2 体验。用户看不到助记词，安全性和可用性兼得。

### 5.3 MCP Session Durable Object

- 基于 Cloudflare Durable Objects 维持长连接
- 每个会话绑定唯一 `session_id`，支持断线自动重连
- 5 秒心跳保活，无状态鉴权不阻塞实时交互
- 一次签发 Session Key，长期有效

**壁垒**：这不是简单的 HTTP API。DO 长连接管理 + MCP 协议 + EIP-191 签名三者结合，竞品难以复现相同的低延迟交互。

### 5.4 三层技能隔离

| 层级 | 命名空间 | 权限 |
|------|----------|------|
| Private | `skill:private:{uid}:{name}` | 仅创建者 |
| Official | `skill:official:{name}` | 全部用户 |
| Market | `skill:market:{name}` | 全部用户 |

加载优先级：`private → official → market`。同名技能，个人版覆盖官方版。为未来企业团队（Team 层级）预留了扩展空间。

---

## 6. 应用场景

### 6.1 当前场景：AI 开发者

| 用户 | 场景 | 效果 |
|------|------|------|
| 独立开发者 | 用 Claude + UniSkill 做技术调研 | 一条命令连上搜索+爬虫，省去 3 个 API 接入 |
| AI 产品团队 | Cursor 内嵌 Agent 调用飞书技能 | 代码提交自动发飞书通知，无需单独开发 Bot |
| 技能创作者 | 写一个 Markdown 发布社区技能 | 写完后 `npm run sync` 即可供全球 Agent 调用 |

### 6.2 游戏场景延伸（规划中）

| 场景 | UniSkill 的作用 |
|------|-----------------|
| AI NPC 获取世界知识 | 调 `uniskill_search`，NPC 说"让我帮你查攻略" |
| 跨国服多语言交流 | 调翻译技能，玩家消息实时互译 |
| 策划调竞品数据 | Agent 定时爬取竞品更新，自动生成分析报告 |
| 游戏内 AI 助手 | 查天气、做数学、看新闻——玩家 Agent 的个人助理 |

---

## 7. 竞品对比

| 维度 | 传统方案（各 API 直连） | MCP 市场（单体工具） | **UniSkill** |
|------|------------------------|---------------------|--------------|
| API Key 管理 | 10+ Key 分散 | 各工具独立配置 | **一个钱包地址** |
| 接入 Claude | 需自行开发 MCP Server | 需逐一安装 | **一条命令完成** |
| 计费 | 各平台独立充值 | 无统一计费 | **统一预付费积分** |
| 身份体系 | 无 | 无 | **MPC 非托管钱包** |
| 技能扩展 | 写代码 | 写代码 | **写 Markdown** |
| 企业团队 | 不支持 | 不支持 | **规划中** |

UniSkill 不是又一个 MCP 工具——它是 MCP 工具的**基础设施**。

---

## 8. 商业价值

### 8.1 商业模式

- **个人开发者**：免费 Credits（注册送 500）+ 按量付费
- **企业团队**（规划中）：按团队人数/调用量订阅
- **技能市场**（规划中）：创作者发布付费技能，平台抽成

### 8.2 市场规模

- MCP 协议由 Anthropic 于 2024 年底发布，已成 AI Agent 互操作标准
- Claude Desktop、Cursor、Windsurf 等主流智能体均已原生支持 MCP
- 全球 AI Agent 开发者预计 2026 年超过 500 万

### 8.3 游戏产业增量

- 全球游戏市场规模 $2000 亿+
- AI NPC 被 GDC 2025 列为游戏行业 Top 3 趋势
- 下一代开放世界游戏需要"会上网的 NPC"——UniSkill 是天然答案

---

## 9. 技术架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                              │
│         Claude Desktop · Cursor · Windsurf · Unity Agent          │
│                       (MCP / REST)                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   UniSkill Gateway                                │
│                   (Cloudflare Workers)                            │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │  MCP Session   │  │  Skill Exec    │  │  Auth / Billing   │   │
│  │  (Durable OB)  │  │  (Parser +     │  │  (EIP-191 sig +   │   │
│  │  SSE stream    │  │   Template)    │  │   Credits debit)  │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
└─────────────┬──────────────────┬──────────────────┬──────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
┌──────────────────┐  ┌────────────────┐  ┌────────────────────┐
│  Cloudflare KV   │  │    Supabase    │  │   Native Handlers  │
│  Skill Registry  │  │  Users · Billing│  │  search · scrape   │
│  3-Tier Isolation│  │  Teams · Logs  │  │  weather · feishu  │
└──────────────────┘  └────────────────┘  └────────────────────┘
```

---

## 10. 团队与进展

### 产品进展

| 里程碑 | 状态 |
|--------|------|
| 个人开发者 MVP 上线 | ✅ 已完成 |
| GitHub OAuth + MPC 钱包 | ✅ 已完成 |
| MCP 一键安装（Claude/Cursor/Windsurf） | ✅ 已完成 |
| 技能市场（17+ 官方技能） | ✅ 已完成 |
| Cloudflare Tunnel 团队内网代理 | 🔧 进行中 |
| 企业团队管理 + 独立计费 | 🔧 进行中 |
| Unity / Unreal SDK | 📋 规划中 |
| 技能创作者激励计划 | 📋 规划中 |

### 核心技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 · React 19 · Tailwind CSS · Framer Motion |
| 网关 | Cloudflare Workers · Durable Objects · KV |
| 数据 | Supabase (PostgreSQL) |
| 身份 | Particle Network MPC-TSS · EIP-191 · NextAuth |
| 部署 | Vercel · Cloudflare · GitHub Actions |

---

## 附录：产品访问方式

- **官网**：[https://uniskill.ai](https://uniskill.ai)
- **Demo 演示视频**：[请附链接]
- **源代码**：[https://github.com/uniskillai](https://github.com/uniskillai)

---

*本文档仅供"数龙杯"评审使用。UniSkill 团队保留所有权利。*
