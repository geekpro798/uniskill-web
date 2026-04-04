---
display_name: "Feishu Calendar Ops"
skill_name: lark_calendar
emoji: "📅"
category: "workspace_data"
tags: ["lark", "calendar", "events", "automation"]
suggested_icon: "Calendar"
theme_color: "blue"
---

# Description
High-fidelity calendar management for Lark Suite. Create, query, and update events with industrial-grade precision using the deterministic `lark-cli` runtime.

# Parameters
```json
{
  "type": "object",
  "properties": {
    "summary": { "type": "string", "description": "The title of the event." },
    "start_time": { "type": "string", "description": "Start time in RFC3339 format." },
    "end_time": { "type": "string", "description": "End time in RFC3339 format." },
    "action": { "type": "string", "enum": ["create", "query", "delete"], "description": "Action to perform." }
  },
  "required": ["summary", "action"]
}
```

# Implementation
```yaml
type: cli
binary: "lark-cli"
command: "calendar event-{{action}} --ts-start {{start_time}}"
args: ["--json"]
```
