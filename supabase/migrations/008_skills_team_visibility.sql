-- 008: skills 表扩展 — 团队技能 + 可见性
-- 支持个人技能 (owner_uid) 与团队技能 (team_uid) 共存

ALTER TABLE skills ADD COLUMN IF NOT EXISTS team_uid  TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public'));

-- 索引：按团队查询技能
CREATE INDEX IF NOT EXISTS idx_skills_team_uid ON skills(team_uid);

-- 现有数据回填：没有 team_uid 的就是个人技能，visibility 按 status 推导
UPDATE skills SET visibility = CASE
  WHEN status = 'Community' THEN 'public'
  ELSE 'private'
END
WHERE visibility IS NULL OR visibility = '';
