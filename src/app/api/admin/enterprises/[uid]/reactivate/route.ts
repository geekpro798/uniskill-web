// src/app/api/admin/enterprises/[uid]/reactivate/route.ts
import { NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminRole();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { uid } = await params;

  const { error } = await supabase
    .from('enterprise_accounts')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('account_uid', uid);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Gateway 清除暂停标记
  try {
    const gatewayUrl = process.env.GATEWAY_URL || 'http://127.0.0.1:8787';
    await fetch(`${gatewayUrl}/v1/admin/sync_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'enterprise_reactivate', enterprise_uid: uid }),
    });
  } catch (e) {
    console.warn('[Reactivate] Gateway sync warning:', e);
  }

  await supabase.from('audit_logs').insert({
    enterprise_uid: uid,
    user_uid: admin.userUid,
    action: 'enterprise.reactivate',
    resource_type: 'enterprise',
    resource_id: uid,
  });

  return NextResponse.json({ success: true, status: 'active' });
}
