-- Supabase Migration: UniSkill — 扩展 teams 表字段
-- 添加 created_by / status / plan，与企业账号表对齐

-- 1. teams 表添加 created_by
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. teams 表添加 status
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('lead', 'active', 'suspended', 'cancelled'));

-- 3. teams 表添加 plan
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'mode1' CHECK (plan IN ('mode1', 'mode2', 'mode3'));
