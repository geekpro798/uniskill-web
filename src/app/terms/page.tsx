import { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
    title: "Terms of Service | UniSkill",
    description: "Terms and conditions for using the UniSkill universal skill layer infrastructure.",
};

export default function TermsPage() {
    return <TermsClient />;
}
