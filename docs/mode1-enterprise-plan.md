# UniSkill 模式一（共享网关）企业部署 — 改造方案

## 一、现状总结

### 当前数据模型

```
Supabase:
  profiles (user_uid, github_id, email, username, authorized_wallet, credits, tier, secrets)
  skills   (skill_uid, skill_name, display_name, owner_uid, status, state, markdown_manifest, secrets)
  credit_events (user_uid, skill_name, amount, created_at)

Cloudflare KV:
  skill:official:{name}         → 官方技能（全局）
  skill:private:{userUid}:{name} → 私有技能（个人）
  skill:market:{name}           → 市场技能（全局）
  skill:secrets:{uid}:{name}   → 技能专属密钥
  user:secrets:{uid}           → 用户全局密钥
  user:profile:{uid}           → 用户画像 (credits/tier/username)
  session:key:{pubKey}         → Session Key 映射
  mcp_registry:tools_cache     → 公共工具缓存
```

### 当前核心问题

**没有"团队/组织"概念。** 一切都是围绕个人用户 (`userUid`) 构建的：
- 技能归属个人 (`owner_uid`)
- 私有技能 KV key 按个人 UID 隔离 (`skill:private:{userUid}:`)
- Dashboard 只展示个人技能
- 没有团队管理、成员管理、审计日志

模式一需要在**不改变核心架构的前提下**，叠加企业/团队能力。

---

## 二、改造总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        改造涉及 4 层                               │
├──────────────┬──────────────────────────────────────────────────┤
│ 1. 数据库层   │ Supabase 新增 4 张表 + skills 表扩展              │
│ 2. Gateway 层 │ KV Key 策略扩展 + Cloudflare Tunnel 端点          │
│ 3. Web API 层 │ 新增 team CRUD + tunnel 管理 + 审计查询 API        │
│ 4. 前端 UI 层 │ 企业 Dashboard + 团队管理 + Tunnel 配置页面         │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 三、详细改造方案

### 3.1 数据库层（Supabase）

#### 新增表 1：teams（团队/组织）

```sql
CREATE TABLE teams (
  id          BIGSERIAL PRIMARY KEY,
  team_uid    UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,          -- URL-friendly identifier
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_teams_slug ON teams(slug);
```

#### 新增表 2：team_members（团队成员）

```sql
CREATE TABLE team_members (
  id          BIGSERIAL PRIMARY KEY,
  team_uid    UUID REFERENCES teams(team_uid) ON DELETE CASCADE,
  user_uid    UUID NOT NULL,                 -- 对应 profiles.user_uid
  role        TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at   TIMESTAMPTZ DEFAULT now()
);

-- 约束：同一用户不能重复加入同一团队
CREATE UNIQUE INDEX idx_team_members_unique ON team_members(team_uid, user_uid);
CREATE INDEX idx_team_members_user ON team_members(user_uid);
```

**角色权限矩阵：**

| 权限 | owner | admin | member | viewer |
|------|:-----:|:-----:|:------:|:------:|
| 管理成员 | ✅ | ✅ | ❌ | ❌ |
| 创建/编辑技能 | ✅ | ✅ | ✅ | ❌ |
| 查看技能 | ✅ | ✅ | ✅ | ✅ |
| 调用技能 | ✅ | ✅ | ✅ | ✅ |
| 管理 Tunnel | ✅ | ✅ | ❌ | ❌ |
| 查看审计日志 | ✅ | ✅ | ❌ | ❌ |
| 删除团队 | ✅ | ❌ | ❌ | ❌ |

#### 新增表 3：audit_logs（审计日志）

