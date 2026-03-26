// src/app/dashboard/skills/[slug]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useSession } from "next-auth/react";
import { SkillDetail, SkillSpec } from '@/components/SkillDetail';
import { supabase } from "@/lib/supabase";
import { Loader2 } from 'lucide-react';
import { resolveSkillVisuals } from '@/lib/skill-visual-identity'; // 🌟 Optimized Identity System

/**
 * Dashboard Skill Detail Page
 * Logic: Fetches custom user skill from Supabase and renders using the official SkillDetail template.
 */
export default function UserSkillDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session, status } = useSession();
  const [skill, setSkill] = useState<SkillSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfficial, setIsOfficial] = useState(false);
  const [skillStatus, setSkillStatus] = useState<string>('');

  useEffect(() => {
    async function fetchSkill() {
      if (status !== 'authenticated' || !slug) return;

      try {
        const { data, error } = await supabase
          .from('skills')
          .select('*')
          .eq('skill_name', slug)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setLoading(false);
          return;
        }

        // 🌟 Use unified visual mapper
        const visuals = resolveSkillVisuals(data);

        // Map database record to SkillSpec protocol
        const spec: SkillSpec = {
          display_name: data.display_name || data.skill_name || "Untitled",
          description: data.description || "No description provided.",
          credits_per_call: data.credits_per_call || 1,
          usd_per_call: data.usd_per_call || 0.001,
          parameters: data.parameters || { type: "object", properties: {} },
          returns: data.returns || null,
          implementation: {}, // Privacy: Implementation code is hidden from this view
          gradientFrom: data.gradient_from || (data.status === 'Community' ? 'from-purple-600' : 'from-blue-600'),
          gradientTo: data.gradient_to || (data.status === 'Community' ? 'to-pink-500' : 'to-cyan-400'),
          visuals: visuals
        };
        
        setSkill(spec);
        setIsOfficial(data.status === 'Official');
        setSkillStatus(data.status || '');
      } catch (err) {
        console.error("[SkillDetail Fetch Error]", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSkill();
  }, [slug, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Initialising Detail...</span>
        </div>
      </div>
    );
  }

  if (!skill) {
    notFound();
  }

  return (
    <main className="min-h-screen transition-colors duration-500" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <SkillDetail
        skill_name={slug}
        skill={skill}
        isOfficial={isOfficial}
        isOwner={true}
        status={skillStatus}
      />
    </main>
  );
}
