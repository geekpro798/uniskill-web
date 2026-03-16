#!/bin/bash
# UniSkill MCP Connector — Auto-detects AI clients and injects MCP config
# Usage: curl -fsSL https://uniskill.ai/connect.sh | bash -s -- <YOUR_KEY>

API_KEY=$1
MCP_SSE_URL="https://api.uniskill.ai/v1/mcp/sse"
DASHBOARD_URL="https://uniskill.ai/dashboard"
GATEWAY_URL="https://gateway.uniskill.ai/v1/execute"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# ── Banner ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      ⚡️  UniSkill MCP Connector  v2.0                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}\n"

# ── Arg Check ────────────────────────────────────────────────────────────────
if [ -z "$API_KEY" ]; then
  echo -e "${RED}❌ Error: API Key is required.${NC}"
  echo -e "Usage: ${CYAN}curl -fsSL https://uniskill.ai/connect.sh | bash -s -- <YOUR_KEY>${NC}\n"
  exit 1
fi

MASKED_KEY="${API_KEY:0:7}...${API_KEY: -4}"

# ── Key Validation ───────────────────────────────────────────────────────────
echo -n -e "🔐 Verifying API Key ${BLUE}${MASKED_KEY}${NC}... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 \
  -X GET -H "Authorization: Bearer $API_KEY" \
  "${MCP_SSE_URL%/sse*}/../../auth/verify") 2>/dev/null

# Fallback
if [ "$HTTP_STATUS" != "200" ]; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 \
    -X GET -H "Authorization: Bearer $API_KEY" \
    "https://api.uniskill.ai/v1/auth/verify") 2>/dev/null
fi

if [ "$HTTP_STATUS" == "401" ] || [ "$HTTP_STATUS" == "403" ]; then
  echo -e "${RED}FAILED ❌${NC}"
  echo -e "\n${YELLOW}⚠️  Invalid API Key. Please copy the correct key from:${NC}"
  echo -e "   ${BLUE}${DASHBOARD_URL}${NC}\n"
  exit 1
elif [ "$HTTP_STATUS" == "000" ]; then
  echo -e "${YELLOW}⚠️  Network timeout — proceeding anyway.${NC}"
else
  echo -e "${GREEN}SUCCESS ✅${NC}"
fi

# ── Environment Detection (云端与桌面端嗅探逻辑) ───────────────────────────
echo -e "\n🔍 Scanning environment..."
IS_DESKTOP=false

# 检查是否存在图形界面环境变量 (Check for Display server - common on desktops)
if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
  IS_DESKTOP=true
fi

# 检查操作系统类型 (macOS / Darwin 绝大部分是本地开发机)
if [ "$(uname -s)" = "Darwin" ]; then
  IS_DESKTOP=true
fi

# ============================================================================
# 🌿 Branch A: Cloud / Headless Server (云端无头服务器逻辑)
# ============================================================================
if [ "$IS_DESKTOP" = false ]; then
  echo -e "  ${CYAN}☁️  Cloud / Headless environment detected.${NC}"
  echo -e "  ${YELLOW}ℹ️  Notice: Desktop clients (Claude/Cursor) are not typically available here.${NC}\n"
  
  echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}🤖 CLOUD AGENT QUICK START (API Integration)${NC}"
  echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
  echo -e "Since you are running in a cloud environment (like OpenClaw or AutoGPT),"
  echo -e "you should call the UniSkill Gateway directly via HTTP POST.\n"
  
  echo -e "${GREEN}Example (Node.js):${NC}"
  cat <<EOF
const fetch = require('node-fetch');

async function callUniSkill() {
  const response = await fetch('${GATEWAY_URL}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${API_KEY}'
    },
    body: JSON.stringify({
      skill: 'uniskill_github_tracker',
      params: { timeWindow: 'daily' }
    })
  });
  
  const intelligence = await response.json();
  console.log(intelligence);
}

callUniSkill();
EOF
  echo -e "\n${GREEN}✅ Your API Key '${MASKED_KEY}' is embedded and ready to use.${NC}"
  echo -e "📊 Dashboard: ${BLUE}${DASHBOARD_URL}${NC}"
  echo -e "${CYAN}══════════════════════════════════════════════════════${NC}\n"
  exit 0
fi

# ============================================================================
# 💻 Branch B: Local Desktop (本地桌面端注入逻辑)
# ============================================================================
echo -e "  ${CYAN}💻 Desktop environment detected.${NC}\n"

