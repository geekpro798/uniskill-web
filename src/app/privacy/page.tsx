"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#0a0f1e] text-slate-300 selection:bg-blue-500/30">
            <Navbar />

            {/* 顶层背景装饰 */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
            </div>

            <section className="relative z-10 pt-32 pb-20 px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    {/* 页面标题 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-blue-400 font-medium">Last Updated: March 1, 2026</p>
                    </motion.div>

                    {/* 正文内容 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="glass-card p-8 md:p-12 prose prose-invert prose-blue max-w-none border-white/5"
                    >
                        <p className="text-lg leading-relaxed text-slate-300">
                            Welcome to UniSkill (referred to as &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We are committed to protecting your privacy while providing the universal skill layer for AI agents. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website at <a href="https://uniskill.ai" className="text-blue-400 hover:text-blue-300 transition-colors">uniskill.ai</a> or use our API services.
                        </p>

                        <hr className="my-10 border-white/5" />

                        <div className="space-y-10 text-slate-300">
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm">1</span>
                                    Information We Collect
                                </h3>
                                <p className="mb-4">To provide a seamless infrastructure for your AI agents, we collect the following types of information:</p>
                                <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
                                    <li><strong>Account Information</strong>: When you register via GitHub OAuth, we collect your GitHub ID, email address, and profile name to manage your account and authentication.</li>
                                    <li><strong>API Keys</strong>: We generate and store unique API keys (e.g., in the format <code className="text-blue-300 px-1.5 py-0.5 bg-blue-500/10 rounded">us-xxxxxxxx</code>) to authorize your agent&apos;s requests.</li>
                                    <li><strong>Usage Data</strong>: We log API request metadata, including timestamps, skill types used (e.g., <code className="text-blue-300 px-1.5 py-0.5 bg-blue-500/10 rounded">uniskill_search</code>, <code className="text-blue-300 px-1.5 py-0.5 bg-blue-500/10 rounded">uniskill_scrape</code>), and credit consumption to maintain your balance and prevent service abuse.</li>
                                    <li><strong>Technical Logs</strong>: For security and rate-limiting purposes, we collect IP addresses and browser/environment data when you execute our <code className="text-blue-300 px-1.5 py-0.5 bg-blue-500/10 rounded">setup-skills.sh</code> script or access our gateway.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm">2</span>
                                    How We Use Your Information
                                </h3>
                                <p className="mb-4">We use the collected data strictly for the following purposes:</p>
                                <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
                                    <li><strong>Service Provision</strong>: To execute the &quot;skills&quot; your agent requests, such as retrieving search results or scraping web content.</li>
                                    <li><strong>Credit Management</strong>: To track and deduct credits from your account (including the initial 500 free credits provided upon registration).</li>
                                    <li><strong>Rate Limiting &amp; Security</strong>: To enforce our 30/60 RPM limits and protect our infrastructure from malicious activity.</li>
                                    <li><strong>Communication</strong>: To send important updates regarding your account, billing, or significant changes to our &quot;Skill Layer&quot; infrastructure.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm">3</span>
                                    Data Sharing and Third Parties
                                </h3>
                                <p className="mb-4">We do not sell your personal data. However, we share necessary information with trusted service providers to run UniSkill:</p>
                                <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
                                    <li><strong>Infrastructure</strong>: We use <strong>Vercel</strong> for web hosting and <strong>Supabase</strong> for secure database and authentication management.</li>
                                    <li><strong>Service Integration</strong>: Requests for search or scraping may be processed via third-party providers like <strong>Jina AI</strong> or other search engines. These providers only receive the specific query or URL required to perform the task; they do not receive your UniSkill account details.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm">4</span>
                                    Data Retention
                                </h3>
                                <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
                                    <li><strong>Account Data</strong>: We retain your account information as long as your account is active.</li>
                                    <li><strong>Request Logs</strong>: We may store API request logs for a limited period (typically 30 days) to facilitate debugging and usage analytics, after which they are anonymized or deleted.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm">5</span>
                                    Your Rights
                                </h3>
                                <p>You have the right to access, correct, or delete your personal information. If you wish to close your account and remove your data from our systems (including Supabase and our gateway logs), please contact us at <a href="mailto:support@uniskill.ai" className="text-blue-400 hover:underline">support@uniskill.ai</a>.</p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm">6</span>
                                    Changes to This Policy
                                </h3>
                                <p>We may update this Privacy Policy to reflect changes in our skills or legal requirements. We will notify you of any significant changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date.</p>
                            </section>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
