#!/bin/bash
# Logic: Enhanced UX/DX for UniSkill MCP injection with Key Validation

API_KEY=$1

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$API_KEY" ]; then
  echo -e "${YELLOW}❌ Error: API Key is required.${NC}"
  echo "Usage: curl -fsSL https://uniskill.ai/connect.sh | bash -s -- <YOUR_KEY>"
  exit 1
fi

ENV_FILE=".env"
CURRENT_DIR=$(pwd)
MASKED_KEY="${API_KEY:0:7}...${API_KEY: -4}"

echo -e "\n${CYAN}======================================================${NC}"
echo -e "${CYAN}       ⚡️ UniSkill MCP Connector Initializing...      ${NC}"
echo -e "${CYAN}======================================================\n${NC}"

# =================================================================
# 🔴 核心新增逻辑：向云端发起鉴权请求 (Ping)
# =================================================================
echo -n -e "🔐 Verifying API Key with UniSkill Cloud... "

# 逻辑：静默请求您的网关，只获取 HTTP 状态码
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET -H "Authorization: Bearer $API_KEY" "https://api.uniskill.ai/v1/auth/verify")

if [ "$HTTP_STATUS" == "401" ] || [ "$HTTP_STATUS" == "403" ]; then
    echo -e "${RED}FAILED ❌${NC}"
    echo -e "\n${YELLOW}⚠️  Error: Invalid API Key. Please copy the correct key from https://uniskill.ai/dashboard${NC}\n"
    exit 1
elif [ "$HTTP_STATUS" != "200" ]; then
    echo -e "${YELLOW}WARNING ⚠️ (HTTP $HTTP_STATUS)${NC}"
    echo -e "Could not verify key right now, but proceeding with injection..."
else
    echo -e "${GREEN}SUCCESS ✅${NC}"
fi
# =================================================================

echo -e "🔍 Scanning environment in ${BLUE}${CURRENT_DIR}${NC}..."
sleep 0.5

if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    echo -e "📄 Created new ${ENV_FILE} file."
fi

echo -e "⚙️  Injecting Cloud MCP settings..."
sleep 0.5

sed -i.bak '/UNISKILL_MCP_URL/d' $ENV_FILE
sed -i.bak '/UNISKILL_API_KEY/d' $ENV_FILE
echo "UNISKILL_MCP_URL=\"https://api.uniskill.ai/v1/mcp\"" >> $ENV_FILE
echo "UNISKILL_API_KEY=\"$API_KEY\"" >> $ENV_FILE
rm -f ${ENV_FILE}.bak

echo -e "\n${GREEN}[✔] Successfully updated: ${CURRENT_DIR}/${ENV_FILE}${NC}"
echo -e "    ${BLUE}+ UNISKILL_MCP_URL=\"https://api.uniskill.ai/v1/mcp\"${NC}"
echo -e "    ${BLUE}+ UNISKILL_API_KEY=\"${MASKED_KEY}\"${NC}\n"

echo -e "${GREEN}✅ Success! UniSkill Superbrain is now wired to your Agent.${NC}\n"

echo -e "${YELLOW}🚀 NEXT STEPS:${NC}"
echo -e "1. Start your Agent framework (e.g., OpenClaw)."
echo -e "2. Copy & Paste this prompt to test dynamic tools:"
echo -e "   ${CYAN}> \"What is the real-time weather in London?\"${NC}\n"
echo -e "Dashboard: ${BLUE}https://uniskill.ai/dashboard${NC}"
echo -e "${CYAN}======================================================${NC}\n"
