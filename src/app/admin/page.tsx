'use client';

// src/app/admin/page.tsx
// UniSkill Admin Dashboard — 运营仪表盘

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Activity, TrendingUp, Users,
  Zap, ArrowUpRight, PlusCircle, Loader2,
} from 'lucide-react';

interface DashboardStats {
  totalEnterprises: number;
  activeEnterprises: number;
  leadEnterprises: number;
  suspendedEnterprises: number;
  monthlyRevenue: number;
  recentEnterprises: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/teams?limit=5');
      const data = await res.json();

      if (data.data) {
        const all = data.data;
        setStats({
          totalEnterprises: all.length,
          activeEnterprises: all.filter((e: any) => e.status === 'active').length,
          leadEnterprises: all.filter((e: any) => e.status === 'lead').length,
          suspendedEnterprises: all.filter((e: any) => e.status === 'suspended').length,
          monthlyRevenue: 0, // TODO: 后续接入真实月收入统计
          recentEnterprises: all.slice(0, 5),
        });
      }
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const statCards = [
    {
      label: '企业总数',
      value: stats?.totalEnterprises ?? 0,
      icon: Building2,
      color: 'blue',
    },
    {
      label: '运行中',
      value: stats?.activeEnterprises ?? 0,
      icon: Activity,
      color: 'emerald',
    },
    {
      label: '月收入 (USD)',
      value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'purple',
    },
    {
      label: '待处理',
      value: stats?.leadEnterprises ?? 0,
      icon: Users,
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            运营仪表盘
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            UniSkill 企业客户概览
          </p>
        </div>
        <Link
          href="/admin/teams/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          开通新企业
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border p-6 transition-all"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${card.color}-500/10`}
              >
                <card.icon className={`w-5 h-5 text-${card.color}-500`} />
              </div>
            </div>
            <div className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>
              {card.value}
            </div>
            <div className="text-xs font-bold mt-1 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Enterprises */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
            最近开通
          </h2>
          <Link
            href="/admin/teams"
            className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
          >
            查看全部 <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {stats?.recentEnterprises?.length ? (
            stats.recentEnterprises.map((e: any) => (
              <Link
                key={e.team_uid}
                href={`/admin/teams/${e.team_uid}`}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
                    {e.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {e.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {e.plan?.toUpperCase()} · ${e.monthly_fee_usd}/月
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      e.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : e.status === 'lead'
                        ? 'bg-amber-500/10 text-amber-600'
                        : e.status === 'suspended'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {e.status}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(e.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              暂无企业记录 —
              <Link href="/admin/teams/new" className="text-blue-500 font-bold ml-1 hover:underline">
                开通第一个企业
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
