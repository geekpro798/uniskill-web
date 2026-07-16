-- Supabase Migration: Community Publish Flow (Phase 1)
-- 社区发布功能：扩展 skills 表 + 新增日志/举报表

-- ─────────────────────────────────────────────
-- 1. 扩展 skills 表：新增社区治理相关字段
-- ─────────────────────────────────────────────
DO $$
BEGIN
  -- 首次发布到社区的时间
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skills' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE skills ADD COLUMN published_at TIMESTAMPTZ;
  END IF;

  -- AI 抽检风险评分（0～1，越高越危险）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skills' AND column_name = 'ai_risk_score'
  ) THEN
    ALTER TABLE skills ADD COLUMN ai_risk_score FLOAT;
  END IF;

  -- 最近一次 AI 抽检时间
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skills' AND column_name = 'ai_checked_at'
  ) THEN
    ALTER TABLE skills ADD COLUMN ai_checked_at TIMESTAMPTZ;
  END IF;

  -- 下架原因（管理员填写，仅创建者可见）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skills' AND column_name = 'suspend_reason'
  ) THEN
    ALTER TABLE skills ADD COLUMN suspend_reason TEXT;
  END IF;

  -- 账号注销孤儿化标记：true 时作者显示为 Anonymous
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skills' AND column_name = 'owner_anonymous'
  ) THEN
    ALTER TABLE skills ADD COLUMN owner_anonymous BOOLEAN DEFAULT false;
  END IF;
END $$;

-- skills.status 新增取值说明（枚举依赖应用层控制，无数据库 ENUM 约束）
-- 原有：'Official' | 'Community' | 'Private' | 'Team'
-- 新增：'Flagged'    — 被 AI 或举报标记，待管理员处理（技术上仍可服务）
--       'Suspended'  — 管理员手动下架，广场不可见，API 拒绝调用

-- ─────────────────────────────────────────────
-- 2. 发布操作日志表
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_publish_log (
  id          BIGSERIAL PRIMARY KEY,
  skill_uid   UUID REFERENCES skills(skill_uid) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN
              ('publish', 'unpublish', 'suspend', 'restore', 'flag')),
  actor_uid   UUID,       -- 操作人（创建者 or 管理员）
  note        TEXT,       -- 原因备注（下架/标记时填写）
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publish_log_skill    ON community_publish_log(skill_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publish_log_actor    ON community_publish_log(actor_uid);
CREATE INDEX IF NOT EXISTS idx_publish_log_action   ON community_publish_log(action);

-- ─────────────────────────────────────────────
-- 3. 社区举报表
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_reports (
  id              BIGSERIAL PRIMARY KEY,
  skill_uid       UUID REFERENCES skills(skill_uid) ON DELETE CASCADE,
  reporter_uid    UUID NOT NULL,
  report_type     TEXT NOT NULL CHECK (report_type IN
                  ('spam', 'malicious_code', 'copyright', 'other')),
  description     TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN
                  ('pending', 'confirmed', 'dismissed')),
  reviewed_by     UUID,           -- 处理该举报的管理员
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  -- 同一用户对同一技能只能举报一次
  UNIQUE (skill_uid, reporter_uid)
);

CREATE INDEX IF NOT EXISTS idx_reports_skill    ON skill_reports(skill_uid);
CREATE INDEX IF NOT EXISTS idx_reports_status   ON skill_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON skill_reports(reporter_uid);
