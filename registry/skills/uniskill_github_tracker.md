---
skill_name: uniskill_github_tracker
display_name: GitHub Tracker
emoji: "github"
status: Official
category: workspace_data
tags:
  - github
  - stars
  - trends
  - dev
gradientFrom: from-gray-700
gradientTo: to-black
credits_per_call: 8
usd_per_call: 0.15
---

# uniskill_github_tracker

## Description
Monitors GitHub to track and analyze emerging open-source projects. It provides Agents with programmable access to repository growth velocity, author profiles, and specific domain tags

## Parameters
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["get_trending_repos", "get_repo_growth_velocity", "get_language_leaders"],
      "description": "The specific operation to execute: trending discovery, growth velocity modeling, or segment leadership indexing."
    },
    "repo_path": {
      "type": "string",
      "description": "The repository path (e.g., 'owner/repo'). Required for growth velocity calculation."
    },
    "time_window": {
      "type": "string",
      "enum": ["daily", "weekly", "monthly"],
      "description": "The time range for trending analysis.",
      "default": "weekly"
    },
    "language": {
      "type": "string",
      "description": "Filter results by programming language (e.g., 'rust', 'typescript')."
    },
    "topic": {
      "type": "string",
      "description": "Filter results by specific topic tags (e.g., 'web3', 'llm', 'mcp')."
    },
    "min_stars": {
      "type": "integer",
      "description": "Filter repositories by a minimum number of stars (e.g., 500)."
    },
    "max_stars": {
      "type": "integer",
      "description": "Filter repositories by a maximum number of stars (e.g., 5000)."
    }
  },
  "required": ["action"]
}
```

## Implementation YAML
```yaml
# Logic: Intelligence tool implemented natively in the gateway for high performance
type: native
plugin_hook: "github_tracker_formatter"
```
