'use client';

// src/app/admin/users/page.tsx
// 运营人员管理 — 仅 super_admin 可访问

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Shield, Trash2, Crown, Eye, UserCog,
  Loader2, AlertCircle, CheckCircle, XCircle,
  Copy, Key, Ban, CheckCircle2, Clock,
} from 'lucide-react';
import { Modal } from '@/components/Modal';

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  viewer: '查看者',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  admin: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  active: '正常',
  disabled: '已禁用',
  pending: '待激活',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add form
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState('admin');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  // Generated credentials display
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email?: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit role
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editing, setEditing] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({ show: false, title: '', message: '' });

  // Password reveal modal
  const [passwordModal, setPasswordModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.data) {
        setUsers(data.data);
        setCurrentRole(data.currentRole);
        setCurrentUserUid(data.currentUserUid);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async () => {
    setAddError('');
    if (!addName.trim()) {
      setAddError('请输入姓名');
      return;
    }
    if (!addEmail.trim() || !addEmail.includes('@')) {
      setAddError('请输入有效的邮箱地址');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim(), name: addName.trim(), phone: addPhone.trim() || undefined, role: addRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || '添加失败');
      } else {
        // 显示生成的密码
        setGeneratedCredentials({ email: addEmail.trim(), password: data.initialPassword });
        setPasswordModal(true);
        setAddOpen(false);
        setAddEmail('');
        setAddName('');
        setAddPhone('');
        setAddRole('admin');
        fetchUsers();
      }
    } catch {
      setAddError('网络错误');
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (uid: string) => {
    setEditing(true);
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || '修改失败');
      } else {
        showToast('success', '角色已更新');
        setEditingUid(null);
        fetchUsers();
      }
    } catch {
      showToast('error', '网络错误');
    } finally {
      setEditing(false);
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const action = newStatus === 'active' ? '启用' : '禁用';
    setConfirmModal({
      show: true,
      title: `${action}运营人员`,
      message: `确定要${action}该运营人员吗？`,
      confirmText: action,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${uid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
          const data = await res.json();
          if (!res.ok) {
            showToast('error', data.error || `${action}失败`);
          } else {
            showToast('success', `已${action}`);
            fetchUsers();
          }
        } catch {
          showToast('error', '网络错误');
        }
      },
    });
  };

  const handleDelete = async (uid: string) => {
    setConfirmModal({
      show: true,
      title: '移除运营人员',
      message: '确定要移除该运营人员吗？此操作不可撤销。',
      confirmText: '移除',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${uid}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) {
            showToast('error', data.error || '移除失败');
          } else {
            showToast('success', '已移除运营人员');
            fetchUsers();
          }
        } catch {
          showToast('error', '网络错误');
        }
      },
    });
  };

  const handleResetPassword = async (uid: string) => {
    setConfirmModal({
      show: true,
      title: '重置密码',
      message: '确定要重置当前账号的密码吗？旧密码将立即失效。',
      confirmText: '重置',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${uid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetPassword: true }),
          });
          const data = await res.json();
          if (!res.ok) {
            showToast('error', data.error || '重置失败');
          } else {
            setGeneratedCredentials({ password: data.password });
            setPasswordModal(true);
            showToast('success', '密码已重置');
          }
        } catch {
          showToast('error', '网络错误');
        }
      },
    });
  };

  const copyCredentials = async () => {
    if (!generatedCredentials) return;
    const text = generatedCredentials.email
      ? `邮箱：${generatedCredentials.email}\n密码：${generatedCredentials.password}`
      : generatedCredentials.password;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!loading && currentRole !== 'super_admin') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>无权限</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>仅超级管理员可管理运营人员</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold animate-in slide-in-from-top-2 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Credentials Reveal Modal */}
      <Modal
        show={passwordModal}
        type="confirm"
        title="新密码"
        message={
          <div className="space-y-3">
            <p>请立即复制并安全地发送给该运营人员，此密码仅显示一次。</p>
            {generatedCredentials?.email && (
              <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                <span className="text-slate-400 mr-2">邮箱</span>
                <span className="font-mono font-bold">{generatedCredentials.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 font-mono text-base font-bold tracking-wider"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <span>{generatedCredentials?.password}</span>
              <button
                onClick={copyCredentials}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="复制"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        }
        confirmText="复制，并关闭"
        cancelText="关闭"
        onConfirm={copyCredentials}
        onClose={() => { setPasswordModal(false); setCopied(false); }}
      />

      {/* Confirm Modal */}
      <Modal
        show={confirmModal.show}
        type="confirm"
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onClose={() => setConfirmModal(prev => ({ ...prev, show: false }))}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            运营人员管理
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            管理 UniSkill 运营团队成员及其权限
          </p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setAddError(''); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          添加运营人员
        </button>
      </div>

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>
                添加运营人员
              </h2>
              <button
                onClick={() => setAddOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                姓名 *
              </label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="例如：孙泽锟"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                邮箱地址 *
              </label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="colleague@uniskill.ai"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                手机号
              </label>
              <input
                type="tel"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="选填"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                系统将自动生成初始密码，请保存后发送给该人员
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                角色
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'viewer'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setAddRole(role)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      addRole === role
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    style={{ borderColor: addRole === role ? undefined : 'var(--color-border)' }}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      {role === 'admin' ? <UserCog className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {role === 'admin' ? '管理员' : '查看者'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {addError && (
              <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                <AlertCircle className="w-4 h-4" />
                {addError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAddOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : users.length > 0 ? (
          <table className="w-full text-left">
            <thead
              className="text-xs font-black uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}
            >
              <tr>
                <th className="px-6 py-3">运营人员</th>
                <th className="px-6 py-3">角色</th>
                <th className="px-6 py-3">状态</th>
                <th className="px-6 py-3">最近活跃</th>
                <th className="px-6 py-3 w-40">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {users.map((u) => {
                const isSelf = (u.user_uid && u.user_uid === currentUserUid) || u.email === currentUserUid;
                return (
                  <tr key={u.user_uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full border border-slate-200" />
                        ) : (
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                            {(u.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                              {u.name || u.username || u.email || '未命名'}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                我
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {u.phone ? `${u.email} · ${u.phone}` : u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUid === u.user_uid ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="px-2 py-1 rounded-lg border text-xs font-bold outline-none"
                            style={{
                              borderColor: 'var(--color-border)',
                              backgroundColor: 'var(--color-bg-primary)',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {u.role === 'super_admin' ? (
                              <option value="super_admin">超级管理员</option>
                            ) : (
                              <>
                                <option value="admin">管理员</option>
                                <option value="viewer">查看者</option>
                              </>
                            )}
                          </select>
                          <button
                            onClick={() => handleEdit(u.user_uid)}
                            disabled={editing}
                            className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-400 disabled:opacity-50"
                          >
                            {editing ? <Loader2 className="w-3 h-3 animate-spin" /> : '保存'}
                          </button>
                          <button
                            onClick={() => setEditingUid(null)}
                            className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            ROLE_COLORS[u.role] || ROLE_COLORS.viewer
                          }`}
                        >
                          {u.role === 'super_admin' && <Crown className="w-3 h-3" />}
                          {u.role === 'admin' && <UserCog className="w-3 h-3" />}
                          {u.role === 'viewer' && <Eye className="w-3 h-3" />}
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : u.status === 'disabled'
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {u.status === 'active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : u.status === 'disabled' ? (
                          <Ban className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {STATUS_LABELS[u.status] || u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {u.last_active_at
                        ? new Date(u.last_active_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {/* 重置密码 — 仅本人可见 */}
                        {isSelf && (
                          <button
                            onClick={() => handleResetPassword(u.user_uid)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
                            title="重置密码"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}
                        {/* 状态切换 */}
                        {u.role !== 'super_admin' && !isSelf && (
                          <button
                            onClick={() => handleToggleStatus(u.user_uid, u.status)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
                            title={u.status === 'active' ? '禁用' : '启用'}
                          >
                            {u.status === 'active' ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {/* 编辑按钮 */}
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() => { setEditingUid(u.user_uid); setEditRole(u.role); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                            title="修改角色"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                        )}
                        {/* 删除按钮 */}
                        {!isSelf && u.role !== 'super_admin' && (
                          <button
                            onClick={() => handleDelete(u.user_uid)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                            title="移除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-24 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
              暂无运营人员
            </p>
          </div>
        )}
      </div>

      {/* Role Legend */}
      <div className="flex items-center gap-6 text-xs flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-purple-500" />
          超级管理员 — 完整权限，可管理其他运营人员
        </span>
        <span className="flex items-center gap-1.5">
          <UserCog className="w-3.5 h-3.5 text-blue-500" />
          管理员 — 可管理企业客户
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          查看者 — 只读访问
        </span>
      </div>
    </div>
  );
}
