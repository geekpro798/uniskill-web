// src/app/api/user/secrets/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { syncSecretsToGateway } from "@/services/secretSync";

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userUid = session.user.userUid;
  const email = session.user.email;
  const secrets = await req.json(); // Record<string, string>

  if (!userUid || !email) {
    return NextResponse.json({ error: "User identity missing" }, { status: 400 });
  }

  try {
    const encryptedVault = await syncSecretsToGateway(userUid, email, secrets);
    return NextResponse.json({ 
      success: true, 
      count: Object.keys(encryptedVault).length 
    });
  } catch (err: any) {
    console.error("[Vault API] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
