import { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
    title: "Privacy Policy | UniSkill",
    description: "Privacy policy for UniSkill - The universal skill layer for AI agents.",
};

export default function PrivacyPage() {
    return <PrivacyClient />;
}
