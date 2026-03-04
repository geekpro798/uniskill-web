// src/app/skills/[id]/page.tsx
// 技能详情页 — 公开路由，无需登录
// 路由：/skills/[id]（e.g. /skills/search, /skills/scrape）

"use client";

import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

/* ─── 技能数据 Map ─────────────────────────────────────────────────────────
   包含 6 个内置技能的完整元数据，供详情页渲染使用
   ─────────────────────────────────────────────────────────────────────── */
const SKILL_DATA: Record<string, {
    name: string;
    emoji: string;
    gradientFrom: string;
    gradientTo: string;
    status: "Active" | "Beta";
    author: string;
    isOfficial: boolean;
    costPerCall: number;
    latency: string;
    successRate: string;
    description: string;
    longDescription: string;
    plugin: string;
    params: { name: string; type: string; required: boolean; description: string }[];
    responseSchema: { field: string; type: string; description: string }[];
    useCases: string[];
}> = {
    search: {
        name: "Search",
        emoji: "🔍",
        gradientFrom: "from-blue-500",
        gradientTo: "to-cyan-400",
        status: "Active",
        author: "UniSkill Team",
        isOfficial: true,
        costPerCall: 1,
        latency: "~800ms",
        successRate: "99.2%",
        plugin: "uniskill_search",
        description: "AI-powered web search with semantic ranking.",
        longDescription: "The Search skill provides real-time access to the web with AI-powered semantic ranking. Unlike traditional keyword search, it understands the intent behind queries and returns the most contextually relevant results. Each response includes structured metadata — titles, URLs, snippets, and domain authority scores — making it ideal for use in RAG pipelines, research agents, and competitive intelligence workflows.",
        params: [
            { name: "query", type: "string", required: true, description: "Natural language search query" },
            { name: "max_results", type: "number", required: false, description: "Maximum number of results (default: 5, max: 20)" },
            { name: "include_domains", type: "string[]", required: false, description: "Whitelist of domains to include" },
            { name: "exclude_domains", type: "string[]", required: false, description: "Blacklist of domains to exclude" },
        ],
        responseSchema: [
            { field: "results[].title", type: "string", description: "Page title" },
            { field: "results[].url", type: "string", description: "Canonical URL" },
            { field: "results[].snippet", type: "string", description: "AI-generated summary snippet" },
            { field: "results[].score", type: "number", description: "Relevance score (0–1)" },
            { field: "query_time_ms", type: "number", description: "Server-side processing time" },
        ],
        useCases: [
            "Stock market analysis — search latest earnings reports",
            "Competitive intelligence — monitor competitor announcements",
            "RAG pipelines — fetch up-to-date context for LLM prompts",
            "Research agents — automate literature reviews",
        ],
    },
    scrape: {
        name: "Scrape",
        emoji: "🕷️",
        gradientFrom: "from-purple-500",
        gradientTo: "to-violet-400",
        status: "Active",
        author: "UniSkill Team",
        isOfficial: true,
        costPerCall: 2,
        latency: "~1.5s",
        successRate: "97.8%",
        plugin: "uniskill_scrape",
        description: "Extract full-page content from any URL.",
        longDescription: "The Scrape skill renders and extracts content from any public URL, including JavaScript-heavy single-page applications. It returns clean, markdown-formatted text stripped of navigation, ads, and boilerplate — ready to be injected directly into an LLM context window. Handles bot detection mitigation and supports cookie-based page access.",
        params: [
            { name: "url", type: "string", required: true, description: "Target URL to scrape" },
            { name: "format", type: "'markdown' | 'text' | 'html'", required: false, description: "Output format (default: markdown)" },
            { name: "wait_for", type: "string", required: false, description: "CSS selector to wait for before scraping" },
            { name: "timeout", type: "number", required: false, description: "Max wait time in ms (default: 10000)" },
        ],
        responseSchema: [
            { field: "content", type: "string", description: "Extracted page content in requested format" },
            { field: "title", type: "string", description: "Page <title> tag" },
            { field: "url", type: "string", description: "Final resolved URL (after redirects)" },
            { field: "word_count", type: "number", description: "Approximate word count of content" },
        ],
        useCases: [
            "Ingest documentation sites into a knowledge base",
            "Monitor pricing pages for competitor changes",
            "Extract blog content for summarization pipelines",
            "Pull legal/compliance documents for analysis",
        ],
    },
    news: {
        name: "News",
        emoji: "📰",
        gradientFrom: "from-cyan-500",
        gradientTo: "to-teal-400",
        status: "Active",
        author: "UniSkill Team",
        isOfficial: true,
        costPerCall: 1,
        latency: "~600ms",
        successRate: "99.5%",
        plugin: "uniskill_news",
        description: "Real-time news aggregation from 50,000+ sources.",
        longDescription: "The News skill aggregates real-time articles from over 50,000 global sources, applying deduplication, relevance ranking, and AI-generated sentiment scoring. Filter results by topic, language, country, or time window. Ideal for financial agents that need to correlate market events with news sentiment, or for news digest bots.",
        params: [
            { name: "query", type: "string", required: true, description: "Topic or keyword to search" },
            { name: "language", type: "string", required: false, description: "ISO 639-1 language code (e.g. 'en', 'zh')" },
            { name: "from_date", type: "string", required: false, description: "Start date filter (ISO 8601)" },
            { name: "max_results", type: "number", required: false, description: "Number of articles (default: 5)" },
        ],
        responseSchema: [
            { field: "articles[].title", type: "string", description: "Article headline" },
            { field: "articles[].url", type: "string", description: "Link to the original article" },
            { field: "articles[].source", type: "string", description: "Publisher name" },
            { field: "articles[].published_at", type: "string", description: "ISO 8601 publish timestamp" },
            { field: "articles[].sentiment", type: "'positive' | 'neutral' | 'negative'", description: "AI-inferred sentiment" },
        ],
        useCases: [
            "Finance bots — correlate earnings news with stock movements",
            "Daily digest agents — compile morning briefings",
            "Brand monitoring — track mentions across global press",
            "Geopolitical risk analysis for investment agents",
        ],
    },
    social: {
        name: "Social",
        emoji: "💬",
        gradientFrom: "from-green-500",
        gradientTo: "to-emerald-400",
        status: "Beta",
        author: "UniSkill Labs",
        isOfficial: true,
        costPerCall: 3,
        latency: "~1.2s",
        successRate: "95.1%",
        plugin: "uniskill_social",
        description: "Monitor social media trends across Twitter/X, Reddit, and HN.",
        longDescription: "The Social skill connects your agent to live social media signals across Twitter/X, Reddit, and Hacker News. Track trending topics, monitor brand mentions, analyze community sentiment, and surface viral threads. Useful for product launch monitoring, community management agents, and social listening dashboards. Currently in Beta with planned expansion to LinkedIn and Bluesky.",
        params: [
            { name: "query", type: "string", required: true, description: "Keyword, hashtag, or @mention to track" },
            { name: "platforms", type: "('twitter' | 'reddit' | 'hn')[]", required: false, description: "Platforms to query (default: all)" },
            { name: "time_window", type: "'1h' | '24h' | '7d'", required: false, description: "Recency filter (default: 24h)" },
            { name: "max_results", type: "number", required: false, description: "Results per platform (default: 5)" },
        ],
        responseSchema: [
            { field: "posts[].platform", type: "string", description: "Source platform" },
            { field: "posts[].content", type: "string", description: "Post text (truncated at 500 chars)" },
            { field: "posts[].author", type: "string", description: "Username or handle" },
            { field: "posts[].engagement", type: "number", description: "Likes + shares + comments total" },
            { field: "posts[].url", type: "string", description: "Direct link to the post" },
        ],
        useCases: [
            "Product launch monitoring — surface reactions in real time",
            "Community sentiment tracking for brand teams",
            "Trend detection for content strategy agents",
            "Hacker News thread analysis for tech intelligence",
        ],
    },
    extract: {
        name: "Extract",
        emoji: "🗂️",
        gradientFrom: "from-yellow-500",
        gradientTo: "to-amber-400",
        status: "Active",
        author: "UniSkill Team",
        isOfficial: true,
        costPerCall: 2,
        latency: "~1.0s",
        successRate: "98.4%",
        plugin: "uniskill_extract",
        description: "Structured data extraction from documents, PDFs, and web pages.",
        longDescription: "The Extract skill uses LLM-guided structured extraction to pull typed data from unstructured sources — PDFs, HTML documents, and plain text. Define your target JSON schema and the skill will parse, validate, and return clean typed output. Supports nested objects, arrays, and optional fields with confidence scores. Perfect for automating data entry, invoice processing, and document intelligence pipelines.",
        params: [
            { name: "source", type: "string", required: true, description: "URL or raw text content to extract from" },
            { name: "schema", type: "object", required: true, description: "JSON Schema defining the extraction target structure" },
            { name: "source_type", type: "'url' | 'text' | 'pdf'", required: false, description: "Type of input (auto-detected if omitted)" },
        ],
        responseSchema: [
            { field: "data", type: "object", description: "Extracted data conforming to the provided schema" },
            { field: "confidence", type: "number", description: "Overall extraction confidence (0–1)" },
            { field: "missing_fields", type: "string[]", description: "Schema fields not found in source" },
        ],
        useCases: [
            "Invoice processing — extract line items, totals, vendor info",
            "Resume parsing — pull structured candidate profiles",
            "Contract analysis — extract dates, parties, and obligations",
            "Product catalog enrichment from supplier PDFs",
        ],
    },
    vision: {
        name: "Vision",
        emoji: "👁️",
        gradientFrom: "from-pink-500",
        gradientTo: "to-rose-400",
        status: "Beta",
        author: "UniSkill Labs",
        isOfficial: true,
        costPerCall: 5,
        latency: "~2.0s",
        successRate: "96.3%",
        plugin: "uniskill_vision",
        description: "Analyze images, screenshots, and charts with multimodal AI.",
        longDescription: "The Vision skill brings multimodal AI capabilities to your agent. Submit any image — screenshots, product photos, data charts, scanned documents, or UI mockups — and receive structured analysis in return. Supports OCR text extraction, scene description, chart data parsing, object detection, and visual Q&A. Built on top of state-of-the-art vision models with a streaming response option.",
        params: [
            { name: "image_url", type: "string", required: true, description: "Public URL or base64-encoded image" },
            { name: "task", type: "'describe' | 'ocr' | 'chart' | 'qa'", required: false, description: "Analysis mode (default: describe)" },
            { name: "question", type: "string", required: false, description: "Question for 'qa' task mode" },
        ],
        responseSchema: [
            { field: "result", type: "string", description: "Primary analysis output (description, extracted text, or answer)" },
            { field: "objects", type: "string[]", description: "Detected objects or key elements (describe/ocr modes)" },
            { field: "confidence", type: "number", description: "Model confidence in the analysis (0–1)" },
        ],
        useCases: [
            "Screenshot-to-code pipelines for UI agents",
            "Chart data extraction for financial reports",
            "Document digitization — OCR scanned contracts",
            "Product image analysis for e-commerce enrichment",
        ],
    },
};