```sql
CREATE TABLE audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  team_uid      UUID REFERENCES teams(team_uid) ON DELETE SET NULL,
  user_uid      UUID,                         -- 操作者
  action        TEXT NOT NULL,                -- 'skill.call', 'skill.create', 'member.invite', etc.
  resource_type TEXT,                         -- 'skill', 'member', 'tunnel', 'team'
  resource_id   TEXT,                         -- 被操作的资源 ID
  details       JSONB DEFAULT '{}',           -- 详细信息
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_team ON audit_logs(team_uid, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_uid, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

#### 新增表 4：team_tunnels（Cloudflare Tunnel 配置）

```sql
CREATE TABLE team_tunnels (
  id              BIGSERIAL PRIMARY KEY,
  team_uid        UUID REFERENCES teams(team_uid) ON DELETE CASCADE,
  tunnel_name     TEXT NOT NULL,              -- CF Tunnel 名称
  tunnel_id       TEXT,                       -- CF Tunnel ID（cloudflared 返回）
  tunnel_token    TEXT,                       -- CF Tunnel Token（加密存储）
  internal_domain TEXT NOT NULL,              -- 内网域名或 IP:Port，如 'jira.internal.corp:8080'
  public_hostname TEXT,                       -- CF 分配的公开 hostname
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','error','disconnected')),
  last_heartbeat  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tunnels_team ON team_tunnels(team_uid);
```

#### 新增表 5：enterprise_accounts（企业账号 — UniSkill 运营端）

```sql
CREATE TABLE enterprise_accounts (
  id                BIGSERIAL PRIMARY KEY,
  account_uid       UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  company_name      TEXT NOT NULL,
  company_slug      TEXT NOT NULL UNIQUE,
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  plan              TEXT DEFAULT 'mode1' CHECK (plan IN ('mode1','mode2','mode3')),
  status            TEXT DEFAULT 'lead' CHECK (status IN ('lead','active','suspended','cancelled')),
  team_uid          UUID REFERENCES teams(team_uid),

  -- 配额
  max_members       INTEGER DEFAULT 50,
  max_skills        INTEGER DEFAULT 100,
  max_credits_month INTEGER DEFAULT 100000,

  -- 商务
  contract_start    DATE,
  contract_end      DATE,
  pricing_model     TEXT DEFAULT 'subscription',
  monthly_fee_usd   INTEGER DEFAULT 99,

  -- 元数据
  notes             TEXT,
  created_by        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enterprise_status ON enterprise_accounts(status);
CREATE INDEX idx_enterprise_slug ON enterprise_accounts(company_slug);
```

#### 扩展 profiles 表

```sql
-- 关联企业账号
ALTER TABLE profiles ADD COLUMN enterprise_uid UUID REFERENCES enterprise_accounts(account_uid);
-- 是否企业管理员
ALTER TABLE profiles ADD COLUMN is_enterprise_admin BOOLEAN DEFAULT false;
-- 是否 UniSkill 运营人员（访问 Admin Panel）
ALTER TABLE profiles ADD COLUMN is_staff BOOLEAN DEFAULT false;
```

#### 扩展 skills 表（新增字段）

```sql
ALTER TABLE skills ADD COLUMN team_uid UUID REFERENCES teams(team_uid);
ALTER TABLE skills ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public'));

-- 新增索引
CREATE INDEX idx_skills_team ON skills(team_uid);
```

- `team_uid`: NULL = 个人技能，有值 = 团队技能
- `visibility`: `private` = 仅自己, `team` = 团队内可见, `public` = 社区公开

---

### 3.2 Gateway 层（Cloudflare Workers）

#### 3.2.1 KV Key 策略扩展

当前私有技能 key：`skill:private:{userUid}:{name}`

需要新增团队技能 key：`skill:private:{teamUid}:{name}`

**SkillKeys 工具类改造** (`src/utils/skill-keys.ts`)：

```typescript
export const SkillKeys = {
  official: (name: string) => `skill:official:${name}`,
  // 个人私有
  private: (uid: string, name: string) => `skill:private:${uid}:${name}`,
  // 🆕 团队私有
  teamPrivate: (teamUid: string, name: string) => `skill:team:${teamUid}:${name}`,
  market: (name: string) => `skill:market:${name}`,
  secrets: (uid: string) => `user:secrets:${uid}`,
  skillSecrets: (uid: string, name: string) => `skill:secrets:${uid}:${name}`,
  profile: (uid: string) => `user:profile:${uid}`,
  sessionKey: (pubKey: string) => `session:key:${pubKey.toLowerCase()}`,
  // ... etc
};
```

#### 3.2.2 技能列表查询扩展

**`GET /v1/skills` 改造：**

当前逻辑只查个人私有技能 (`skill:private:{userUid}:`)。需要：
1. 通过新增的 `/v1/admin/sync_team_membership` 端点，在用户登录时将其所属 team_uid 列表同步到 KV
2. 在列表查询时，同时扫描 `skill:private:{userUid}:` 和 `skill:team:{teamUid}:`

实现方案：在用户 profile KV 中存储 `teams: string[]` 字段：

```typescript
// KV 中 user:profile:{uid} 扩展
{
  credits: 500,
  tier: "FREE",
  username: "alice",
  updated_at: 1234567890,
  teams: ["team-uid-1", "team-uid-2"]  // 🆕
}
```

列表查询时：

```typescript
// 在 scanCategories 中动态加入团队前缀
if (userUid) {
  scanCategories.unshift({ prefix: `skill:private:${userUid}:`, source: "private" });
  // 🆕 加入所有团队的技能
  const profile = JSON.parse(await env.UNISKILL_KV.get(`user:profile:${userUid}`));
  const teamUids = profile?.teams || [];
  for (const teamUid of teamUids) {
    scanCategories.unshift({ prefix: `skill:team:${teamUid}:`, source: "team" });
  }
}
```

#### 3.2.3 MCP Session 中 tools/list 扩展

**`MCPSession.ts` — `processMessage` 中 `tools/list` 改造：**

当前私有工具拉取：
```typescript
const list = await this.env.UNISKILL_KV.list({ prefix: `skill:private:${userUid}:` });
```

需要扩展为同时拉取团队工具：

```typescript
// 在 tools/list 中添加团队工具获取
const profile = JSON.parse(await this.env.UNISKILL_KV.get(`user:profile:${userUid}`));
const teamUids = profile?.teams || [];

for (const teamUid of teamUids) {
  const teamList = await this.env.UNISKILL_KV.list({ prefix: `skill:team:${teamUid}:` });
  // 用 team_username 前缀命名
  const teamSkills = await Promise.all(teamList.keys.map(async (key) => {
    // 同样解析逻辑，但命名前缀使用团队用户名
    const raw = await this.env.UNISKILL_KV.get(key.name);
    const baseName = key.name.split(':').pop();
    const mcpName = `team_${safeTeamName}_${baseName}`.slice(0, 64);
    // ...
  }));
  allTools.push(...teamSkills);
}
```

#### 3.2.4 Cloudflare Tunnel 健康检查端点（🆕）

新增一个轻量端点供 Tunnel 心跳：

```
POST /v1/tunnel/heartbeat
Header: X-Tunnel-Token: <team_tunnel_token>

Body: { team_uid, tunnel_id, status }
```

Gateway 收到心跳后更新 KV 中的 tunnel 状态：
- `tunnel:status:{teamUid}` → `{ status, lastHeartbeat }`

#### 3.2.5 计费日志增强

当前仅在 `deductCredit` 中扣除积分，无结构化审计。新增：

```typescript
// 在 deductCredit 中增加审计日志写入
async function writeAuditLog(env: Env, entry: {
  team_uid?: string,
  user_uid: string,
  skill_name: string,
  action: string,
  credits: number,
  ip?: string,
  timestamp: number
}) {
  // 写入 KV: audit:{teamUid}:{timestamp}
  // 或通过 BILLING_QUEUE 异步推送
  await env.BILLING_QUEUE.send(entry);
}
```

---

### 3.3 Web API 层（Next.js API Routes）

#### 新增 API 路由清单

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/teams` | GET | 列出当前用户的团队 |
| `/api/teams` | POST | 创建新团队 |
| `/api/teams/[slug]` | GET | 获取团队详情 |
| `/api/teams/[slug]` | PATCH | 更新团队信息 |
| `/api/teams/[slug]` | DELETE | 删除团队（仅 owner） |
| `/api/teams/[slug]/members` | GET | 列出团队成员 |
| `/api/teams/[slug]/members` | POST | 邀请成员（通过邮箱/GitHub ID） |
| `/api/teams/[slug]/members/[uid]` | PATCH | 修改成员角色 |
| `/api/teams/[slug]/members/[uid]` | DELETE | 移除成员 |
| `/api/teams/[slug]/tunnels` | GET | 列出团队 Tunnel |
| `/api/teams/[slug]/tunnels` | POST | 创建 Tunnel 配置 |
| `/api/teams/[slug]/tunnels/[id]` | DELETE | 删除 Tunnel |
| `/api/teams/[slug]/tunnels/[id]/token` | GET | 获取 Tunnel 连接令牌（一次性展示） |
| `/api/teams/[slug]/audit` | GET | 查询审计日志（支持筛选） |
| `/api/teams/[slug]/skills` | GET | 列出团队技能 |

#### 关键 API 实现要点

**创建团队 (POST /api/teams)：**
```
1. 检查用户是否有权限创建团队（Enterprise 订阅检查）
2. 生成 team_uid (UUID)
3. INSERT INTO teams
4. INSERT INTO team_members (role='owner')
5. 同步到 Gateway KV 的 user profile (teams 字段)
6. 写入 audit_log
```

**邀请成员 (POST /api/teams/[slug]/members)：**
```
1. 检查邀请者是否为 admin+
2. 通过 email 或 GitHub ID 查找 profiles 表
3. INSERT INTO team_members
4. 同步到 Gateway KV（更新被邀请者的 teams 列表）
5. 写入 audit_log
```

**Tunnel 管理 (POST /api/teams/[slug]/tunnels)：**
```
1. 调用 Cloudflare API 创建 Tunnel（或生成 cloudflared 命令行）
2. 存储 tunnel token（加密）
3. 返回一键安装脚本给企业管理员
```

---

### 3.4 前端 UI 层

#### 新增页面路由

```
/dashboard/teams              → 团队列表
/dashboard/teams/[slug]       → 团队主页（概览 + 技能列表）
/dashboard/teams/[slug]/members → 成员管理
/dashboard/teams/[slug]/tunnels → Tunnel 管理
/dashboard/teams/[slug]/audit   → 审计日志
/dashboard/teams/[slug]/settings → 团队设置
```

#### 改造页面

| 页面 | 改造内容 |
|------|---------|
| `UnifiedNavbar` | 新增团队切换器（下拉选择团队上下文） |
| `CreateSkillClient.tsx` | visibility 新增 "Team" 选项 + team_uid 绑定 |
| `SkillsClient.tsx` | 可按团队筛选技能列表 |
| `DashboardClient.tsx` | 新增团队快捷入口卡片 |

#### 团队切换器（上下文切换）

在 Navbar 中增加团队选择下拉框。切换团队后：
- 所有 API 请求带上 `X-Team-Uid` header（或通过 cookie/session 记录当前活跃 team）
- Dashboard 技能列表自动过滤当前团队的技能
- "Deploy New Skill" 默认归属到当前团队

#### Tunnel 配置页面 UI

```
┌────────────────────────────────────────────┐
│  Cloudflare Tunnel                         │
│                                            │
│  ┌─ 步骤1：安装 cloudflared ──────────┐   │
│  │ curl -L https://... | sudo bash     │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ┌─ 步骤2：运行 Tunnel ───────────────┐   │
│  │ cloudflared tunnel run <token>      │   │
│  │          [📋 Copy]                   │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ┌─ Tunnel 状态 ──────────────────────┐   │
│  │ ● Jira API        jira.corp.com     │   │
│  │   Status: 🟢 Connected              │   │
│  │   Last heartbeat: 2s ago            │   │
│  │                                     │   │
│  │ ● Database API    db.internal:5432  │   │
│  │   Status: 🔴 Disconnected           │   │
│  └────────────────────────────────────┘   │
│                                            │
│  [+ Add Tunnel]                            │
└────────────────────────────────────────────┘
```

---

### 3.5 UniSkill 运营管理端（Admin Panel）

以上是企业侧的自服务功能。但模式一的核心前提是 **UniSkill 官方后台** 能够：
- 开通/管理企业账号
- 为企业创建初始团队和管理员
- 查看所有企业的使用情况
- 处理企业工单

这是整个 B 端业务的操作中枢。

#### 3.5.1 企业账号生命周期

```
┌──────────────────────────────────────────────────────────────┐
│                    Enterprise Account Lifecycle                │
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐ │
│  │  意向     │ →  │  开通     │ →  │  运行中   │ →  │  停用   │ │
│  │ (lead)   │    │ (active) │    │ (active) │    │(suspend)│ │
│  └──────────┘    └──────────┘    └──────────┘    └─────────┘ │
│       ↑                              │              │         │
│       └──────────────────────────────┴──────────────┘         │
│                    重新激活 / 续费                              │
└──────────────────────────────────────────────────────────────┘

1. 意向 (lead)
   - 企业联系 UniSkill，提交基本信息
   - UniSkill 运营人员在后台创建 "潜在客户" 记录

2. 开通 (provisioning)
   - 运营人员创建 Enterprise Account
   - 系统自动：创建 team + 指定初始 admin 用户 + 发放 Session Key
   - 生成企业专属的 onboarding 链接发送给客户

3. 运行中 (active)
   - 企业管理员自助管理团队成员、技能、Tunnel
   - UniSkill 运营人员可查看用量、审计日志
   - 月度账单生成

4. 停用 (suspended)
   - 欠费/合同到期/违规 → 暂停所有企业技能调用
   - Gateway 侧拦截：返回 402 错误码 + 提示联系管理员
   - 数据保留 90 天，期间可恢复
```

#### 3.5.2 新增数据库表

**enterprise_accounts（企业账号）**

```sql
CREATE TABLE enterprise_accounts (
  id                BIGSERIAL PRIMARY KEY,
  account_uid       UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  company_name      TEXT NOT NULL,                 -- 企业名称
  company_slug      TEXT NOT NULL UNIQUE,          -- URL 标识
  contact_name      TEXT,                          -- 联系人
  contact_email     TEXT,                          -- 联系邮箱
  contact_phone     TEXT,                          -- 联系电话
  plan              TEXT DEFAULT 'mode1' CHECK (plan IN ('mode1', 'mode2', 'mode3')),
  status            TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'suspended', 'cancelled')),
  team_uid          UUID REFERENCES teams(team_uid), -- 关联的默认团队

  -- 配额与限制
  max_members       INTEGER DEFAULT 50,            -- 最大成员数
  max_skills        INTEGER DEFAULT 100,           -- 最大技能数
  max_credits_month INTEGER DEFAULT 100000,        -- 月积分上限

  -- 商务信息
  contract_start    DATE,
  contract_end      DATE,
  pricing_model     TEXT DEFAULT 'subscription',   -- subscription / usage-based / hybrid
  monthly_fee_usd   INTEGER DEFAULT 99,            -- 月费（美元）

  -- 元数据
  notes             TEXT,                          -- 运营备注
  created_by        TEXT,                          -- 创建者（UniSkill 运营人员 ID）
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enterprise_status ON enterprise_accounts(status);
CREATE INDEX idx_enterprise_slug ON enterprise_accounts(company_slug);
```

**需要扩展 profiles 表：**

```sql
-- 关联到企业账号，标识 B 端用户
ALTER TABLE profiles ADD COLUMN enterprise_uid UUID REFERENCES enterprise_accounts(account_uid);
-- 是否为企业管理员（由 UniSkill 运营端指定）
ALTER TABLE profiles ADD COLUMN is_enterprise_admin BOOLEAN DEFAULT false;
```

#### 3.5.3 UniSkill Admin API（运营端专用）

这些 API 仅供 UniSkill 内部运营人员使用，需要 ADMIN_KEY 鉴权 + 运营人员 Supabase RLS 策略。

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/admin/enterprises` | GET | 列出所有企业账号（支持筛选、分页） |
| `/api/admin/enterprises` | POST | 创建企业账号 + 自动开通团队 |
| `/api/admin/enterprises/[uid]` | GET | 查看企业详情 |
| `/api/admin/enterprises/[uid]` | PATCH | 更新企业信息/配额/状态 |
| `/api/admin/enterprises/[uid]/suspend` | POST | 暂停企业账号 |
| `/api/admin/enterprises/[uid]/reactivate` | POST | 重新激活企业账号 |
| `/api/admin/enterprises/[uid]/usage` | GET | 查看企业用量统计（技能数、调用量、积分消耗） |
| `/api/admin/enterprises/[uid]/audit` | GET | 查看企业审计日志 |
| `/api/admin/enterprises/[uid]/members` | GET | 查看企业所有成员 |
| `/api/admin/enterprises/[uid]/onboarding` | POST | 生成/重新发送 onboarding 链接 |

**关键 API 实现要点：**

**创建企业账号 (POST /api/admin/enterprises)：**

```
1. 鉴权：校验操作者是 UniSkill 运营人员（ADMIN_KEY + Supabase role）
2. INSERT INTO enterprise_accounts（状态 = 'lead' 或直接 'active'）
3. 自动创建关联 team：INSERT INTO teams
4. 更新 enterprise_accounts.team_uid
5. 如果指定了初始管理员（通过 email/GitHub ID）：
   a. 查找或创建 profiles 记录
   b. 标记 is_enterprise_admin = true, enterprise_uid = account_uid
   c. INSERT INTO team_members (role = 'owner')
6. 同步到 Gateway KV（team 创建 + 成员 teams 列表更新）
7. 生成 onboarding 链接：https://uniskill.com/dashboard/teams/{slug}?token=xxx
8. 发送通知邮件（可选）
```

**暂停企业 (POST /api/admin/enterprises/[uid]/suspend)：**

```
1. UPDATE enterprise_accounts SET status = 'suspended'
2. Gateway KV 写入拦截标记：enterprise:suspended:{account_uid} = true
3. Gateway 鉴权时检查此标记 → 返回 402
4. 保留所有数据（技能、成员、Tunnel 配置）
```

#### 3.5.4 Gateway 侧企业拦截

在 `authenticate` 函数中增加企业状态检查：

```typescript
// src/index.ts — authenticate 函数扩展
async function authenticate(request: Request, env: Env): Promise<string | null> {
  // ... 现有签名验证逻辑 ...
  
  // 🆕 企业状态检查
  const profile = JSON.parse(await env.UNISKILL_KV.get(`user:profile:${uid}`));
  if (profile?.enterprise_uid) {
    const suspended = await env.UNISKILL_KV.get(`enterprise:suspended:${profile.enterprise_uid}`);
    if (suspended === 'true') {
      return null; // 等同于鉴权失败 → 返回 402
    }
  }
  
  return uid;
}
```

#### 3.5.5 UniSkill Admin 前端页面

独立的运营管理后台，与用户端 Dashboard 分离：

```
/admin                          → Admin 登录页（独立鉴权）
/admin/dashboard                → 运营仪表盘（总览：企业数、活跃数、收入、调用量）
/admin/enterprises              → 企业列表（可搜索、按状态筛选）
/admin/enterprises/[slug]       → 企业详情（基本信息、团队成员、技能列表、用量图表、审计日志）
/admin/enterprises/[slug]/edit  → 编辑企业信息
/admin/enterprises/new          → 开通新企业账号（表单 + 向导）
/admin/billing                  → 账单管理（生成月度账单、标记付款）
/admin/settings                → 运营人员管理（谁能访问 Admin Panel）
```

**Admin Dashboard 首页概览示例：**

```
┌─────────────────────────────────────────────────────────────┐
│  UniSkill Admin                                   [👤 运营]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ 12       │ │ 8        │ │ $3,240   │ │ 45.2k        │  │
│  │ 企业总数  │ │ 活跃企业  │ │ 月收入     │ │ 本月 API 调用 │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                             │
│  ┌─ 最近开通 ──────────────────────────────────────────┐   │
│  │ 知行科技      2026-05-20   Mode 1    $99/月  运营中  │   │
│  │ 云端数据      2026-05-18   Mode 1    $199/月  运营中  │   │
│  │ 极客网络      2026-05-15   Mode 2   $990/年   部署中  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ 待处理 ────────────────────────────────────────────┐   │
│  │ ⚠️ 星辰科技  信用点余额 < 10%               [充值]  │   │
│  │ ⚠️ 云端数据  Tunnel 断连超过 2 小时          [查看]  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ 开通新企业账号]                                          │
└─────────────────────────────────────────────────────────────┘
```

#### 3.5.6 运营端鉴权方案

运营端与用户端共用 Supabase，但需要额外鉴权层：

```typescript
// middleware.ts — 新增 admin 路由保护
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await getServerSession(authOptions);
    
    // 检查是否为 UniSkill 运营人员
    const supabase = createClient(...);
    const { data } = await supabase
      .from('profiles')
      .select('is_staff')
      .eq('user_uid', session?.user?.userUid)
      .single();
    
    if (!data?.is_staff) {
      return NextResponse.redirect('/unauthorized');
    }
  }
}
```

或在 `profiles` 表中新增：

```sql
ALTER TABLE profiles ADD COLUMN is_staff BOOLEAN DEFAULT false;
-- 只有 UniSkill 内部员工标记为 true
```

#### 3.5.7 开通企业账号的完整流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ UniSkill 运营 │     │  UniSkill    │     │  企业客户     │
│   (Admin)    │     │  System      │     │  (Customer)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. 创建企业账号     │                    │
       │──────────────────>│                    │
       │                    │                    │
       │                    │ 2. 自动创建 Team    │
       │                    │ 3. 创建初始 Admin   │
       │                    │ 4. 同步 Gateway KV  │
       │                    │                    │
       │ 5. 返回 onboard URL│                    │
       │<──────────────────│                    │
       │                    │                    │
       │ 6. 发送邀请邮件/链接│                    │
       │────────────────────────────────────────>│
       │                    │                    │
       │                    │  7. 企业管理员登录   │
       │                    │<───────────────────│
       │                    │                    │
       │                    │  8. 邀请团队成员     │
       │                    │  9. 创建团队技能     │
       │                    │  10. 配置 Tunnel     │
       │                    │                    │
       │ 11. 查看用量/审计   │                    │
       │<──────────────────│                    │
```

