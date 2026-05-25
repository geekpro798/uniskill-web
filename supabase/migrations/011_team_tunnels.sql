-- supabase/migrations/011_team_tunnels.sql
-- Cloudflare Tunnel 集成：团队专属隧道管理

CREATE TABLE IF NOT EXISTS team_tunnels (
  id BIGSERIAL PRIMARY KEY,
  team_uid UUID NOT NULL REFERENCES teams(team_uid) ON DELETE CASCADE,
  tunnel_name TEXT NOT NULL,
  cf_tunnel_id TEXT NOT NULL,
  cf_token TEXT NOT NULL,
  cname TEXT NOT NULL,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_tunnels_team ON team_tunnels(team_uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_tunnels_cf_id ON team_tunnels(cf_tunnel_id);
