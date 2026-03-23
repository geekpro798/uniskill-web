// src/components/Settings.tsx
"use client";

import React, { useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import { signOut } from "next-auth/react";
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
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white shadow-sm rounded-xl border border-gray-200 flex flex-col md:flex-row overflow-hidden min-h-[600px] transition-colors duration-300">
      
      {/* ── Left Sidebar (Sidebar) ── */}
      <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
        <div className="mb-8 px-2">
          <h2 className="text-lg font-bold text-gray-900">Settings</h2>
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
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Logout Button */}
        <div className="pt-4 border-t border-gray-200 mt-auto">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Right Content Area ── */}
      <div className="flex-1 p-8 overflow-y-auto bg-white">
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
    </div>
  );
}

// ── SUB-COMPONENT: Profile Tab ──
function ProfileTab({ user, onChange, onSave, isSaving, saveSuccess }: any) {
  const MAX_BIO_LENGTH = 160;
  const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your public profile and personal information.
        </p>
      </div>
      <div className="h-px bg-gray-200" />

      <div className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700">Avatar</label>
          <div className="mt-2 flex items-center space-x-4">
            {user.image ? (
              <img src={user.image} alt="Avatar" className="h-16 w-16 rounded-full border-2 border-indigo-500 object-cover shadow-sm" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-500">
                <span className="text-indigo-600 font-bold text-xl">{initials}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Display Name</label>
          <input 
            type="text" 
            value={user.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <div className="mt-1 relative">
            <textarea 
              rows={3}
              value={user.bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              maxLength={MAX_BIO_LENGTH}
              placeholder="Tell us a little about yourself..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border resize-none pb-7 outline-none" 
            />
            <div className={`absolute bottom-2 right-3 text-[10px] font-mono ${(user.bio?.length || 0) >= MAX_BIO_LENGTH ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {user.bio?.length || 0} / {MAX_BIO_LENGTH}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input 
            type="email" 
            value={user.email}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm px-3 py-2 border text-gray-500 cursor-not-allowed" 
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
function VaultTab({ secrets, onUpdate }: any) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  const handleDeleteSecret = async (key: string) => {
    if (!confirm(`Delete ${key}?`)) return;
    setIsSyncing(true);
    try {
      const { [key]: _, ...rest } = secrets;
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Integrations & Global Vault</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your global API keys. These secrets are AES-256 encrypted and can be accessed by all your Agent skills.
        </p>
      </div>
      <div className="h-px bg-gray-200" />

      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center">
          <span className="font-medium text-sm text-gray-900">Your Global Secrets</span>
        </div>
        <ul className="divide-y divide-gray-200 bg-white">
          {Object.entries(secrets).map(([key, value]) => (
            <li key={key} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex flex-col">
                <span className="text-sm font-bold font-mono text-gray-900">{key}</span>
                <span className="text-xs text-gray-500 font-mono mt-1">
                  {visibleKeys[key] ? (value as string) : '••••••••••••••••••••••••'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => toggleVisibility(key)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  {visibleKeys[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          {Object.keys(secrets).length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500 italic">No secrets found.</li>
          )}
        </ul>
      </div>

      <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
        <h4 className="text-sm font-medium text-indigo-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Secret
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input 
            placeholder="KEY_NAME"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2 border outline-none bg-white"
          />
          <input 
            type="password"
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2 border outline-none bg-white"
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
        <h3 className="text-lg font-medium text-gray-900">Account & Security</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your connected identities and account security.
        </p>
      </div>
      <div className="h-px bg-gray-200" />

      <div className="space-y-4 max-w-xl">
        <h4 className="text-sm font-medium text-gray-900">Connected Accounts</h4>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-md border border-gray-200 shadow-sm">
              <Github className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">GitHub</p>
              <p className="text-xs text-gray-500">Connected as {displayName}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-200">
            Active
          </span>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
          <Shield className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
          <span>Your account is authenticated via GitHub. Password management and 2FA are handled by your provider.</span>
        </p>
      </div>

      <div className="h-px bg-gray-200 my-6" />

      <div>
        <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-sm font-bold text-red-900">Delete Account</p>
            <p className="text-xs text-red-700 mt-1">Once deleted, all your skills and global vault secrets will be permanently wiped.</p>
          </div>
          
          {!showDeleteInfo ? (
            <button 
              onClick={() => setShowDeleteInfo(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Delete Account
            </button>
          ) : (
            <div className="bg-white p-3 rounded-md border border-red-200 shadow-sm max-w-sm">
              <p className="text-xs text-slate-600 mb-3 flex items-start gap-1.5">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>For ecosystem integrity and to prevent downstream Agent failures, account deletion currently requires manual review.</span>
              </p>
              <a 
                href="mailto:support@uniskill.ai?subject=Account Deletion Request"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors"
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