---

## 四、实施步骤（按优先级）

### Phase 0：运营管理端基础设施（Week 1）

> **优先级最高** — 没有管理端就无法开通企业客户

1. **数据库迁移**
   - 创建 `enterprise_accounts` 表
   - 创建 `teams`, `team_members`, `audit_logs`, `team_tunnels` 表
   - 扩展 `skills` 表（`team_uid`, `visibility`）
   - 扩展 `profiles` 表（`enterprise_uid`, `is_enterprise_admin`, `is_staff`）

2. **Admin API**
   - `/api/admin/enterprises` CRUD
   - `/api/admin/enterprises/[uid]/suspend` + `reactivate`
   - `/api/admin/enterprises/[uid]/onboarding`
   - 运营端鉴权 middleware

3. **Admin 前端**
   - `/admin/dashboard` 运营仪表盘
   - `/admin/enterprises` 企业列表
   - `/admin/enterprises/new` 开通新企业（向导式表单）
   - `/admin/enterprises/[slug]` 企业详情

### Phase 1：团队基础设施（Week 1-2）

4. **Gateway 改造**
   - `SkillKeys` 新增 `teamPrivate()`
   - `user:profile` KV 新增 `teams` + `enterprise_uid` 字段
   - `GET /v1/skills` 支持团队技能扫描
   - `MCPSession tools/list` 支持团队工具
   - 新增 `/v1/admin/sync_team_membership` 端点
   - 企业暂停拦截逻辑（检查 `enterprise:suspended:*` KV key）

