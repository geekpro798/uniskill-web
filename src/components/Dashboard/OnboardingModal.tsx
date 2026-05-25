"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Key,
  Terminal,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Copy,
  Settings,
} from "lucide-react";

const SESSION_STORAGE_KEY = "uniskill_session_meta";
const ONBOARDING_DISMISSED_KEY = "uniskill_onboarding_dismissed";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);

  // Check if user already has session keys to auto-advance to step 2
  useEffect(() => {
    if (!isOpen) return;
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const hasActive = Array.isArray(parsed)
          ? parsed.some((s: any) => s.expiresAt > Date.now())
          : parsed.expiresAt > Date.now();
        if (hasActive) {
          setActiveStep(2);
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    onClose();
  };

  const handleOpenSettings = () => {
    window.location.href = "/settings#security";
  };

  const connectCmd = "curl -fsSL https://uniskill.ai/connect.sh | bash";

  const handleCopy = () => {
    navigator.clipboard.writeText(connectCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Key size={18} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Get Started in 2 Steps
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Connect your AI agent to UniSkill
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-5">
              {/* ── Step Indicator ── */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      activeStep === 1
                        ? "bg-blue-500 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {activeStep > 1 ? <CheckCircle2 size={12} /> : "1"}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      activeStep === 1
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400 line-through"
                    }`}
                  >
                    Generate Session Key
                  </span>
                </div>
                <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      activeStep === 2
                        ? "bg-blue-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      activeStep === 2
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400"
                    }`}
                  >
                    Connect Your Agent
                  </span>
                </div>
              </div>

              {/* ── Step 1 Content ── */}
              {activeStep === 1 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    Create a session key to authorize your local AI agent. The
                    private key is generated in your browser and never leaves
                    your machine.
                  </p>
                  <button
                    onClick={handleOpenSettings}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-md active:scale-[0.98] transition-all"
                  >
                    <Settings size={14} />
                    Open Settings
                    <ExternalLink size={12} className="opacity-60" />
                  </button>
                  <p className="text-[10px] text-slate-400 mt-3 text-center">
                    You&apos;ll be taken to Account &amp; Security → Sovereign
                    Identity Access
                  </p>
                </div>
              )}

              {/* ── Step 2 Content ── */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  {/* Step 1 completed badge */}
                  <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle2 size={12} />
                    Session key generated
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      Run this command in your terminal. It auto-detects your AI
                      client (Claude Desktop, Cursor, Windsurf) and injects the
                      MCP config — no manual setup needed.
                    </p>

                    {/* Code block */}
                    <div className="bg-slate-900 dark:bg-black rounded-lg p-3 font-mono text-xs text-white flex items-center justify-between group">
                      <span className="break-all pr-2 select-all">
                        {connectCmd}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors shrink-0"
                      >
                        {copied ? (
                          <CheckCircle2
                            size={14}
                            className="text-emerald-400"
                          />
                        ) : (
                          <Copy size={14} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleDone}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-md active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 size={14} />
                    Got it, I&apos;m all set!
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
