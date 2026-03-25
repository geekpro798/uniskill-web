import { NextResponse } from 'next/server';
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';

/**
 * UniSkill Skill Finalization API (v5.1 - 全量元数据同步与编译修复版)
 * 职责：
 * 1. 验证草稿合法性 (Verify draft legitimacy)
 * 2. 从 Markdown 源码中重新编译提取 Description 和 Parameters (Re-compile Meta from MD)
 * 3. 强制更新数据库的结构化字段（解决卡片信息不更新的问题）(Force sync DB columns)
 * 4. 组装 UnifiedSkill 格式推送到边缘网关 (Push Unified Format to Gateway)
 */
export async function POST(req: Request) {
  try {
    // 1. Session 鉴权补齐 (Session authentication)
    const session = await getServerSession(authOptions as any) as Session | null;
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Supabase with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { skillUid, userUid: clientUserUid } = body;
    let userUid = clientUserUid || (session.user as any).userUid;

    // 自动补齐 userUid (Auto-fill userUid from profile)
    if (!userUid) {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('user_uid')
            .eq('github_id', session.user.id)
            .maybeSingle();
        if (profile) userUid = profile.user_uid;
    }

    if (!skillUid || !userUid) {
      return NextResponse.json({ error: "Missing required identifiers" }, { status: 400 });
    }

    // 2. 获取数据库最新记录 (Fetch the latest raw data)
    const { data: skill, error: fetchError } = await supabaseAdmin
      .from('skills')
      .select('skill_name, display_name, markdown_manifest, status, emoji, secrets')
      .eq('skill_uid', skillUid)
      .eq('owner_uid', userUid)
      .single();

    if (fetchError || !skill || !skill.markdown_manifest) {
      return NextResponse.json({ error: "Skill source not found" }, { status: 404 });
    }

    const content = skill.markdown_manifest;

    // ------------------------------------------------------------------
    // 3. 核心编译器逻辑：动态提取最新元数据 (Extract latest Meta & Config)
    // ------------------------------------------------------------------
    
    // 解析最新的 Description (提取 ## Description 下方的内容)
    const descMatch = content.match(/## Description\s+([\s\S]*?)(?=\n##|$)/i);
    const parsedDescription = descMatch ? descMatch[1].trim() : "";

    // 解析最新的 Parameters (提取 Parameters 下方的 JSON，兼容 # / ## 等)
    const paramMatch = content.match(/#+\s*Parameters[\s\S]*?```(?:json)?\s*([\s\S]*?)\n?\s*```/i);
    let parsedParameters = { type: "object", properties: {} };
    try {
      if (paramMatch) {
         let jsonStr = paramMatch[1].trim();
         // 🌟 净化 JSON：去除可能的尾部逗号 (Basic cleaning)
         jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
         parsedParameters = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn("[Compiler] Failed to parse Parameters JSON, using fallback.");
    }

    // 解析最新的 Frontmatter (提取 display_name 和 emoji)
    const dNameMatch = content.match(/display_name:\s*(.+)/);
    const emojiMatch = content.match(/emoji:\s*([^\s\n]+)/);
    
    const finalDisplayName = dNameMatch ? dNameMatch[1].replace(/['"]/g, '').trim() : skill.display_name;
    const finalEmoji = emojiMatch ? emojiMatch[1].replace(/['"]/g, '').trim() : skill.emoji;

    // 解析最新的 Implementation (提取 ## Implementation 下方的 YAML)
    const implMatch = content.match(/#+\s*(?:Implementation|Implementation YAML)[\s\S]*?```(?:yaml)?\s*([\s\S]*?)```/i);
    let parsedImplementation = { type: "unknown" };
    if (implMatch) {
       try {
          // ⚠️ 使用工程已有的 js-yaml
          const yaml = (await import('js-yaml')).default.load(implMatch[1].trim()) as any;
          parsedImplementation = yaml;
       } catch (e) {
          console.warn("[Compiler] Failed to parse Implementation YAML, using fallback.");
       }
    }

    // 计算最新的内容指纹 (DID)
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const did = `did:usk:skill:${contentHash}`;

    // ------------------------------------------------------------------
    // 4. 同步到数据库结构化字段 (Sync to DB Columns)
    // 🌟 这里解决了“改了内容，卡片没变”的核心痛点
    // ------------------------------------------------------------------
    const { error: updateError } = await supabaseAdmin
      .from('skills')
      .update({ 
        state: 'active',
        did: did,
        display_name: finalDisplayName, // 👈 同步最新的显示名称
        emoji: finalEmoji,               // 👈 同步最新的图标
        description: parsedDescription, // 👈 强制覆盖为最新解析的描述
        parameters: parsedParameters,   // 👈 强制覆盖为最新解析的参数
        deployed_at: new Date().toISOString()
      })
      .eq('skill_uid', skillUid);

    if (updateError) throw updateError;

    // ------------------------------------------------------------------
    // 5. 组装数据并推送到边缘网关 (Push to Gateway v5 protocol)
    // ------------------------------------------------------------------
    const skillManifest = {
      skill_uid: skillUid, // 🌟 显式注入 UUID
      id: skillUid,        // 🌟 兼容性：将 id 也设为 UUID，防止网关 fallback 到名字
      did: did,
      owner_uid: userUid,
      meta: {
        name: (finalEmoji || "🧩") + " " + (finalDisplayName || skill.skill_name),
        emoji: finalEmoji || "🧩",
        description: parsedDescription // 使用刚才解析出的最新描述
      },
      config: {
        ...parsedImplementation, // 融合可执行逻辑
        parameters: parsedParameters,
        tier: skill.status 
      },
      source: content 
    };

    const gatewayUrl = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || "http://127.0.0.1:8787";
    const adminKey = process.env.ADMIN_KEY || "";

    try {
      const gatewayRes = await fetch(`${gatewayUrl}/v1/admin/sync_skill`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}` 
        },
        body: JSON.stringify({
          user_uid: userUid,
          skill_name: skill.skill_name,
          status: skill.status, // 使用数据库 status (Private/Community)
          manifest: skillManifest,
          secrets: skill.secrets, // 🔑 同步加密后的私钥到网关
          type: 'skill_activation'
        })
      });

      if (!gatewayRes.ok) {
        const errorText = await gatewayRes.text();
        console.error("[Gateway Sync] Remote error:", errorText);
      }
    } catch (e) {
      console.error("[Gateway Sync] Network error during synchronization.");
    }

    return NextResponse.json({ 
      success: true, 
      did: did,
      skillName: skill.skill_name 
    });

  } catch (error: any) {
    console.error("[Finalize Fatal]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
