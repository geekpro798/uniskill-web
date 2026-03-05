"use client";

import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * QuickstartCard 组件：恢复三层逻辑结构，并融合 Skills 页面样式细节
 * 结构：Terminal Frame -> Step 1 -> Terminal Action -> Step 2
 */
const QuickstartCard = () => {
    // 逻辑：定义设置命令变量
    const setupCommand = "curl -fsSL https://uniskill.ai/setup-skills.sh | bash -s -- <YOUR_KEY>";

    // 逻辑：实现复制到剪贴板功能
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(setupCommand);
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
            className="glass-card glow-blue w-full max-w-2xl mx-auto overflow-hidden transition-all duration-300 hover:shadow-blue-500/20"
        >
            {/* ─── Terminal Header (标题改为 Initialize Environment) ─── */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-500 font-mono italic">Initialize Environment</span>
            </div>

            {/* ─── Main Action: 初始化环境 ─── */}
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            Initialize Environment
                        </h3>
                        <p className="text-xs text-slate-500 font-mono tracking-tight">Run the installation script in your terminal</p>
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
                    <div className="flex items-start gap-2">
                        <span className="text-slate-600 select-none shrink-0">$</span>
                        <span className="leading-relaxed">
                            <span className="text-blue-400">curl</span>
                            <span className="text-slate-400"> -fsSL </span>
                            <span className="text-green-400">https://uniskill.ai/setup-skills.sh</span>
                            <span className="text-slate-400"> | </span>
                            <span className="text-blue-400">bash</span>
                            <span className="text-slate-400"> -s -- </span>
                            <span className="text-slate-500 italic">your_api_key</span>
                        </span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default QuickstartCard;
