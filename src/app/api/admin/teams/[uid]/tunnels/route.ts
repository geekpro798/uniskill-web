// src/app/api/admin/teams/[uid]/tunnels/route.ts
// Admin API: 团队 Tunnel CRUD — Cloudflare Tunnel 代理层

import { NextResponse } from "next/server";
import { getAdminRole } from "@/lib/adminAuth";
import { createClient } from "@supabase/supabase-js";
import {
  createCFTunnel,
  configureCFTunnelIngress,
  deleteCFTunnel,
  getCFTunnel as getCFTunnelStatus,
} from "@/lib/cloudflare";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET — 列出团队的 Tunnel
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { uid } = await params;

  const { data: tunnels, error } = await supabase
    .from("team_tunnels")
    .select("*")
    .eq("team_uid", uid)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 异步刷新 CF 状态（非阻塞，失败不影响列表返回）
  const refreshed = await Promise.all(
    (tunnels || []).map(async (t) => {
      try {
        const cf = await getCFTunnelStatus(t.cf_tunnel_id);
        const newStatus =
          cf.status === "healthy"
            ? "healthy"
            : cf.status === "degraded"
              ? "degraded"
              : "inactive";
        if (newStatus !== t.status) {
          await supabase
            .from("team_tunnels")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", t.id);
        }
        return { ...t, status: newStatus };
      } catch {
        return t;
      }
    }),
  );

  return NextResponse.json({ tunnels: refreshed, total: refreshed.length });
}

// POST — 创建 Tunnel
export async function POST(
  req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { uid } = await params;

  const { data: team } = await supabase
    .from("teams")
    .select("slug")
    .eq("team_uid", uid)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const body = await req.json();
  const tunnelName: string = (body.tunnel_name || "").trim();
  if (!tunnelName) {
    return NextResponse.json({ error: "tunnel_name required" }, { status: 400 });
  }

  const cfName = `${team.slug}-${tunnelName}`;

  try {
    const cf = await createCFTunnel(cfName);

    // 尝试配置 ingress（非致命失败）
    try {
      await configureCFTunnelIngress(
        cf.id,
        `${team.slug}.tunnel.uniskill.ai`,
      );
    } catch (e: any) {
      console.warn("[tunnels] Ingress config warning:", e.message);
    }

    const { data: tunnel, error } = await supabase
      .from("team_tunnels")
      .insert({
        team_uid: uid,
        tunnel_name: tunnelName,
        cf_tunnel_id: cf.id,
        cf_token: cf.token,
        cname: cf.cname,
        status: "inactive",
      })
      .select()
      .single();

    if (error) {
      // 回滚 CF 侧
      await deleteCFTunnel(cf.id).catch(() => {});
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const installScript = `cloudflared tunnel run --token ${cf.token}`;

    return NextResponse.json({ tunnel, install_script: installScript });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — 删除 Tunnel（先 CF 后 DB）
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { uid } = await params;

  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get("id") || "");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { data: tunnel } = await supabase
    .from("team_tunnels")
    .select("id, cf_tunnel_id")
    .eq("id", id)
    .eq("team_uid", uid)
    .maybeSingle();

  if (!tunnel) {
    return NextResponse.json({ error: "Tunnel not found" }, { status: 404 });
  }

  // 先删 CF，再删 DB（强一致）
  try {
    await deleteCFTunnel(tunnel.cf_tunnel_id);
  } catch (e: any) {
    return NextResponse.json(
      { error: `CF delete failed: ${e.message}` },
      { status: 500 },
    );
  }

  const { error } = await supabase
    .from("team_tunnels")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
