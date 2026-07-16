'use client';

/**
 * PublishToCommunityModal
 * 发布到社区确认弹窗 — 轻量、无审核
 * 用户点击确认后调用 /api/skills/publish，立即生效
 */

import React, { useState } from 'react';
import { Globe, Zap, AlertCircle, CheckCircle2, Loader2, X, Tag } from 'lucide-react';

const CATEGORIES = [
  { id: 'web_search',        label: 'Web & Search' },
  { id: 'devops_infra',      label: 'DevOps & Infra' },
  { id: 'workspace_data',    label: 'Workspace & Data' },
  { id: 'media_intelligence',label: 'Media & Intelligence' },
  { id: 'social_outreach',   label: 'Social & Outreach' },
  { id: 'finance_trading',   label: 'Finance & Trading' },
  { id: 'utilities',         label: 'Utilities' },
];

interface PublishToCommunityModalProps {
  isOpen: boolean;
  skill: {
    id: string;          // skill_uid
    slug: string;        // skill_name
    name: string;        // display_name
    description: string;
    emoji?: string;
    category?: string;
    tags?: string[];
  };
  onClose: () => void;
  onSuccess: () => void; // 发布成功后刷新列表
}

export default function PublishToCommunityModal({
  isOpen,
  skill,
  onClose,
  onSuccess,
}: PublishToCommunityModalProps) {
  const [category, setCategory] = useState(skill.category ?? 'utilities');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(skill.tags ?? []);
  const [agreed, setAgreed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const handlePublish = async () => {
    if (!agreed) {
      setError('Please agree to the platform terms before publishing.');
      return;
    }
    setIsPublishing(true);
    setError(null);

    try {
      const res = await fetch('/api/skills/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_uid: skill.id,
          category,
          tags,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 门槛不达标时的特殊提示
        if (res.status === 403 && data.missing_calls !== undefined) {
          setError(
            `Still need ${data.missing_calls} more call${data.missing_calls > 1 ? 's' : ''} to unlock publishing.`
          );
        } else {
          setError(data.error ?? 'Failed to publish. Please try again.');
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Network error. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Publish to Community
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Goes live immediately • No review required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Skill Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{skill.emoji ?? '⚙️'}</span>
              <div>
                <div className="font-black text-slate-900 dark:text-white text-sm">{skill.name}</div>
                <div className="text-[10px] font-mono text-slate-400">{skill.slug}</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {skill.description}
            </p>
          </div>

          {/* Platform Policy Notice */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
            <Zap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This skill will be available to all community users at{' '}
              <span className="font-black text-purple-500">1 credit / call</span>
              {' '}(platform unified pricing). Effective immediately upon publish.
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Tags <span className="text-slate-300 font-normal normal-case tracking-normal">(max 5)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="e.g. automation"
                className="flex-1 px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <button
                onClick={addTag}
                disabled={tags.length >= 5}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-500 hover:border-purple-500/30 transition-all disabled:opacity-40"
              >
                <Tag size={16} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold"
                  >
                    #{t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Agreement */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setAgreed(!agreed)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                agreed
                  ? 'bg-purple-500 border-purple-500'
                  : 'border-slate-300 dark:border-slate-600 group-hover:border-purple-400'
              }`}
            >
              {agreed && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              I confirm this skill does not contain malicious code, unauthorized data collection, 
              or content that violates platform terms. I understand it may be taken down if reported.
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || !agreed}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black transition-all shadow-lg shadow-purple-500/20 active:scale-95"
          >
            {isPublishing ? (
              <><Loader2 size={16} className="animate-spin" /> Publishing...</>
            ) : (
              <><Globe size={16} /> Publish Now</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
