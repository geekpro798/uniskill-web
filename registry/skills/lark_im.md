---
display_name: "Feishu IM Assistant"
skill_name: lark_im
emoji: "💬"
category: "workspace_data"
tags: ["lark", "im", "messenger", "automation"]
suggested_icon: "ChatText"
theme_color: "blue"
---

# Description
Send messages, query chats, and manage groups via Lark CLI in a secure cloud sandbox. Optimized for autonomous agents requiring deterministic shell interaction with the Feishu/Lark Suite.

# Parameters
```json
{
  "type": "object",
  "properties": {
    "receive_id": { "type": "string", "description": "The ID of the user or group chat." },
    "msg_type": { "type": "string", "enum": ["text", "post", "image"], "description": "Type of the message." },
    "content": { "type": "string", "description": "The message body in JSON string format." }
  },
  "required": ["receive_id", "msg_type", "content"]
}
```

# Implementation
```yaml
type: cli
binary: "lark-cli"
command: "im message-send --id {{receive_id}} --type {{msg_type}}"
args: ["--json"]
```
