-- Migration: merge enterprise_accounts into teams
-- Phase 2 schema simplification

-- Step 1: Add enterprise-only columns to teams
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contract_start text,
  ADD COLUMN IF NOT EXISTS contract_end text,
  ADD COLUMN IF NOT EXISTS pricing_model text NOT NULL DEFAULT 'subscription';

-- Step 2: Copy data from enterprise_accounts to teams
UPDATE teams t
SET
  contact_email  = ea.contact_email,
  contract_start = ea.contract_start,
  contract_end   = ea.contract_end,
  pricing_model  = COALESCE(ea.pricing_model, 'subscription')
FROM enterprise_accounts ea
WHERE t.team_uid = ea.team_uid;

-- Step 3: Drop the now-redundant enterprise_accounts table
DROP TABLE IF EXISTS enterprise_accounts;

-- Step 4: Add team_uid index for admin queries (was on enterprise_accounts.account_uid)
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);
CREATE INDEX IF NOT EXISTS idx_teams_company_name ON teams(name);
