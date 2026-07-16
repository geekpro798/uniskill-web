'use client';

// src/app/admin/teams/[uid]/edit/page.tsx
// 企业编辑页

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Loader2, AlertCircle,
  CheckCircle2, Eye, EyeOff,
} from 'lucide-react';

const PLAN_OPTIONS = [
  { value: 'mode1', label: '模式一 · 共享网关' },
  { value: 'mode2', label: '模式二 · 专属网关', disabled: true },
  { value: 'mode3', label: '模式三 · 完全私有化', disabled: true },
];

export default function EditEnterprisePage() {
  const params = useParams();
  const router = useRouter();
  const uid = params?.uid as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    biz_contact_email: '',
    contactEmailSameAsAdmin: true,
    plan: 'mode1',
    status: 'active',
    max_members: 50,
    max_skills: 100,
    max_credits_month: 100000,
    monthly_fee_usd: 99,
    admin_email: '',
    admin_password: '',
    notes: '',
  });

  useEffect(() => {
    if (uid) fetchEnterprise();
  }, [uid]);

  async function fetchEnterprise() {
    try {
      const res = await fetch(`/api/admin/teams/${uid}`);
      const json = await res.json();
      if (!res.ok || !json.team) {
        setNotFound(true);
        return;
      }
      const t = json.team;
      const adminEmail = t.admin_email || '';
      const bizEmail = t.contact_email || '';
      setForm({
        company_name: t.team_name || '',
        contact_name: t.contact_name || '',
        contact_email: adminEmail,
        contact_phone: t.contact_phone || '',
        biz_contact_email: bizEmail,
        contactEmailSameAsAdmin: !bizEmail || bizEmail === adminEmail,
        plan: t.plan || 'mode1',
        status: t.status || 'active',
        max_members: t.max_members ?? 50,
        max_skills: t.max_skills ?? 100,
        max_credits_month: t.max_credits_month ?? 100000,
        monthly_fee_usd: t.monthly_fee_usd ?? 99,
        admin_email: adminEmail,
        admin_password: '',
        notes: t.notes || '',
      });
    } catch (e) {
      console.error('Failed to fetch enterprise:', e);
    } finally {
      setLoading(false);
    }
  }

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/teams/${uid}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');

      setSaved(true);
      setTimeout(() => router.push(`/admin/teams/${uid}`), 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-24">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>企业不存在</h2>
        <Link href="/admin/teams" className="text-blue-500 text-sm mt-2 inline-block hover:underline">返回列表</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </Link>

      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          编辑企业
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {form.company_name}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          保存成功，即将返回详情页...
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
          <Building2 className="w-4 h-4" /> 企业信息
        </h2>

        <div>
          <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            企业全称 *
          </label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => updateField('company_name', e.target.value)}
            required
            className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              联系人
            </label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => updateField('contact_name', e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              联系电话
            </label>
            <input
              type="text"
              value={form.contact_phone}
              onChange={(e) => updateField('contact_phone', e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              企业联系邮箱
            </label>
            <input
              type="email"
              value={form.biz_contact_email}
              onChange={(e) => updateField('biz_contact_email', e.target.value)}
              placeholder="contact@company.com"
              className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              管理员邮箱（登录用） *
            </label>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={form.contactEmailSameAsAdmin ? form.biz_contact_email : form.admin_email}
                  onChange={(e) => updateField('admin_email', e.target.value)}
                  disabled={form.contactEmailSameAsAdmin}
                  placeholder={form.contactEmailSameAsAdmin ? '自动同步企业联系邮箱' : 'admin@example.com'}
                  required
                  className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <label className="flex items-center gap-1.5 pb-2.5 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={form.contactEmailSameAsAdmin}
                  onChange={(e) => updateField('contactEmailSameAsAdmin', e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-blue-600"
                />
                <span className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                  同联系邮箱
                </span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              新密码（选填）
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.admin_password}
                onChange={(e) => updateField('admin_password', e.target.value)}
                placeholder="留空则不修改密码"
                className="w-full px-4 py-2.5 pr-10 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              {form.admin_password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            状态
          </label>
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="active">运营中</option>
            <option value="lead">意向</option>
            <option value="suspended">已暂停</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            备注
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20 resize-none"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            方案与配额
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {PLAN_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                disabled={opt.disabled}
                onClick={() => updateField('plan', opt.value)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  opt.disabled ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  form.plan === opt.value
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
                style={{
                  borderColor: form.plan === opt.value ? undefined : 'var(--color-border)',
                }}
              >
                <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {opt.label}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { key: 'max_members', label: '成员上限' },
              { key: 'max_skills', label: '技能上限' },
              { key: 'max_credits_month', label: '月积分上限' },
              { key: 'monthly_fee_usd', label: '月费 (USD)' },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {label}
                </label>
                <input
                  type="number"
                  value={(form as any)[key]}
                  onChange={(e) => updateField(key, parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href={`/admin/teams/${uid}`}
            className="px-5 py-3 border rounded-xl text-sm font-bold transition-all"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={saving || !form.company_name.trim()}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
            ) : (
              '保存修改'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
