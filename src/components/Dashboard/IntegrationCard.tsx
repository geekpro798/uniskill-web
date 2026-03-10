// src/components/Dashboard/IntegrationCard.tsx
// OS-aware install command card with Mac/Windows tab switcher

"use client";

import { Terminal, Copy, Check, ShieldCheck, Monitor, Apple } from "lucide-react";
import { useState, useEffect } from "react";

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

    const displayKey = rawKey ?? "your-key-here";

    const commands: Record<OS, { label: string; cmd: string; rendered: React.ReactNode }> = {
        mac: {
            label: "Mac / Linux",
            cmd: `curl -fsSL https://uniskill.ai/connect.sh | bash -s -- ${displayKey}`,
            rendered: (
                <code className="break-all block">
                    <span className="text-slate-500">$ </span>
                    <span className="text-blue-400">curl</span>
                    <span className="text-slate-400"> -fsSL </span>
                    <span className="text-green-400">https://uniskill.ai/connect.sh</span>
                    <span className="text-slate-400"> | </span>
                    <span className="text-blue-400">bash</span>
                    <span className="text-slate-400"> -s -- </span>
                    <span className={rawKey ? "text-indigo-300" : "text-slate-500 italic"}>
                        {displayKey}
                    </span>
                </code>
            ),
        },
        windows: {
            label: "Windows",
            cmd: `$env:UNISKILL_KEY="${displayKey}"; irm https://uniskill.ai/install.ps1 | iex`,
            rendered: (
                <code className="break-all block">
                    <span className="text-slate-500">&gt; </span>
                    <span className="text-yellow-400">$env:UNISKILL_KEY</span>
                    <span className="text-slate-400">=&quot;</span>
                    <span className={rawKey ? "text-indigo-300" : "text-slate-500 italic"}>
                        {displayKey}
                    </span>
                    <span className="text-slate-400">&quot;; </span>
                    <span className="text-blue-400">irm</span>
                    <span className="text-slate-400"> </span>
                    <span className="text-green-400">https://uniskill.ai/install.ps1</span>
                    <span className="text-slate-400"> | </span>
                    <span className="text-blue-400">iex</span>
                </code>
            ),
        },
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(commands[os].cmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col">

            {/* ── Title Row ── */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                        <Terminal size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Tool Suite Integration</h3>
                        <p className="text-xs text-slate-500">
                            One command to connect your AI client.
                        </p>
                    </div>
                </div>
                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
                    title={copied ? "Copied!" : "Copy command"}
                >
                    {copied
                        ? <Check size={18} className="text-green-500" />
                        : <Copy size={18} />
                    }
                </button>
            </div>

            {/* ── OS Tab Switcher ── */}
            <div className="flex gap-1 mb-3 bg-black/30 rounded-lg p-1 w-fit">
                {(["mac", "windows"] as OS[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setOs(tab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${os === tab
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        {tab === "mac"
                            ? <Apple size={12} />
                            : <Monitor size={12} />
                        }
                        {commands[tab].label}
                    </button>
                ))}
            </div>

            {/* ── Terminal Code Block ── */}
            <div className="bg-black/60 rounded-xl p-4 font-mono text-sm mb-6 border border-white/5">
                <div className="text-slate-500 mb-2 text-[10px] uppercase tracking-widest">
                    {os === "mac" ? "Terminal" : "PowerShell"}
                </div>
                {commands[os].rendered}
            </div>

            {/* ── Feature Explanation ── */}
            <div className="space-y-3 mt-auto">
                <div className="flex items-start gap-2 text-xs text-slate-400">
                    <ShieldCheck size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                        Auto-detects your AI client (Claude, Cursor, Windsurf) and injects the MCP config.
                    </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Your{" "}
                    <code className="text-indigo-400 bg-slate-800 px-1 rounded">API key</code>{" "}
                    is written into your client&apos;s config — no manual setup needed.
                    {!rawKey && (
                        <span className="block mt-1 text-amber-600/70">
                            ⚠ Your key is only shown once at registration.
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}
