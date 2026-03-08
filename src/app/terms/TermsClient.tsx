"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsClient() {
    const sections = [
        {
            title: "Description of Service",
            content: "UniSkill provides a managed infrastructure (\"The Universal Skill Layer\") that enables AI agents to execute complex tasks, including but not limited to real-time web search and automated content scraping via our gateway.",
        },
        {
            title: "Account Registration and Security",
            list: [
                "Authentication: You must authenticate via GitHub OAuth to create an account.",
                "API Key Responsibility: Upon registration or via our setup-skills.sh script, you are provided with a unique API Key (e.g., us-xxxxxxxx).",
                "Security: You are solely responsible for maintaining the confidentiality of your key. Any activity performed using your key will be attributed to your account.",
            ],
        },
        {
            title: "Credit System and Payments",
            list: [
                "Initial Credits: New accounts receive 500 complimentary credits for testing purposes.",
                "Consumption: Credits are deducted based on the specific \"skill\" invoked (e.g., uniskill_search or uniskill_scrape) and the complexity of the task.",
                "No Refunds: Credits purchased through our subscription tiers (Starter, Pro, Scale) are non-refundable and hold no cash value.",
            ],
        },
        {
            title: "Acceptable Use and Restrictions",
            content: "You agree NOT to use UniSkill to:",
            list: [
                "Illegal Activity: Scrape or search for content that violates any local, state, or international laws.",
                "Abuse: Attempt to bypass our rate limits (30 RPM for Free / 60+ RPM for higher tiers) or execute DDoS attacks against our gateway.",
                "Reselling: Sub-license or resell access to your UniSkill API Key without explicit written consent.",
            ],
        },
        {
            title: "Disclaimer of Warranties",
            content: "UniSkill is provided on an \"as-is\" and \"as-available\" basis. While we strive for high uptime (tracked via status.uniskill.ai), we do not guarantee that the skills will be uninterrupted or error-free. We are not responsible for the accuracy of data retrieved from third-party websites during search or scrape operations.",
        },
        {
            title: "Limitation of Liability",
            content: "To the maximum extent permitted by law, UniSkill shall not be liable for any indirect, incidental, or consequential damages arising from:",
            list: [
                "The actions or decisions made by an AI agent using our skills.",
                "Temporary service outages or data loss within the Supabase or Vercel infrastructure.",
            ],
        },
        {
            title: "Termination",
            content: "We reserve the right to suspend or terminate your access to the API immediately, without prior notice, if you violate any of these terms or engage in activity that threatens the stability of our Skill Layer.",
        },
        {
            title: "Governing Law",
            content: "These terms are governed by the laws of the jurisdiction in which the UniSkill operator is based, without regard to its conflict of law provisions.",
        },
    ];

    return (
        <main className="min-h-screen bg-[#0a0f1e] text-slate-300 selection:bg-blue-500/30">
            <Navbar />

            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
            </div>

            <section className="relative z-10 pt-32 pb-20 px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            Terms of Service
                        </h1>
                        <p className="text-blue-400 font-medium">Effective Date: March 1, 2026</p>
                    </motion.div>

                    {/* Content Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="glass-card p-8 md:p-12 border-white/5"
                    >
                        <p className="text-lg leading-relaxed text-slate-300 mb-10">
                            By accessing UniSkill (<a href="https://uniskill.ai" className="text-blue-400 hover:text-blue-300 transition-colors">uniskill.ai</a>) or using our &quot;Skill Layer&quot; API, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
                        </p>

                        <div className="space-y-12">
                            {sections.map((section, index) => (
                                <section key={index} className="scroll-mt-24">
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm flex-shrink-0">
                                            {index + 1}
                                        </span>
                                        {section.title}
                                    </h3>

                                    {section.content && (
                                        <p className="leading-relaxed text-slate-400 mb-4">
                                            {section.content}
                                        </p>
                                    )}

                                    {section.list && (
                                        <ul className="list-disc pl-6 space-y-3 marker:text-blue-500 text-slate-400">
                                            {section.list.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
