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
                <div className="flex items-start gap-2 text-[13px]">
                    <span className="select-none shrink-0 font-bold" style={{ color: "var(--color-code-flag)" }}>$</span>
                    <span className="leading-relaxed font-bold">
                        <span style={{ color: "var(--color-code-keyword)" }}>curl</span>
                        <span style={{ color: "var(--color-code-flag)" }}> -fsSL </span>
                        <span style={{ color: "var(--color-code-string)" }}>https://uniskill.ai/connect.sh</span>
                        <span style={{ color: "var(--color-code-flag)" }}> | </span>
                        <span style={{ color: "var(--color-code-keyword)" }}>bash</span>
                    </span>
                </div>
            )
        },
        windows: {
            label: "Windows",
            cmd: `irm https://uniskill.ai/connect.ps1 | iex`,
            rendered: (
                <div className="flex items-start gap-2 text-[13px]">
                    <span className="select-none shrink-0 font-bold" style={{ color: "var(--color-code-flag)" }}>&gt;</span>
                    <span className="leading-relaxed font-bold">
                        <span style={{ color: "var(--color-code-keyword)" }}>irm</span>
                        <span style={{ color: "var(--color-code-flag)" }}> </span>
                        <span style={{ color: "var(--color-code-string)" }}>https://uniskill.ai/connect.ps1</span>
                        <span style={{ color: "var(--color-code-flag)" }}> | </span>
                        <span style={{ color: "var(--color-code-keyword)" }}>iex</span>
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
            style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
        >
            {/* ─── Terminal Header ─── */}
            <div 
                className="flex justify-between items-center px-6 py-4 border-b"
                style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    <span className="ml-2 text-xs font-mono italic" style={{ color: "var(--color-text-secondary)" }}>Initialize Environment</span>
                </div>

                {/* ─── OS Tab Switcher ─── */}
                <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: "var(--color-os-tabs-bg)" }}>
                    {(["mac", "windows"] as OS[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setOs(tab)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${os === tab
                                ? "shadow-[0_2px_10px_rgba(37, 99, 235, 0.1)]"
                                : "hover:bg-slate-200 dark:hover:bg-slate-700/50"
                                }`}
                            style={{ 
                                backgroundColor: os === tab ? "var(--color-tab-active-bg)" : "transparent",
                                color: os === tab ? "var(--color-tab-active-text)" : "var(--color-text-secondary)",
                                border: os === tab ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid transparent"
                            }}
                        >
                            {commands[tab].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Main Action ─── */}
            <div className="p-6 flex-grow flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                            One Command Setup
                        </h3>
                        <p className="text-xs font-mono tracking-tight" style={{ color: "var(--color-text-secondary)" }}>Run in your terminal. We'll handle the rest.</p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={copyToClipboard}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 mb-0.5 ${copied
                            ? "bg-green-500/15 text-green-400 border-green-500/30"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400/50"
                            }`}
                        title="Copy to clipboard"
                        style={{ 
                            color: copied ? "" : "var(--color-blue)",
                            borderColor: copied ? "" : "rgba(37, 99, 235, 0.2)"
                        }}
                    >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={13} />}
                        <span className="font-medium text-[11px]">{copied ? 'Copied!' : 'Copy Command'}</span>
                    </motion.button>
                </div>

                <motion.div
                    whileHover={{ scale: 1.005 }}
                    className="relative overflow-x-auto rounded-xl border p-5 font-mono text-xs leading-relaxed group/code transition-all duration-300"
                    style={{ 
                        backgroundColor: "var(--color-terminal-bg)",
                        borderColor: "var(--color-border)",
                    }}
                >
                    {commands[os].rendered}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default QuickstartCard;
