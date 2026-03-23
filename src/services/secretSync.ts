// src/services/secretSync.ts
// Logic: Securely sync user secrets (API keys) to Supabase and Cloudflare Edge Gateway

import { createClient } from "@supabase/supabase-js";
import { encrypt } from "@/utils/encryption";

const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY!;

/**
 * Encrypts and syncs a user's global vault to both the DB and Edge Gateway.
 */
export async function syncSecretsToGateway(userUid: string, email: string, rawSecrets: Record<string, string>) {
  if (!userUid || !email) {
    throw new Error("[SecretSync] Missing user identity for sync.");
  }

  // 1. 同行服务端加密 (Encrypt all secrets)
  const encryptedVault: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawSecrets)) {
    // 逻辑：如果已经加密过（带点分隔符），则跳过；否则进行 AES-256-GCM 加密
    encryptedVault[key] = value.includes('.') ? value : encrypt(value, MASTER_KEY);
  }

  // 2. 更新 Supabase Profiles 表 (Update DB)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: dbError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      secrets: encryptedVault,
      updated_at: new Date().toISOString()
    })
    .eq('user_uid', userUid);

  if (dbError) {
    console.error("[SecretSync] DB Update Failed:", dbError);
    throw new Error(`Database sync failed: ${dbError.message}`);
  }

  // 3. 推送至 Edge Gateway (Push to Cloudflare KV via Admin API)
  // 逻辑：调用网关的 /admin/sync_cache 接口进行全局分发
  try {
    const gatewayRes = await fetch(`${process.env.GATEWAY_URL}/v1/admin/sync_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: "vault_update",
        user_uid: userUid,
        payload: encryptedVault
      })
    });

    if (!gatewayRes.ok) {
      const errorText = await gatewayRes.text();
      console.warn("[SecretSync] Gateway sync warning:", errorText);
      // 注意：即使网关同步失败，数据库已更新，通常不抛出阻塞异常，但建议记录日志
    }
  } catch (gatewayErr) {
    console.error("[SecretSync] Network error during gateway sync:", gatewayErr);
  }

  return encryptedVault;
}
