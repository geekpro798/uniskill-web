// uniskill-web/src/app/api/skills/route.ts
// Logic: Serve the Skills Store metadata from the unified local registry.

import { NextResponse } from "next/server";
import { getAllSkills } from "@/lib/skills-parser";

export async function GET() {
    try {
        const skills = getAllSkills();
        return NextResponse.json(skills);
    } catch (error) {
        console.error("[API] Failed to fetch skills:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