5. **Web API（企业自服务）**
   - `/api/teams` CRUD
   - `/api/teams/[slug]/members` CRUD

### Phase 2：团队 Dashboard + Admin 用量监控（Week 2-3）

6. **前端页面（企业侧）**
   - `/dashboard/teams` 列表页
   - `/dashboard/teams/[slug]` 主页
   - `/dashboard/teams/[slug]/members` 成员管理
   - `UnifiedNavbar` 团队切换器
   - `CreateSkillClient` 支持团队技能

7. **前端页面（运营侧）**
   - `/admin/enterprises/[slug]/usage` 用量图表
   - `/admin/enterprises/[slug]/audit` 审计日志查看
   - `/admin/dashboard` 完善统计指标

### Phase 3：Tunnel 集成（Week 3-4）

8. **Tunnel 管理**
   - `/api/teams/[slug]/tunnels` API
   - `/dashboard/teams/[slug]/tunnels` 页面（企业侧）
   - `/admin/enterprises/[slug]/tunnels` 查看（运营侧）
   - Gateway 心跳端点 `/v1/tunnel/heartbeat`
   - 一键安装脚本生成

### Phase 4：审计与计费（Week 4）

9. **审计日志**
   - Gateway 端结构化日志写入
   - `/api/teams/[slug]/audit` API
   - `/dashboard/teams/[slug]/audit` 页面

