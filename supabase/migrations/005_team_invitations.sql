-- Supabase Migration: UniSkill Phase 2 — Team Invitations
-- 团队邀请表：支持通过邀请链接自助加入团队

CREATE TABLE IF NOT EXISTS team_invitations (
  id            BIGSERIAL PRIMARY KEY,
  token         TEXT UNIQUE NOT NULL,
  team_uid      UUID NOT NULL REFERENCES teams(team_uid) ON DELETE CASCADE,
  created_by    UUID NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'viewer')),
  max_uses      INTEGER DEFAULT 0,       -- 0 = unlimited
  use_count     INTEGER DEFAULT 0,
  expires_at    TIMESTAMPTZ,             -- NULL = never expires
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_uid ON team_invitations(team_uid);
