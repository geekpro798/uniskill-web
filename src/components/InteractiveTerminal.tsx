"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const lines = [
  { text: "curl -X POST https://api.uniskill.ai/v1/skills/execute \\", color: "text-blue-400" },
  { text: "  -H \"Authorization: Bearer sk_live_...\" \\", color: "text-slate-400" },
  { text: "  -d '{\"skill\": \"web_search\", \"query\": \"AI trends 2024\"}'", color: "text-slate-400" },
  { text: "", color: "text-white" },
  { text: "> Requesting Search Skill...", color: "text-yellow-400/80" },
  { text: "> Logic: searching 54 sources...", color: "text-slate-500" },
  { text: "> Status: 200 OK", color: "text-green-400" },
  { text: "{ \"result\": \"AI agents is the top trend...\" }", color: "text-cyan-400" },
];

export default function InteractiveTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLines((prev) => (prev < lines.length ? prev + 1 : prev));
    }, 800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card glow-blue w-full max-w-2xl mx-auto overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Request Preview
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-6 font-mono text-[13px] leading-relaxed min-h-[240px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${line.color} mb-1.5 flex items-start gap-3`}
          >
            {line.text.startsWith(">") ? null : (
              <span className="text-slate-600 select-none">$</span>
            )}
            <span>{line.text}</span>
          </motion.div>
        ))}
        {visibleLines < lines.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-4 bg-blue-500 align-middle ml-1"
          />
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between">
        <div className="text-[10px] text-slate-600 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          API Connected
        </div>
        <div className="text-[10px] text-slate-600 font-mono">
          UTF-8 / zsh
        </div>
      </div>
    </div>
  );
}
