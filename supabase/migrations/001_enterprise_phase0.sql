-- Supabase Migration: UniSkill Enterprise Mode 1 — Phase 0
-- 创建企业/团队/审计核心表结构

-- 1. teams（团队/组织）
CREATE TABLE IF NOT EXISTS teams (
  id          BIGSERIAL PRIMARY KEY,
  team_uid    UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);

-- 2. team_members（团队成员）
CREATE TABLE IF NOT EXISTS team_members (
  id          BIGSERIAL PRIMARY KEY,
  team_uid    UUID REFERENCES teams(team_uid) ON DELETE CASCADE,
  user_uid    UUID NOT NULL,
  role        TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at   TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_unique ON team_members(team_uid, user_uid);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_uid);

-- 3. audit_logs（审计日志）
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  team_uid      UUID REFERENCES teams(team_uid) ON DELETE SET NULL,
  enterprise_uid UUID,
  user_uid      UUID,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  details       JSONB DEFAULT '{}',
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_team ON audit_logs(team_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_enterprise ON audit_logs(enterprise_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- 4. team_tunnels（Cloudflare Tunnel 配置）
CREATE TABLE IF NOT EXISTS team_tunnels (
  id              BIGSERIAL PRIMARY KEY,
  team_uid        UUID REFERENCES teams(team_uid) ON DELETE CASCADE,
  tunnel_name     TEXT NOT NULL,
  tunnel_id       TEXT,
  tunnel_token    TEXT,
  internal_domain TEXT NOT NULL,
  public_hostname TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','error','disconnected')),
  last_heartbeat  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tunnels_team ON team_tunnels(team_uid);

-- 5. enterprise_accounts（企业账号 — UniSkill 运营端）
CREATE TABLE IF NOT EXISTS enterprise_accounts (
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

  max_members       INTEGER DEFAULT 50,
  max_skills        INTEGER DEFAULT 100,
  max_credits_month INTEGER DEFAULT 100000,

  contract_start    DATE,
  contract_end      DATE,
  pricing_model     TEXT DEFAULT 'subscription',
  monthly_fee_usd   INTEGER DEFAULT 99,

  notes             TEXT,
  created_by        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enterprise_status ON enterprise_accounts(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_slug ON enterprise_accounts(company_slug);

-- 6. 扩展 profiles 表（使用 DO 块安全添加列）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='enterprise_uid') THEN
    ALTER TABLE profiles ADD COLUMN enterprise_uid UUID REFERENCES enterprise_accounts(account_uid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_enterprise_admin') THEN
    ALTER TABLE profiles ADD COLUMN is_enterprise_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 6b. admin_users（运营人员 — 独立于 profiles 表）
CREATE TABLE IF NOT EXISTS admin_users (
  id          BIGSERIAL PRIMARY KEY,
  user_uid    UUID NOT NULL UNIQUE,  -- 关联 profiles.user_uid（通过 GitHub OAuth 登录）
  role        TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  added_by    UUID,                  -- 谁添加的（user_uid）
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_users_uid ON admin_users(user_uid);

-- 种子：初始超级管理员（你的 user_uid）
INSERT INTO admin_users (user_uid, role)
VALUES ('48d14b3e-a928-4bb5-b337-d85e1626ccfa', 'super_admin')
ON CONFLICT (user_uid) DO NOTHING;

-- 7. 扩展 skills 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skills' AND column_name='team_uid') THEN
    ALTER TABLE skills ADD COLUMN team_uid UUID REFERENCES teams(team_uid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skills' AND column_name='visibility') THEN
    ALTER TABLE skills ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_skills_team ON skills(team_uid);
