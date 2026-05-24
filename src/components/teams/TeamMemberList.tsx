// src/components/teams/TeamMemberList.tsx
// 团队成员列表

import React from 'react';
import { Crown, UserCog, Eye } from 'lucide-react';
import type { TeamMember } from '@/types/teams';

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-purple-500' },
  admin: { label: 'Admin', icon: UserCog, color: 'text-blue-500' },
  member: { label: 'Member', icon: Eye, color: 'text-slate-400' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-slate-400' },
};

export function TeamMemberList({ members }: { members: TeamMember[] }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
          团队成员 ({members.length})
        </h2>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {members.map((m) => {
          const config = ROLE_CONFIG[m.role] || ROLE_CONFIG.member;
          const Icon = config.icon;
          return (
            <div
              key={m.user_uid}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt=""
                    className="w-9 h-9 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {(m.username || m.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {m.username || m.email || '未命名'}
                  </div>
                  {m.email && m.username && (
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {m.email}
                    </div>
                  )}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
