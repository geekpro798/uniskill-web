---
display_name: "Feishu Base (Bitable)"
skill_name: lark_base
emoji: "📊"
category: "workspace_data"
tags: ["lark", "bitable", "database", "automation"]
suggested_icon: "ChartBar"
theme_color: "blue"
---

# Description
Lark Suite Multi-dimensional Database (Bitable) automation. Allows autonomous agents to create records, query tables, and manage workflows in the Feishu/Lark Workspace using industrial-grade CLI interaction.

# Parameters
```json
{
  "type": "object",
  "properties": {
    "app_token": { "type": "string", "description": "The unique token of the target Bitable app." },
    "table_id": { "type": "string", "description": "Target table ID within the app." },
    "action": { "type": "string", "enum": ["query", "create", "update"], "description": "Action to perform." },
    "data": { "type": "object", "description": "The record data payload for creation or update." }
  },
  "required": ["app_token", "table_id", "action"]
}
```

# Implementation
```yaml
type: cli
binary: "lark-cli"
command: "bitable record-{{action}} --token {{app_token}} --table {{table_id}}"
args: ["--json"]
```
