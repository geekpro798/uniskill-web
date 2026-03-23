// src/app/api/user/secrets/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { syncSecretsToGateway } from "@/services/secretSync";
import { supabase } from "@/lib/supabase";

/**
 * GET: Fetch the current user's secrets
 */
export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userUid = session.user.userUid;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('secrets')
      .eq('user_uid', userUid)
      .single();

    if (error) throw error;

    // 兼容旧版 Dashboard 的 Array 格式要求 (Compatibility for legacy Dashboard array format)
    const secretsRecord = profile?.secrets || {};
    const secretsArray = Object.entries(secretsRecord).map(([key, value]) => ({
      key,
      value
    }));

    return NextResponse.json({ 
      secrets: secretsArray, // Dashboard expects this
      secretsRecord: secretsRecord // Settings can use this
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Sync secrets (handles both Record and {secrets: Array} formats)
 */
export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userUid = session.user.userUid;
  const email = session.user.email;
  const body = await req.json();

  let secretsToSync: Record<string, string> = {};

  // 🌟 Format Conversion: Handle Dashboard's { secrets: [{key, value}] }
  if (body.secrets && Array.isArray(body.secrets)) {
    body.secrets.forEach((s: any) => {
      if (s.key) secretsToSync[s.key] = s.value;
    });
  } else {
    // Handle Settings' Record<string, string>
    secretsToSync = body;
  }

  if (!userUid || !email) {
    return NextResponse.json({ error: "User identity missing" }, { status: 400 });
  }

  try {
    const encryptedVault = await syncSecretsToGateway(userUid, email, secretsToSync);
    return NextResponse.json({ 
      success: true, 
      count: Object.keys(encryptedVault).length 
    });
  } catch (err: any) {
    console.error("[Vault API] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
