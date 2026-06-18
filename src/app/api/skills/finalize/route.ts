import { NextResponse } from 'next/server';
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';

/**
 * UniSkill Skill Finalization API (v5.1)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { skillUid, userUid: clientUserUid } = body;
    let userUid = clientUserUid || (session.user as any).userUid;

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

    const { data: skill, error: fetchError } = await supabaseAdmin
      .from('skills')
      .select('skill_name, display_name, description, markdown_manifest, status, emoji, secrets, team_uid, visibility')
      .eq('skill_uid', skillUid)
      .eq('owner_uid', userUid)
      .single();

    if (fetchError || !skill || !skill.markdown_manifest) {
      return NextResponse.json({ error: "Skill source not found" }, { status: 404 });
    }

    const content = skill.markdown_manifest;

    // Parse Description
    const descMatch = content.match(/#+\s*Description\s+([\s\S]*?)(?=\n#+|$)/i);
    const parsedDescription = descMatch ? descMatch[1].trim() : (skill.description || "");

    // Parse Frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
    let frontmatter: any = {};
    if (frontmatterMatch) {
      try {
        const jsYaml = (await import('js-yaml')).default;
        frontmatter = jsYaml.load(frontmatterMatch[1]) as any;
      } catch (e) {
        console.warn("[Compiler] Failed to parse Frontmatter YAML");
      }
    }

    const finalDisplayName = frontmatter.display_name?.trim() || skill.display_name;
    const finalEmoji = frontmatter.emoji?.trim() || skill.emoji;
    const finalVisuals = frontmatter.visuals || null;

    // Parse Parameters
    const paramMatch = content.match(/#+\s*Parameters[\s\S]*?```(?:json)?\s*([\s\S]*?)\n?\s*```/i);
    let parsedParameters = { type: "object", properties: {} };
    try {
      if (paramMatch) {
         let jsonStr = paramMatch[1].trim();
         jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
         parsedParameters = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn("[Compiler] Failed to parse Parameters JSON, using fallback.");
    }

    // Parse Implementation
    const implMatch = content.match(/#+\s*(?:Implementation|Implementation YAML)[\s\S]*?```(?:yaml)?\s*([\s\S]*?)```/i);
    let parsedImplementation: Record<string, any> = { type: "unknown" };
    if (implMatch) {
       try {
          const jsYaml = (await import('js-yaml')).default;
          parsedImplementation = jsYaml.load(implMatch[1].trim()) as any;
       } catch (e) {
          console.warn("[Compiler] Failed to parse Implementation YAML, using fallback.");
       }
    }

    // CLI detection
    if (parsedImplementation.type === 'unknown' && /<!-- uniskill:scripts/.test(content)) {
      parsedImplementation.type = 'cli';
    }

    // Content DID
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const did = `did:usk:skill:${contentHash}`;

    // Sync to DB
    const { error: updateError } = await supabaseAdmin
      .from('skills')
      .update({
        state: 'active',
        did: did,
        display_name: finalDisplayName,
        emoji: finalEmoji,
        description: parsedDescription,
        parameters: parsedParameters,
        deployed_at: new Date().toISOString()
      })
      .eq('skill_uid', skillUid);

    if (updateError) throw updateError;

    // Extract inline scripts
    let scripts: Record<string, string> = {};
    const scriptsMatch = content.match(/<!-- uniskill:scripts\n([\s\S]*?)\n-->/);
    if (scriptsMatch) {
      try { scripts = JSON.parse(scriptsMatch[1]); } catch (_) { /* ignore */ }
    }

    // Build manifest
    const skillManifest = {
      skill_name: skill.skill_name,
      display_name: finalDisplayName || skill.skill_name,
      skill_uid: skillUid,
      emoji: finalEmoji || "🧩",
      did: did,
      owner_uid: userUid,
      metadata: {
        description: parsedDescription,
        visuals: finalVisuals
      },
      config: {
        ...parsedImplementation,
        parameters: parsedParameters,
        tier: skill.status,
        scripts: Object.keys(scripts).length > 0 ? scripts : undefined
      },
      source: content
    };

    // Gateway sync (best-effort, 不阻塞部署)
    const gatewayUrl = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || "http://127.0.0.1:8787";
    const adminKey = process.env.ADMIN_KEY || "";
    let gatewaySynced = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const gatewayRes = await fetch(`${gatewayUrl}/v1/admin/sync_skill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          user_uid: userUid,
          skill_name: skill.skill_name,
          status: (skill as any).visibility || skill.status,
          manifest: skillManifest,
          secrets: (skill as any).secrets,
          team_uid: (skill as any).team_uid || undefined,
          type: 'skill_activation'
        })
      });

      clearTimeout(timeoutId);
      gatewaySynced = gatewayRes.ok;
      if (gatewaySynced) {
        console.log(`[Gateway Sync] OK: ${skill.skill_name}`);
      } else {
        console.warn(`[Gateway Sync] Skipped (status ${gatewayRes.status}) — skill saved to DB, sync manually if needed`);
      }
    } catch (e: any) {
      console.warn(`[Gateway Sync] Unreachable (${e.message}) — skill saved to DB, sync manually if needed`);
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
