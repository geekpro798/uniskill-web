import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { key } = await req.json();

        if (!key || typeof key !== "string" || !key.startsWith("us-")) {
            return NextResponse.json({ error: "Invalid API Key format" }, { status: 400 });
        }

        // Generate SHA-256 hash of the raw API Key
        const tokenHash = crypto.createHash("sha256").update(key).digest("hex");

        // Initialize Supabase with Service Role to check keys directly
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if the hash exists in the profiles table
        const { data, error } = await supabase
            .from("profiles")
            .select("github_id")
            .eq("key_hash", tokenHash)
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
