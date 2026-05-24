// src/types/teams.ts
// Phase 2: 团队功能共享类型定义

export interface TeamInfo {
  team_uid: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  logo_url: string | null;
  admin_email?: string | null;
  admin_uid?: string | null;
  contact_email?: string | null;
  contract_start?: string | null;
  contract_end?: string | null;
  pricing_model?: string;
  created_at: string;
  member_count?: number;
  contact_name?: string | null;
  contact_phone?: string | null;
  max_members?: number;
  max_skills?: number;
  max_credits_month?: number;
  monthly_fee_usd?: number;
  notes?: string | null;
}

export interface TeamMember {
  user_uid: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  name?: string | null;
}
