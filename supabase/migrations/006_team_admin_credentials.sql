-- 006: teams 表增加企业管理员邮箱和密码
ALTER TABLE teams ADD COLUMN admin_email TEXT;
ALTER TABLE teams ADD COLUMN password_hash TEXT;
ALTER TABLE teams ADD COLUMN admin_uid TEXT;
-- admin_uid 是该管理员的唯一标识，用于关联 team_members
