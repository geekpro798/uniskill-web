// src/components/Settings.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  ShieldCheck, 
  Key, 
  Save, 
  Plus, 
  Trash2, 
  Github, 
  Mail, 
  AlertTriangle,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  name: string;
  email: string;
  image: string;
  bio: string;
  githubUrl: string;
  provider: string;
  secrets: Record<string, string>;
}

interface SettingsDashboardProps {
  initialUser: UserProfile;
}

export default function SettingsDashboard({ initialUser }: SettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "vault" | "security">("profile");
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tabs Configuration
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "vault", label: "Integrations & Vault", icon: Key },
    { id: "security", label: "Security", icon: ShieldCheck },
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
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* ── Left Sidebar: Tabs ── */}
      <div className="lg:col-span-1 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" 
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-nav-bg)] border border-transparent"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Right Content: Tab Panels ── */}
      <div className="lg:col-span-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-8 min-h-[500px]"
          >
            {activeTab === "profile" && (
              <ProfileTab 
                user={user} 
                onChange={(updates: Partial<UserProfile>) => setUser({ ...user, ...updates })}
                onSave={handleSaveProfile}
                isSaving={isSaving}
                saveSuccess={saveSuccess}
              />
            )}
            {activeTab === "vault" && (
              <VaultTab 
                secrets={user.secrets}
                onUpdate={(newSecrets: Record<string, string>) => setUser({ ...user, secrets: newSecrets })}
              />
            )}
            {activeTab === "security" && (
              <SecurityTab provider={user.provider} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: Profile Tab ──
function ProfileTab({ user, onChange, onSave, isSaving, saveSuccess }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <img src={user.image} className="w-20 h-20 rounded-2xl border-2 border-blue-500/20" alt="Avatar" />
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{user.name}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Display Name</label>
          <input 
            type="text" 
            value={user.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 transition-colors outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">GitHub Profile</label>
          <input 
            type="text" 
            value={user.githubUrl}
            placeholder="https://github.com/username"
            onChange={(e) => onChange({ githubUrl: e.target.value })}
            className="w-full bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 transition-colors outline-none"
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Bio</label>
          <textarea 
            rows={4}
            value={user.bio}
            placeholder="Tell us about yourself..."
            onChange={(e) => onChange({ bio: e.target.value })}
            className="w-full bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 transition-colors outline-none resize-none"
          />
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle2 size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: Vault Tab (Phase 2) ──
function VaultTab({ secrets, onUpdate }: any) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAddSecret = async () => {
    if (!newKey || !newValue) return;
    setIsSyncing(true);
    try {
      const updatedSecrets = { ...secrets, [newKey]: newValue };
      
      const res = await fetch('/api/user/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSecrets)
      });
      
      if (!res.ok) throw new Error("Sync failed");
      
      onUpdate(updatedSecrets);
      setNewKey("");
      setNewValue("");
    } catch (err) {
      alert("Failed to sync secret.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSecret = async (keyToDelete: string) => {
    if (!confirm(`Delete ${keyToDelete}?`)) return;
    setIsSyncing(true);
    try {
      const { [keyToDelete]: _, ...rest } = secrets;
      
      const res = await fetch('/api/user/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });

      if (!res.ok) throw new Error("Delete sync failed");
      onUpdate(rest);
    } catch (err) {
      alert("Failed to delete secret.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          Global Vault
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
            <ShieldCheck className="text-green-500" size={18} />
          </motion.div>
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">密钥将在服务端 AES-256 加密并同步至全球边缘节点。</p>
      </div>

      {/* Secrets List */}
      <div className="space-y-3">
        {Object.entries(secrets).map(([key, _]) => (
          <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Key size={14} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">{key}</p>
                <p className="text-[10px] text-[var(--color-text-secondary)] font-mono uppercase">Value Encrypted (AES-256)</p>
              </div>
            </div>
            <button 
              onClick={() => handleDeleteSecret(key)}
              className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {Object.keys(secrets).length === 0 && (
          <div className="text-center py-10 text-[var(--color-text-secondary)] italic text-sm">
            No secrets found in your vault.
          </div>
        )}
      </div>

      {/* Add Secret Form */}
      <div className="pt-6 border-t border-[var(--color-border)]">
        <h4 className="text-sm font-bold mb-4 opacity-70">Add New Integration</h4>
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            placeholder="KEY_NAME (e.g. OPENAI_API_KEY)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm focus:border-blue-500/50 outline-none"
          />
          <input 
            type="password"
            placeholder="api-key-value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1 bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm focus:border-blue-500/50 outline-none"
          />
          <button 
            onClick={handleAddSecret}
            disabled={isSyncing || !newKey || !newValue}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
          >
            {isSyncing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: Security Tab (Phase 3) ──
function SecurityTab({ provider }: any) {
  const [showDeleteInfo, setShowDeleteInfo] = useState(false);

  return (
    <div className="space-y-12">
      {/* Connected Accounts */}
      <section>
        <h3 className="text-lg font-bold mb-6">Connected Accounts</h3>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 text-white">
              {provider === "github" ? <Github size={20} /> : <Mail size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-tight">{provider === "github" ? "GitHub Account" : "Email Login"}</p>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle2 size={12} /> Connected
              </p>
            </div>
          </div>
          <button className="text-xs font-bold text-[var(--color-text-secondary)] opacity-50 cursor-not-allowed">
            Disconnect
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="pt-12 border-t border-red-500/10">
        <h3 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} />
          Danger Zone
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-6">Irreversible actions. Use with caution.</p>

        {!showDeleteInfo ? (
          <button 
            onClick={() => setShowDeleteInfo(true)}
            className="px-6 py-2.5 border border-red-500/30 text-red-500 text-xs font-bold rounded-xl hover:bg-red-500/5 transition-all"
          >
            Delete Account
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-4"
          >
            <p className="text-sm text-red-200/80 leading-relaxed font-medium">
              为了保护 UniSkill 生态系统的完整性并防止下游 Agent 工具发生连锁失效，**账号删除目前需要人工审核。**
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <a 
                href="mailto:support@uniskill.ai?subject=Account Deletion Request"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                <Mail size={16} />
                Contact Support
              </a>
              <button 
                onClick={() => setShowDeleteInfo(false)}
                className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Cancel request
              </button>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}
