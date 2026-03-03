// src/components/Dashboard/QuickStart.tsx
// Auto-Integration QuickStart card — 展示一键安装脚本命令

"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface QuickStartProps {
    // 用户的原始 API Token（仅首次登录时由 session 提供；后续为 undefined）
    rawApiToken?: string;
}

export default function QuickStart({ rawApiToken }: QuickStartProps) {
    const [copied, setCopied] = useState(false);

    // 若 token 可用则注入命令行，否则展示占位符
    const displayToken = rawApiToken ?? "your-token-here";

    // 一键安装命令：curl 下载 install.sh 并通过 bash 自动配置 .env
    const installCommand = `curl -s https://uniskill.io/install.sh | bash -s -- ${displayToken}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(installCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-card p-6 border border-slate-700/50">
            {/* ── 标题栏 ── */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* 终端图标 */}
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                            <polyline points="4,17 10,11 4,5" />
                            <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-slate-300">Tool Suite Integration</span>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Add UniSkill capabilities to your agent without changing your LLM provider.
                        </p>
                    </div>
                </div>

                {/* 复制按钮 */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all shrink-0 ${copied
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                        }`}
                >
                    {copied ? (
                        <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20,6 9,17 4,12" />
                            </svg>
                            Copied!
                        </>
                    ) : (
                        <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy
                        </>
                    )}
                </motion.button>
            </div>

            {/* ── 终端代码块 ── */}
            <div className="code-block text-xs leading-relaxed font-mono flex items-start gap-2 overflow-x-auto">
                {/* 提示符 */}
                <span className="text-slate-600 select-none shrink-0">$</span>
                <span>
                    {/* curl 命令关键字着色 */}
                    <span className="text-blue-400">curl</span>
                    <span className="text-slate-400"> -s </span>
                    <span className="text-green-400">https://uniskill.io/install.sh</span>
                    <span className="text-slate-400"> | </span>
                    <span className="text-blue-400">bash</span>
                    <span className="text-slate-400"> -s -- </span>
                    {/* 注入 token，若无 token 则用暗灰色显示占位符 */}
                    <span className={rawApiToken ? "text-cyan-400" : "text-slate-500 italic"}>
                        {displayToken}
                    </span>
                </span>
            </div>

            {/* ── 说明文字 ── */}
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                This script injects{" "}
                <code className="text-slate-500 bg-slate-800 px-1 rounded">UNISKILL_API_KEY</code>{" "}
                into your <code className="text-slate-500 bg-slate-800 px-1 rounded">.env</code> and generates tool manifests for frameworks like OpenClaw.
                {!rawApiToken && (
                    <span className="block mt-1 text-amber-600/70">
                        ⚠ Your token is only shown once at registration — re-login to retrieve a new session if needed.
                    </span>
                )}
            </p>
        </div>
    );
}
