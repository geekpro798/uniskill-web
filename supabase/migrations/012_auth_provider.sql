-- supabase/migrations/012_auth_provider.sql
-- 为 profiles 增加 auth_provider 字段，区分用户来源渠道

-- Step 1: 加字段（可空，存量刷完后再 NOT NULL）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT;

-- Step 2: 刷存量数据
-- GitHub OAuth 用户：github_id 为纯数字
UPDATE profiles
SET auth_provider = 'github'
WHERE github_id ~ '^[0-9]+$'
  AND auth_provider IS NULL;

-- 团队/邮箱登录用户（自愈补建的 profile）：github_id 格式为 email:xxx
UPDATE profiles
SET auth_provider = 'email_otp'
WHERE github_id LIKE 'email:%'
  AND auth_provider IS NULL;

-- Step 3: 兜底 — 剩余未匹配的标记为 unknown（理论上不应该有）
UPDATE profiles
SET auth_provider = 'unknown'
WHERE auth_provider IS NULL;

-- Step 4: 设为 NOT NULL + 默认值
ALTER TABLE profiles ALTER COLUMN auth_provider SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN auth_provider SET DEFAULT 'github';

-- Step 5: 索引（方便管理后台筛选）
CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON profiles(auth_provider);
