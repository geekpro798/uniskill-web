"use client";

import { motion } from "framer-motion";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Footer from "@/components/Footer";

export default function PrivacyClient({ initialCredits, initialDisplayName, initialAvatarUrl }: { initialCredits?: number, initialDisplayName?: string | null, initialAvatarUrl?: string | null }) {
    const sections = [
        {
            title: "Information We Collect",
            content: "To provide a seamless infrastructure for your AI agents, we collect the following types of information:",
            list: [
                "Account Information: When you register via GitHub OAuth, we collect your GitHub ID, email address, and profile name to manage your account and authentication.",
                "API Keys: We generate and store unique API keys (e.g., in the format us-xxxxxxxx) to authorize your agent's requests.",
                "Usage Data: We log API request metadata, including timestamps, skill types used (e.g., uniskill_search, uniskill_scrape), and credit consumption to maintain your balance and prevent service abuse.",
                "Technical Logs: For security and rate-limiting purposes, we collect IP addresses and browser/environment data when you execute our connect.sh script or access our gateway.",
            ],
        },
        {
            title: "How We Use Your Information",
            content: "We use the collected data strictly for the following purposes:",
            list: [
                "Service Provision: To execute the \"skills\" your agent requests, such as retrieving search results or scraping web content.",
                "Credit Management: To track and deduct credits from your account (including the initial 500 free credits provided upon registration).",
                "Rate Limiting & Security: To enforce our tier-based RPM limits (30 - 1000 RPM) and protect our infrastructure from malicious activity.",
                "Communication: To send important updates regarding your account, billing, or significant changes to our \"Skill Layer\" infrastructure.",
            ],
        },
        {
            title: "Data Sharing and Third Parties",
            content: "We do not sell your personal data. However, we share necessary information with trusted service providers to run UniSkill:",
            list: [
                "Infrastructure: We use Vercel for web hosting and Supabase for secure database and authentication management.",
                "Service Integration: Requests for search or scraping may be processed via third-party providers like Jina AI or other search engines. These providers only receive the specific query or URL required to perform the task; they do not receive your UniSkill account details.",
            ],
        },
        {
            title: "Data Retention",
            list: [
                "Account Data: We retain your account information as long as your account is active.",
                "Request Logs: We may store API request logs for a limited period (typically 30 days) to facilitate debugging and usage analytics, after which they are anonymized or deleted.",
            ],
        },
        {
            title: "Your Rights",
            content: "You have the right to access, correct, or delete your personal information. If you wish to close your account and remove your data from our systems (including Supabase and our gateway logs), please contact us at support@uniskill.ai.",
        },
        {
            title: "Changes to This Policy",
            content: "We may update this Privacy Policy to reflect changes in our skills or legal requirements. We will notify you of any significant changes by posting the new policy on this page and updating the \"Last Updated\" date.",
        },
    ];

    return (
        <main className="min-h-screen selection:bg-blue-500/30" style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-secondary)" }}>
            <UnifiedNavbar initialCredits={initialCredits} initialDisplayName={initialDisplayName} initialAvatarUrl={initialAvatarUrl} />

            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
            </div>

            <section className="relative z-10 pb-20 lg:px-8">
                <main className="max-w-4xl mx-auto px-6 pt-[88px] md:pt-[100px] pb-24">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-12"
                    >
                        <h1 className="text-2xl font-black mb-4 tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                            Privacy Policy
                        </h1>
                        <p className="text-blue-400 font-medium">Last Updated: March 1, 2026</p>
                    </motion.div>

                    {/* Content Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="glass-card p-8 md:p-12 mb-10"
                        style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border-subtle)" }}
                    >
                        <p className="text-lg leading-relaxed mb-10" style={{ color: "var(--color-text-secondary)" }}>
                            Welcome to UniSkill (referred to as &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We are committed to protecting your privacy while providing the universal skill layer for AI agents. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website at <a href="https://uniskill.ai" className="text-blue-400 hover:text-blue-300 transition-colors">uniskill.ai</a> or use our API services.
                        </p>

                        <div className="space-y-12">
                            {sections.map((section, index) => (
                                <section key={index} className="scroll-mt-24">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3" style={{ color: "var(--color-text-primary)" }}>
                                        <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm flex-shrink-0">
                                            {index + 1}
                                        </span>
                                        {section.title}
                                    </h3>

                                    {section.content && (
                                        <p className="leading-relaxed mb-4" style={{ color: "var(--color-text-secondary)", opacity: 0.8 }}>
                                            {section.content}
                                        </p>
                                    )}

                                    {section.list && (
                                        <ul className="list-disc pl-6 space-y-3 marker:text-blue-500" style={{ color: "var(--color-text-secondary)", opacity: 0.8 }}>
                                            {section.list.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ))}
                        </div>
                    </motion.div>
                </main>
            </section>

            <Footer />
        </main>
    );
}
