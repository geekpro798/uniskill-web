'use client';

/**
 * /admin/skills/reports — 社区举报处理面板
 * 功能：按技能聚合展示所有 pending 举报，支持「确认下架」和「驳回无效」操作
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquareWarning, Flag, CheckCircle2, XCircle,
  Loader2, Search, ChevronLeft, Ban, Eye, AlertTriangle
} from 'lucide-react';

const REPORT_TYPE_LABELS: Record<string, string> = {
  spam:           '垃圾/广告',
  malicious_code: '恶意代码',
  copyright:      '版权侵权',
  other:          '其他',
};

export default function AdminSkillReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendModal, setSuspendModal] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      // 复用 admin/skills API，过滤有举报的技能
      const res = await fetch('/api/admin/skills?status=all&limit=100');
      const data = await res.json();
      // 只保留有 pending_reports 的技能，按举报数降序
      const withReports = (data.data ?? [])
        .filter((s: any) => s.pending_reports > 0)
        .sort((a: any, b: any) => b.pending_reports - a.pending_reports);
      setReports(withReports);
    } catch (e) {
      console.error('Failed to fetch reports:', e);
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
        setSuspendModal(null);
        setSuspendReason('');
        fetchReports();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDismiss(skill: any) {
    // 驳回举报：恢复为 Community（如果已是 Flagged）
    setActionLoading(skill.skill_uid);
    try {
      await fetch(`/api/admin/skills/${skill.skill_uid}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Reports dismissed by admin — no violation found' }),
      });
      fetchReports();
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = reports.filter(s =>
    !search ||
    s.skill_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/skills"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <MessageSquareWarning className="text-orange-500" size={24} />
            举报处理
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '加载中...' : `${filtered.length} 个技能有待处理举报`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="搜索技能名称..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-500">
            {search ? '未找到匹配的技能' : '暂无待处理举报，社区状态良好 ✓'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(skill => (
            <div
              key={skill.skill_uid}
              className={`bg-white dark:bg-slate-800/50 border rounded-2xl overflow-hidden transition-all ${
                skill.status === 'Flagged'
                  ? 'border-orange-500/30 shadow-orange-500/5 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Skill Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{skill.emoji ?? '⚙️'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white">
                        {skill.display_name}
                      </span>
                      {skill.status === 'Flagged' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] font-black">
                          <Flag size={9} /> FLAGGED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {skill.skill_name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* 举报计数 */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <MessageSquareWarning size={14} className="text-orange-500" />
                    <span className="text-sm font-black text-orange-500">
                      {skill.pending_reports} 条举报
                    </span>
                  </div>

                  {/* AI 风险分 */}
                  {skill.ai_risk_score != null && (
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-black ${
                      skill.ai_risk_score > 0.8
                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                        : skill.ai_risk_score > 0.5
                          ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                      AI 风险 {Math.round(skill.ai_risk_score * 100)}%
                    </div>
                  )}

                  {/* 查看 */}
                  <a
                    href={`/skills/${skill.skill_name}`}
                    target="_blank"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-500/30 transition-all"
                    title="在社区查看"
                  >
                    <Eye size={16} />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 dark:bg-slate-900/20">
                <p className="text-xs text-slate-400">
                  发布于 {skill.published_at
                    ? new Date(skill.published_at).toLocaleDateString('zh-CN')
                    : '未知'}
                  {' · '}总调用 {(skill.total_calls ?? 0).toLocaleString()} 次
                </p>

                <div className="flex items-center gap-3">
                  {/* 驳回举报 */}
                  <button
                    onClick={() => handleDismiss(skill)}
                    disabled={actionLoading === skill.skill_uid}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 hover:border-emerald-500/30 text-sm font-bold transition-all disabled:opacity-40"
                  >
                    {actionLoading === skill.skill_uid
                      ? <Loader2 size={14} className="animate-spin" />
                      : <XCircle size={14} />}
                    驳回举报（无违规）
                  </button>

                  {/* 确认下架 */}
                  <button
                    onClick={() => { setSuspendModal(skill); setSuspendReason(''); }}
                    disabled={actionLoading === skill.skill_uid}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-black transition-all shadow-lg shadow-red-500/20 disabled:opacity-40"
                  >
                    <Ban size={14} />
                    确认下架
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSuspendModal(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">确认下架</h3>
                <p className="text-xs text-slate-400">{suspendModal.display_name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              技能将立即从社区广场移除，创建者可在 My Skills 看到下架原因。
            </p>
            <textarea
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="下架原因（必填，创建者可见）..."
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSuspendModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => handleSuspend(suspendModal)}
                disabled={!suspendReason.trim() || actionLoading === suspendModal.skill_uid}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-black transition-all"
              >
                {actionLoading === suspendModal.skill_uid
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Ban size={14} />}
                确认下架
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
