// src/lib/cloudflare.ts
// Cloudflare API 封装 — Tunnel 管理（Account.Tunnel:Edit 权限）

const CF_API = "https://api.cloudflare.com/client/v4";

function cfHeaders() {
  return {
    "Authorization": `Bearer ${process.env.CF_API_TOKEN!}`,
    "Content-Type": "application/json",
  };
}

function getAccountId(): string {
  const id = process.env.CF_ACCOUNT_ID;
  if (!id) throw new Error("CF_ACCOUNT_ID not configured");
  return id;
}

export interface CFTunnel {
  id: string;
  name: string;
  token: string;
  cname: string;
  status: string;
  connections: {
    id: string;
    client_version: string;
    origin_ip: string;
    opened_at: string;
  }[];
}

interface CFResponse<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  result: T;
}

/** 创建 Cloudflare Tunnel */
export async function createCFTunnel(name: string): Promise<{
  id: string;
  token: string;
  cname: string;
}> {
  const accountId = getAccountId();
  const res = await fetch(`${CF_API}/accounts/${accountId}/cfd_tunnel`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify({ name, config_src: "cloudflare" }),
  });

  const json: CFResponse<{ id: string; token: string; cname: string }> = await res.json();
  if (!json.success) {
    throw new Error(`CF create tunnel failed: ${json.errors[0]?.message || "unknown"}`);
  }
  return json.result;
}

/** 配置 Tunnel ingress（hostname → origin service） */
export async function configureCFTunnelIngress(
  tunnelId: string,
  hostname: string,
  service: string = "http://localhost:8080",
): Promise<void> {
  const accountId = getAccountId();
  const res = await fetch(
    `${CF_API}/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`,
    {
      method: "PUT",
      headers: cfHeaders(),
      body: JSON.stringify({
        config: {
          ingress: [{ hostname, service }],
          originRequest: {},
        },
      }),
    },
  );

  const json: CFResponse<unknown> = await res.json();
  if (!json.success) {
    throw new Error(`CF configure ingress failed: ${json.errors[0]?.message || "unknown"}`);
  }
}

/** 获取 Tunnel 详情（含连接状态） */
export async function getCFTunnel(tunnelId: string): Promise<CFTunnel> {
  const accountId = getAccountId();
  const res = await fetch(
    `${CF_API}/accounts/${accountId}/cfd_tunnel/${tunnelId}`,
    { headers: cfHeaders() },
  );

  const json: CFResponse<CFTunnel> = await res.json();
  if (!json.success) {
    throw new Error(`CF get tunnel failed: ${json.errors[0]?.message || "unknown"}`);
  }
  return json.result;
}

/** 删除 Cloudflare Tunnel */
export async function deleteCFTunnel(tunnelId: string): Promise<void> {
  const accountId = getAccountId();
  const res = await fetch(
    `${CF_API}/accounts/${accountId}/cfd_tunnel/${tunnelId}`,
    { method: "DELETE", headers: cfHeaders() },
  );

  const json: CFResponse<{ id: string }> = await res.json();
  if (!json.success) {
    throw new Error(`CF delete tunnel failed: ${json.errors[0]?.message || "unknown"}`);
  }
}

/** 列出所有 CF Tunnel（用于 GC 对账） */
export async function listCFTunnels(): Promise<{ id: string; name: string }[]> {
  const accountId = getAccountId();
  const res = await fetch(
    `${CF_API}/accounts/${accountId}/cfd_tunnel`,
    { headers: cfHeaders() },
  );

  const json: CFResponse<{ id: string; name: string }[]> = await res.json();
  if (!json.success) {
    throw new Error(`CF list tunnels failed: ${json.errors[0]?.message || "unknown"}`);
  }
  return json.result;
}
