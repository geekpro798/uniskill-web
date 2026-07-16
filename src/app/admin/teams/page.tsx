'use client';

// src/app/admin/teams/page.tsx
// 企业管理列表页

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, PlusCircle, ChevronRight,
  Building2, Loader2, Filter, Edit3,
} from 'lucide-react';

export default function EnterprisesListPage() {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ hasMore: false });

  const fetchEnterprises = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/admin/teams?${params}`, { signal });
      const data = await res.json();

      if (data.data) {
        setEnterprises(data.data);
        setPagination(data.pagination);
        setCurrentRole(data.currentRole || null);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Failed to fetch enterprises:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const controller = new AbortController();
    fetchEnterprises(controller.signal);
    return () => controller.abort();
  }, [fetchEnterprises]);

  // 搜索防抖
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '运营中' },
    { value: 'lead', label: '意向' },
    { value: 'suspended', label: '已暂停' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            企业管理
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            企业管理后台
          </p>
        </div>
        {currentRole !== 'viewer' && (
          <Link
            href="/admin/teams/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            开通新企业
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索企业名称或邮箱..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === opt.value
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : enterprises.length > 0 ? (
          <>
            <table className="w-full text-left">
              <thead className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th className="px-6 py-3">企业</th>
                  <th className="px-6 py-3">方案</th>
                  <th className="px-6 py-3">月费</th>
                  <th className="px-6 py-3">状态</th>
                  <th className="px-6 py-3">开通人</th>
                  <th className="px-6 py-3">开通日期</th>
                  <th className="px-6 py-3 w-20">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {enterprises.map((e) => (
                  <tr key={e.team_uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/teams/${e.team_uid}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
                          {e.team_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold group-hover:text-blue-500 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                            {e.team_name}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {e.contact_email || e.contact_name || '—'}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-xs font-bold uppercase">
                        {e.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      ${e.monthly_fee_usd}
                    </td>
                    <td className="px-6 py-4">
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
                        {e.status === 'active' ? '运营中' : e.status === 'lead' ? '意向' : e.status === 'suspended' ? '已暂停' : e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {e.created_by_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(e.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/teams/${e.team_uid}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/teams/${e.team_uid}`}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination — 有更多数据或不在第一页时显示 */}
            {(pagination.hasMore || page > 1) && (
              <div className="px-6 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  第 {page} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-40 transition-all"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasMore}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-40 transition-all"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
              {search || statusFilter !== 'all' ? '没有匹配的企业记录' : '暂无企业'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
