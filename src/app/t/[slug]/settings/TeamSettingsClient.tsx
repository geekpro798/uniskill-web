"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Key, Eye, EyeOff, Plus, Trash2,
  X, Info, CheckCircle2, Crown, Copy, Save,
  Building2, Users, Globe, Mail, Phone, BadgeCheck,
  AlertTriangle
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Modal } from "@/components/Modal";

interface TeamInfo {
  team_uid: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  admin_email: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  max_members?: number;
  max_skills?: number;
  max_credits_month?: number;
  monthly_fee_usd?: number;
}

interface TeamSettingsClientProps {
  team: TeamInfo;
  userUid: string;
}

export default function TeamSettingsClient({ team, userUid }: TeamSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "vault" | "security">("profile");
  const [modal, setModal] = useState<{
    show: boolean;
    type: "confirm" | "alert";
    title: string;
    message: React.ReactNode;
    onConfirm?: () => void;
  }>({ show: false, type: "alert", title: "", message: "" });

  const showAlert = (title: string, message: string) => {
    setModal({ show: true, type: "alert", title, message });
  };

  const showConfirm = (title: string, message: React.ReactNode, onConfirm: () => void) => {
    setModal({ show: true, type: "confirm", title, message, onConfirm });
  };

  const menuItems = [
    { id: "profile", label: "Team Profile", icon: Building2 },
    { id: "vault", label: "Integrations & Vault", icon: Key },
    { id: "security", label: "Account & Security", icon: Shield },
  ];

  const STATUS_LABELS: Record<string, string> = {
    lead: "潜在",
    active: "运营中",
    suspended: "已暂停",
    cancelled: "已取消",
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: team.team_name, href: `/t/${team.slug}` },
          { label: "Dashboard", href: `/t/${team.slug}/dashboard` },
          { label: "Settings" },
        ]}
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-56 shrink-0">
          <div
            className="p-1 rounded-xl"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 last:mb-0 transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-800 shadow-sm"
                      : "hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
              }}
            >
              {activeTab === "profile" && (
                <ProfileTab team={team} slug={team.slug} />
              )}
              {activeTab === "vault" && (
                <VaultTab
                  showConfirm={showConfirm}
                  showAlert={showAlert}
                />
              )}
              {activeTab === "security" && (
                <SecurityTab team={team} userUid={userUid} showAlert={showAlert} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Modal
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal((prev) => ({ ...prev, show: false }))}
        onConfirm={modal.onConfirm}
        confirmText={modal.type === "confirm" ? "Delete" : "Got it"}
      />
    </div>
  );
}

