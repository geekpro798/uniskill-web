import { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
    title: "Privacy Policy | UniSkill",
    description: "Privacy policy for UniSkill - The universal skill layer for AI agents.",
};

export default async function PrivacyPage() {
    const session: any = await getServerSession(authOptions as any);
    let initialCredits = undefined;
    let initialDisplayName = null;

    if (session?.user?.userUid) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data } = await supabase
            .from("profiles")
            .select("credits, display_name")
            .eq("user_uid", session.user.userUid)
            .single();
        
        if (data) {
            initialCredits = data.credits;
            initialDisplayName = data.display_name;
        }
    }

    return (
        <PrivacyClient 
            initialCredits={initialCredits} 
            initialDisplayName={initialDisplayName} 
            initialAvatarUrl={session?.user?.image || null}
        />
    );
}