10. **计费管理**
    - `/admin/billing` 账单管理页面
    - 月度账单生成（基于积分消耗）
    - 付款状态标记

---

## 五、关键设计决策

### 5.1 为什么用 team_uid 而不是复用 userUid？

团队和用户在概念上是不同实体：
- 用户可以属于多个团队
- 团队技能可以被多个成员调用
- KV key 隔离清晰：`skill:private:{userUid}` vs `skill:team:{teamUid}`
- 便于未来扩展（团队配额、团队计费）

### 5.2 团队技能如何命名（MCP tool name）？

当前个人私有技能：`{username}_{skillname}` (如 `alice_jira_search`)
团队技能建议：`team_{teamname}_{skillname}` (如 `team_acmecorp_jira_search`)

### 5.3 Cloudflare Tunnel 鉴权

Tunnel Token 由 Web 后端生成（随机 UUID），存储在 `team_tunnels.tunnel_token`（加密），Gateway 通过比对 `X-Tunnel-Token` header 验证心跳。

### 5.4 审计日志存储

首期使用 Supabase + BILLING_QUEUE 异步写入。不做实时查询（成本高），Dashboard 审计页从 Supabase 拉取（带分页、筛选）。

### 5.5 订阅/计费

模式一企业客户需 Enterprise 订阅（Tier = "ENTERPRISE"），在 profiles 表中新增 tier 值。创建团队时校验 tier 权限。

