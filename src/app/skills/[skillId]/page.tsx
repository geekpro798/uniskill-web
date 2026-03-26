'use client';

import React, { useState, useEffect } from 'react';
import { SkillDetail, SkillSpec } from '@/components/SkillDetail';
import { useParams, notFound } from 'next/navigation';
import { resolveSkillVisuals } from '@/lib/skill-visual-identity'; // 🌟 Optimized Identity System

export default function SkillPage() {
    const params = useParams();
    const skillId = params.skillId as string;
    const [skillData, setSkillData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSkill() {
            if (!skillId) return;
            try {
                // 逻辑：从 API 获取技能数据
                const response = await fetch(`/api/skills/${skillId}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // 🌟 Apply unified visuals
                    const visuals = resolveSkillVisuals(data);
                    
                    setSkillData({
                        ...data,
                        visuals: visuals
                    });
                }
            } catch (err) {
                console.error("[SKILL PAGE] Fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchSkill();
    }, [skillId]);

    if (loading) return null; // Or a loader

    if (!skillData) {
        notFound();
    }

    return (
        <main className="min-h-screen transition-colors duration-500" style={{ backgroundColor: "var(--color-bg-primary)" }}>
            <SkillDetail
                skill_name={skillId}
                skill={skillData}
                isOfficial={skillData.status === "Official"}
                isOwner={true}
            />
        </main>
    );
}
