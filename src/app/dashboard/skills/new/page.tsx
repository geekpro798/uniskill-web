'use client';

import React, { useState, useRef } from 'react';
import { 
  Save, Terminal, Globe, Lock, AlertCircle, KeyRound, 
  Plus, Trash2, Sparkles, Wand2, Loader2, CheckCircle2,
  Activity 
} from 'lucide-react';
import { useSession, signIn } from "next-auth/react";
import { useEffect } from 'react';
import { motion } from "framer-motion";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";

export default function CreateSkillPage() {
  const { data: session, status } = useSession();
  const [liveCredits, setLiveCredits] = useState<number | undefined>(undefined);

  const fetchLiveCredits = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setLiveCredits(data.credits);
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchLiveCredits();
      const interval = setInterval(fetchLiveCredits, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session?.user?.id]);
  // ==========================================
  // State: Magic Architect (AI 生成器状态)
  // ==========================================
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [magicSuccess, setMagicSuccess] = useState(false);

  // ==========================================
  // State: Skill Form (表单核心状态)
  // ==========================================
  const [displayName, setDisplayName] = useState('');
  const [skillName, setSkillName] = useState(''); 
  const [description, setDescription] = useState('');
  const [markdownBody, setMarkdownBody] = useState('');
  const [secrets, setSecrets] = useState<{key: string, value: string}[]>([{ key: '', value: '' }]);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); // 🌟 升级：使用字典存储字段级错误状态

  // 🌟 新增：部署成功后的状态，用于触发原地沙箱 (State for post-deployment sandbox)
  const [deployedSkill, setDeployedSkill] = useState<{id: string, name: string} | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testLog, setTestLog] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg-primary)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 text-center max-w-md w-full"
        >
          <div className="w-14 h-14 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Sign in to UniSkill</h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>Access your API key and usage dashboard</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => signIn("github")}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>Continue with GitHub</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg-primary)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--color-text-secondary)" }}>
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // 自动生成符合 MCP 规范的 Skill Name (Auto-generate valid MCP tool name)
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setDisplayName(newVal);
    if (!magicSuccess) {
      setSkillName(newVal.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/(^_|_$)+/g, ''));
    }
  };

  // 环境变量操作逻辑 (Handlers for Secrets)
  const handleAddSecret = () => setSecrets([...secrets, { key: '', value: '' }]);
  const handleRemoveSecret = (index: number) => setSecrets(secrets.filter((_, i) => i !== index));
  const handleSecretChange = (index: number, field: 'key' | 'value', val: string) => {
    const newSecrets = [...secrets];
    newSecrets[index][field] = val;
    setSecrets(newSecrets);
  };

  // ==========================================
  // 核心逻辑：调用 AI 接口并解析填充表单
  // (Core Logic: Call AI API, parse Markdown, and autofill form)
  // ==========================================
  const handleMagicGenerate = async () => {
    if (!magicPrompt) return;
    setIsGenerating(true);
    setMagicSuccess(false);
    setDeployedSkill(null); // 如果重新生成，隐藏沙箱 (Hide sandbox on regenerate)

    try {
      // 模拟网络延迟和 AI 生成时间 (Simulating LLM generation time)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockResponse = `---
skill_name: my_crypto_tracker
display_name: Crypto Price Tracker
secrets:
  - COINGECKO_API_KEY
---
# Description
Fetches real-time cryptocurrency prices.

# Parameters
\`\`\`json
{
  "type": "object",
  "properties": {
    "coin_id": { "type": "string", "description": "ID of the coin (e.g., bitcoin)" }
  },
  "required": ["coin_id"]
}
\`\`\`

# Implementation
\`\`\`yaml
type: custom_http
endpoint: "https://api.coingecko.com/api/v3/simple/price"
method: "GET"
headers:
  x-cg-demo-api-key: "{{SECRETS.COINGECKO_API_KEY}}"
payload:
  ids: "{{coin_id}}"
  vs_currencies: "usd"
\`\`\`
`;

      const frontmatterMatch = mockResponse.match(/^---\n([\s\S]+?)\n---/);
      let bodyStr = mockResponse;
      
      if (frontmatterMatch) {
        const fm = frontmatterMatch[1];
        bodyStr = mockResponse.replace(/^---\n[\s\S]+?\n---\n*/, '');

        const sNameMatch = fm.match(/skill_name:\s*(.+)/);
        const dNameMatch = fm.match(/display_name:\s*(.+)/);
        
        if (sNameMatch) setSkillName(sNameMatch[1].trim());
        if (dNameMatch) setDisplayName(dNameMatch[1].trim());

        const secretsMatch = fm.match(/secrets:\n([\s\S]+?)(?=\n[a-z_]+:|$)/);
        if (secretsMatch) {
          const secretLines = secretsMatch[1].split('\n').filter(l => l.trim().startsWith('-'));
          const extractedSecrets = secretLines.map(line => ({ key: line.replace('-', '').trim(), value: '' }));
          setSecrets(extractedSecrets.length > 0 ? extractedSecrets : [{ key: '', value: '' }]);
        }
      }

      const descMatch = bodyStr.match(/# Description\n([^#]+)/);
      if (descMatch) setDescription(descMatch[1].trim());

      setMarkdownBody(bodyStr.trim());
      setMagicSuccess(true);
      
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (error) {
      console.error('Magic Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ==========================================
  // 提交最终配置到数据库 (Submit final config to DB)
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // 每次提交前重置错误状态

    // 🌟 核心拦截：精细化的字段级内联校验 (Field-level validation)
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = 'Display Name is required.';
    if (!skillName.trim()) newErrors.skillName = 'Skill ID is required.';
    if (!description.trim()) newErrors.description = 'Short Description is required.';
    if (!markdownBody.trim()) newErrors.markdownBody = 'Skill Manifest (Markdown) is required.';

    // 如果字典里有错误，阻止提交并滚动到顶部
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setIsSubmitting(true);
    try {
      const validSecrets = secrets.filter(s => s.key.trim() !== '' && s.value.trim() !== '');
      const payload = {
        skill_name: skillName,
        display_name: displayName,
        description,
        markdown_body: markdownBody,
        visibility: isPublic ? 'public' : 'private',
        secrets: validSecrets 
      };

      console.log('Deploying Final Skill:', payload);
      // 模拟部署延迟 (Simulate deployment delay)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 🌟 核心变更：不再弹窗，而是将状态置为已部署，触发沙箱 UI
      // alert('Skill deployed successfully! Your API keys are encrypted at rest.');
      setDeployedSkill({ id: skillName, name: displayName });

      // 平滑滚动至页面底部的沙箱区域
      // (Smooth scroll to the sandbox area at the bottom)
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 150);

    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🌟 沙箱执行逻辑 (Sandbox Execution Logic)
  const handleRunTest = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    setTestLog(null);
    try {
      // 模拟调用刚创建好的云端 Endpoint
      // (Simulate hitting the newly deployed endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟成功的 JSON 响应 (Simulate a successful JSON response)
      const mockResponse = {
        status: "success",
        tool_invoked: deployedSkill?.id,
        latency_ms: 142,
        result: {
          data: "Mock response generated successfully based on your prompt.",
          input_received: testInput
        }
      };
      
      setTestLog(JSON.stringify(mockResponse, null, 2));
    } catch (err) {
      setTestLog(JSON.stringify({ error: "Failed to execute. Check your API Keys." }, null, 2));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <DashboardNavbar credits={liveCredits} totalCredits={500} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* ==========================================
              模块 1：魔法生成器 (Module 1: Magic Architect)
              统一适配了浅色与深色模式 (Adapted for both light and dark modes)
              ========================================== */}
          <div className="bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl relative transition-colors duration-300">
            {/* 背景光晕效果，仅在深色模式下明显 (Background glow, prominent in dark mode) */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none transition-all"></div>
            
            <div className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl border border-purple-200 dark:border-purple-500/30 transition-colors">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide transition-colors">Magic Skill Architect</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Describe what you want the tool to do. AI will generate the API schema & implementation.</p>
                </div>
              </div>

              <div className="relative group">
                <textarea
                  value={magicPrompt}
                  onChange={(e) => setMagicPrompt(e.target.value)}
                  placeholder="e.g., Build a tool that searches crypto prices on Coingecko using my API key..."
                  className="w-full h-32 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 pr-16 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500/70 focus:bg-white dark:focus:bg-slate-900 focus:ring-0 outline-none transition-all resize-none text-sm leading-relaxed"
                />
                <button
                  onClick={handleMagicGenerate}
                  disabled={isGenerating || !magicPrompt}
                  className="absolute bottom-4 right-4 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.2)] dark:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center gap-2 font-medium text-sm"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Thinking...</>
                  ) : (
                    <><Wand2 className="w-4 h-4" /> Generate</>
                  )}
                </button>
              </div>

              {magicSuccess && (
                <div className="mt-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 px-4 py-2.5 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 transition-colors">
                  <CheckCircle2 className="w-5 h-5" />
                  Architecture synthesized! Review the configuration and add your API Keys below.
                </div>
              )}
            </div>
          </div>

          {/* 视觉分隔条 (Visual Divider) */}
          <div className="flex items-center gap-4 opacity-70 dark:opacity-50 transition-opacity">
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1 transition-colors"></div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">Or Configure Manually</span>
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1 transition-colors"></div>
          </div>

          {/* ==========================================
              模块 2：手动配置表单 (Module 2: Manual Configuration Form)
              全面适配暗色模式，背景、输入框、边框全部重构
              ========================================== */}
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
            <div className="p-8 md:p-10 space-y-10">
              
              {/* 1. 基础信息设置 (Basic Info Settings) */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3 transition-colors">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors">1</span>
                  Basic Identification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Display Name</label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => {
                        handleDisplayNameChange(e);
                        if (errors.displayName) setErrors({ ...errors, displayName: '' }); // 输入时自动清除报错
                      }}
                      placeholder="e.g., Crypto Price Tracker"
                      className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161b22] border rounded-xl outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.displayName 
                          ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-[#0d1117]'
                      }`}
                    />
                    {/* 🌟 字段底部专属报错信息 */}
                    {errors.displayName && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.displayName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between transition-colors">
                      Skill ID (MCP Tool Name)
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-normal mt-0.5">A-Z, 0-9, underscores</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={skillName}
                      onChange={(e) => {
                        setSkillName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                        if (errors.skillName) setErrors({ ...errors, skillName: '' });
                      }}
                      placeholder="crypto_price_tracker"
                      className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161b22] border rounded-xl outline-none transition-all font-mono text-sm text-slate-900 dark:text-slate-100 ${
                        errors.skillName 
                          ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-[#0d1117]'
                      }`}
                    />
                    {errors.skillName && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.skillName}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Short Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors({ ...errors, description: '' });
                    }}
                    placeholder="Fetches real-time cryptocurrency prices..."
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161b22] border rounded-xl outline-none transition-all text-slate-900 dark:text-slate-100 ${
                      errors.description 
                        ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-[#0d1117]'
                    }`}
                  />
                  {errors.description && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.description}</p>}
                </div>
              </div>

              {/* 2. 核心资产：Markdown 提示词与架构 (Core Asset: Markdown Manifest) */}
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800/50 pb-3 transition-colors">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors">2</span>
                    Skill Manifest (Markdown)
                  </h3>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md transition-colors">Defines Parameters & Implementation</span>
                </div>
                <textarea
                  required
                  value={markdownBody}
                  onChange={(e) => {
                    setMarkdownBody(e.target.value);
                    if (errors.markdownBody) setErrors({ ...errors, markdownBody: '' });
                  }}
                  rows={14}
                  placeholder="# Description&#10;...&#10;&#10;# Parameters&#10;...&#10;&#10;# Implementation&#10;..."
                  className={`w-full px-4 py-4 bg-slate-50 dark:bg-[#161b22] border rounded-xl outline-none transition-all font-mono text-[13px] leading-relaxed resize-y dark:shadow-inner text-slate-900 dark:text-slate-100 ${
                    errors.markdownBody 
                      ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-[#0d1117]'
                  }`}
                />
                {errors.markdownBody && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.markdownBody}</p>}
              </div>

              {/* 3. 环境变量与机密管理 (Environment Variables & Secrets) */}
              <div className="space-y-4 bg-amber-50/50 dark:bg-amber-900/10 -mx-8 px-8 py-6 border-y border-amber-100 dark:border-amber-900/30 transition-colors">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                      <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-500 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors">3</span>
                      <KeyRound className="w-5 h-5 text-amber-500" />
                      Environment Variables (Secrets)
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-8 transition-colors">
                      Store your API keys securely. Referenced as <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-xs font-mono transition-colors">{'{{SECRETS.KEY_NAME}}'}</code> in the manifest.
                    </p>
                  </div>
                  <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded font-bold border border-amber-200 dark:border-amber-900/50 transition-colors">
                    AES-256 Encrypted
                  </span>
                </div>

                <div className="space-y-3 pl-8">
                  {secrets.map((secret, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="KEY_NAME (e.g., COINGECKO_API_KEY)"
                          value={secret.key}
                          onChange={(e) => handleSecretChange(index, 'key', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                          className="w-full px-3 py-2.5 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono text-sm uppercase text-slate-900 dark:text-slate-100 shadow-sm transition-colors"
                        />
                      </div>
                      <div className="flex-[2]">
                        <input
                          type="password"
                          placeholder="Enter the actual secret value..."
                          value={secret.value}
                          onChange={(e) => handleSecretChange(index, 'value', e.target.value)}
                          className={`w-full px-3 py-2.5 bg-white dark:bg-[#161b22] border rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono text-sm text-slate-900 dark:text-slate-100 shadow-sm transition-colors ${secret.key && !secret.value ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-100 dark:ring-amber-900/30' : 'border-slate-200 dark:border-slate-700'}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSecret(index)}
                        className="p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                        title="Remove Secret"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSecret}
                    className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-bold px-1 py-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Variable
                  </button>
                </div>
              </div>

              {/* 4. 权限可见性设置 (Publishing) */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3 transition-colors">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors">4</span>
                  Publishing Mode
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all ${
                      !isPublic 
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-900/20 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#161b22]'
                    }`}
                  >
                    <Lock className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${!isPublic ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <div>
                      <h4 className={`font-bold transition-colors ${!isPublic ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>Private Sandbox</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed transition-colors">Deployed instantly to your personal MCP gateway. Only you can call this endpoint.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                      isPublic 
                        ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-900/20 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#161b22]'
                    }`}
                  >
                    <Globe className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${isPublic ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <div>
                      <h4 className={`font-bold transition-colors ${isPublic ? 'text-purple-900 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>Public Marketplace</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed transition-colors">Publish to the UniSkill Store. Earn crypto credits when other agents invoke your tool.</p>
                    </div>
                    <div className="absolute top-3 right-3 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest transition-colors">
                      Phase 2
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* 🌟 底部提交与沙箱测试区域 (Footer & Sandbox Area) */}
            {!deployedSkill ? (
              <div className="bg-slate-50 dark:bg-[#0d1117] p-6 md:px-10 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <AlertCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>Edge deployment takes &lt; 1s globally.</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 dark:shadow-slate-100/10 active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin transition-colors" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'Deploying to Edge...' : 'Deploy Skill Endpoint'}
                </button>
              </div>
            ) : (
              // 🌟 部署成功后的深色沙箱测试面板 (Dark Sandbox Panel after successful deployment)
              <div className="bg-[#020617] border-t border-emerald-500/30 p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      Endpoint Live!
                    </h3>
                    <p className="text-slate-400 mt-2 text-sm">
                      Your skill <code className="text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded">execute_{deployedSkill.id}</code> is running at the edge. Test it below.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      type="button"
                      onClick={() => {
                        setDeployedSkill(null);
                        setTestLog(null);
                      }}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors border border-slate-700"
                    >
                      Edit & Redeploy
                    </button>
                    <button 
                      type="button"
                      className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                    >
                      Done
                    </button>
                  </div>
                </div>

                {/* 沙箱输入与输出区 (Sandbox Input & Output) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> Test Input Payload
                    </label>
                    <textarea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder='e.g., {"query": "Show me trending rust repos"}'
                      className="w-full h-40 bg-[#0d1117] border border-slate-700 rounded-xl p-4 text-emerald-400 font-mono text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={handleRunTest}
                      disabled={isTesting || !testInput.trim()}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                    >
                      {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Execution'}
                    </button>
                  </div>

                  <div className="space-y-3 flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Execution Log
                    </label>
                    <div className="flex-1 bg-[#0d1117] border border-slate-700 rounded-xl p-4 overflow-auto min-h-[10rem] relative shadow-inner">
                      {!testLog && !isTesting && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-sm">
                          Waiting for execution...
                        </div>
                      )}
                      {isTesting && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500 font-mono text-sm gap-3">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Executing via MCP Gateway...
                        </div>
                      )}
                      {testLog && !isTesting && (
                        <pre className="text-cyan-300 font-mono text-[13px] leading-relaxed">
                          {testLog}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

        </div>
      </main>
    </div>
  );
}