---

## 六、架构决策：Admin Panel 实现方式

**方案：集成在同一个 Next.js 应用中**（推荐）

```
uniskill-web/
├── src/app/
│   ├── dashboard/          ← 用户端
│   ├── admin/              ← 运营端（新增）
│   └── api/
│       ├── teams/           ← 企业 API
│       └── admin/           ← 运营 API（新增）
```

**理由：**
- 共用 Supabase client、认证体系、UI 组件库
- 避免维护两个独立项目的开销
- 通过 `is_staff` 字段 + middleware 实现路由级隔离
- 初期企业客户量不大，独立部署的必要性低

**未来拆分时机：** 运营端功能复杂到需要独立发布节奏时（通常 > 20 个 admin 页面），再拆分为 `uniskill-admin` 独立应用。

---

## 七、风险点与缓解

| 风险 | 缓解措施 |
|------|---------|
| KV key 数量膨胀（每个团队技能一个 key） | CF KV 免费 10 万 key，早期够用；后续可加缓存层 |
| Tunnel 稳定性 | 设计心跳 + 自动重连机制；Tunnel 断线时返回明确错误码而非超时 |
| 团队成员权限越权 | API 层双重校验：Next.js middleware + Gateway auth header |
| 审计日志量过大 | 按 team_uid 分区 + TTL 自动清理老旧日志 |
| 运营端误操作（误停企业账号） | 暂停操作需要二次确认 + 操作日志不可删除 |
| 企业数据隔离 | Gateway KV key 中 team_uid 天然隔离；Supabase RLS 按 enterprise_uid 策略 |
| Admin Panel 被未授权访问 | `is_staff` 手动设置（数据库层面），不通过注册流程；独立 middleware 校验 |

---

## 八、不在本次范围内的功能

以下功能属于模式二/三，或后续迭代，本次不做：

- Gateway 部署到企业 Cloudflare 账号（模式二）
- Docker 私有化部署（模式三）
- SSO/SAML 集成（企业管理员用 GitHub OAuth 过渡）
- 自定义域名
- 企业技能市场（跨企业共享）
- SLA 保障
- 自动化对账/发票系统（首期手动生成）
- Admin Panel 操作审计（谁在什么时候做了什么管理操作）— Phase 4 一并处理
