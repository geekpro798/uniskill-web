#!/bin/bash
# UniSkill MCP Connector — Local Agent Signing Mode
# Usage: curl -fsSL https://uniskill.ai/connect.sh | bash
#        curl -fsSL https://uniskill.ai/connect.sh | bash -s -- --session ./my_session.json

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# ── Banner ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      ⚡️  UniSkill MCP Connector  v3.0                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}\n"

# ── Parse Args ───────────────────────────────────────────────────────────────
SESSION_ARG=""
INLINE_DATA=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --session) SESSION_ARG="$2"; shift 2;;
    --data) INLINE_DATA="$2"; shift 2;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1;;
  esac
done

# ── Handle Inline Data vs Search ──────────────────────────────────────────────
SESSION_FILE=""

if [ -n "$INLINE_DATA" ]; then
  echo -e "📦 Processing inline session data..."
  mkdir -p "$HOME/.uniskill"
  
  # Decode Base64 data (try portable python3 first, then base64 tool)
  if python3 -c "import base64, sys; print(base64.b64decode('$INLINE_DATA').decode('utf-8'))" > "$HOME/.uniskill/session.json" 2>/dev/null; then
    SESSION_FILE="$HOME/.uniskill/session.json"
    echo -e "  ${GREEN}✔ Session data restored from command line.${NC}"
  elif echo "$INLINE_DATA" | base64 --decode > "$HOME/.uniskill/session.json" 2>/dev/null; then
    SESSION_FILE="$HOME/.uniskill/session.json"
    echo -e "  ${GREEN}✔ Session data restored from command line (base64 tool).${NC}"
  else
    echo -e "${RED}❌ Failed to decode session data. Please ensure the command was copied correctly.${NC}"
    exit 1
  fi
else
  # ── Search Candidate Files ──
  echo -e "🔍 Searching for session key..."
  CANDIDATES=(
    "$SESSION_ARG"
    "./uniskill_session.json"
    "$HOME/Downloads/uniskill_session.json"
    "$HOME/.uniskill/session.json"
  )

  for f in "${CANDIDATES[@]}"; do
    if [ -n "$f" ] && [ -f "$f" ]; then
      SESSION_FILE="$f"
      break
    fi
  done
fi

if [ -z "$SESSION_FILE" ]; then
  echo -e "${RED}❌ uniskill_session.json not found!${NC}"
  echo -e "\n${BOLD}To get a session key:${NC}"
  echo -e "  1. Log in to ${BLUE}https://uniskill.ai${NC}"
  echo -e "  2. Go to Settings → Account & Security → Local Agent Access"
  echo -e "  3. Click \"Generate Session Key\" and download the file."
  echo -e "  4. Run this script again in the folder where you downloaded it.\n"
  exit 1
fi

echo -e "  ${GREEN}✔ Found session file at: $SESSION_FILE${NC}"

# ── Validate session.json ────────────────────────────────────────────────────
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}❌ python3 is required but not installed.${NC}"
  exit 1
fi

EXPIRES_AT=$(python3 -c "import json,sys; d=json.load(open('$SESSION_FILE')); print(d.get('expiresAt', 0))" 2>/dev/null)
if [ -z "$EXPIRES_AT" ] || [ "$EXPIRES_AT" == "0" ]; then
  echo -e "${RED}❌ Invalid session.json (missing expiresAt)${NC}"
  exit 1
fi

NOW_MS=$(python3 -c "import time; print(int(time.time()*1000))")
if [ "$NOW_MS" -gt "$EXPIRES_AT" ]; then
  echo -e "${RED}❌ This Session Key has expired.${NC}"
  echo -e "Please generate a new one from the UniSkill Dashboard."
  exit 1
fi

# ── Check Node.js ────────────────────────────────────────────────────────────
echo -e "\n🔍 Checking Node.js environment..."
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed.${NC}"
  echo -e "UniSkill Local Proxy requires Node.js >= 18."
  if [ "$(uname -s)" = "Darwin" ]; then
    echo -e "Run: ${CYAN}brew install node${NC}"
  else
    echo -e "Visit: ${CYAN}https://nodejs.org${NC}"
  fi
  exit 1
fi

NODE_VER=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}❌ Node.js version is too old (v${NODE_VER}).${NC}"
  echo -e "UniSkill Local Proxy requires Node.js >= 18."
  exit 1
fi
echo -e "  ${GREEN}✔ Node.js v${NODE_VER} detected.${NC}"

# ── Setup ~/.uniskill directory ──────────────────────────────────────────────
UNISKILL_DIR="$HOME/.uniskill"
mkdir -p "$UNISKILL_DIR"

