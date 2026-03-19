// src/components/Dashboard/IntegrationCard.tsx
// OS-aware install command card with Mac/Windows tab switcher

"use client";

import { Terminal, Copy, Check, ShieldCheck, Monitor, Apple } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface IntegrationCardProps {
    rawKey?: string;
}

type OS = "mac" | "windows";

export default function IntegrationCard({ rawKey }: IntegrationCardProps) {
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

    // Helper to generate commands based on the presence of a real key
    const getCommands = (): Record<OS, { label: string; cmd: string; rendered: React.ReactNode }> => {
        if (rawKey) {
            // When we have the real key (e.g. right after sign-in), give the one-click long command
            return {
                mac: {
                    label: "Mac / Linux",
                    cmd: `curl -fsSL https://uniskill.ai/connect.sh | bash -s -- ${rawKey}`,
                    rendered: (
                        <div className="flex items-start gap-2 text-[13px]">
                            <span className="select-none shrink-0 font-bold" style={{ color: "var(--color-code-flag)" }}>$</span>
                            <span className="leading-relaxed font-bold whitespace-nowrap">
                                <span style={{ color: "var(--color-code-keyword)" }}>curl</span>
                                <span style={{ color: "var(--color-code-flag)" }}> -fsSL </span>
                                <span style={{ color: "var(--color-code-string)" }}>https://uniskill.ai/connect.sh</span>
                                <span style={{ color: "var(--color-code-flag)" }}> | </span>
                                <span style={{ color: "var(--color-code-keyword)" }}>bash</span>
                                <span style={{ color: "var(--color-code-flag)" }}> -s -- </span>
                                <span style={{ color: "var(--color-code-keyword)" }}>{rawKey}</span>
                            </span>
                        </div>
                    ),
                },
                windows: {
                    label: "Windows",
                    cmd: `$env:UNISKILL_KEY="${rawKey}"; irm https://uniskill.ai/connect.ps1 | iex`,
                    rendered: (
                        <div className="flex items-start gap-2 text-[13px]">
                            <span className="select-none shrink-0 font-bold" style={{ color: "var(--color-code-flag)" }}>&gt;</span>
                            <span className="leading-relaxed font-bold whitespace-nowrap">
                                <span style={{ color: "var(--color-code-keyword)" }}>$env:UNISKILL_KEY</span>
                                <span style={{ color: "var(--color-code-flag)" }}>=&quot;</span>
                                <span style={{ color: "var(--color-code-keyword)" }}>{rawKey}</span>
                                <span style={{ color: "var(--color-code-flag)" }}>&quot;; </span>
                                <span style={{ color: "var(--color-code-keyword)" }}>irm</span>
                                <span style={{ color: "var(--color-code-flag)" }}> </span>
                                <span style={{ color: "var(--color-code-string)" }}>https://uniskill.ai/connect.ps1</span>
                                <span style={{ color: "var(--color-code-flag)" }}> | </span>
                                <span style={{ color: "var(--color-code-keyword)" }}>iex</span>
                            </span>
                        </div>
                    ),
                },
            };
        } else {
            // When there is no key available on the page, show the clean interactive commands
            return {
                mac: {
                    label: "Mac / Linux",
                    cmd: `curl -fsSL https://uniskill.ai/connect.sh | bash`,
                    rendered: (
                        <div className="flex items-start gap-2 text-[13px]">
                            <span className="select-none shrink-0 font-bold" style={{ color: "var(--color-code-flag)" }}>$</span>
                            <span className="leading-relaxed font-bold whitespace-nowrap">
                                <span style={{ color: "var(--color-code-keyword)" }}>curl</span>
                                <span style={{ color: "var(--color-code-flag)" }}> -fsSL </span>
                                <span style={{ color: "var(--color-code-string)" }}>https://uniskill.ai/connect.sh</span>
                                <span style={{ color: "var(--color-code-flag)" }}> | </span>
                                <span style={{ color: "var(--color-code-keyword)" }}>bash</span>
                            </span>
                        </div>
                    ),
                },
                windows: {
                    label: "Windows",
                    cmd: `irm https://uniskill.ai/connect.ps1 | iex`,
                    rendered: (
                        <div className="flex items-start gap-2 text-[13px]">
                            <span className="select-none shrink-0 font-bold" style={{ color: "var(--color-code-flag)" }}>&gt;</span>
                            <span className="leading-relaxed font-bold whitespace-nowrap">
                                <span style={{ color: "var(--color-code-keyword)" }}>irm</span>
                                <span style={{ color: "var(--color-code-flag)" }}> </span>
                                <span style={{ color: "var(--color-code-string)" }}>https://uniskill.ai/connect.ps1</span>
                                <span style={{ color: "var(--color-code-flag)" }}> | </span>
                                <span style={{ color: "var(--color-code-keyword)" }}>iex</span>
                            </span>
                        </div>
                    ),
                },
            };
        }
    };

    const commands = getCommands();

    const handleCopy = () => {
        navigator.clipboard.writeText(commands[os].cmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full glass-card p-6 flex flex-col">

            {/* ── Title Row ── */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500">
                    <Terminal size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Tool Suite Integration</h3>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        One command to connect your AI client.
                    </p>
                </div>
            </div>

            {/* ── OS Tab Switcher ── */}
            <div className="flex gap-1 mb-4 rounded-lg p-1 w-fit" style={{ backgroundColor: "var(--color-os-tabs-bg)" }}>
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

            {/* ── Terminal Code Block ── */}
            <div 
                className="rounded-xl overflow-hidden border mb-6 transition-all duration-300"
                style={{ 
                    backgroundColor: "var(--color-terminal-bg)", 
                    borderColor: "var(--color-border)" 
                }}
            >
                <div 
                    className="flex justify-between items-center px-4 py-2 border-b"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.03)" }}
                >
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                        <span className="ml-2 text-[10px] font-mono italic" style={{ color: "var(--color-text-secondary)" }}>
                            {os === "mac" ? "Terminal" : "PowerShell"}
                        </span>
                    </div>

                    {/* Copy button Moved Here */}
                    <motion.button
                        onClick={handleCopy}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 rounded transition-all flex items-center gap-1.5 hover:bg-white/10"
                        style={{ color: "var(--color-text-secondary)" }}
                        title={copied ? "Copied!" : "Copy command"}
                    >
                        {copied ? (
                            <>
                                <Check size={12} className="text-green-500" />
                                <span className="text-[10px] font-bold text-green-500">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={12} />
                                <span className="text-[10px] font-bold">Copy</span>
                            </>
                        )}
                    </motion.button>
                </div>
                <div className="p-5 font-mono overflow-x-auto">
                    {commands[os].rendered}
                </div>
            </div>

            {/* ── Feature Explanation ── */}
            <div className="space-y-3 mt-auto">
                <div className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <ShieldCheck size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                        Auto-detects your AI client (Claude, Cursor, Windsurf) and injects the MCP config.
                    </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    Your{" "}
                    <code 
                        className="px-1 rounded"
                        style={{ 
                            backgroundColor: "var(--color-toggle-bg)",
                            color: "var(--color-indigo)"
                        }}
                    >
                        API key
                    </code>{" "}
                    is written into your client&apos;s config — no manual setup needed.
                    {!rawKey && (
                        <span className="block mt-1 text-amber-600/70 font-medium">
                            ⚠ Your key is only shown once at registration.
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}
