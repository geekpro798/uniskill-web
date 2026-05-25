-- 009: 团队邀请白名单 — 支持 Owner 添加邮箱白名单，用户注册后自动加入团队
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_uid TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by_uid TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(team_uid, email)
);

-- 索引：按邮箱查待处理邀请（用户注册时自动匹配）
CREATE INDEX IF NOT EXISTS idx_team_invitations_email_status ON team_invitations(email, status);

-- 索引：按团队查邀请列表
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_uid ON team_invitations(team_uid);
