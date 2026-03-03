#!/bin/bash
# setup-skills.sh: Dynamic Mode
# 动态模式集成脚本
# Usage: curl -fsSL https://uniskill-web.vercel.app/setup-skills.sh | bash -s -- <YOUR_TOKEN>

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ── Step 1: Inject UNISKILL_API_KEY into .env ─────────────────────────────
# 步骤：将 API 密钥注入环境变量文件
USER_TOKEN=$1
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then touch "$ENV_FILE"; fi
sed -i.bak '/UNISKILL_API_KEY/d' "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
echo "UNISKILL_API_KEY=$USER_TOKEN" >> "$ENV_FILE"

echo -e "\n${GREEN}✓ Environment ready.${NC}"

# ── Step 2: Output the Dynamic Link for OpenClaw ──────────────────────────
# 步骤：输出 OpenClaw 专用的动态工具加载配置
echo -e "Add the following line to your OpenClaw config.yaml to enable auto-sync:"
echo "------------------------------------------------"
echo "remote_tools:"
echo "  - url: \"https://uniskill-gateway.geekpro798.workers.dev/v1/skills\""
echo "    auth: \"Bearer $USER_TOKEN\""
echo "------------------------------------------------"
echo "Skills will stay versioned and rollback-ready automatically."

# ── Step 3: Download Python loader ───────────────────────────────────────
# 步骤：将 Python 加载器下载到 utils/
LOADER_URL="https://uniskill-web.vercel.app/uniskill_loader.py"

UTILS_DIR="utils"
LOADER_DEST="${UTILS_DIR}/uniskill_loader.py"
INIT_FILE="${UTILS_DIR}/__init__.py"
RUNNER_DEST="uniskill_run.py"

echo ""
echo -e "${BLUE}→ Installing UniSkill Python integration...${NC}"

# 创建 utils/ 并确保存在 __init__.py 使其成为合法 Python 包
mkdir -p "$UTILS_DIR"
if [ ! -f "$INIT_FILE" ]; then
    touch "$INIT_FILE"
    echo "  ✓ Created ${INIT_FILE}"
fi

# 优先使用 curl，回退到 wget
if command -v curl &>/dev/null; then
    curl -fsSL "$LOADER_URL" -o "$LOADER_DEST"
elif command -v wget &>/dev/null; then
    wget -q "$LOADER_URL" -O "$LOADER_DEST"
else
    echo -e "  ${RED}✗ Neither curl nor wget found. Please download manually:${NC}"
    echo "    $LOADER_URL  →  $LOADER_DEST"
    exit 1
fi

echo -e "  ${GREEN}✓ Saved loader to ${LOADER_DEST}${NC}"

# ── Step 4: Smart Entry Point Detection ───────────────────────────────────
# 智能入口探测：尝试自动寻找 OpenClaw 的启动文件
POSSIBLE_ENTRIES=("main.py" "app.py" "run.py" "start.py" "bot.py" "agent.py" "openclaw_main.py")
ENTRY_POINT=""

for e in "${POSSIBLE_ENTRIES[@]}"; do
    if [ -f "$e" ]; then
        ENTRY_POINT="$e"
        break
    fi
done

# 如果没找到，当场问用户，一次性解决
if [ -z "$ENTRY_POINT" ]; then
    echo -e "${YELLOW}ℹ️  Could not auto-detect your OpenClaw entry point.${NC}"
    read -p "❓ What is your main Python file? (e.g. main.py): " ENTRY_POINT
fi

# 如果仍然为空，使用占位符防止 Python 语法错误
if [ -z "$ENTRY_POINT" ]; then
    ENTRY_POINT="YOUR_MAIN_FILE"
    ENTRY_MODULE="YOUR_MAIN_FILE"
else
    ENTRY_MODULE=$(echo $ENTRY_POINT | cut -f 1 -d '.')
fi

# ── Step 5: Generate PRE-CONFIGURED Wrapper ──────────────────────────────
# 生成已经配置好的启动包装器，用户无需再打开修改
cat <<EOF > "$RUNNER_DEST"
# uniskill_run.py - Pre-configured Wrapper
# 预配置的 UniSkill 启动包装器
# Please replace YOUR_MAIN_FILE with your actual start file if needed.
# 如果自动探测失败，请将 YOUR_MAIN_FILE 替换为您的实际启动文件名

import os
import sys
from utils.uniskill_loader import load_skills

def launch():
    # 1. Sync skills from cloud
    # 从云端同步技能
    print("🚀 UniSkill: Syncing live tools...")
    try:
        dynamic_tools = load_skills(verbose=True)
        print(f"✅ UniSkill: Successfully loaded {len(dynamic_tools)} tools.")
    except Exception as e:
        print(f"❌ Error syncing tools: {e}")
        dynamic_tools = []
    
    # 2. Dynamically import and run your agent
    # 动态导入并运行你的 Agent
    try:
        sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
        import $ENTRY_MODULE as agent_module
        print(f"⚡ UniSkill: Context ready for $ENTRY_POINT. Launching...")
        
        # OpenClaw typical entry points (try 'start' or 'main')
        if hasattr(agent_module, 'start'):
            agent_module.start(tools=dynamic_tools)
        elif hasattr(agent_module, 'main'):
            agent_module.main(extra_tools=dynamic_tools)
        else:
            print(f"⚠️ Warning: No 'start' or 'main' function found in $ENTRY_POINT")
            print("Please ensure your entry file has a callable entry function.")
            
    except Exception as e:
        print(f"❌ Launch Error: {e}")

if __name__ == "__main__":
    launch()
EOF

echo -e "  ${GREEN}✓ Generated pre-configured wrapper: ${RUNNER_DEST}${NC}"

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}🎉 UniSkill setup complete!${NC}"
echo "  • API key    → .env"
echo "  • Loader     → ${LOADER_DEST}"
echo "  • Wrapper    → ${RUNNER_DEST} (Configured for $ENTRY_POINT)"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  Just run: python3 ${RUNNER_DEST}"
echo "  Your agent will launch with UniSkill tools automatically loaded!"
echo ""

echo -e "\n${YELLOW}? Do you want to launch your Agent with UniSkill now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "🚀 Starting Agent..."
    python3 "$RUNNER_DEST"
else
    echo -e "👍 No problem! You can run it later with: python3 $RUNNER_DEST"
fi