/* ─── CopyButton 组件 ─── */
function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${copied
                ? "bg-green-500/15 text-green-400 border-green-500/30"
                : "bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                }`}
        >
            {copied ? (
                <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12" /></svg> Copied!</>
            ) : (
                <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> {label}</>
            )}
        </motion.button>
    );
}

/* ─── Skill Detail 主页面 ─── */
export default function SkillDetailPage() {
    const params = useParams();
    const id = typeof params.id === "string" ? params.id : "";

    // 从 session 获取登录状态与用户 Token，用于条件注入 curl 命令
    const { data: session, status } = useSession();

    const skill = SKILL_DATA[id];

    /* ── Token 注入逻辑 ──────────────────────────────────────────────────────
       已登录且有 rawToken → 注入真实 token
       未登录 / rawToken 不存在 → 显示占位符 <LOGIN_TO_VIEW_TOKEN>
       ─────────────────────────────────────────────────────────────────────── */
    const isLoggedIn = status === "authenticated";
    const rawApiToken = session?.user?.rawToken;
    const displayToken = isLoggedIn && rawApiToken ? rawApiToken : "<LOGIN_TO_VIEW_TOKEN>";
    const hasRealToken = isLoggedIn && !!rawApiToken;

    // 集成 curl 命令：使用 api.uniskill.ai/v1/[id] 端点
    const curlCommand = `curl -X POST https://api.uniskill.ai/v1/${id} \\
  -H "Authorization: Bearer ${displayToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "example query"}'`;

    // 404 处理：未知技能 ID
    if (!skill) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] bg-grid flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-6xl mb-4">🔍</p>
                        <h1 className="text-2xl font-black text-white mb-2">Skill Not Found</h1>
                        <p className="text-slate-400 text-sm mb-6">No skill with ID <code className="text-indigo-400 bg-slate-800 px-2 py-0.5 rounded">{id}</code> exists.</p>
                        <Link href="/skills" className="px-4 py-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/25 transition-all">
                            ← Back to Skills Store
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] bg-grid">
            <Navbar />

            <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">

                {/* ── 面包屑导航 ── */}
                <motion.nav
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-2 text-xs text-slate-500 mb-8"
                >
                    <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/skills" className="hover:text-slate-300 transition-colors">Skills</Link>
                    <span>/</span>
                    <span className="text-slate-300 font-medium">{skill.name}</span>
                </motion.nav>

                {/* ── 技能 Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-start gap-5 mb-10"
                >
                    {/* 大图标 */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${skill.gradientFrom} ${skill.gradientTo} flex items-center justify-center text-3xl shadow-2xl shrink-0`}>
                        {skill.emoji}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                            <h1 className="text-3xl font-black text-white">{skill.name}</h1>
                            {/* Official 徽章 */}
                            {skill.isOfficial && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    Official
                                </span>
                            )}
                            {/* Status 徽章 */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${skill.status === "Active"
                                ? "bg-green-500/10 text-green-400 border-green-500/25"
                                : "bg-orange-500/10 text-orange-400 border-orange-500/25"
                                }`}>{skill.status}</span>
                        </div>
                        <p className="text-slate-400 text-sm">by <span className="text-slate-300 font-medium">{skill.author}</span></p>
                        <p className="text-slate-500 text-sm mt-1">{skill.description}</p>
                    </div>
                </motion.div>

                {/* ── 2-Column Layout (7:3) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">

                    {/* ════ Main Column (Left · 7/10) ════ */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Description */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="glass-card p-6 border border-slate-700/50"
                        >
                            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                Description
                            </h2>
                            <p className="text-sm text-slate-400 leading-relaxed">{skill.longDescription}</p>
                        </motion.section>

                        {/* API Reference */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                            className="glass-card p-6 border border-slate-700/50"
                        >
                            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><polyline points="4,17 10,11 4,5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>
                                API Reference
                            </h2>

                            {/* Input Parameters */}
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Input Parameters</p>
                            <div className="overflow-x-auto rounded-lg border border-slate-700/60 mb-6">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-800/60 border-b border-slate-700/60">
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Parameter</th>
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Type</th>
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Required</th>
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {skill.params.map((p, i) => (
                                            <tr key={p.name} className={`border-b border-slate-700/40 ${i % 2 === 0 ? "" : "bg-slate-800/20"}`}>
                                                <td className="px-4 py-2.5"><code className="text-indigo-400 font-mono">{p.name}</code></td>
                                                <td className="px-4 py-2.5"><code className="text-cyan-500 font-mono text-[11px]">{p.type}</code></td>
                                                <td className="px-4 py-2.5">
                                                    {p.required
                                                        ? <span className="text-green-400 font-semibold">Yes</span>
                                                        : <span className="text-slate-600">No</span>}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-400">{p.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Response Schema */}
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Response Schema</p>
                            <div className="overflow-x-auto rounded-lg border border-slate-700/60">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-800/60 border-b border-slate-700/60">
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Field</th>
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Type</th>
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {skill.responseSchema.map((f, i) => (
                                            <tr key={f.field} className={`border-b border-slate-700/40 last:border-0 ${i % 2 === 0 ? "" : "bg-slate-800/20"}`}>
                                                <td className="px-4 py-2.5"><code className="text-purple-400 font-mono">{f.field}</code></td>
                                                <td className="px-4 py-2.5"><code className="text-cyan-500 font-mono text-[11px]">{f.type}</code></td>
                                                <td className="px-4 py-2.5 text-slate-400">{f.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.section>

                        {/* Use Cases */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="glass-card p-6 border border-slate-700/50"
                        >
                            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" /></svg>
                                Use Cases
                            </h2>
                            <ul className="space-y-2.5">
                                {skill.useCases.map((uc) => (
                                    <li key={uc} className="flex items-start gap-2.5 text-sm text-slate-400">
                                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                        {uc}
                                    </li>
                                ))}
                            </ul>
                        </motion.section>
                    </div>

                    {/* ════ Sidebar (Right · 3/10) ════ */}
                    <div className="lg:col-span-3 space-y-5">

                        {/* Cost Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="glass-card p-5 border border-slate-700/50"
                        >
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pricing</p>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-300">Cost per Request</span>
                                <div className="flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" /></svg>
                                    <span className="text-lg font-black text-white">{skill.costPerCall}</span>
                                    <span className="text-xs text-slate-500 ml-0.5">CR</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600">Credits are deducted per successful API call.</p>
                        </motion.div>

                        {/* Performance Stats */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                            className="glass-card p-5 border border-slate-700/50"
                        >
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Performance</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Avg. Latency</span>
                                    <span className="text-sm font-bold text-cyan-400">{skill.latency}</span>
                                </div>
                                <div className="h-px bg-slate-700/50" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Success Rate</span>
                                    <span className="text-sm font-bold text-green-400">{skill.successRate}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Integration Snippet */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="glass-card p-5 border border-slate-700/50"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Integration</p>
                                {/* 根据登录状态显示复制按钮或登录 CTA */}
                                {hasRealToken
                                    ? <CopyButton text={curlCommand} label="Copy" />
                                    : null}
                            </div>

                            {/* curl 代码块 */}
                            <div className="code-block text-[11px] leading-relaxed font-mono overflow-x-auto whitespace-pre">
                                <span className="text-blue-400">curl</span>
                                <span className="text-slate-400"> -X POST </span>
                                <span className="text-green-400">https://api.uniskill.ai/v1/{id}</span>
                                {`\n  `}
                                <span className="text-slate-400">-H </span>
                                <span className="text-yellow-300">&quot;Authorization: Bearer </span>
                                {/* 根据登录状态动态渲染 token 颜色：已登录真实 token 用 cyan，未登录用灰色斜体 */}
                                <span className={hasRealToken ? "text-cyan-400" : "text-slate-500 italic"}>
                                    {displayToken}
                                </span>
                                <span className="text-yellow-300">&quot;</span>
                                {`\n  `}
                                <span className="text-slate-400">-H </span>
                                <span className="text-yellow-300">&quot;Content-Type: application/json&quot;</span>
                                {`\n  `}
                                <span className="text-slate-400">-d </span>
                                <span className="text-orange-300">&apos;&#123;&quot;query&quot;: &quot;example&quot;&#125;&apos;</span>
                            </div>

                            {/* 未登录 CTA：引导用户登录以获取真实 token */}
                            {!isLoggedIn && status !== "loading" && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => signIn("github", { callbackUrl: `/skills/${id}` })}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all"
                                >
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    Sign in to use this Skill
                                </motion.button>
                            )}

                            {/* 已登录但 token 非首次登录不可用时的提示 */}
                            {isLoggedIn && !hasRealToken && (
                                <p className="mt-3 text-xs text-slate-600">
                                    ⚠ Token shown once at first sign-in. Find it in your Dashboard.
                                </p>
                            )}
                        </motion.div>

                        {/* Back to Store */}
                        <Link
                            href="/skills"
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Back to Skills Store
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
