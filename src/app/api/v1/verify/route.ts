import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token || typeof token !== "string" || !token.startsWith("us-")) {
            return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
        }

        // Generate SHA-256 hash of the raw token
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // Initialize Supabase with Service Role to check tokens directly
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if the hash exists in the profiles table
        const { data, error } = await supabase
            .from("profiles")
            .select("github_id")
            .eq("token_hash", tokenHash)
            .maybeSingle();

        if (error) {
            console.error("[Verify API] Supabase error:", error);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({ success: true, message: "API Key is valid" });
    } catch (err) {
        console.error("[Verify API] Unexpected error:", err);
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
}
