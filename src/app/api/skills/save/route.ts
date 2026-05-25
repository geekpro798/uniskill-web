// src/app/api/skills/save/route.ts
// Secure API to save or update skills with server-side secret encryption
// 功能：集成服务端加密的技能保存接口，确保护控制台 `.next` 运行时持有 Master Key 分离

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import { encrypt } from "@/utils/encryption";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
        skill_uid,
        skill_name,
        display_name,
        description,
        markdown_manifest,
        status,
        owner_uid,
        state,
        secrets,
        emoji,
        team_uid,
        visibility
    } = body;

    if (!skill_name || !owner_uid) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 🔒 Server-Side Encryption (仅对尚未加密的明文进行加密)
        // AES-256-GCM 加密串格式: iv.authTag.encryptedHex (三段十六进制用点分隔)
        const isAlreadyEncrypted = (v: string) => /^[0-9a-f]+\.[0-9a-f]+\.[0-9a-f]+$/i.test(v);
        const encryptedSecrets = Array.isArray(secrets) ? secrets.map((s: any) => ({
            key: s.key,
            value: isAlreadyEncrypted(s.value) ? s.value : encrypt(s.value, process.env.MASTER_ENCRYPTION_KEY!)
        })) : [];

        const payload = {
            skill_name,
            display_name,
            description,
            markdown_manifest,
            status,
            owner_uid,
            state,
            secrets: encryptedSecrets,
            emoji,
            credits_per_call: 1,
            usd_per_call: 0.001,
            gradient_from: body.gradient_from || 'from-blue-500',
            gradient_to: body.gradient_to || 'to-indigo-500'
        };
        if (team_uid) (payload as any).team_uid = team_uid;
        if (visibility) (payload as any).visibility = visibility;

        let result;
        if (skill_uid) {
            // Update existing
            const { data, error } = await supabaseAdmin
                .from('skills')
                .update(payload)
                .eq('skill_uid', skill_uid)
                .select().single();
            if (error) throw error;
            result = data;
        } else {
            // Insert new
            const { data, error } = await supabaseAdmin
                .from('skills')
                .insert(payload)
                .select().single();
            if (error) throw error;
            result = data;
        }

        return NextResponse.json(result);

    } catch (err: any) {
        console.error("[Skill Save] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
