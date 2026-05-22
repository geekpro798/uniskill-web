"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Key,
  CheckCircle2,
  Settings,
  ExternalLink,
  Rocket,
} from "lucide-react";

const SESSION_STORAGE_KEY = "uniskill_session_meta";
const ONBOARDING_DISMISSED_KEY = "uniskill_onboarding_dismissed";

interface OnboardingBannerProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function OnboardingBanner({ visible, onDismiss }: OnboardingBannerProps) {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible]);

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    onDismiss();
  };

  const handleOpenSettings = () => {
    window.location.href = "/settings#security";
  };

  const handleDone = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden mb-6"
    >
      <div className="bg-white dark:bg-slate-900/60 border border-blue-200 dark:border-blue-800/30 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-blue-100 dark:border-blue-800/20 bg-blue-50/50 dark:bg-blue-900/10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Rocket size={15} className="text-blue-500" />
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                Get Started in 2 Steps
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                    activeStep === 1
                      ? "bg-blue-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {activeStep > 1 ? <CheckCircle2 size={11} /> : "1"}
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    activeStep === 1
                      ? "text-slate-700 dark:text-slate-200"
                      : "text-slate-400 line-through"
                  }`}
                >
                  Generate Session Key
                </span>
              </div>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 max-w-[40px]" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                    activeStep === 2
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    activeStep === 2
                      ? "text-slate-700 dark:text-slate-200"
                      : "text-slate-400"
                  }`}
                >
                  Connect Your Agent
                </span>
              </div>
            </div>

            {/* Step 1 */}
            {activeStep === 1 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">
                  Create a session key to authorize your local AI agent.
                  Private key is generated in your browser — never leaves your machine.
                </p>
                <button
                  onClick={handleOpenSettings}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <Settings size={13} />
                  Open Settings
                  <ExternalLink size={11} className="opacity-60" />
                </button>
              </div>
            )}

            {/* Step 2 */}
            {activeStep === 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-900/30 w-fit">
                  <CheckCircle2 size={11} />
                  Session key generated
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your session key is ready. Copy the setup command from your Settings page and run it in your AI client's terminal.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenSettings}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-xl active:scale-[0.98] transition-all whitespace-nowrap"
                  >
                    <Settings size={12} />
                    Settings
                  </button>
                  <button
                    onClick={handleDone}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl shadow-sm active:scale-[0.98] transition-all whitespace-nowrap"
                  >
                    <CheckCircle2 size={12} />
                    I'm all set!
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </motion.div>
  );
}
