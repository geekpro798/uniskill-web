// uniskill-web/src/app/skills/[skillId]/page.tsx
// Logic: Server Component to load skill details from the official local registry.

import React from 'react';
import { SkillDetail } from '@/components/SkillDetail';
import { notFound } from 'next/navigation';
import { parseSkillFile } from '@/lib/skills-parser';

interface PageProps {
    params: {
        skillId: string;
    };
}

export default async function SkillPage({ params }: PageProps) {
    const { skillId } = await params;

    // 逻辑：直接从本地 registry 目录读取 MD 文件，确保 ID 和 Name 绝对准确
    const skillData = parseSkillFile(skillId);

    if (!skillData) {
        console.warn(`[SKILL PAGE] Skill not found in registry: ${skillId}`);
        notFound();
    }

    return (
        <main className="min-h-screen bg-[#0a0f1e]">
            {/* 逻辑：由于现在是直接读本地文件，我们将 data 结构对齐传递给客户端组件 */}
            <SkillDetail
                skillId={skillId}
                skill={skillData}
                isOfficial={skillData.status === "Official"}
                isOwner={true} // 本地预览模式默认拥有权限
            />
        </main>
    );
}
