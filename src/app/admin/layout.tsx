'use client';

// src/app/admin/layout.tsx
// UniSkill Admin Panel — 运营管理端布局

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/admin/me')
        .then(res => res.json())
        .then(data => {
          if (data.role) {
            setAdminRole(data.role);
          } else {
            setAdminRole(null);
          }
        })
        .catch(() => setAdminRole(null))
        .finally(() => setChecking(false));
    }
  }, [status, session, isLoginPage]);

  // 登录页不套 layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!adminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>无访问权限</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>仅 UniSkill 运营人员可访问管理端</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <AdminSidebar role={adminRole} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
