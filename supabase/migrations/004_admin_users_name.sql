-- Supabase Migration: UniSkill — admin_users 添加 name 字段

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS name TEXT;
