#!/bin/bash
# setup-skills.sh: Dynamic Mode
# 动态模式集成脚本
# Usage: curl -fsSL https://uniskill-web.vercel.app/setup-skills.sh | bash -s -- <YOUR_TOKEN>

# ── Step 1: Inject UNISKILL_API_KEY into .env ─────────────────────────────
# 步骤：将 API 密钥注入环境变量文件
USER_TOKEN=$1
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then touch "$ENV_FILE"; fi
sed -i.bak '/UNISKILL_API_KEY/d' "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
echo "UNISKILL_API_KEY=$USER_TOKEN" >> "$ENV_FILE"

echo -e "\n\033[0;32m✓ Environment ready.\033[0m"

# ── Step 2: Output the Dynamic Link for OpenClaw ──────────────────────────
# 步骤：输出 OpenClaw 专用的动态工具加载配置
echo -e "Add the following line to your OpenClaw config.yaml to enable auto-sync:"
echo "------------------------------------------------"
echo "remote_tools:"
echo "  - url: \"https://uniskill-gateway.geekpro798.workers.dev/v1/skills\""
echo "    auth: \"Bearer $USER_TOKEN\""
echo "------------------------------------------------"
echo "Skills will stay versioned and rollback-ready automatically."

# ── Step 3: Download Python loader & wrapper ─────────────────────────────
# 步骤：将 Python 加载器下载到 utils/，将包装器下载到当前根目录
LOADER_URL="https://uniskill-web.vercel.app/uniskill_loader.py"
RUNNER_URL="https://uniskill-web.vercel.app/uniskill_run.py"

UTILS_DIR="utils"
LOADER_DEST="${UTILS_DIR}/uniskill_loader.py"
INIT_FILE="${UTILS_DIR}/__init__.py"
RUNNER_DEST="uniskill_run.py"

echo ""
echo -e "\033[0;34m→ Installing UniSkill Python integration...\033[0m"

# 创建 utils/ 并确保存在 __init__.py 使其成为合法 Python 包
mkdir -p "$UTILS_DIR"
if [ ! -f "$INIT_FILE" ]; then
    touch "$INIT_FILE"
    echo "  ✓ Created ${INIT_FILE}"
fi

# 优先使用 curl，回退到 wget，若均不可用则报错提示手动下载
if command -v curl &>/dev/null; then
    curl -fsSL "$LOADER_URL" -o "$LOADER_DEST"
    curl -fsSL "$RUNNER_URL" -o "$RUNNER_DEST"
elif command -v wget &>/dev/null; then
    wget -q "$LOADER_URL" -O "$LOADER_DEST"
    wget -q "$RUNNER_URL" -O "$RUNNER_DEST"
else
    echo -e "  \033[0;31m✗ Neither curl nor wget found. Please download manually:\033[0m"
    echo "    $LOADER_URL  →  $LOADER_DEST"
    echo "    $RUNNER_URL  →  $RUNNER_DEST"
    exit 1
fi

echo -e "  \033[0;32m✓ Saved loader to ${LOADER_DEST}\033[0m"
echo -e "  \033[0;32m✓ Saved wrapper to ${RUNNER_DEST}\033[0m"

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo -e "\033[0;32m🎉 UniSkill setup complete!\033[0m"
echo "  • API key    → .env"
echo "  • Loader     → ${LOADER_DEST}"
echo "  • Wrapper    → ${RUNNER_DEST}"
echo ""
echo -e "\033[0;36mNext steps:\033[0m"
echo "  1. Open ${RUNNER_DEST} and specify your agent's start module"
echo "  2. Run: python ${RUNNER_DEST}"
echo "  Your agent will launch with UniSkill tools automatically loaded!"
echo ""

echo -e "\n\033[1;33m? Do you want to launch your Agent with UniSkill now? (y/n)\033[0m"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "🚀 Starting Agent..."
    python uniskill_run.py
else
    echo -e "👍 No problem! You can run it later with: python uniskill_run.py"
fi
