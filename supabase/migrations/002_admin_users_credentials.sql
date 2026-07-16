-- Supabase Migration: UniSkill Admin Users — Email + Password Auth
-- 扩展 admin_users 表，支持邮箱+密码登录

-- 1. 添加新列
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS email         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone         VARCHAR(30),
  ADD COLUMN IF NOT EXISTS status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'disabled')),
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by    UUID,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT now();

-- 2. email 设为 UNIQUE（如果还没加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_email_key'
  ) THEN
    ALTER TABLE admin_users ADD CONSTRAINT admin_users_email_key UNIQUE (email);
  END IF;
END $$;

-- 3. 创建新索引
CREATE INDEX IF NOT EXISTS idx_admin_users_email  ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

-- 4. 保留旧的 user_uid 唯一约束（可变更为可空）
-- 注意：由于现有数据行有 user_uid 值，不强制改 NOT NULL，后续新行可以不填 user_uid
ALTER TABLE admin_users ALTER COLUMN user_uid DROP NOT NULL;

-- 5. 更新种子用户：设置 email 和 status
UPDATE admin_users
SET email  = 'sunzekun@uniskill.ai',
    status = 'active'
WHERE user_uid = '48d14b3e-a928-4bb5-b337-d85e1626ccfa'
  AND email IS NULL;
