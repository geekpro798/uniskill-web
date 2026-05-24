'use client';

// src/app/admin/AdminSidebar.tsx
// Admin Panel 侧边导航

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Building2, PlusCircle,
  ChevronRight, Shield, LogOut, Users
} from 'lucide-react';

const navItems = [
  {
    href: '/admin',
    label: '运营仪表盘',
    icon: LayoutDashboard,
    exact: true,
    roles: ['super_admin', 'admin', 'viewer'],
  },
  {
    href: '/admin/teams',
    label: '企业管理',
    icon: Building2,
    exact: false,
    roles: ['super_admin', 'admin', 'viewer'],
  },
  {
    href: '/admin/teams/new',
    label: '开通新企业',
    icon: PlusCircle,
    exact: true,
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/admin/users',
    label: '管理员管理',
    icon: Users,
    exact: true,
    roles: ['super_admin'],
  },
];

export default function AdminSidebar({ role }: { role: string | null }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col border-r z-40"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo / Header */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              UniSkill
            </span>
            <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest">
              Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-blue-500' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 text-blue-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <Link
          href="/dashboard"
          className="block text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
        >
          ← 返回用户端
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