# ── Build JSON config block ──────────────────────────────────────────────────
MCP_JSON=$(cat <<EOF
{
  "mcpServers": {
    "uniskill": {
      "url": "${MCP_SSE_URL}",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
EOF
)

# ── Helper: merge uniskill into existing config ──────────────────────────────
inject_config() {
  local CONFIG_FILE="$1"
  local CLIENT_NAME="$2"
  local CONFIG_DIR
  CONFIG_DIR=$(dirname "$CONFIG_FILE")

  mkdir -p "$CONFIG_DIR"

  if [ ! -f "$CONFIG_FILE" ]; then
    # New file: write full config (如果文件不存在，直接写入新配置)
    echo "$MCP_JSON" > "$CONFIG_FILE"
    echo -e "   ${GREEN}✔ Created: ${CONFIG_FILE}${NC}"
  else
    # Existing file: merge mcpServers.uniskill key using Python (使用 Python 深度合并已有配置)
    python3 - <<PYEOF
import json, sys

with open("${CONFIG_FILE}", "r") as f:
    try:
        cfg = json.load(f)
    except json.JSONDecodeError:
        cfg = {}

cfg.setdefault("mcpServers", {})
cfg["mcpServers"]["uniskill"] = {
    "url": "${MCP_SSE_URL}",
    "headers": {"Authorization": "Bearer ${API_KEY}"}
}

with open("${CONFIG_FILE}", "w") as f:
    json.dump(cfg, f, indent=2)

print("  merged")
PYEOF
    echo -e "   ${GREEN}✔ Updated: ${CONFIG_FILE}${NC}"
  fi
  INJECTED=true
}

# ── Client Detection & Injection ─────────────────────────────────────────────
INJECTED=false

# Claude Desktop (macOS)
CLAUDE_CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -d "$HOME/Library/Application Support/Claude" ] || pgrep -x "Claude" > /dev/null 2>&1; then
  echo -e "  ${CYAN}→ Claude Desktop detected${NC}"
  inject_config "$CLAUDE_CFG" "Claude Desktop"
fi

# Cursor
CURSOR_CFG="$HOME/.cursor/mcp.json"
if [ -d "$HOME/.cursor" ] || command -v cursor &> /dev/null; then
  echo -e "  ${CYAN}→ Cursor detected${NC}"
  inject_config "$CURSOR_CFG" "Cursor"
fi

# Windsurf
WINDSURF_CFG="$HOME/.codeium/windsurf/mcp_config.json"
if [ -d "$HOME/.codeium/windsurf" ] || command -v windsurf &> /dev/null; then
  echo -e "  ${CYAN}→ Windsurf detected${NC}"
  inject_config "$WINDSURF_CFG" "Windsurf"
fi

# Zed
ZED_CFG="$HOME/.config/zed/settings.json"
if [ -d "$HOME/.config/zed" ] || command -v zed &> /dev/null; then
  echo -e "  ${CYAN}→ Zed detected${NC}"
  # Zed uses a different key: "context_servers" (Zed 使用特殊的键名)
  python3 - <<PYEOF
import json

path = "${ZED_CFG}"
try:
    with open(path, "r") as f:
        cfg = json.load(f)
except:
    cfg = {}

cfg.setdefault("context_servers", {})
cfg["context_servers"]["uniskill"] = {
    "url": "${MCP_SSE_URL}",
    "headers": {"Authorization": "Bearer ${API_KEY}"}
}

with open(path, "w") as f:
    json.dump(cfg, f, indent=2)
PYEOF
  echo -e "   ${GREEN}✔ Updated: ${ZED_CFG}${NC}"
  INJECTED=true
fi

# No client found — fallback: write to .env
if [ "$INJECTED" = false ]; then
  echo -e "  ${YELLOW}⚠️  No AI client detected. Writing to .env as fallback.${NC}"
  ENV_FILE=".env"
  touch "$ENV_FILE"
  sed -i.bak '/UNISKILL_MCP_URL/d' "$ENV_FILE"
  sed -i.bak '/UNISKILL_API_KEY/d' "$ENV_FILE"
  echo "UNISKILL_MCP_URL=\"${MCP_SSE_URL}\"" >> "$ENV_FILE"
  echo "UNISKILL_API_KEY=\"${API_KEY}\"" >> "$ENV_FILE"
  rm -f "${ENV_FILE}.bak"
  echo -e "   ${GREEN}✔ Written to: .env${NC}"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}✅  UniSkill Superbrain is now connected!${NC}\n"
echo -e "${YELLOW}${BOLD}🚀 NEXT STEPS:${NC}"
echo -e "  1. Restart your AI client (Claude / Cursor / Windsurf etc.)."
echo -e "  2. Ask it: ${CYAN}\"What is the real-time weather in Tokyo?\"${NC}"
echo -e "  3. Watch UniSkill tools appear automatically.\n"
echo -e "📊 Dashboard: ${BLUE}${DASHBOARD_URL}${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}\n"
