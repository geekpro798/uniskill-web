// scripts/register-notify.ts — One-time script to register uniskill_notify
// Run: npx tsx scripts/register-notify.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iwijeijjpnojtolvcxtp.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const OFFICIAL_UID = "00000000-0000-0000-0000-000000000001"; // Official skills owner

async function main() {
  const { error } = await supabaseAdmin.from("skills").upsert({
    skill_name: "uniskill_notify",
    display_name: "System Notification",
    description: "Send a native OS notification to your desktop. Works on macOS and Windows.",
    markdown_manifest: `---
skill_name: uniskill_notify
display_name: System Notification
description: Send a native OS notification to the user's desktop. Supports macOS and Windows.
visuals:
  suggested_icon: Bell
  theme_color: amber
---

# Description
Pushes a native OS notification to the user's desktop. Works on macOS (via osascript) and Windows (via msg).

# Parameters
\`\`\`json
{
  "type": "object",
  "properties": {
    "title": { "type": "string", "description": "Notification title" },
    "body": { "type": "string", "description": "Notification body text" }
  },
  "required": ["title", "body"]
}
\`\`\`

# Implementation
type: native
handler: uniskill_notify`,
    status: "Official",
    state: "active",
    owner_uid: OFFICIAL_UID,
    credits_per_call: 0,
    emoji: "🔔",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Notification title" },
        body: { type: "string", description: "Notification body text" }
      },
      required: ["title", "body"]
    }
  }, { onConflict: "skill_name" });

  if (error) {
    console.error("Failed:", error.message);
  } else {
    console.log("✅ uniskill_notify registered successfully");
  }
}

main();
