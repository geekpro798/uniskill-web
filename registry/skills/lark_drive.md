---
display_name: "Feishu Drive Sync"
skill_name: lark_drive
emoji: "📂"
category: "workspace_data"
tags: ["lark", "drive", "cloud", "storage", "automation"]
suggested_icon: "CloudArrowUp"
theme_color: "blue"
---

# Description
Industrial-grade file management for Lark Drive. Allows autonomous agents to upload, download, and manage permissions for cloud documents using the specialized `lark-cli` substrate.

# Parameters
```json
{
  "type": "object",
  "properties": {
    "file_token": { "type": "string", "description": "The unique token of the target folder or file." },
    "file_path": { "type": "string", "description": "The local path for upload or download." },
    "action": { "type": "string", "enum": ["upload", "download", "meta"], "description": "Action to perform." }
  },
  "required": ["file_token", "action"]
}
```

# Implementation
```yaml
type: cli
binary: "lark-cli"
command: "drive file-{{action}} --token {{file_token}}"
args: ["--json"]
```
