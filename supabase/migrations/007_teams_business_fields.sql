-- 007: teams 表补齐所有业务字段（合并 003+006+007，一份完整补齐）
-- 运营字段（003）
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_by       TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'active' CHECK (status IN ('lead','active','suspended','cancelled'));
ALTER TABLE teams ADD COLUMN IF NOT EXISTS plan             TEXT DEFAULT 'mode1' CHECK (plan IN ('mode1','mode2','mode3'));

-- 管理员凭证（006）
ALTER TABLE teams ADD COLUMN IF NOT EXISTS admin_email      TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS password_hash    TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS admin_uid        TEXT;

-- 联系信息
ALTER TABLE teams ADD COLUMN IF NOT EXISTS contact_name     TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS contact_phone    TEXT;

-- 配额上限
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_members       INTEGER DEFAULT 50;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_skills        INTEGER DEFAULT 100;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_credits_month INTEGER DEFAULT 100000;

-- 计费
ALTER TABLE teams ADD COLUMN IF NOT EXISTS monthly_fee_usd   INTEGER DEFAULT 99;

-- 备注
ALTER TABLE teams ADD COLUMN IF NOT EXISTS notes             TEXT;
