-- Supabase Migration: 010_team_credits.sql
-- 团队独立信用额度 + team_uid 审计追踪 + 团队扣费 RPC
-- name → team_name 重命名 + team_invitations 合并进 team_members

-- ============================================================
-- 0. teams 表加固
-- ============================================================

-- 0.1 name 列重命名为 team_name
ALTER TABLE teams RENAME COLUMN name TO team_name;
ALTER INDEX IF EXISTS idx_teams_company_name RENAME TO idx_teams_team_name;

-- 0.2 团队独立 credits
ALTER TABLE teams ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- ============================================================
-- 1. credit_events 审计增强
-- ============================================================

ALTER TABLE credit_events ADD COLUMN IF NOT EXISTS team_uid TEXT;
CREATE INDEX IF NOT EXISTS idx_credit_events_team_uid ON credit_events(team_uid);

-- ============================================================
-- 2. team_members 补全 — 合并 team_invitations 的字段
--    通过 status 区分：pending（邀请中）/ active（已加入）/ cancelled / rejected
-- ============================================================

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS invited_by_uid TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- 防止同一邮箱重复邀请
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_pending_email
  ON team_members(team_uid, email)
  WHERE status = 'pending';

-- ============================================================
-- 3. 数据迁移：team_invitations → team_members
-- ============================================================

INSERT INTO team_members (team_uid, email, role, invited_by_uid, status, created_at, accepted_at)
SELECT team_uid, email, role, invited_by_uid, status, created_at, accepted_at
FROM team_invitations
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm
  WHERE tm.team_uid = team_invitations.team_uid
    AND tm.email = team_invitations.email
    AND tm.status = 'pending'
);

-- ============================================================
-- 4. 清理旧表
-- ============================================================

DROP TABLE IF EXISTS team_invitations;

-- ============================================================
-- 5. RPC: record_team_skill_usage — 从团队 credits 扣费
-- ============================================================

CREATE OR REPLACE FUNCTION record_team_skill_usage(
  p_user_uid         TEXT,
  p_team_uid         TEXT,
  p_skill_name       TEXT,
  p_payment_type     TEXT DEFAULT 'credits',
  p_request_id       TEXT DEFAULT NULL,
  p_cost             INTEGER DEFAULT 0,
  p_status_code      INTEGER DEFAULT 200,
  p_execution_status TEXT DEFAULT 'SUCCESS',
  p_error_message    TEXT DEFAULT NULL,
  p_latency_ms       INTEGER DEFAULT 0,
  p_metadata         JSONB DEFAULT '{}',
  p_display_name     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits     INTEGER;
  v_event_id        BIGINT;
BEGIN
  SELECT credits INTO v_current_credits
  FROM teams
  WHERE team_uid = p_team_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team not found');
  END IF;

  IF p_execution_status = 'SUCCESS' AND p_cost > 0 THEN
    IF v_current_credits < p_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient team credits', 'credits', v_current_credits);
    END IF;

    v_new_credits := v_current_credits - p_cost;

    UPDATE teams SET credits = v_new_credits WHERE team_uid = p_team_uid;
  ELSE
    v_new_credits := v_current_credits;
  END IF;

  INSERT INTO credit_events (
    user_uid, team_uid, request_id, skill_name, amount, created_at
  ) VALUES (
    p_user_uid, p_team_uid, p_request_id, p_skill_name, -p_cost, now()
  )
  RETURNING id INTO v_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_event_id,
    'credits_before', v_current_credits,
    'credits_after', v_new_credits,
    'cost', p_cost
  );
END;
$$;