if [ "$SESSION_FILE" != "$UNISKILL_DIR/session.json" ]; then
  cp "$SESSION_FILE" "$UNISKILL_DIR/session.json"
  echo -e "  ${GREEN}✔ Session key saved to ~/.uniskill/session.json${NC}"
fi

# Clean up old port file if exists
rm -f "$UNISKILL_DIR/active_port"

# ── Download Proxy Engine ────────────────────────────────────────────────────
echo -e "\n⬇️  Downloading Proxy Engine..."
curl -fsSL https://uniskill.ai/proxy.js -o "$UNISKILL_DIR/proxy.js"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to download proxy.js. Please check your network connection.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✔ Proxy engine downloaded successfully.${NC}"

# ── Setup Autostart ──────────────────────────────────────────────────────────
echo -e "\n⚙️  Configuring autostart..."
OS_TYPE=$(uname -s)

if [ "$OS_TYPE" = "Darwin" ]; then
  # macOS launchd
  PLIST="$HOME/Library/LaunchAgents/ai.uniskill.proxy.plist"
  mkdir -p "$HOME/Library/LaunchAgents"
  cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>ai.uniskill.proxy</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(which node)</string>
    <string>$UNISKILL_DIR/proxy.js</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$UNISKILL_DIR/proxy.log</string>
  <key>StandardErrorPath</key>
  <string>$UNISKILL_DIR/proxy.log</string>
</dict>
</plist>
EOF
  launchctl unload "$PLIST" 2>/dev/null
  launchctl load "$PLIST"
  launchctl start ai.uniskill.proxy
  echo -e "  ${GREEN}✔ macOS launchd service enabled and started.${NC}"

elif [ "$OS_TYPE" = "Linux" ]; then
  # Linux systemd (user)
  if command -v systemctl &> /dev/null && [ -d "$HOME/.config/systemd/user" ]; then
    SVC="$HOME/.config/systemd/user/uniskill-proxy.service"
    mkdir -p "$HOME/.config/systemd/user"
    cat > "$SVC" <<EOF
[Unit]
Description=UniSkill Local Signing Proxy
After=network.target

[Service]
ExecStart=$(which node) $UNISKILL_DIR/proxy.js
Restart=always
StandardOutput=append:$UNISKILL_DIR/proxy.log
StandardError=append:$UNISKILL_DIR/proxy.log

[Install]
WantedBy=default.target
EOF
    systemctl --user daemon-reload
    systemctl --user enable --now uniskill-proxy.service
    echo -e "  ${GREEN}✔ Linux systemd service enabled and started.${NC}"
  else
    echo -e "  ${YELLOW}⚠️  systemd user service not available. Starting proxy in background...${NC}"
    nohup node "$UNISKILL_DIR/proxy.js" > "$UNISKILL_DIR/proxy.log" 2>&1 &
  fi
fi

# ── Wait for Active Port ─────────────────────────────────────────────────────
echo -n -e "\n⏳ Waiting for proxy to start..."
MAX_TRIES=30
TRIES=0
ACTIVE_PORT=""

while [ $TRIES -lt $MAX_TRIES ]; do
  if [ -f "$UNISKILL_DIR/active_port" ]; then
    ACTIVE_PORT=$(cat "$UNISKILL_DIR/active_port")
    break
  fi
  sleep 0.5
  TRIES=$((TRIES+1))
done

if [ -z "$ACTIVE_PORT" ]; then
  echo -e "\n${RED}❌ Proxy failed to start or write active_port within 15 seconds.${NC}"
  echo -e "Check logs at: $UNISKILL_DIR/proxy.log"
  exit 1
fi

echo -e " ${GREEN}✔ Running on port $ACTIVE_PORT${NC}"
PROXY_URL="http://localhost:${ACTIVE_PORT}/v1/mcp/sse"

# ── Environment Detection (Headless vs Desktop) ──────────────────────────────
IS_DESKTOP=false

if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ] || [ "$OS_TYPE" = "Darwin" ]; then
  IS_DESKTOP=true
fi

if [ "$IS_DESKTOP" = false ]; then
  echo -e "\n  ${CYAN}☁️  Headless Server Environment Detected.${NC}"
  echo -e "  ${YELLOW}Skipping desktop client config injection.${NC}\n"
  
  echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}🤖 PYTHON AGENT QUICK START${NC}"
  echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
  echo -e "Your local signing proxy is running in the background."
  echo -e "Configure your uniskill_loader.py to use this proxy URL:\n"
  echo -e "${GREEN}export PROXY_URL=\"${PROXY_URL}\"${NC}\n"
  echo -e "You do ${BOLD}NOT${NC} need to set UNISKILL_KEY anymore."
  echo -e "${CYAN}══════════════════════════════════════════════════════${NC}\n"
  exit 0
