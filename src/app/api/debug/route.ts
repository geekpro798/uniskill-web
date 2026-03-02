// src/app/api/debug/route.ts
// 临时诊断端点：验证 Vercel 上的环境变量是否正确加载
// ⚠️ 仅调试用，上线稳定后删除

export async function GET() {
    const vars = {
        GITHUB_ID: process.env.GITHUB_ID
            ? `✅ SET (${process.env.GITHUB_ID.slice(0, 6)}...)` : "❌ MISSING",
        GITHUB_SECRET: process.env.GITHUB_SECRET
            ? `✅ SET (${process.env.GITHUB_SECRET.slice(0, 4)}...)` : "❌ MISSING",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "❌ MISSING",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
            ? `✅ SET (${process.env.NEXTAUTH_SECRET.slice(0, 4)}...)` : "❌ MISSING",
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "❌ MISSING",
        NODE_ENV: process.env.NODE_ENV,
    };

    return Response.json(vars);
}
