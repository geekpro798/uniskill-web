
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function check() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const githubId = "41595156"; // Assuming this is the user's ID from common patterns, or I'll search for it

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("github_id", githubId)
        .single();

    if (error) {
        console.error("Error:", error);
        // If github_id is unknown, let's just list the last 5 users
        const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5);
        console.log("Recent Users:", JSON.stringify(users, null, 2));
    } else {
        console.log("User Profile:", JSON.stringify(data, null, 2));
    }
}

check();
