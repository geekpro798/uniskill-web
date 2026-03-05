#!/bin/bash

# Logic: Define colors for better terminal output
# 逻辑：定义颜色变量，优化终端输出显示
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}UniSkill: The universal skill layer for AI agents.${NC}"
echo "-------------------------------------------------------"

# Logic: Check if the API Key is provided as an argument
# 逻辑：检查是否通过参数传入了 API Key
API_KEY=$1

if [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: No API Key provided.${NC}"
    echo "Usage: curl -fsSL https://uniskill.ai/setup-skills.sh | bash -s -- <your_api_key>"
    exit 1
fi

# Logic: Validate key format (should start with 'us-')
# 逻辑：校验密钥格式，必须以 'us-' 开头
if [[ ! $API_KEY =~ ^us- ]]; then
    echo -e "${RED}Error: Invalid Key format. It should start with 'us-'.${NC}"
    exit 1
fi

# Logic: Online verification against UniSkill API
# 逻辑：联机验证 API Key 是否真实有效
echo -n "Verifying API Key... "
VERIFY_RES=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$API_KEY\"}" \
    https://uniskill.ai/api/v1/verify)

if [ "$VERIFY_RES" != "200" ]; then
    echo -e "${RED}FAILED${NC}"
    echo -e "${RED}❌ Error: Invalid API Key. The provided key ${BLUE}${API_KEY:0:7}...${RED} is not authorized. Please check your credentials at ${BLUE}https://uniskill.ai/dashboard${NC}."
    exit 1
fi
echo -e "${GREEN}VALIDATED${NC}"

# Logic: Detect the current user's shell profile
# 逻辑：检测当前用户的 Shell 配置文件（.zshrc 或 .bashrc）
if [ -n "$ZSH_VERSION" ]; then
    PROFILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    PROFILE="$HOME/.bashrc"
else
    PROFILE="$HOME/.profile"
fi

# Logic: Prevent duplicate entries in the profile file
# 逻辑：防止在配置文件中重复写入环境变量
if grep -q "UNISKILL_KEY" "$PROFILE"; then
    # Update existing key
    # 逻辑：如果已存在，则使用 sed 更新现有的 Key
    sed -i '' "s/export UNISKILL_KEY=.*/export UNISKILL_KEY=\"$API_KEY\"/" "$PROFILE" 2>/dev/null || \
    sed -i "s/export UNISKILL_KEY=.*/export UNISKILL_KEY=\"$API_KEY\"/" "$PROFILE"
else
    # Append new key
    # 逻辑：如果不存在，则在文件末尾追加
    echo -e "\n# UniSkill Configuration" >> "$PROFILE"
    echo "export UNISKILL_KEY=\"$API_KEY\"" >> "$PROFILE"
fi

# Logic: Check for Python installation (optional but helpful for agents)
# 逻辑：检查环境是否安装了 Python（对 AI Agent 开发至关重要）
if command -v python3 &>/dev/null; then
    echo -e "${GREEN}✓ Python 3 detected.${NC}"
else
    echo -e "${RED}! Warning: Python 3 not found. Most AI agents require Python.${NC}"
fi

echo "-------------------------------------------------------"
echo -e "${GREEN}Success! UniSkill environment initialized.${NC}"
echo -e "Your key has been saved to: ${BLUE}$PROFILE${NC}"
echo -e "Please run ${BLUE}source $PROFILE${NC} or restart your terminal to apply changes."
echo -e "Happy hacking with UniSkill! (500 credits ready to use)"
