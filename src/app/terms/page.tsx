import { Metadata } from "next";
import TermsClient from "./TermsClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
    title: "Terms of Service | UniSkill",
    description: "Terms and conditions for using the UniSkill universal skill layer infrastructure.",
};

export default async function TermsPage() {
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
        <TermsClient 
            initialCredits={initialCredits} 
            initialDisplayName={initialDisplayName} 
            initialAvatarUrl={session?.user?.image || null}
        />
    );
}
