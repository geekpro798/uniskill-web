// src/components/Settings.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Key, 
  Shield, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  LogOut,
  Github,
  Mail,
  Info,
  ExternalLink,
  AlertTriangle,
  X,
  CheckCircle2
} from "lucide-react";
import { signOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Modal } from "@/components/Modal";

interface UserProfile {
  name: string;
  email: string;
  image: string;
  bio: string;
  githubUrl: string;
  provider: string;
  secrets: Record<string, string>;
  tier: string;
  handle: string;
}

interface SettingsDashboardProps {
  initialUser: UserProfile;
}

export default function SettingsDashboard({ initialUser }: SettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "vault" | "security">("profile");
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modal, setModal] = useState<{
    show: boolean, 
    type: 'confirm' | 'alert', 
    title: string, 
    message: React.ReactNode, 
    onConfirm?: () => void 
  }>({ show: false, type: 'alert', title: '', message: '' });

  const showAlert = (title: string, message: React.ReactNode) => {
    setModal({ show: true, type: 'alert', title, message });
  };

  const showConfirm = (title: string, message: React.ReactNode, onConfirm: () => void) => {
    setModal({ show: true, type: 'confirm', title, message, onConfirm });
  };

  // Tabs Configuration
  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "vault", label: "Integrations & Vault", icon: Key },
    { id: "security", label: "Account & Security", icon: Shield },
  ];

  // Logic: Phase 1 - Save Profile
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: user.name,
          bio: user.bio,
          github_url: user.githubUrl
        })
        .eq('email', user.email);

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      showAlert("Save Failed", "We couldn't save your profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs 
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" }
        ]} 
      />
      
      <div className="w-full max-w-5xl bg-white dark:bg-[#0f172a] shadow-sm rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden min-h-[600px] transition-colors duration-300">
      
      {/* ── Left Sidebar (Sidebar) ── */}
      <div className="w-full md:w-64 bg-gray-50 dark:bg-slate-900/50 border-r border-gray-200 dark:border-slate-800 p-4 flex flex-col">
        <div className="mb-8 px-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h2>
        </div>
        
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                    : 'text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600 dark:text-indigo-500' : 'text-gray-400 dark:text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Logout Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-slate-800 mt-auto">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400 dark:text-slate-500" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Right Content Area ── */}
      <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-[#0f172a]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'profile' && (
              <ProfileTab 
                user={user} 
                onChange={(updates: Partial<UserProfile>) => setUser({ ...user, ...updates })}
                onSave={handleSaveProfile}
                isSaving={isSaving}
                saveSuccess={saveSuccess}
              />
            )}
            {activeTab === 'vault' && (
              <VaultTab 
                secrets={user.secrets}
                onUpdate={(newSecrets: Record<string, string>) => setUser({ ...user, secrets: newSecrets })}
                showConfirm={showConfirm}
                showAlert={showAlert}
              />
            )}
            {activeTab === 'security' && (
              <SecurityTab 
                user={user}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Global Modal ── */}
      <Modal 
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, show: false }))}
        onConfirm={modal.onConfirm}
        confirmText={modal.type === 'confirm' ? "Delete" : "Got it"}
      />
    </div>
  </div>
  );
}

