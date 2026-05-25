"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, UserCog, Eye, Trash2, Plus, Mail, Loader2, Users, Shield, Clock, X } from "lucide-react";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Modal } from "@/components/Modal";
import { formatDateTime } from "@/lib/utils";

interface Member {
  user_uid: string;
  role: "owner" | "admin" | "member" | "viewer";
  joined_at: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface Invitation {
  id: string;
  team_uid: string;
  email: string;
  role: string;
  invited_by_uid: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
}

interface MembersClientProps {
  teamUid: string;
  teamName: string;
  teamSlug: string;
  currentUserUid: string;
  currentUserRole: string;
  initialMembers: Member[];
  initialInvitations?: Invitation[];
  initialCredits?: number;
  initialDisplayName?: string | null;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-purple-400", bg: "bg-purple-500/10" },
  admin: { label: "Admin", icon: UserCog, color: "text-blue-400", bg: "bg-blue-500/10" },
  member: { label: "Member", icon: Users, color: "text-slate-400", bg: "bg-slate-500/10" },
  viewer: { label: "Viewer", icon: Eye, color: "text-slate-400", bg: "bg-slate-500/10" },
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

export default function MembersClient({
  teamUid,
  teamName,
  teamSlug,
  currentUserUid,
  currentUserRole,
  initialMembers,
  initialInvitations,
  initialCredits,
  initialDisplayName,
}: MembersClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations || []);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [loadingRemove, setLoadingRemove] = useState<string | null>(null);
  const [loadingCancel, setLoadingCancel] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    show: boolean;
    type: "confirm" | "alert";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ show: false, type: "alert", title: "", message: "" });

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin";
  const canInvite = isOwner || isAdmin;
  const roleLabel = ROLE_CONFIG[currentUserRole]?.label || currentUserRole;

  const handleAddMember = async () => {
    if (!email.trim()) return;
    setAddError("");
    setAddSuccess("");
    setAdding(true);

    try {
      const res = await fetch("/api/teams/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_uid: teamUid, email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setInvitations((prev) => [...prev, data.invitation]);
      setEmail("");
      setAddSuccess(data.message || `${data.invitation.email} invited`);
      setTimeout(() => setAddSuccess(""), 3000);
    } catch (e: any) {
      setAddError(e.message);
      setTimeout(() => setAddError(""), 5000);
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (targetUid: string, newRole: string) => {
    setLoadingRole(targetUid);
    try {
      const res = await fetch("/api/teams/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_uid: teamUid, user_uid: targetUid, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      setMembers((prev) =>
        prev.map((m) => (m.user_uid === targetUid ? { ...m, role: newRole as Member["role"] } : m))
      );
    } catch (e: any) {
      setModal({ show: true, type: "alert", title: "Role update failed", message: e.message });
    } finally {
      setLoadingRole(null);
    }
  };

  const handleRemove = async (targetUid: string) => {
    setLoadingRemove(targetUid);
    try {
      const res = await fetch(
        `/api/teams/members?team_uid=${teamUid}&user_uid=${targetUid}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");

      setMembers((prev) => prev.filter((m) => m.user_uid !== targetUid));
    } catch (e: any) {
      setModal({ show: true, type: "alert", title: "Remove failed", message: e.message });
    } finally {
      setLoadingRemove(null);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setLoadingCancel(invitationId);
    try {
      const res = await fetch(
        `/api/teams/members?team_uid=${teamUid}&invitation_id=${invitationId}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel invitation");

      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (e: any) {
      setModal({ show: true, type: "alert", title: "Cancel failed", message: e.message });
    } finally {
      setLoadingCancel(null);
    }
  };

  const confirmRemove = (member: Member) => {
    setModal({
      show: true,
      type: "confirm",
      title: "Remove member?",
      message: `Remove ${member.username || member.email || "this member"} from the team? This action cannot be undone.`,
      onConfirm: () => handleRemove(member.user_uid),
    });
  };

  return (
    <div
      className="min-h-screen transition-colors duration-500 font-sans relative"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none bg-grid" />
      <UnifiedNavbar
        initialCredits={initialCredits}
        initialDisplayName={initialDisplayName}
      />

      <div className="max-w-7xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-8 px-6 md:px-8 space-y-6 relative z-10">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Breadcrumbs
            homeHref={`/t/${teamSlug}`}
            homeLabel="Team"
            items={[
              { label: "Dashboard", href: `/t/${teamSlug}/dashboard` },
              { label: "Members" },
            ]}
          />
          <h1 className="text-2xl font-black mb-1" style={{ color: "var(--color-text-primary)" }}>
            Members
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
            {invitations.length > 0 && ` · ${invitations.length} pending invitation${invitations.length !== 1 ? "s" : ""}`}
          </p>
        </motion.div>

        {/* Header */}

        {/* Invite form */}
        {canInvite && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  placeholder="Invite by email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                />
              </div>
              <button
                onClick={handleAddMember}
                disabled={adding || !email.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
              >
                {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add
              </button>
            </div>
            <AnimatePresence>
              {addError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-bold text-red-500 mt-2"
                >
                  {addError}
                </motion.p>
              )}
              {addSuccess && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-bold text-emerald-500 mt-2"
                >
                  {addSuccess}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Member list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-sm"
        >
          {members.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {members.map((member) => {
                const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                const RoleIcon = config.icon;
                const isSelf = member.user_uid === currentUserUid;
                const isTargetOwner = member.role === "owner";

                return (
                  <div
                    key={member.user_uid}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(member.username || member.email || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                            {member.username || member.email || member.user_uid?.slice(0, 8)}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        {member.email && member.username && (
                          <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                            {member.email}
                          </p>
                        )}
                        {member.joined_at && (
                          <p className="text-[10px]" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>
                            Joined {formatDateTime(member.joined_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Role badge / selector */}
                      {isOwner && !isTargetOwner && !isSelf ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user_uid, e.target.value)}
                          disabled={loadingRole === member.user_uid}
                          className="text-[10px] font-black uppercase tracking-wider rounded-lg border px-2 py-1.5 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${config.color} ${config.bg}`}
                        >
                          {loadingRole === member.user_uid ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <RoleIcon size={12} />
                          )}
                          {config.label}
                        </span>
                      )}

                      {/* Remove button */}
                      {canInvite && !isTargetOwner && !isSelf && (
                        <button
                          onClick={() => confirmRemove(member)}
                          disabled={loadingRemove === member.user_uid}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          {loadingRemove === member.user_uid ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}

                      {/* Owner shield */}
                      {isTargetOwner && (
                        <Shield size={14} className="text-purple-400/50" title="Team owner" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Users size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>
                No members yet
              </p>
            </div>
          )}
        </motion.div>

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-sm"
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-toggle-bg)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
                Pending Invitations
              </p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                        {inv.email}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>
                        Invited {formatDateTime(inv.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10">
                      <Clock size={10} />
                      Pending
                    </span>
                    {canInvite && (
                      <button
                        onClick={() => handleCancelInvite(inv.id)}
                        disabled={loadingCancel === inv.id}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Cancel invitation"
                      >
                        {loadingCancel === inv.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <Modal
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal((prev) => ({ ...prev, show: false }))}
        onConfirm={modal.onConfirm}
        confirmText={modal.type === "confirm" ? "Remove" : "Got it"}
      />
    </div>
  );
}
