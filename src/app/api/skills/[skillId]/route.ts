import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ skillId: string }> }
) {
    // Next.js 15+ convention for dynamic params in route handlers
    const { skillId } = await params;

    try {
        // Fetch from Supabase as the source of truth
        const { data: skill, error } = await supabase
            .from("skills")
            .select("*")
            .eq("skill_name", skillId)
            .maybeSingle();

        if (error) throw error;
        if (!skill) {
            return NextResponse.json({ error: "Skill not found" }, { status: 404 });
        }

        // Return formatted data for UI consistency
        const formattedSkill = {
            ...skill,
            invocations: skill.total_calls || 0
        };

        return NextResponse.json(formattedSkill);
    } catch (error) {
        console.error(`[API] Failed to fetch skill details for ${skillId}:`, error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
