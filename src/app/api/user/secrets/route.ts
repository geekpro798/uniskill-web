// src/app/api/user/secrets/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import { encrypt, decrypt } from "@/utils/encryption";

// Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/user/secrets
 * Fetch all global secrets for the authenticated user.
 */
export async function GET() {
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userUid = session.user.userUid;
    if (!userUid) {
        return NextResponse.json({ error: "User Profile not found" }, { status: 404 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('secrets')
            .eq('user_uid', userUid)
            .single();

        if (error) throw error;
        
        const rawSecrets = data?.secrets || {};
        const decryptedSecrets: Record<string, string> = {};

        // 🔓 Decrypt all secrets for the vault view
        Object.entries(rawSecrets).forEach(([k, v]) => {
            try {
                const val = v as string;
                const isEncrypted = /^[0-9a-f]+\.[0-9a-f]+\.[0-9a-f]+$/i.test(val);
                decryptedSecrets[k] = isEncrypted 
                    ? decrypt(val, process.env.MASTER_ENCRYPTION_KEY!) 
                    : val;
            } catch (decErr) {
                decryptedSecrets[k] = "[Decryption Failed]";
            }
        });

        return NextResponse.json(decryptedSecrets);
    } catch (err: any) {
        console.error("[Secrets GET] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/user/secrets
 * Create or update a global secret.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key_name, value } = await req.json();
    if (!key_name || !value) {
        return NextResponse.json({ error: "Missing key_name or value" }, { status: 400 });
    }

    const userUid = session.user.userUid;
    if (!userUid) {
        return NextResponse.json({ error: "User Profile not found" }, { status: 404 });
    }

    try {
        // 🔒 Server-Side Encryption
        const isAlreadyEncrypted = (v: string) => /^[0-9a-f]+\.[0-9a-f]+\.[0-9a-f]+$/i.test(v);
        const encryptedValue = isAlreadyEncrypted(value) 
            ? value 
            : encrypt(value, process.env.MASTER_ENCRYPTION_KEY!);

        // 1. Fetch current secrets
        const { data: profile, error: getError } = await supabaseAdmin
            .from('profiles')
            .select('secrets')
            .eq('user_uid', userUid)
            .single();
        
        if (getError) throw getError;

        const currentSecrets = profile?.secrets || {};
        const updatedSecrets = { ...currentSecrets, [key_name]: encryptedValue };

        // 2. Update profiles table
        const { data: updateData, error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ secrets: updatedSecrets })
            .eq('user_uid', userUid)
            .select('secrets')
            .single();

        if (updateError) throw updateError;

        // 🔓 Decrypt for response
        const finalSecrets: Record<string, string> = {};
        Object.entries(updateData.secrets as Record<string, string>).forEach(([k, v]) => {
            try {
                const isEncrypted = /^[0-9a-f]+\.[0-9a-f]+\.[0-9a-f]+$/i.test(v);
                finalSecrets[k] = isEncrypted 
                    ? decrypt(v, process.env.MASTER_ENCRYPTION_KEY!) 
                    : v;
            } catch {
                finalSecrets[k] = "[Decryption Failed]";
            }
        });

        return NextResponse.json(finalSecrets);
    } catch (err: any) {
        console.error("[Secrets POST] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * DELETE /api/user/secrets?key_name=...
 * Remove a global secret from the profiles table.
 */
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key_name = searchParams.get('key_name');
    if (!key_name) {
        return NextResponse.json({ error: "Missing key_name" }, { status: 400 });
    }

    const userUid = session.user.userUid;
    if (!userUid) {
        return NextResponse.json({ error: "User Profile not found" }, { status: 404 });
    }

    try {
        // 1. Fetch current secrets
        const { data: profile, error: getError } = await supabaseAdmin
            .from('profiles')
            .select('secrets')
            .eq('user_uid', userUid)
            .single();
        
        if (getError) throw getError;

        const currentSecrets = profile?.secrets || {};
        const { [key_name]: removed, ...rest } = currentSecrets;

        // 2. Update profiles table
        const { data: updateData, error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ secrets: rest })
            .eq('user_uid', userUid)
            .select('secrets')
            .single();

        if (updateError) throw updateError;

        // 🔓 Decrypt for response
        const finalSecrets: Record<string, string> = {};
        Object.entries(updateData.secrets as Record<string, string>).forEach(([k, v]) => {
            try {
                const isEncrypted = /^[0-9a-f]+\.[0-9a-f]+\.[0-9a-f]+$/i.test(v);
                finalSecrets[k] = isEncrypted 
                    ? decrypt(v, process.env.MASTER_ENCRYPTION_KEY!) 
                    : v;
            } catch {
                finalSecrets[k] = "[Decryption Failed]";
            }
        });

        return NextResponse.json(finalSecrets);
    } catch (err: any) {
        console.error("[Secrets DELETE] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