// ── SUB-COMPONENT: Profile Tab ──
function ProfileTab({ user, onChange, onSave, isSaving, saveSuccess }: any) {
  const MAX_BIO_LENGTH = 160;
  const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'U';

  const handle = user.handle || "user";
  const tier = user.tier || "Free";
  const avatarUrl = user.image;

  const renderTierBadge = (t: string) => {
    const normalizedTier = t?.toUpperCase();
    
    // 免费等级采用更低调的灰色样式
    if (normalizedTier === 'FREE') {
      return (
        <span className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded uppercase tracking-widest shadow-sm border border-slate-200 dark:border-slate-700/50">
          FREE
        </span>
      );
    }

    // 允许显示名牌的付费等级列表（金色样式）
    const paidTiers = ['STARTER', 'PRO', 'SCALE', 'UNLIMITED'];
    
    if (paidTiers.includes(normalizedTier)) {
      return (
        <span className="ml-2 px-1.5 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black rounded uppercase tracking-widest shadow-sm">
          {t}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Settings</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Manage your public profile and personal information.
        </p>
      </div>
      <div className="h-px bg-gray-200 dark:bg-slate-800" />

      <div className="space-y-6 max-w-xl">
        {/* ==========================================
            1. 头像与极客身份区 (Avatar & Identity)
            ========================================== */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Avatar & Identity
          </label>
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm">
            
            {/* 头像区域，带在线小绿点 */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="h-16 w-16 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover ring-1 ring-slate-200 dark:ring-slate-700" 
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">{initials}</span>
                </div>
              )}
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            
            {/* 右侧身份信息 */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center">
                <span className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[200px]" title={user.name}>
                  {user.name}
                </span>
                {/* 渲染 PRO/Unlimited 铭牌 */}
                {renderTierBadge(tier)}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[13px] font-bold font-mono text-slate-500 dark:text-slate-400 flex items-center">
                  <span className="text-slate-400 select-none mr-[1px]">@</span>{handle}
                </span>
                <span className="text-[11px] text-slate-300 dark:text-slate-600 font-medium">Synced via GitHub</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            2. 锁死的社区唯一 ID (Creator Profile URL)
            ========================================== */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Creator Profile URL
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            {/* 左侧前缀固定区域 */}
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-mono whitespace-nowrap">
              uniskill.ai/u/
            </span>
            
            {/* 中间只读输入框 */}
            <input 
              type="text" 
              defaultValue={handle}
              disabled
              className="flex-1 block w-full min-w-0 rounded-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs px-3 py-2 border-y border-l cursor-not-allowed font-mono outline-none" 
            />
            
            {/* 右侧跳转外链按钮 */}
            <a 
              href={`/u/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
              title="View Public Profile"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          {/* 底部不可修改提示 */}
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" /> 
            Your unique community ID synced from GitHub. This cannot be changed.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nickname (Display Name)</label>
          <div className="mt-1 relative">
            <input 
              type="text" 
              value={user.name}
              onChange={(e) => onChange({ name: e.target.value })}
              maxLength={32}
              placeholder="How should we call you?"
              className="block w-full rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white pr-12" 
            />
            <div className={`absolute bottom-2.5 right-3 text-[10px] font-mono ${(user.name?.length || 0) >= 32 ? 'text-red-500 font-bold' : 'text-gray-400 dark:text-slate-500'}`}>
              {user.name?.length || 0} / 32
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Bio</label>
          <div className="mt-1 relative">
            <textarea 
              rows={3}
              value={user.bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              maxLength={MAX_BIO_LENGTH}
              placeholder="Tell us a little about yourself..."
              className="block w-full rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white resize-none pb-7" 
            />
            <div className={`absolute bottom-2 right-3 text-[10px] font-mono ${(user.bio?.length || 0) >= MAX_BIO_LENGTH ? 'text-red-500 font-bold' : 'text-gray-400 dark:text-slate-500'}`}>
              {user.bio?.length || 0} / {MAX_BIO_LENGTH}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Email Address</label>
          <input 
            type="email" 
            value={user.email}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 shadow-sm sm:text-sm px-3 py-2 border text-gray-500 dark:text-slate-500 cursor-not-allowed" 
          />
        </div>
      </div>

      <div className="pt-4 flex justify-start">
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm disabled:bg-indigo-400"
        >
          {isSaving ? (
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : saveSuccess ? (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: Vault Tab ──
function VaultTab({ secrets, onUpdate, showConfirm, showAlert }: any) {
  const [localSecrets, setLocalSecrets] = useState<Record<string, string>>(secrets || {});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const formatSecretName = (name: string) => {
    return name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch secrets on mount
  useEffect(() => {
    const fetchSecrets = async () => {
      try {
        const res = await fetch('/api/user/secrets');
        if (res.ok) {
          const data = await res.json();
          setLocalSecrets(data);
          onUpdate(data);
        }
      } catch (err) {
        console.error("Failed to fetch vault secrets:", err);
      }
    };
    fetchSecrets();
  }, []);

  const handleAddSecret = async () => {
    if (!newKey || !newValue) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/user/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_name: newKey, value: newValue })
      });
      if (!res.ok) throw new Error("Sync failed");
      
      const updatedSecrets = await res.json();
      setLocalSecrets(updatedSecrets);
      onUpdate(updatedSecrets);
      setNewKey("");
      setNewValue("");
    } catch (err) {
      showAlert("Sync Failed", "We couldn't reach the vault service. Please check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSecret = async (key: string) => {
    showConfirm(
      "Delete Secret?", 
      <span>
        Are you sure you want to permanently remove <strong className="text-slate-900 dark:text-white font-bold">{formatSecretName(key)}</strong> from your global vault? This action cannot be undone.
      </span>,
      async () => {
        setIsSyncing(true);
        try {
          const res = await fetch(`/api/user/secrets?key_name=${encodeURIComponent(key)}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error("Delete sync failed");
          
          const updatedSecrets = await res.json();
          setLocalSecrets(updatedSecrets);
          onUpdate(updatedSecrets);
        } catch (err) {
          showAlert("Delete Failed", "We couldn't remove the secret. Please try again later.");
        } finally {
          setIsSyncing(false);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Integrations & Global Vault</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Manage your global API keys. These secrets are AES-256 encrypted and can be accessed by all your Agent skills.
        </p>
      </div>
      <div className="h-px bg-gray-200 dark:bg-slate-800" />

      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 flex justify-between items-center">
          <span className="font-medium text-sm text-gray-900 dark:text-white">Your Global Secrets</span>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-[#0f172a]">
          {Object.entries(localSecrets).map(([key, value]) => (
            <li key={key} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs transition-opacity">
                    {formatSecretName(key)}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 tracking-tighter">
                    AES-256
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-500 font-mono mt-1 break-all max-w-[280px] sm:max-w-md">
                  {visibleKeys[key] === true 
                    ? (value as string) 
                    : (value as string).length > 8 
                      ? `${(value as string).slice(0, 4)}••••••••${(value as string).slice(-4)}`
                      : '••••••••••••'
                  }
                </span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => toggleVisibility(key)}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  {visibleKeys[key] === true ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleDeleteSecret(key)}
                  className="p-1.5 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
          {Object.keys(localSecrets).length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500 italic">No secrets found.</li>
          )}
        </ul>
      </div>

      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
        <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-400 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Secret
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input 
            placeholder="KEY_NAME (e.g. GEMINI_API_KEY)"
            value={newKey}
            onChange={(e) => setNewKey(formatSecretName(e.target.value))}
            className="rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2 border outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono placeholder:text-gray-400 dark:placeholder:text-slate-600"
          />
          <input 
            type="password"
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2 border outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600"
          />
        </div>
        <button 
          onClick={handleAddSecret}
          disabled={isSyncing || !newKey || !newValue}
          className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
        >
          {isSyncing ? "Syncing..." : "Sync to Vault"}
        </button>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: Security Tab ──
function SecurityTab({ user }: any) {
  const [showDeleteInfo, setShowDeleteInfo] = useState(false);
  const displayName = user.name || user.email.split('@')[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account & Security</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Manage your connected identities and account security.
        </p>
      </div>
      <div className="h-px bg-gray-200 dark:bg-slate-800" />

      <div className="space-y-4 max-w-xl">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Connected Accounts</h4>
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-950 rounded-md border border-gray-200 dark:border-slate-800 shadow-sm">
              <Github className="w-5 h-5 text-gray-900 dark:text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">GitHub</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Connected as {displayName}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-200 dark:border-emerald-900/30">
            Active
          </span>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-slate-500 mt-2 flex items-start gap-1">
          <Shield className="w-3.5 h-3.5 mt-0.5 text-gray-400 dark:text-slate-600 shrink-0" />
          <span>Your account is authenticated via GitHub. Password management and 2FA are handled by your provider.</span>
        </p>
      </div>

      <div className="h-px bg-gray-200 my-6" />

      <div>
        <h4 className="text-sm font-medium text-red-600 dark:text-red-500 mb-2">Danger Zone</h4>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-sm font-bold text-red-900 dark:text-red-400">Delete Account</p>
            <p className="text-xs text-red-700 dark:text-red-500/80 mt-1">Once deleted, all your skills and global vault secrets will be permanently wiped.</p>
          </div>
          
          {!showDeleteInfo ? (
            <button 
              onClick={() => setShowDeleteInfo(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Delete Account
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-3 rounded-md border border-red-200 dark:border-red-900/30 shadow-sm max-w-sm">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 flex items-start gap-1.5">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>For ecosystem integrity and to prevent downstream Agent failures, account deletion currently requires manual review.</span>
              </p>
              <a 
                href="mailto:support@uniskill.ai?subject=Account Deletion Request"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 rounded-md text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