// ── Profile Tab ──
function ProfileTab({ team, slug }: { team: TeamInfo; slug: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Team Profile</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Your team information and configuration.
        </p>
      </div>
      <div className="h-px bg-gray-200 dark:bg-slate-800" />

      <div className="space-y-4 max-w-xl">
        {/* Team Name & Status */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
            <Building2 className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{team.team_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              uniskill.ai/t/{slug}
            </p>
          </div>
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
            team.status === "active"
              ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
          }`}>
            {STATUS_LABELS[team.status] || team.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard icon={BadgeCheck} label="Plan" value={team.plan?.toUpperCase() || "—"} />
          <InfoCard icon={Users} label="Max Members" value={team.max_members?.toString() || "—"} />
          <InfoCard icon={Globe} label="Max Skills" value={team.max_skills?.toString() || "—"} />
          <InfoCard icon={Shield} label="Monthly Credits" value={team.max_credits_month?.toLocaleString() || "—"} />
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoCard icon={Mail} label="Admin Email" value={team.admin_email || "—"} />
            <InfoCard icon={Phone} label="Contact Phone" value={team.contact_phone || "—"} />
            <InfoCard icon={Mail} label="Contact Email" value={team.contact_email || "—"} />
            <InfoCard icon={Users} label="Contact Name" value={team.contact_name || "—"} />
          </div>
        </div>

        <p className="text-xs text-slate-500 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
          Team profile details are managed by the UniSkill administrator. Contact support for changes.
        </p>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg">
      <Icon size={14} className="text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  lead: "潜在",
  active: "运营中",
  suspended: "已暂停",
  cancelled: "已取消",
};

// ── Vault Tab ──
function VaultTab({ showConfirm, showAlert }: any) {
  const [localSecrets, setLocalSecrets] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const formatSecretName = (name: string) => {
    return name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchSecrets = async () => {
      try {
        const res = await fetch("/api/user/secrets");
        if (res.ok) {
          const data = await res.json();
          setLocalSecrets(data);
        }
      } catch (err) {
        console.warn("Failed to fetch vault secrets:", err);
      }
    };
    fetchSecrets();
  }, []);

  const handleAddSecret = async () => {
    if (!newKey || !newValue) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/user/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_name: newKey, value: newValue }),
      });
      if (!res.ok) throw new Error("Sync failed");
      const updatedSecrets = await res.json();
      setLocalSecrets(updatedSecrets);
      setNewKey("");
      setNewValue("");
    } catch {
      showAlert("Sync Failed", "We couldn't reach the vault service.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSecret = async (key: string) => {
    showConfirm(
      "Delete Secret?",
      <span>
        Remove <strong>{formatSecretName(key)}</strong> from the vault?
      </span>,
      async () => {
        setIsSyncing(true);
        try {
          const res = await fetch(`/api/user/secrets?key_name=${encodeURIComponent(key)}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Delete failed");
          const updatedSecrets = await res.json();
          setLocalSecrets(updatedSecrets);
        } catch {
          showAlert("Delete Failed", "Could not remove the secret.");
        } finally {
          setIsSyncing(false);
        }
      }
    );
  };

  const secretEntries = Object.entries(localSecrets);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Integrations & Vault</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Manage team API keys. These secrets are AES-256 encrypted and shared across team skills.
        </p>
      </div>
      <div className="h-px bg-gray-200 dark:bg-slate-800" />

      {/* Add new secret */}
      <div className="max-w-xl space-y-3">
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Key (e.g. OPENAI_API_KEY)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="password"
              placeholder="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={handleAddSecret}
              disabled={isSyncing || !newKey || !newValue}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Secret list */}
      {secretEntries.length > 0 && (
        <div className="max-w-xl space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Stored Secrets</h4>
          {secretEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg"
            >
              <Key size={14} className="text-slate-400 shrink-0" />
              <span className="flex-1 text-xs font-mono font-bold text-gray-900 dark:text-white truncate">
                {formatSecretName(key)}
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1">
                <span className="text-xs font-mono text-slate-500 select-none">
                  {visibleKeys[key] ? value : "••••••••••••"}
                </span>
                <button
                  onClick={() => toggleVisibility(key)}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                >
                  {visibleKeys[key] ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
              <button
                onClick={() => handleDeleteSecret(key)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Security Tab ──
function SecurityTab({
  team,
  userUid,
  showAlert,
}: {
  team: TeamInfo;
  userUid: string;
  showAlert: (title: string, message: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert("Missing Fields", "Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      showAlert("Too Short", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Mismatch", "New passwords do not match.");
      return;
    }
    setIsChanging(true);
    try {
      const res = await fetch("/api/admin/teams/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_uid: team.team_uid,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      showAlert("Change Failed", e.message);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account & Security</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Manage your team access credentials and security settings.
        </p>
      </div>
      <div className="h-px bg-gray-200 dark:bg-slate-800" />

      {/* Admin Account */}
      <div className="space-y-4 max-w-xl">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Admin Account</h4>
        <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
              <Mail className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{team.admin_email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Email / Password Authentication</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-200 dark:border-emerald-900/30">
            Active
          </span>
        </div>
      </div>

      {/* Change Password */}
      <div className="space-y-4 max-w-xl">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h4>
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="password"
            placeholder="New password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            onClick={handleChangePassword}
            disabled={isChanging}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {success ? (
              <>
                <CheckCircle2 size={14} /> Changed
              </>
            ) : isChanging ? (
              "Changing..."
            ) : (
              <>
                <Save size={14} /> Change Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
