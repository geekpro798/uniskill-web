'use client';

import React, { useState, useRef } from 'react';
import { 
  Save, Terminal, Globe, Lock, AlertCircle, KeyRound, 
  Plus, Trash2, Sparkles, Wand2, Loader2, CheckCircle2,
  Activity, Edit3, Code2, Link, Link2, Unlink
} from 'lucide-react';
import { useSession, signIn } from "next-auth/react";
import { useEffect } from 'react';
import { motion } from "framer-motion";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/Modal";

interface CreateSkillClientProps {
  initialCredits: number | undefined;
  initialDisplayName: string | null;
}

export default function CreateSkillPage({ initialCredits, initialDisplayName }: CreateSkillClientProps) {
  const { data: session, status } = useSession();
  const [liveCredits, setLiveCredits] = useState<number | undefined>(initialCredits);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(initialDisplayName);

  const fetchLiveCredits = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setLiveCredits(data.credits);
        if (data.displayName) {
          setProfileDisplayName(data.displayName);
        }
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

  // 🌟 Fetch Global Secrets on Mount
  useEffect(() => {
    if (status === "authenticated") {
      const fetchGlobalSecrets = async () => {
        try {
          const res = await fetch("/api/user/secrets");
          if (res.ok) {
            const data = await res.json();
            // Transform Record<string, string> to Array for UI compatibility
            const formatted = Object.entries(data).map(([k, v]) => ({ 
              key_name: k, 
              encrypted_value: v as string 
            }));
            setGlobalSecrets(formatted);
          }
        } catch (err) {
          console.error("Failed to fetch global secrets:", err);
        }
      };
      fetchGlobalSecrets();
    }
  }, [status]);

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
  const [secrets, setSecrets] = useState<{key: string, value: string, isGlobal?: boolean, saveToGlobal?: boolean}[]>([{ key: '', value: '' }]);
  const [globalSecrets, setGlobalSecrets] = useState<{key_name: string, encrypted_value: string}[]>([]);
  const [showSecretPicker, setShowSecretPicker] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); // 🌟 升级：使用字典存储字段级错误状态

  // 🌟 新增：部署成功后的状态，用于触发原地沙箱 (State for post-deployment sandbox)
  const [deployedSkill, setDeployedSkill] = useState<{id: string, name: string} | null>(null);
  const [resumeSkillUid, setResumeSkillUid] = useState<string | null>(null);
  const [originalState, setOriginalState] = useState<string | null>(null);
  const [isSkillNameDirty, setIsSkillNameDirty] = useState(false); // 🌟 新增：智能锁定 (Smart Sync Lock)

  const [testInput, setTestInput] = useState('');
  const [testLog, setTestLog] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false); // 🌟 新增：记录测试是否成功 (Track if test was successful)
  const [isCheckingName, setIsCheckingName] = useState(false); // 🌟 新增：正在检查名称唯一性 (Checking name uniqueness)
  
  // 🌟 新增：全局弹窗状态 (Global Modal State)
  const [modal, setModal] = useState<{
    show: boolean, 
    type: 'confirm' | 'alert', 
    title: string, 
    message: React.ReactNode, 
    onConfirm?: () => void 
  }>({ show: false, type: 'alert', title: '', message: '' });

  const showAlert = (title: string, message: React.ReactNode) => {
    setModal({ show: true, type: 'alert', title, message });
  };
  // 🌟 二阶段部署：完结态逻辑 (Two-Stage Deployment: Finalization State)
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeSuccess, setFinalizeSuccess] = useState(false);

  // 🌟 AI 意图抽取状态 (AI Intent Extraction State)
  const [isExtracting, setIsExtracting] = useState(false);
  const [nlpQuery, setNlpQuery] = useState('');

  const formRef = useRef<HTMLFormElement>(null);

  // 🌟 Resume Logic: Load drafted or active skill if '?resume=' is in URL
  useEffect(() => {
    if (status !== 'authenticated') return;
    const params = new URLSearchParams(window.location.search);
    const resumeId = params.get('resume');
    if (resumeId) {
      setResumeSkillUid(resumeId);
      supabase.from('skills')
        .select('*')
        .eq('skill_uid', resumeId)
        .single()
        .then(({ data, error }) => {
          // 现在允许加载 testing 或 active 状态的技能进行编辑 (Allow loading testing or active skills)
          if (data && !error && (data.state === 'testing' || data.state === 'active')) {
            setOriginalState(data.state);
            setSkillName(data.skill_name || '');
            setDisplayName(data.display_name || data.skill_name || '');
            setDescription(data.description || '');
            setMarkdownBody(data.markdown_manifest || '');
            setIsPublic(data.status === 'Community');
            setSecrets(data.secrets && Array.isArray(data.secrets) && data.secrets.length > 0 
              ? data.secrets 
              : [{ key: '', value: '' }]
            );
            
            // 如果是已发布的技能，进入已部署状态以便直接进入右侧 Sandbox
            if (data.state === 'active') {
              setDeployedSkill({ id: data.skill_uid || data.id, name: data.display_name || data.skill_name });
            }

            // 只有首次加载时尝试滚动，且加延迟以避开渲染闪烁
            setTimeout(() => {
              window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
            }, 800);
          }
        });
    }
  }, [status]);

  // 🌟 新增：检查 Skill Name 是否重复 (Check if Skill Name is unique)
  useEffect(() => {
    if (!skillName || skillName.length < 3) return;

    const timer = setTimeout(async () => {
      setIsCheckingName(true);
      try {
        const { data, error } = await supabase
          .from('skills')
          .select('skill_name')
          .eq('skill_name', skillName)
          .neq('skill_uid', resumeSkillUid || 'none') // 🌟 排除当前正在编辑的资产 (Exclude current asset)
          .maybeSingle();

        if (data) {
          setErrors(prev => ({ ...prev, skillName: 'This Skill Name is already taken. Please choose another one.' }));
        } else if (!error) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.skillName;
            return newErrors;
          });
        }
      } catch (err) {
        console.error('Failed to check name uniqueness:', err);
      } finally {
        setIsCheckingName(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [skillName]);


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
    
    // 🌟 核心：智能锁定 (Smart Sync Lock)
    // 逻辑：如果是编辑已有技能 (resumeSkillUid 存在) 或者是用户手动改过 ID (isSkillNameDirty)，则禁止联变
    if (!resumeSkillUid && !isSkillNameDirty && !magicSuccess) {
      setSkillName(newVal.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/(^_|_$)+/g, ''));
    }
  };

  // 环境变量操作逻辑 (Handlers for Secrets)
  const handleAddSecret = () => setSecrets([...secrets, { key: '', value: '' }]);
  const handleRemoveSecret = (index: number) => setSecrets(secrets.filter((_, i) => i !== index));
  const handleSecretChange = (index: number, field: 'key' | 'value' | 'isGlobal' | 'saveToGlobal', val: any) => {
    const newSecrets = [...secrets];
    (newSecrets[index] as any)[field] = val;
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
    setDeployedSkill(null); 
    setErrors({}); // 清除现有错误 (Clear existing errors)

    try {
      const response = await fetch('/api/skills/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: magicPrompt }),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate skill architecture';
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = responseText.substring(0, 100); 
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      const generatedMarkdown = data.markdown;
      
      // 🌟 Extract metadata for form fields, but PRESERVE full markdown in the editor
      const frontmatterMatch = generatedMarkdown.match(/^---\n([\s\S]+?)\n---/);
      
      if (frontmatterMatch) {
        const fm = frontmatterMatch[1];

        const sNameMatch = fm.match(/skill_name:\s*(.+)/);
        const dNameMatch = fm.match(/display_name:\s*(.+)/);
        
        if (sNameMatch) setSkillName(sNameMatch[1].trim());
        if (dNameMatch) setDisplayName(dNameMatch[1].trim());

        const secretsMatch = fm.match(/secrets:\n([\s\S]+?)(?=\n[a-z_]+:|$)/);
        if (secretsMatch) {
          const secretLines = secretsMatch[1].split('\n').filter((l: string) => l.trim().startsWith('-'));
          const extractedSecrets = secretLines.map((line: string) => ({ 
            key: line.replace('-', '').trim(), 
            value: '' 
          }));
          setSecrets(extractedSecrets.length > 0 ? extractedSecrets : [{ key: '', value: '' }]);
        }
      }

      // Sync description for the preview/card
      const descMatch = generatedMarkdown.match(/#+\s*Description\s*\n([\s\S]*?)(?=\n#+|$)/i);
      if (descMatch) setDescription(descMatch[1].trim());

      setMarkdownBody(generatedMarkdown.trim());
      setMagicSuccess(true);
      
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (error: any) {
      console.error('Magic Generation failed:', error);
      // 将 API 报错显示在界面上 (Display API error on UI)
      setErrors({ magic: error.message });
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
      // 🌟 流程 A：处理“一键保存至全局”的机密 (Process 'Save to Global' secrets)
      const secretsToVault = secrets.filter(s => !s.isGlobal && s.saveToGlobal && s.key && s.value);
      
      if (secretsToVault.length > 0) {
        console.log(`Vaulting ${secretsToVault.length} secrets to global storage...`);
        await Promise.all(secretsToVault.map(async (s) => {
          try {
            await fetch('/api/user/secrets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key_name: s.key, value: s.value })
            });
          } catch (vaultErr) {
            console.error(`Failed to vault secret ${s.key}:`, vaultErr);
            // 这里选择继续，不阻塞主流程，但在控制台记录 (Choose to continue to avoid blocking main flow)
          }
        }));
      }

      const validSecrets = secrets.filter(s => s.key.trim() !== '' && s.value.trim() !== '');
      const payload = {
        skill_uid: resumeSkillUid, // 传给后端以便 upsert
        skill_name: skillName,
        display_name: displayName,
        description,
        markdown_manifest: markdownBody,
        status: isPublic ? 'Community' : 'Private',
        state: originalState === 'active' ? 'active' : 'testing',
        secrets: validSecrets.map(s => ({ key: s.key, value: s.value })), // 传递原始 Key/Value，后端处理加密
        emoji: markdownBody.match(/emoji:\s*([^\s\n]+)/)?.[1] || '⚙️',
        owner_uid: (session as any)?.user?.userUid // API 会校验
      };

      // 🌟 调用安全后端接口 (Use secure backend API)
      const res = await fetch('/api/skills/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save skill");
      }
      
      const insertedSkill = await res.json();

      console.log('Deploying Initial Skill State:', payload);

      // 后续逻辑保持不变 (Wait for state update)
      
      // 🌟 核心变更：不再允许使用名字 (skillName) 兜底 ID。
      // 必须使用从后端 Supabase 返回的真实 UUID (skill_uid)。
      setDeployedSkill({ 
        id: insertedSkill.skill_uid?.toString() || insertedSkill.id?.toString(), 
        name: displayName, 
        visibility: isPublic ? 'public' : 'private' 
      } as any);
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

  // 🌟 AI 意图抽取逻辑 (AI Intent Extraction Logic)
  const handleExtractIntent = async () => {
    if (!nlpQuery.trim()) return;
    setIsExtracting(true);
    try {
      const res = await fetch('/api/skills/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest: markdownBody,
          query: nlpQuery
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestInput(data.payload);
        setNlpQuery(''); // Clear after successful extraction
      } else {
        console.error("Extraction failed:", data.error);
      }
    } catch (err) {
      console.error("AI Extraction Error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  // 🌟 沙箱执行逻辑 (Sandbox Execution Logic)
  const handleRunTest = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    setTestLog(null);
    setTestSuccess(false);

    try {
      // 🌟 调用真实的后端沙箱验证接口 (Call real backend sandbox API)
      const res = await fetch('/api/skills/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest: markdownBody,
          payload: testInput
        })
      });
      
      const result = await res.json();
      setTestLog(JSON.stringify(result, null, 2));
      
      if (res.ok && result.status === 'success') {
        setTestSuccess(true);
      } else {
        setTestSuccess(false);
      }
    } catch (err: any) {
      setTestLog(JSON.stringify({ 
        status: "error", 
        error: err.message || "Failed to execute. Check your network connection." 
      }, null, 2));
      setTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  };

  // 🌟 完结部署逻辑：从测试态转移至生产态 (Finalize Deployment Logic)
  const handleFinalize = async () => {
    if (!deployedSkill) return;
    setIsFinalizing(true);
    setErrors({});
    
    try {
      // 🚀 保持加密一致性，强制同步一次表单数据 (Maintain consistency via Server-Side API)
      // 🌟 同时处理可能存在的“一键保存至全局”勾选
      const secretsToVault = secrets.filter(s => !s.isGlobal && s.saveToGlobal && s.key && s.value);
      if (secretsToVault.length > 0) {
        await Promise.all(secretsToVault.map(async (s) => {
          try {
            await fetch('/api/user/secrets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key_name: s.key, value: s.value })
            });
          } catch (e) {
            console.error("Vaulting failed during finalize:", e);
          }
        }));
      }

      const res = await fetch('/api/skills/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_uid: deployedSkill.id,
          skill_name: skillName,
          display_name: displayName,
          description: description,
          markdown_manifest: markdownBody,
          secrets: secrets.filter(s => s.key.trim() !== '' && s.value.trim() !== '').map(s => ({ key: s.key, value: s.value })),
          owner_uid: (session as any)?.user?.userUid
        })
      });

      if (!res.ok) throw new Error("Pre-sync failed before finalization.");

      const finalizeRes = await fetch('/api/skills/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillUid: deployedSkill.id })
      });
      
      if (!finalizeRes.ok) {
        const errorData = await finalizeRes.json();
        throw new Error(errorData.error || 'Failed to finalize skill');
      }
      
      setFinalizeSuccess(true);
      
      // 稍微延迟让用户看到成功视图，然后返回面板
      setTimeout(() => {
         window.location.href = '/dashboard/myskills';
      }, 3500);
      
    } catch (err: any) {
      console.error('Finalize failed:', err);
      showAlert('Launch Failed', err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <UnifiedNavbar initialCredits={liveCredits} initialDisplayName={profileDisplayName} />

      <main className="max-w-5xl mx-auto px-6 pt-[88px] md:pt-[100px] pb-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header section for Shadow Edit Mode */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {originalState === 'active' ? 'Edit Live Skill' : 'Deploy New Skill'}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {originalState === 'active' 
                  ? 'Update your production tool without any downtime.' 
                  : 'Architect a new autonomous agent capability.'}
              </p>
            </div>
            {originalState === 'active' && (
              <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-full border border-blue-500/20 shadow-sm animate-in fade-in slide-in-from-right-4 transition-all">
                <Edit3 size={12} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest">Shadow Edit Mode</span>
              </div>
            )}
          </div>

          {/* ==========================================
              模块 1：魔法生成器 (Module 1: Magic Architect)
              统一适配了浅色与深色模式 (Adapted for both light and dark modes)
              ========================================== */}
          <div className="rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl relative transition-colors duration-300 border" style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
            {/* 背景光晕效果，仅在深色模式下明显 (Background glow, prominent in dark mode) */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none transition-all"></div>
            
            <div className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl border border-purple-200 dark:border-purple-500/30 transition-colors">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-wide transition-colors" style={{ color: "var(--color-text-primary)" }}>Magic Skill Architect</h2>
                  <p className="text-sm mt-1 transition-colors" style={{ color: "var(--color-text-secondary)" }}>Describe what you want the tool to do. AI will generate the API schema & implementation.</p>
                </div>
              </div>

              <div className="relative group">
                <textarea
                  value={magicPrompt}
                  onChange={(e) => setMagicPrompt(e.target.value)}
                  placeholder="e.g., Build a tool that searches crypto prices on Coingecko using my API key..."
                  className="w-full h-32 border-2 rounded-2xl p-4 pr-16 outline-none transition-all resize-none text-sm leading-relaxed"
                  style={{ 
                    backgroundColor: "var(--color-bg-secondary)", 
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)"
                  }}
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
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {secrets.some(s => s.key.trim() !== '') 
                    ? "Skill blueprint ready! ✨ Please review the details and add your API Keys below to get started."
                    : "Skill blueprint ready! ✨ Everything looks good. Review the configuration below to proceed."}
                </div>
              )}

              {errors.magic && (
                <div className="mt-4 flex items-center gap-2 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 px-4 py-2.5 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 transition-colors">
                  <AlertCircle className="w-5 h-5" />
                  {errors.magic}
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
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="rounded-3xl shadow-sm dark:shadow-xl border overflow-hidden transition-all duration-300" style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
            <div className="p-8 md:p-10 space-y-10">
              
              {/* 1. 基础信息设置 (Basic Info Settings) */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3 transition-colors" style={{ color: "var(--color-text-primary)", borderBottomColor: "var(--color-border-subtle)" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors" style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>1</span>
                  Basic Identification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 transition-colors" style={{ color: "var(--color-text-secondary)" }}>Display Name</label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => {
                        handleDisplayNameChange(e);
                        if (errors.displayName) setErrors({ ...errors, displayName: '' }); // 输入时自动清除报错
                      }}
                      placeholder="e.g., Crypto Price Tracker"
                      className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all shadow-sm ${
                        errors.displayName 
                          ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                      style={{ 
                        backgroundColor: "var(--color-bg-secondary)", 
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)"
                      }}
                    />
                    {/* 🌟 字段底部专属报错信息 */}
                    {errors.displayName && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.displayName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 flex justify-between transition-colors" style={{ color: "var(--color-text-secondary)" }}>
                      Skill Name (Internal ID / MCP)
                      <span className="text-xs font-normal mt-0.5" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>A-Z, 0-9, underscores</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        disabled={originalState === 'active'}
                        value={skillName}
                        onChange={(e) => {
                          setIsSkillNameDirty(true); // 🌟 用户手动修改，彻底锁定联动
                          setSkillName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                        }}
                        placeholder="crypto_price_tracker"
                        className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all font-mono text-sm shadow-sm ${
                          errors.skillName 
                            ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                        } ${originalState === 'active' ? 'opacity-50 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/50' : ''}`}
                        style={{ 
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-primary)"
                        }}
                      />
                      {isCheckingName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    {errors.skillName && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.skillName}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 transition-colors" style={{ color: "var(--color-text-secondary)" }}>Short Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors({ ...errors, description: '' });
                    }}
                    placeholder="Fetches real-time cryptocurrency prices..."
                    className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all shadow-sm ${
                      errors.description 
                        ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    style={{ 
                      backgroundColor: "var(--color-bg-secondary)", 
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)"
                    }}
                  />
                  {errors.description && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.description}</p>}
                </div>
              </div>

              {/* 2. 核心资产：Markdown 提示词与架构 (Core Asset: Markdown Manifest) */}
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b pb-3 transition-colors" style={{ borderBottomColor: "var(--color-border-subtle)" }}>
                  <h3 className="text-lg font-bold flex items-center gap-2 transition-colors" style={{ color: "var(--color-text-primary)" }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors" style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>2</span>
                    Skill Manifest (Markdown)
                  </h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md transition-colors" style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>Defines Parameters & Implementation</span>
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
                  className={`w-full px-4 py-4 border rounded-xl outline-none transition-all font-mono text-[13px] leading-relaxed resize-y shadow-inner ${
                    errors.markdownBody 
                      ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                  style={{ 
                    backgroundColor: "var(--color-bg-secondary)", 
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)"
                  }}
                />
                {errors.markdownBody && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.markdownBody}</p>}
              </div>

              {/* 3. 环境变量与机密管理 (Environment Variables & Secrets) */}
              <div className="space-y-4 -mx-8 px-8 py-8 border-y transition-colors" style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border-subtle)" }}>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 transition-colors" style={{ color: "var(--color-text-primary)" }}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>3</span>
                      <KeyRound className="w-5 h-5 text-amber-500" />
                      Environment Variables (Secrets)
                    </h3>
                    <p className="text-sm mt-1 pl-8 transition-colors" style={{ color: "var(--color-text-secondary)" }}>
                      Store your API keys securely. Referenced as <code className="px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 border text-xs font-mono transition-colors" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>{'{{SECRETS.KEY_NAME}}'}</code> in the manifest.
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded font-bold border transition-colors" style={{ backgroundColor: "rgba(245, 158, 11, 0.05)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.2)" }}>
                    AES-256 Encrypted
                  </span>
                </div>

                <div className="space-y-4 pl-8">
                  {secrets.map((secret, index) => (
                    <div key={index} className="space-y-2">
                       <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="KEY_NAME (e.g. OPENAI_API_KEY)"
                            value={secret.key}
                            onChange={(e) => {
                              const v = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_');
                              handleSecretChange(index, 'key', v);
                            }}
                            className="w-full px-3 py-2.5 border rounded-lg outline-none font-mono text-sm shadow-sm transition-colors"
                            style={{ 
                              backgroundColor: "var(--color-bg-primary)", 
                              borderColor: "var(--color-border)",
                              color: "var(--color-text-primary)"
                            }}
                          />
                        </div>
                        <div className="flex-[2] relative group">
                          <input
                            type={secret.isGlobal ? "text" : "password"}
                            placeholder={secret.isGlobal ? "Linked from Global Secrets" : "Enter the actual secret value..."}
                            value={secret.isGlobal ? `Linked: ${secret.key}` : secret.value}
                            readOnly={secret.isGlobal}
                            onChange={(e) => !secret.isGlobal && handleSecretChange(index, 'value', e.target.value)}
                            className={`w-full px-3 py-2.5 pr-10 border rounded-lg outline-none font-mono text-sm shadow-sm transition-colors ${
                              secret.isGlobal 
                                ? 'bg-blue-50/10 dark:bg-blue-900/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold' 
                                : secret.key && !secret.value 
                                  ? 'ring-2 ring-amber-500/20 border-amber-500' 
                                  : ''
                            }`}
                            style={{ 
                              backgroundColor: secret.isGlobal ? undefined : "var(--color-bg-primary)", 
                              borderColor: secret.isGlobal ? undefined : "var(--color-border)",
                              color: secret.isGlobal ? undefined : "var(--color-text-primary)"
                            }}
                          />
                          
                          {/* 🌟 Global Secret Picker Trigger */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {secret.isGlobal ? (
                              <button 
                                type="button" 
                                onClick={() => {
                                  handleSecretChange(index, 'isGlobal', false);
                                  handleSecretChange(index, 'value', '');
                                }}
                                className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                title="Unlink Global Secret"
                              >
                                <Unlink size={14} />
                              </button>
                            ) : (
                              <button 
                                type="button" 
                                onClick={() => setShowSecretPicker(showSecretPicker === index ? null : index)}
                                className={`p-1 rounded transition-colors ${showSecretPicker === index ? 'bg-blue-500 text-white' : 'hover:bg-blue-500/10 text-blue-500'}`}
                                title="Link to Global Secret"
                              >
                                <Globe size={14} />
                              </button>
                            )}
                          </div>

                          {/* 🌟 Secret Picker Dropdown */}
                          {showSecretPicker === index && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                               <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Global Secrets</span>
                                  <button onClick={() => setShowSecretPicker(null)} className="text-[10px] text-slate-400 hover:text-slate-600">Close</button>
                               </div>
                               <div className="max-h-48 overflow-auto">
                                  {globalSecrets.length > 0 ? globalSecrets.map((gs, gsIdx) => (
                                    <button
                                      key={gsIdx}
                                      type="button"
                                      onClick={() => {
                                        handleSecretChange(index, 'key', gs.key_name);
                                        handleSecretChange(index, 'value', gs.encrypted_value);
                                        handleSecretChange(index, 'isGlobal', true);
                                        setShowSecretPicker(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 flex items-center justify-between group transition-colors border-b last:border-0 border-slate-50 dark:border-slate-800/50"
                                    >
                                      <div className="flex items-center gap-2">
                                        <KeyRound size={12} className="text-blue-500" />
                                        <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{gs.key_name}</span>
                                      </div>
                                      <Link size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </button>
                                  )) : (
                                    <div className="p-8 text-center">
                                      <p className="text-xs text-slate-400 font-medium tracking-tight">No global secrets found.</p>
                                    </div>
                                  )}
                               </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSecret(index)}
                          className="p-2.5 transition-colors border border-transparent hover:bg-red-500/10 hover:text-red-500 rounded-lg"
                          style={{ color: "var(--color-text-secondary)" }}
                          title="Remove Secret"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 🌟 Save as Global Logic */}
                      {!secret.isGlobal && secret.key && secret.value && (
                        <div className="pl-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                           <input 
                            type="checkbox" 
                            id={`save-global-${index}`}
                            checked={!!secret.saveToGlobal}
                            onChange={(e) => handleSecretChange(index, 'saveToGlobal', e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer"
                           />
                           <label htmlFor={`save-global-${index}`} className="text-[11px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-500 transition-colors">
                              Save to Global Vault (Vault sync enabled)
                           </label>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSecret}
                    className="flex items-center gap-1.5 text-sm font-bold px-1 py-2 transition-colors hover:opacity-80"
                    style={{ color: "#f59e0b" }}
                  >
                    <Plus className="w-4 h-4" /> Add Variable
                  </button>
                </div>
              </div>

              {/* 4. 权限可见性设置 (Publishing) */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3 transition-colors" style={{ color: "var(--color-text-primary)", borderBottomColor: "var(--color-border-subtle)" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors" style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>4</span>
                  Publishing Mode
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${!isPublic ? 'border-blue-500 shadow-lg' : 'border-slate-100 dark:border-slate-800 opacity-60 grayscale'}`}
                    style={{ 
                      backgroundColor: !isPublic ? "white" : "rgba(0,0,0,0.01)",
                      borderColor: !isPublic ? undefined : "var(--color-border)"
                    }}
                  >
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800 shrink-0">
                      <Lock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Private Sandbox</h4>
                      <p className="text-[11px] mt-1.5 leading-relaxed text-slate-500 dark:text-slate-400 font-medium">Deployed instantly to your personal MCP gateway. Only you can call this endpoint.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={true}
                    className="flex items-start gap-4 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-left relative overflow-hidden opacity-60 grayscale cursor-not-allowed transition-all shadow-inner"
                    style={{ 
                      backgroundColor: "rgba(0,0,0,0.01)",
                    }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0">
                      <Globe className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <h4 className="font-bold text-slate-500 dark:text-slate-400 text-sm">Public Marketplace</h4>
                      <p className="text-[11px] mt-1.5 leading-relaxed text-slate-400 dark:text-slate-500 font-medium">Publish to the UniSkill Store. Earn crypto credits when other agents invoke your tool.</p>
                    </div>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                      <Lock size={8} />
                      <span className="text-[8px] font-black uppercase tracking-widest leading-none">Phase 2</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* 🌟 底部提交与沙箱测试区域 (Footer & Sandbox Area) */}
            {!deployedSkill ? (
              <div className="p-6 md:px-10 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors" style={{ backgroundColor: "var(--color-bg-secondary)", borderTopColor: "var(--color-border)" }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <AlertCircle className="w-4 h-4" />
                  <span>Edge deployment takes &lt; 1s globally.</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 dark:shadow-white/10 active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin transition-colors" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isSubmitting 
                    ? 'Deploying to Edge...' 
                    : (originalState === 'active' ? 'Save & Proceed to Sandbox' : 'Deploy Skill Endpoint')}
                </button>
              </div>
            ) : finalizeSuccess ? (
              // 🌟 权限感知成功界面 (Access-Aware Success View)
              <div className="border-t p-12 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center" style={{ backgroundColor: "var(--color-bg-secondary)", borderTopColor: "var(--color-border)" }}>
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black mb-4 transition-colors uppercase tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                  {(deployedSkill as any)?.visibility === 'private' ? 'Deployment Secured' : 'Deployment Live'}
                </h3>
                <p className="text-lg font-medium max-w-lg mb-8" style={{ color: "var(--text-secondary)" }}>
                  {/* Dynamic Success Message based on Tier */}
                  {(deployedSkill as any)?.visibility === 'private' 
                    ? "Deployed! This skill is now securely active in your private vault and ready for your agents." 
                    : "Live! Your skill is now discoverable in the global marketplace and earning potential is active."}
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Hub
                </div>
              </div>
            ) : (
              // 🌟 部署成功后的沙箱测试面板 (Sandbox Panel after successful deployment)
              <div className="border-t p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8" style={{ backgroundColor: "var(--color-bg-secondary)", borderTopColor: "var(--color-border)" }}>
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-3" style={{ color: "var(--color-text-primary)" }}>
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      Endpoint Live!
                    </h3>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Your skill <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{deployedSkill.name}</span> <code className="text-emerald-400 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded ml-1 font-mono">({skillName})</code> is running at the edge. Test it below.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      type="button"
                      onClick={() => {
                        setDeployedSkill(null);
                        setTestLog(null);
                        setTestSuccess(false);
                      }}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors border border-slate-700"
                    >
                      Edit & Redeploy
                    </button>
                    <button 
                      type="button"
                      onClick={handleFinalize}
                      disabled={!testSuccess || isFinalizing}
                      className={`flex-1 md:flex-none px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                        testSuccess 
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-emerald-900/20 hover:scale-105 active:scale-95 cursor-pointer' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed grayscale'
                      }`}
                    >
                      {isFinalizing ? <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing...</> : 'Done'}
                    </button>
                  </div>
                </div>

                {/* 沙箱输入与输出区 (Sandbox Input & Output) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Code2 className="w-4 h-4" /> Test Input Payload
                    </label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative space-y-3">
                        {/* Magic Intent Extractor Input */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={nlpQuery}
                              onChange={(e) => setNlpQuery(e.target.value)}
                              placeholder="Describe your intent in natural language..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && nlpQuery.trim()) {
                                  e.preventDefault();
                                  handleExtractIntent();
                                }
                              }}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                            />
                            <Sparkles className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500" />
                          </div>
                          <button
                            type="button"
                            onClick={handleExtractIntent}
                            disabled={isExtracting || !nlpQuery.trim()}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl transition-all flex items-center gap-2 font-bold text-sm shadow-sm"
                          >
                            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4" /> Magic Fill</>}
                          </button>
                        </div>

                        {/* Traditional JSON Textarea */}
                        <textarea
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder='e.g., {"query": "Show me trending rust repos"}'
                          className="w-full h-40 border rounded-xl p-4 text-emerald-600 dark:text-emerald-400 font-mono text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none shadow-inner transition-all"
                          style={{ 
                            backgroundColor: "var(--color-bg-primary)", 
                            borderColor: "var(--color-border)"
                          }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunTest}
                      disabled={isTesting || !testInput.trim()}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                    >
                      {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Execution'}
                    </button>
                  </div>

                  <div className="space-y-3 flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Execution Log
                    </label>
                    <div className="flex-1 border rounded-xl p-4 overflow-auto min-h-[10rem] relative shadow-inner" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
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
                        <pre className={`font-mono text-[13px] leading-relaxed ${testSuccess ? 'text-emerald-500' : 'text-red-500'}`}>
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

      {/* ── Global Modal ── */}
      <Modal 
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, show: false }))}
        onConfirm={modal.onConfirm}
        confirmText={modal.type === 'confirm' ? "Delete" : "Got it"}
      />
    </div>
  );
}
