"use client";

import React, { useState, useEffect } from 'react';
import { Copy, Check, Monitor, Apple } from 'lucide-react';
import { motion } from 'framer-motion';

type OS = "mac" | "windows";

const QuickstartCard = () => {
    const [copied, setCopied] = useState(false);
    const [os, setOs] = useState<OS>("mac");

    // Auto-detect OS on mount
    useEffect(() => {
        const platform = (navigator.userAgent || "").toLowerCase();
        if (platform.includes("win")) {
            setOs("windows");
        } else {
            setOs("mac");
        }
    }, []);

    const commands: Record<OS, { label: string; cmd: string; rendered: React.ReactNode }> = {
        mac: {
            label: "Mac / Linux",
            cmd: `curl -fsSL https://uniskill.ai/connect.sh | bash`,
            rendered: (
                <div className="flex items-start gap-2">
                    <span className="text-slate-600 select-none shrink-0">$</span>
                    <span className="leading-relaxed">
                        <span className="text-blue-400">curl</span>
                        <span className="text-slate-400"> -fsSL </span>
                        <span className="text-green-400">https://uniskill.ai/connect.sh</span>
                        <span className="text-slate-400"> | </span>
                        <span className="text-blue-400">bash</span>
                    </span>
                </div>
            )
        },
        windows: {
            label: "Windows",
            cmd: `irm https://uniskill.ai/install.ps1 | iex`,
            rendered: (
                <div className="flex items-start gap-2">
                    <span className="text-slate-600 select-none shrink-0">&gt;</span>
                    <span className="leading-relaxed">
                        <span className="text-blue-400">irm</span>
                        <span className="text-slate-400"> </span>
                        <span className="text-green-400">https://uniskill.ai/install.ps1</span>
                        <span className="text-slate-400"> | </span>
                        <span className="text-blue-400">iex</span>
                    </span>
                </div>
            )
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(commands[os].cmd);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-card glow-blue w-full max-w-2xl mx-auto overflow-hidden transition-all duration-300 hover:shadow-blue-500/20 flex flex-col h-full"
        >
            {/* ─── Terminal Header ─── */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    <span className="ml-2 text-xs text-slate-500 font-mono italic">Initialize Environment</span>
                </div>

                {/* ─── OS Tab Switcher ─── */}
                <div className="flex gap-1 bg-black/30 rounded-lg p-1">
                    {(["mac", "windows"] as OS[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setOs(tab)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${os === tab
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            {tab === "mac" ? <Apple size={12} /> : <Monitor size={12} />}
                            {commands[tab].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Main Action ─── */}
            <div className="p-6 flex-grow flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            One Command Setup
                        </h3>
                        <p className="text-xs text-slate-500 font-mono tracking-tight">Run in your terminal. We'll handle the rest.</p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={copyToClipboard}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 mb-0.5 ${copied
                                ? "bg-green-500/15 text-green-400 border-green-500/30"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-400/50"
                            }`}
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={13} />}
                        <span className="font-medium text-[11px]">{copied ? 'Copied!' : 'Copy Command'}</span>
                    </motion.button>
                </div>

                <motion.div
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(15, 23, 42, 0.6)" }}
                    className="relative overflow-x-auto bg-slate-900/40 rounded-xl border border-white/5 p-5 font-mono text-xs leading-relaxed group/code transition-colors duration-300 shadow-inner"
                >
                    {commands[os].rendered}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default QuickstartCard;
