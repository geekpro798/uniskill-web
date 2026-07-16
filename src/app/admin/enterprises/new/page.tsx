'use client';

// src/app/admin/enterprises/new/page.tsx
// 开通新企业账号 — 向导式表单

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Mail, Phone, User, Globe,
  CheckCircle2, Loader2, ArrowLeft, Shield,
  AlertCircle, Info, Copy,
} from 'lucide-react';
import Link from 'next/link';

export default function NewEnterprisePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<any>(null);

  const [form, setForm] = useState({
    company_name: '',
    company_slug: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    plan: 'mode1',
    max_members: 50,
    max_skills: 100,
    max_credits_month: 100000,
    monthly_fee_usd: 99,
    initial_admin_email: '',
    initial_admin_github_id: '',
    notes: '',
  });

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/enterprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '创建失败');
      }

      setCreated(data);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const planOptions = [
    { value: 'mode1', label: '模式一 · 共享网关', desc: '轻量接入 · $99-$499/月' },
    { value: 'mode2', label: '模式二 · 专属网关', desc: '部署至企业 CF 账号 · $9,900+/年', disabled: true },
    { value: 'mode3', label: '模式三 · 完全私有化', desc: 'Docker 自建 · 项目制定价', disabled: true },
  ];

  if (created) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>
            开通成功!
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            {created.enterprise.company_name} 已成功开通
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 text-left space-y-3 max-w-md mx-auto"
          style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>方案</span>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {created.enterprise.plan?.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>月费</span>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              ${created.enterprise.monthly_fee_usd}/月
            </span>
          </div>
          {created.onboarding_url && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Onboarding URL</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(created.onboarding_url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 font-mono text-xs text-blue-500 hover:underline transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? '已复制' : '复制链接'}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <Link
            href={`/admin/enterprises/${created.enterprise.account_uid}`}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all"
          >
            查看企业详情
          </Link>
          <button
            onClick={() => {
              setCreated(null);
              setStep(1);
              setForm({
                company_name: '', company_slug: '', contact_name: '', contact_email: '',
                contact_phone: '', plan: 'mode1', max_members: 50, max_skills: 100,
                max_credits_month: 100000, monthly_fee_usd: 99,
                initial_admin_email: '', initial_admin_github_id: '', notes: '',
              });
            }}
            className="px-5 py-2.5 border font-bold rounded-xl transition-all"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            再开一个
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Back link */}
      <Link
        href="/admin/enterprises"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </Link>

      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          开通新企业账号
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          填写企业信息，系统将自动创建团队和管理员
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {s}
            </div>
            {s < 2 && <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700" />}
          </React.Fragment>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {step === 1 && (
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <Building2 className="w-4 h-4" /> 基本信息
          </h2>

          <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              企业全称 *
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => updateField('company_name', e.target.value)}
              placeholder="例如：知行科技有限公司"
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
              URL 标识 (Slug) *
            </label>
            <input
              type="text"
              value={form.company_slug}
              onChange={(e) => updateField('company_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="zhixing-tech"
              className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              用于生成企业端 URL: uniskill.ai/t/{form.company_slug || '...'}
            </p>
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
                placeholder="姓名"
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
                联系邮箱
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              备注
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="内部备注，客户不可见..."
              rows={2}
              className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20 resize-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={!form.company_name.trim() || !form.company_slug.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              下一步：选择方案
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <Shield className="w-4 h-4" /> 方案与配额
          </h2>

          {/* Plan selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              部署方案 *
            </label>
            {planOptions.map((opt) => (
              <button
                key={opt.value}
                disabled={opt.disabled}
                onClick={() => updateField('plan', opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
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
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Quota fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
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

          {/* Initial admin */}
          <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              初始管理员（选填）
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                如目标用户已在 UniSkill 注册，填入其 GitHub ID 或邮箱即可自动绑定。未注册则开通后发送邀请。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  GitHub ID
                </label>
                <input
                  type="text"
                  value={form.initial_admin_github_id}
                  onChange={(e) => updateField('initial_admin_github_id', e.target.value)}
                  placeholder="例如: 12345678"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  邮箱
                </label>
                <input
                  type="email"
                  value={form.initial_admin_email}
                  onChange={(e) => updateField('initial_admin_email', e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 border rounded-xl text-sm font-bold transition-all"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              上一步
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 开通中...</>
              ) : (
                '确认开通'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
