'use client';

/**
 * /admin/skills — 社区技能治理监控台
 * 功能：列出社区技能，支持按状态过滤，提供下架/恢复操作
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe, Flag, Ban, CheckCircle2, Loader2,
  Search, AlertTriangle, RotateCcw, ChevronRight,
  MessageSquareWarning, Eye
} from 'lucide-react';

type SkillStatus = 'all' | 'Community' | 'Flagged' | 'Suspended';

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SkillStatus>('all');
  const [search, setSearch] = useState('');
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSkills();
  }, [activeTab, search]);

  async function fetchSkills() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        ...(search ? { search } : {}),
        limit: '50',
      });
      const res = await fetch(`/api/admin/skills?${params}`);
      const data = await res.json();
      setSkills(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error('Failed to fetch skills:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend(skill: any) {
    if (!suspendReason.trim()) return;
    setActionLoading(skill.skill_uid);
    try {
      const res = await fetch(`/api/admin/skills/${skill.skill_uid}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspendReason }),
      });
      if (res.ok) {
        setSuspendTarget(null);
        setSuspendReason('');
        fetchSkills();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestore(skill: any) {
    setActionLoading(skill.skill_uid);
    try {
      const res = await fetch(`/api/admin/skills/${skill.skill_uid}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Restored by admin' }),
      });
      if (res.ok) fetchSkills();
    } finally {
      setActionLoading(null);
    }
  }

  const tabs: { key: SkillStatus; label: string; icon: any; color: string }[] = [
    { key: 'all',       label: 'All Community', icon: Globe,            color: 'text-slate-500' },
    { key: 'Flagged',   label: 'Flagged',        icon: Flag,             color: 'text-orange-500' },
    { key: 'Suspended', label: 'Suspended',      icon: Ban,              color: 'text-red-500' },
    { key: 'Community', label: 'Live',           icon: CheckCircle2,     color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Community Skills
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and govern published skills · {total} total
          </p>
        </div>
        <Link
          href="/admin/skills/reports"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 text-sm font-bold hover:bg-orange-500/15 transition-all"
        >
          <MessageSquareWarning size={16} />
          View Reports
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} className={activeTab === tab.key ? tab.color : ''} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : skills.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            No skills found.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
              <tr>
                <th className="px-6 py-3 tracking-widest">Skill</th>
                <th className="px-6 py-3 tracking-widest">Status</th>
                <th className="px-6 py-3 tracking-widest text-center">Calls</th>
                <th className="px-6 py-3 tracking-widest text-center">Reports</th>
                <th className="px-6 py-3 tracking-widest text-center">AI Risk</th>
                <th className="px-6 py-3 tracking-widest">Published</th>
                <th className="px-6 py-3 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {skills.map(skill => (
                <tr
                  key={skill.skill_uid}
                  className={`transition-colors ${
                    skill.status === 'Flagged'
                      ? 'bg-orange-500/[0.03] hover:bg-orange-500/[0.06]'
                      : skill.status === 'Suspended'
                        ? 'bg-red-500/[0.03] hover:bg-red-500/[0.06]'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/20'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{skill.emoji ?? '⚙️'}</span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {skill.display_name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {skill.skill_name}
                        </div>
                        {skill.suspend_reason && (
                          <div className="text-[9px] text-red-400 mt-0.5 italic">
                            ↳ {skill.suspend_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                      skill.status === 'Community'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : skill.status === 'Flagged'
                          ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {skill.status === 'Flagged' ? <Flag size={9} />
                        : skill.status === 'Suspended' ? <Ban size={9} />
                        : <CheckCircle2 size={9} />}
                      {skill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-mono font-bold text-slate-600 dark:text-slate-300">
                    {(skill.total_calls ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {skill.pending_reports > 0 ? (
                      <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-500 text-[10px] font-black border border-orange-500/20">
                        {skill.pending_reports}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {skill.ai_risk_score != null ? (
                      <span className={`text-xs font-black ${
                        skill.ai_risk_score > 0.8 ? 'text-red-500'
                          : skill.ai_risk_score > 0.5 ? 'text-orange-400'
                          : 'text-emerald-500'
                      }`}>
                        {Math.round(skill.ai_risk_score * 100)}%
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px]">pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {skill.published_at
                      ? new Date(skill.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* View */}
                      <a
                        href={`/skills/${skill.skill_name}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                        title="View in community"
                      >
                        <Eye size={14} />
                      </a>

                      {/* Restore (for Suspended/Flagged) */}
                      {['Suspended', 'Flagged'].includes(skill.status) && (
                        <button
                          onClick={() => handleRestore(skill)}
                          disabled={actionLoading === skill.skill_uid}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all disabled:opacity-40"
                          title="Restore to Community"
                        >
                          {actionLoading === skill.skill_uid
                            ? <Loader2 size={14} className="animate-spin" />
                            : <RotateCcw size={14} />}
                        </button>
                      )}

                      {/* Suspend (for Community/Flagged) */}
                      {['Community', 'Flagged'].includes(skill.status) && (
                        <button
                          onClick={() => setSuspendTarget(skill)}
                          disabled={actionLoading === skill.skill_uid}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black hover:bg-red-500/20 transition-all disabled:opacity-40"
                        >
                          <Ban size={12} /> Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Suspend Modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSuspendTarget(null)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Suspend Skill</h3>
                <p className="text-xs text-slate-400">{suspendTarget.display_name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              This skill will be immediately removed from the community. The creator will see your reason.
            </p>
            <textarea
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension (required)..."
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSuspendTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(suspendTarget)}
                disabled={!suspendReason.trim() || actionLoading === suspendTarget.skill_uid}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-black transition-all"
              >
                {actionLoading === suspendTarget.skill_uid
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Ban size={14} />}
                Confirm Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
