'use client';

// src/app/admin/login/page.tsx
// Admin 登录页 — 邮箱+密码 或 GitHub OAuth

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Shield, Github, Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('admin-credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误，或账号已被禁用');
      } else if (result?.ok) {
        window.location.href = '/admin';
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setGithubLoading(true);
    setError('');
    try {
      await signIn('github', { callbackUrl: '/admin' });
    } catch {
      setError('GitHub 登录失败，请重试');
      setGithubLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            UniSkill Admin
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            运营管理端 · 仅限内部人员
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8 space-y-5"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@uniskill.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入初始密码"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                {password && (
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : null}
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>或</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>

          {/* GitHub Login */}
          <button
            onClick={handleGitHubSignIn}
            disabled={githubLoading}
            className="w-full py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {githubLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Github className="w-5 h-5" />
            )}
            {githubLoading ? '跳转中...' : 'Sign in with GitHub'}
          </button>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--color-text-secondary)' }}>
          需要开通权限？联系 UniSkill 管理员
        </p>
      </motion.div>
    </div>
  );
}
