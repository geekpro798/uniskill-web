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

# ── Step 3: Download uniskill_loader.py into utils/ ──────────────────────
# 步骤：将 Python 加载器下载到当前项目的 utils/ 目录
LOADER_URL="https://uniskill-web.vercel.app/uniskill_loader.py"
UTILS_DIR="utils"
LOADER_DEST="${UTILS_DIR}/uniskill_loader.py"
INIT_FILE="${UTILS_DIR}/__init__.py"

echo ""
echo -e "\033[0;34m→ Installing UniSkill Python loader...\033[0m"

# 若 utils/ 不存在则创建，并确保存在 __init__.py 使其成为合法 Python 包
mkdir -p "$UTILS_DIR"
if [ ! -f "$INIT_FILE" ]; then
    touch "$INIT_FILE"
    echo "  ✓ Created ${INIT_FILE}"
fi

# 优先使用 curl，回退到 wget，若均不可用则报错提示手动下载
if command -v curl &>/dev/null; then
    curl -fsSL "$LOADER_URL" -o "$LOADER_DEST"
elif command -v wget &>/dev/null; then
    wget -q "$LOADER_URL" -O "$LOADER_DEST"
else
    echo -e "  \033[0;31m✗ Neither curl nor wget found. Please download manually:\033[0m"
    echo "    $LOADER_URL  →  $LOADER_DEST"
    exit 1
fi

echo -e "  \033[0;32m✓ Saved loader to ${LOADER_DEST}\033[0m"

# ── Step 4: Inject startup code into main.py ─────────────────────────────
# 步骤：尝试在 main.py 顶部注入 UniSkill 初始化代码块
MAIN_FILE="main.py"

# 待注入的代码块：导入加载器并在启动时拉取最新技能清单
INJECT_BLOCK="# >>> UniSkill auto-injected by setup-skills.sh <<<
import os; os.environ.setdefault('UNISKILL_API_KEY', open('.env').read().split('UNISKILL_API_KEY=')[-1].split()[0] if 'UNISKILL_API_KEY' not in os.environ else os.environ['UNISKILL_API_KEY'])
from utils.uniskill_loader import load_skills
_uniskill_tools = load_skills()
# <<< UniSkill block end >>>"

if [ -f "$MAIN_FILE" ]; then
    # 检测是否已注入过，避免重复插入
    if grep -q "UniSkill auto-injected" "$MAIN_FILE"; then
        echo -e "  ⚠️  main.py already contains UniSkill block — skipping injection."
    else
        # 在文件头部插入代码块（保留原有内容）
        ORIGINAL=$(cat "$MAIN_FILE")
        printf '%s\n\n%s\n' "$INJECT_BLOCK" "$ORIGINAL" > "$MAIN_FILE"
        echo -e "  \033[0;32m✓ Injected UniSkill loader into main.py\033[0m"
    fi
else
    echo -e "  ℹ️  No main.py found in current directory — skipping auto-injection."
    echo "     To load skills manually, add this to your entry point:"
    echo "       from utils.uniskill_loader import load_skills"
    echo "       tools = load_skills()"
fi

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo -e "\033[0;32m✓ UniSkill setup complete.\033[0m"
echo "  • API key    → .env"
echo "  • Loader     → ${LOADER_DEST}"
echo "  • Skills are fetched live from the cloud on every run."
echo ""