fi

# ── Client Injection ─────────────────────────────────────────────────────────
echo -e "\n💻 Desktop environment detected. Injecting MCP configs...\n"

# JSON string without auth headers
MCP_JSON=$(cat <<EOF
{
  "mcpServers": {
    "uniskill": {
      "url": "${PROXY_URL}"
    }
  }
}
EOF
)

inject_config() {
  local CONFIG_FILE="$1"
  local CLIENT_NAME="$2"
  local CONFIG_DIR
  CONFIG_DIR=$(dirname "$CONFIG_FILE")

  mkdir -p "$CONFIG_DIR"

  if [ ! -f "$CONFIG_FILE" ]; then
    echo "$MCP_JSON" > "$CONFIG_FILE"
    echo -e "   ${GREEN}✔ Created: ${CONFIG_FILE}${NC} ($CLIENT_NAME)"
  else
    python3 - <<PYEOF
import json, sys

with open("${CONFIG_FILE}", "r") as f:
    try:
        cfg = json.load(f)
    except json.JSONDecodeError:
        cfg = {}

cfg.setdefault("mcpServers", {})
cfg["mcpServers"]["uniskill"] = {
    "url": "${PROXY_URL}"
}

# Remove legacy headers if exist
if "headers" in cfg["mcpServers"]["uniskill"]:
    del cfg["mcpServers"]["uniskill"]["headers"]

with open("${CONFIG_FILE}", "w") as f:
    json.dump(cfg, f, indent=2)
PYEOF
    echo -e "   ${GREEN}✔ Updated: ${CONFIG_FILE}${NC} ($CLIENT_NAME)"
  fi
  INJECTED=true
}

INJECTED=false

# Claude Desktop
CLAUDE_CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -d "$HOME/Library/Application Support/Claude" ] || pgrep -x "Claude" > /dev/null 2>&1; then
  inject_config "$CLAUDE_CFG" "Claude Desktop"
fi

# Cursor
CURSOR_CFG="$HOME/.cursor/mcp.json"
if [ -d "$HOME/.cursor" ] || command -v cursor &> /dev/null; then
  inject_config "$CURSOR_CFG" "Cursor"
fi

# Windsurf
WINDSURF_CFG="$HOME/.codeium/windsurf/mcp_config.json"
if [ -d "$HOME/.codeium/windsurf" ] || command -v windsurf &> /dev/null; then
  inject_config "$WINDSURF_CFG" "Windsurf"
fi

# Zed
ZED_CFG="$HOME/.config/zed/settings.json"
if [ -d "$HOME/.config/zed" ] || command -v zed &> /dev/null; then
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
    "url": "${PROXY_URL}"
}
if "headers" in cfg["context_servers"]["uniskill"]:
    del cfg["context_servers"]["uniskill"]["headers"]

with open(path, "w") as f:
    json.dump(cfg, f, indent=2)
PYEOF
  echo -e "   ${GREEN}✔ Updated: ${ZED_CFG}${NC} (Zed)"
  INJECTED=true
fi

if [ "$INJECTED" = false ]; then
  echo -e "  ${YELLOW}⚠️  No desktop AI client detected. Run them once to initialize their config folders.${NC}"
fi

# ── Workspace Local Config (EasyClaw, etc.) ──────────────────────────────────
WORKSPACE_CFG="$PWD/.mcp.json"
inject_config "$WORKSPACE_CFG" "Current Workspace"

# Handle .gitignore to prevent accidental commits
if [ -f "$PWD/.gitignore" ]; then
  if ! grep -q "^\.mcp\.json$" "$PWD/.gitignore"; then
    echo ".mcp.json" >> "$PWD/.gitignore"
    echo -e "   ${GREEN}✔ Appended .mcp.json to .gitignore${NC}"
  fi
elif [ -d "$PWD/.git" ]; then
  echo ".mcp.json" > "$PWD/.gitignore"
  echo -e "   ${GREEN}✔ Created .gitignore and added .mcp.json${NC}"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}✅  UniSkill Superbrain is now securely connected!${NC}\n"
echo -e "${YELLOW}${BOLD}🚀 NEXT STEPS:${NC}"
echo -e "  1. Restart your AI client (Claude / Cursor / Windsurf / Zed)."
echo -e "  2. Ask it: ${CYAN}\"What is the real-time weather in Tokyo?\"${NC}"
echo -e "  3. Watch UniSkill tools appear automatically.\n"
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}\n"
