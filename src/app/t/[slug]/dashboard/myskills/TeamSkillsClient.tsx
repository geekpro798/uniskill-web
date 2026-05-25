'use client';

import React, { useState, useMemo, useEffect } from 'react';
import UnifiedNavbar from "@/components/UnifiedNavbar";
import { supabase } from "@/lib/supabase";
import Breadcrumbs from "@/components/Breadcrumbs";
import DeleteSkillModal from "@/components/Dashboard/DeleteSkillModal";
import {
  Plus, Lock, Globe,
  Copy, CheckCircle2, LayoutGrid, List, Search,
  Zap, ChevronRight, Trash2, Pencil,
  ShieldCheck, Info, AlertCircle, PlayCircle,
  Users,
} from 'lucide-react';
import { resolveSkillVisuals } from '@/lib/skill-visual-identity';

interface TeamSkillsClientProps {
  teamUid: string;
  teamName: string;
  teamSlug: string;
  membership: { role: string };
  initialCredits: number | undefined;
  initialDisplayName: string | null;
  initialSkills?: any[];
}

export default function TeamSkillsClient({
  teamUid,
  teamName,
  teamSlug,
  membership,
  initialCredits,
  initialDisplayName,
  initialSkills,
}: TeamSkillsClientProps) {
  const [liveCredits, setLiveCredits] = useState<number | undefined>(initialCredits);
  const [displayName, setDisplayName] = useState<string | null>(initialDisplayName);

  const [skills, setSkills] = useState<any[]>(() => {
    if (!initialSkills) return [];
    return initialSkills.map((s: any) => ({
      ...s,
      id: s.skill_uid || s.id,
      slug: s.skill_name || 'unknown-skill',
      name: s.display_name || s.skill_name,
      description: s.description || 'Professional AI tool for advanced automation logic.',
      visibility: s.visibility || (s.status === 'Community' ? 'public' : 'private'),
      credits_per_call: s.credits_per_call || 1,
      emoji: s.emoji || '⚙️',
      visuals: resolveSkillVisuals(s),
      tags: s.tags || [],
      status: s.status || 'Private',
      state: s.state || 'active',
    }));
  });

  const [loading, setLoading] = useState(!initialSkills);
  const [skillToDelete, setSkillToDelete] = useState<{uid: string, name: string} | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'private' | 'public'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = membership.role === 'owner' || membership.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!initialSkills) setLoading(true);

        // Live credits
        const credRes = await fetch("/api/user/credits");
        if (credRes.ok) {
          const credData = await credRes.json();
          setLiveCredits(credData.credits);
          if (credData.displayName) {
            setDisplayName(credData.displayName);
          }
        }

        if (initialSkills && initialSkills.length > 0 && skills.length > 0) {
          setLoading(false);
          return;
        }

        const { data: skillsData, error } = await supabase
          .from('skills')
          .select('*')
          .eq('team_uid', teamUid)
          .order('skill_name', { ascending: true });

        if (error) throw error;

        const formattedSkills = (skillsData || []).map((s: any) => ({
          ...s,
          id: s.skill_uid || s.id,
          slug: s.skill_name || 'unknown-skill',
          name: s.display_name || s.skill_name,
          description: s.description || 'Professional AI tool for advanced automation logic.',
          visibility: s.visibility || (s.status === 'Community' ? 'public' : 'private'),
          credits_per_call: s.credits_per_call || 1,
          emoji: s.emoji || '⚙️',
          visuals: resolveSkillVisuals(s),
          tags: s.tags || [],
          status: s.status || 'Private',
          state: s.state || 'active',
          total_calls: s.total_calls || 0,
        }));

        setSkills(formattedSkills);
      } catch (e) {
        console.error("Failed to fetch team skills", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialSkills, teamUid]);

  const confirmDelete = async () => {
    if (!skillToDelete) return;
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('skill_uid', skillToDelete.uid);
      if (error) throw error;
      setSkills(prev => prev.filter(s => s.id !== skillToDelete.uid));
    } catch (err: any) {
      console.error("[Delete Error]", err.message);
      alert("Failed to delete the skill. Please try again.");
    } finally {
      setSkillToDelete(null);
    }
  };

  const filteredSkills = useMemo(() => {
    return skills.filter((skill: any) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        skill.name?.toLowerCase().includes(query) ||
        skill.id?.toLowerCase().includes(query) ||
        skill.slug?.toLowerCase().includes(query) ||
        (skill.tags && skill.tags.some((t: string) => t.toLowerCase().includes(query.replace('#', ''))));

      const matchesFilter = filterVisibility === 'all' || skill.visibility === filterVisibility;
      return matchesSearch && matchesFilter;
    });
  }, [skills, searchQuery, filterVisibility]);

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSkillClick = (skill: any) => {
    if (skill.state === 'testing') {
      window.location.href = `/t/${teamSlug}/dashboard/myskills/new?resume=${skill.id}`;
    } else {
      window.location.href = `/t/${teamSlug}/dashboard/myskills/new?resume=${skill.id}`;
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 font-sans relative" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none bg-grid" />

      <UnifiedNavbar
        initialCredits={liveCredits}
        initialDisplayName={displayName}
      />

      <main className="max-w-7xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-10 px-6 md:px-10 space-y-8 relative z-10">
        <Breadcrumbs
          homeHref={`/t/${teamSlug}`}
          homeLabel="Team"
          items={[
            { label: "Dashboard", href: `/t/${teamSlug}/dashboard` },
            { label: "My Skills" }
          ]}
        />

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              My Skills
              <span className="ml-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 align-middle">
                <Users size={12} />
                {teamName}
              </span>
            </h1>
            <p className="mt-2 font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Manage team skills and track deployment status.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => window.location.href = `/t/${teamSlug}/dashboard/myskills/new`}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 w-full md:w-auto"
            >
              <Plus className="w-5 h-5" />
              Deploy New Skill
            </button>
          )}
        </header>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID or #tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end px-1">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {(['all', 'private', 'public'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterVisibility(filter)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterVisibility === filter
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {filter === 'public' ? 'team' : filter}
                </button>
              ))}
            </div>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={16}/></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}><List size={16}/></button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Team Skills...</span>
             </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]">
              {filteredSkills.map((skill: any) => (
                <div
                  key={skill.id}
                  onClick={() => handleSkillClick(skill)}
                  className={`glass-card border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col p-[18px] min-h-[280px] cursor-pointer ${
                    skill.state === 'testing'
                      ? 'border-2 border-dashed border-amber-500/30 bg-amber-500/[0.02]'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl border ${skill.visuals.styles.box} ${skill.visuals.styles.border} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform ${skill.state === 'testing' ? 'grayscale opacity-50' : ''}`}>
                      <div className={`w-6 h-6 flex items-center justify-center ${skill.visuals.styles.text}`}>
                        <skill.visuals.Icon weight="duotone" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`flex items-center gap-1.5 px-3 py-0.5 border text-[9px] font-black uppercase tracking-widest rounded-lg ${
                        skill.state === 'testing'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                        {skill.state === 'testing' ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                        {skill.state}
                      </span>
                      <span className={`flex items-center gap-1.5 px-3 py-0.5 border text-[9px] font-black uppercase tracking-widest rounded-lg ${
                        skill.visibility === 'public' || skill.status === 'Community'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {skill.visibility === 'public' || skill.status === 'Community' ? <Globe size={10} /> : <Lock size={10} />}
                        {skill.visibility === 'public' ? 'Public' : skill.status === 'Community' ? 'Community' : 'Team'}
                      </span>
                    </div>
                  </div>

                  <h3 className={`text-lg font-bold mb-2 tracking-tight transition-colors ${skill.state === 'testing' ? 'group-hover:text-amber-500' : 'group-hover:text-blue-500'}`} style={{ color: "var(--color-text-primary)" }}>
                    {skill.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-3 flex-1 font-normal">
                    {skill.state === 'testing'
                      ? "This skill hasn't been finalized. Complete the sandbox test to activate the global endpoint."
                      : skill.description}
                  </p>

                  {skill.state === 'testing' ? (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSkillToDelete({ uid: skill.id, name: skill.name });
                          }}
                          className="flex items-center justify-center p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-slate-200 dark:border-slate-800 hover:border-red-500/30"
                          title="Delete Draft"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/t/${teamSlug}/dashboard/myskills/new?resume=${skill.id}`;
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95"
                      >
                        <PlayCircle size={14} />
                        Resume Deployment
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div
                        onClick={(e) => handleCopyId(skill.slug, e)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-mono font-bold text-slate-400 cursor-pointer hover:border-blue-500/30 transition-all flex items-center gap-2"
                      >
                        <span className="uppercase">{skill.slug}</span>
                        {copiedId === skill.slug ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <Zap size={14} className="text-amber-500 fill-amber-500/20" />
                          <span className="text-lg font-black" style={{ color: "var(--color-text-primary)" }}>{skill.credits_per_call}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Credits</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredSkills.length === 0 && !loading && (
                 <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] bg-slate-50/10">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6">
                      <Plus className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">
                      No team skills deployed<br/>
                      <span className="text-[10px] font-bold lowercase normal-case tracking-normal italic mt-1 block">Click "Deploy New Skill" to add the first team skill.</span>
                    </p>
                 </div>
              )}
            </div>
          ) : (
            /* List view */
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm transition-all">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-8 py-2.5 tracking-widest">Skill</th>
                      <th className="px-8 py-2.5 tracking-widest">Summary</th>
                      <th className="px-8 py-2.5 tracking-widest text-center">Visibility</th>
                      <th className="px-8 py-2.5 tracking-widest text-center">State</th>
                      <th className="px-8 py-2.5 tracking-widest text-right">Cost</th>
                      <th className="px-8 py-2.5 tracking-widest text-right">Total Calls</th>
                      <th className="px-8 py-2.5 tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredSkills.map((skill: any) => (
                      <tr key={skill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group" onClick={() => handleSkillClick(skill)}>
                        <td className="px-8 py-2.5 text-left">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${skill.visuals.styles.box} ${skill.visuals.styles.border} ${skill.visuals.styles.glow} premium-icon-glow`}>
                              <div className={`text-lg ${skill.visuals.styles.text}`}>
                                <skill.visuals.Icon weight="duotone" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-[13px] uppercase tracking-tight" style={{ color: "var(--color-text-primary)" }}>{skill.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold leading-none mt-0.5">{skill.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-2.5 text-left">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 max-w-xs">{skill.description}</div>
                        </td>
                        <td className="px-8 py-2.5 text-center">
                           <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                             skill.visibility === 'public' || skill.status === 'Community'
                               ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                               : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                           }`}>
                             {skill.visibility === 'public' ? 'Public' : 'Team'}
                           </span>
                        </td>
                        <td className="px-8 py-2.5 text-center">
                           <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                             skill.state === 'testing'
                               ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse'
                               : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                           }`}>
                             {skill.state}
                           </span>
                        </td>
                        <td className="px-8 py-2.5 text-right font-black text-lg" style={{ color: "var(--color-text-primary)" }}>
                          {skill.credits_per_call} <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Credits</span>
                        </td>
                        <td className="px-8 py-2.5 text-right font-mono text-sm text-slate-500 dark:text-slate-400 font-bold">
                          {(skill.total_calls ?? 0).toLocaleString()}
                        </td>
                        <td className="px-8 py-2.5 text-right w-32">
                          {skill.state === 'testing' ? (
                            <div className="flex items-center justify-end gap-2">
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSkillToDelete({ uid: skill.id, name: skill.name });
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Delete Draft"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/t/${teamSlug}/dashboard/myskills/new?resume=${skill.id}`;
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                              >
                                <PlayCircle size={12} /> Resume
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2 pr-2">
                               {isAdmin && (
                                 <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/t/${teamSlug}/dashboard/myskills/new?resume=${skill.id}`;
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                  title="Edit Skill"
                                >
                                  <Pencil size={16} />
                                </button>
                               )}
                              <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-300 group-hover:text-blue-500">
                                 <ChevronRight size={18} />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSkills.length === 0 && !loading && (
                      <tr className="border-none">
                        <td colSpan={7} className="py-24 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                          No team skills found.
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </main>

      <DeleteSkillModal
        isOpen={!!skillToDelete}
        skillName={skillToDelete?.name || ''}
        onClose={() => setSkillToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
