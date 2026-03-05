// src/components/Dashboard/IntegrationCard.tsx
// Refactored for Tool/Plugin integration (Option B)
// 针对工具/插件模式（方案 B）重构的集成卡片

"use client";

import { Terminal, Copy, Check, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface IntegrationCardProps {
    // 用户的原始 API Key（仅首次登录由 session 提供；后续为 undefined）
    rawKey?: string;
}

export default function IntegrationCard({ rawKey }: IntegrationCardProps) {
    const [copied, setCopied] = useState(false);

    // 若 rawKey 可用则注入命令行，否则展示占位符
    const displayKey = rawKey ?? "your-key-here";

    // 更新后的脚本名称与参数，侧重于"能力注入"
    const installCmd = `curl -fsSL https://uniskill.ai/setup-skills.sh | bash -s -- ${displayKey}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(installCmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col">
            {/* ── 标题栏 ── */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                        <Terminal size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Tool Suite Integration</h3>
                        <p className="text-xs text-slate-500">
                            Recommended: Setup UniSkill as a plugin provider.
                        </p>
                    </div>
                </div>
                {/* 复制按钮 */}
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

            {/* Terminal Code Block 终端代码块 */}
            <div className="bg-black/60 rounded-xl p-4 font-mono text-sm mb-6 border border-white/5">
                <div className="text-slate-500 mb-2 text-[10px] uppercase tracking-widest">
                    Execute in project root
                </div>
                {/* 命令行：API Key 有值时高亮展示，否则以斜体灰色显示占位符 */}
                <code className="break-all block">
                    <span className="text-slate-500">$ </span>
                    <span className="text-blue-400">curl</span>
                    <span className="text-slate-400"> -fsSL </span>
                    <span className="text-green-400">https://uniskill.ai/setup-skills.sh</span>
                    <span className="text-slate-400"> | </span>
                    <span className="text-blue-400">bash</span>
                    <span className="text-slate-400"> -s -- </span>
                    <span className={rawKey ? "text-indigo-300" : "text-slate-500 italic"}>
                        {displayKey}
                    </span>
                </code>
            </div>

            {/* Feature List 插件模式的功能特点 */}
            <div className="space-y-3 mt-auto">
                <div className="flex items-start gap-2 text-xs text-slate-400">
                    <ShieldCheck size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>Keep your local LLM settings (OpenAI / Claude) intact.</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                    This script injects your{" "}
                    <code className="text-indigo-400 bg-slate-800 px-1 rounded">API key</code>{" "}
                    and auto-syncs cloud skills into your OpenClaw project.
                    {/* 该脚本会自动配置环境变量并为 OpenClaw 同步云端技能 */}
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
