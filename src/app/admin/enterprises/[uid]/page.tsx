'use client';

// src/app/admin/enterprises/[uid]/page.tsx
// 企业详情页

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Users, Zap, Activity,
  PauseCircle, PlayCircle, Settings, Loader2,
  Globe, Wifi, WifiOff, Clock, AlertCircle,
  CheckCircle2, Shield, ExternalLink, Copy,
} from 'lucide-react';

export default function EnterpriseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params?.uid as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (uid) fetchData();
  }, [uid]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/admin/enterprises/${uid}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch enterprise:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend() {
    if (!confirm('确认暂停该企业？暂停后所有成员将无法调用技能。')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/enterprises/${uid}/suspend`, { method: 'POST' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/enterprises/${uid}/reactivate`, { method: 'POST' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data?.enterprise) {
    return (
      <div className="text-center py-24">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          企业不存在
        </h2>
        <Link href="/admin/enterprises" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
          返回列表
        </Link>
      </div>
    );
  }

  const { enterprise, team, stats, members, recentAudit, tunnels } = data;

  const onboardingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/teams/${team?.slug}`;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/enterprises"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </Link>

      {/* Hero card */}
      <div
        className="rounded-2xl border p-6 md:p-8"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0">
              {enterprise.company_name?.charAt(0) || '?'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                  {enterprise.company_name}
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    enterprise.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : enterprise.status === 'suspended'
                      ? 'bg-red-500/10 text-red-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {enterprise.status === 'active' ? '运营中' : enterprise.status === 'suspended' ? '已暂停' : enterprise.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {enterprise.plan?.toUpperCase()}
                </span>
                <span>${enterprise.monthly_fee_usd}/月</span>
                <span>开通于 {new Date(enterprise.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
              {enterprise.contact_email && (
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  联系人: {enterprise.contact_name || '—'} · {enterprise.contact_email}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Onboarding URL copy */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(onboardingUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all hover:bg-slate-50"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制 Onboarding URL'}
            </button>

            {enterprise.status === 'active' ? (
              <button
                onClick={handleSuspend}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-red-500/30 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <PauseCircle className="w-4 h-4" />
                暂停
              </button>
            ) : enterprise.status === 'suspended' ? (
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" />
                重新激活
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {[
            { label: '成员', value: stats.memberCount, sub: `/ ${enterprise.max_members}`, icon: Users, color: 'blue' },
            { label: '技能', value: stats.skillCount, sub: `/ ${enterprise.max_skills}`, icon: Zap, color: 'purple' },
            { label: 'Tunnel', value: `${stats.activeTunnels}/${stats.tunnelCount}`, sub: '活跃/总数', icon: Wifi, color: 'emerald' },
            { label: '月积分上限', value: enterprise.max_credits_month?.toLocaleString(), sub: '', icon: Activity, color: 'amber' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                {item.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {item.label} {item.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Members + Recent Audit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Users className="w-4 h-4" /> 成员 ({members?.length || 0})
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {members?.length > 0 ? members.map((m: any) => (
                <div key={m.user_uid} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                      {m.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {m.username || m.email || m.user_uid?.slice(0, 8)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {m.email || '—'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      m.role === 'owner'
                        ? 'bg-amber-500/10 text-amber-600'
                        : m.role === 'admin'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {m.role}
                  </span>
                </div>
              )) : (
                <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  暂无成员
                </div>
              )}
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Clock className="w-4 h-4" /> 最近操作
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {recentAudit?.length > 0 ? recentAudit.map((log: any) => (
                <div key={log.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        log.action?.includes('suspend')
                          ? 'bg-red-500/10 text-red-600'
                          : log.action?.includes('create')
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {log.details?.company_name || log.resource_id?.slice(0, 8) || '—'}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              )) : (
                <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  暂无操作记录
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Tunnels + Info */}
        <div className="space-y-6">
          {/* Tunnel Status */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Globe className="w-4 h-4" /> Tunnel 状态
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {tunnels?.length > 0 ? tunnels.map((t: any) => (
                <div key={t.id} className="px-5 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {t.tunnel_name}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-bold ${
                      t.status === 'active' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {t.status === 'active' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                    {t.internal_domain}
                  </div>
                  {t.last_heartbeat && (
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      最后心跳: {new Date(t.last_heartbeat).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              )) : (
                <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  暂无 Tunnel 配置
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div
            className="rounded-2xl border p-5 space-y-3"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
              基本信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Team Slug</span>
                <span className="font-mono font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>
                  {team?.slug}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>定价模式</span>
                <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {enterprise.pricing_model === 'subscription' ? '订阅制' : enterprise.pricing_model}
                </span>
              </div>
              {enterprise.contract_start && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>合同周期</span>
                  <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {enterprise.contract_start} ~ {enterprise.contract_end || '—'}
                  </span>
                </div>
              )}
            </div>
            {enterprise.notes && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  备注
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {enterprise.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
