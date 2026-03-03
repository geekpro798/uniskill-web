#!/bin/bash
# UniSkill Dynamic Setup - Production Grade
# UniSkill 动态集成脚本 - 生产环境稳健版

# 1. Formatting
# 界面美化定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🛠️  UniSkill Tool Suite Integration${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 2. Argument Check
# 参数校验
USER_TOKEN=$1
if [ -z "$USER_TOKEN" ]; then
    echo -e "${YELLOW}Error: Missing Token. Usage: curl ... | bash -s -- <token>${NC}"
    exit 1
fi

# 3. Environment Setup
# 注入 API Key
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then touch "$ENV_FILE"; fi
sed -i.bak '/UNISKILL_API_KEY/d' "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
echo "UNISKILL_API_KEY=$USER_TOKEN" >> "$ENV_FILE"
echo -e "✅ Environment ready (.env updated)"

# 4. Auto-detect Entry Point
# 自动探测 OpenClaw 入口文件
ENTRY_POINT=""
for file in "main.py" "app.py" "run.py" "start.py"; do
    if [ -f "$file" ]; then
        ENTRY_POINT="${file%.*}"
        break
    fi
done

# 5. Generate Loader
# 生成 Python 加载器逻辑
mkdir -p utils
touch utils/__init__.py
cat <<'EOF' > utils/uniskill_loader.py
import requests
import os

def load_skills():
    """
    Fetches tools from UniSkill cloud.
    从云端拉取技能清单。
    """
    token = os.getenv("UNISKILL_API_KEY")
    url = "https://uniskill-gateway.geekpro798.workers.dev/v1/skills"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        print(f"✅ UniSkill: Synced {len(data['tools'])} skills.")
        return data['tools']
    except Exception as e:
        print(f"❌ UniSkill Sync Error: {e}")
        return []
EOF

# 6. Generate Wrapper with fallback for Entry Point
# 生成包装器，若未探测到入口则设为占位符防止 SyntaxError
FINAL_ENTRY=${ENTRY_POINT:-"your_main_file"}
cat <<EOF > uniskill_run.py
import os
from utils.uniskill_loader import load_skills

def run():
    # 1. Sync tools
    # 同步云端工具
    tools = load_skills()
    
    # 2. Try to launch agent
    # 尝试启动 Agent
    try:
        import $FINAL_ENTRY as agent_module
        if hasattr(agent_module, 'start'):
            print("🚀 Launching Agent with UniSkill tools...")
            agent_module.start(tools=tools)
        else:
            print("ℹ️  Tools loaded. Please pass them to your agent manually.")
    except ImportError:
        print("⚠️  Entry point '$FINAL_ENTRY.py' not found.")
        print("   Please edit uniskill_run.py to import your actual start file.")

if __name__ == "__main__":
    run()
EOF

echo -e "✅ Integration tools generated"

# 7. Final Interactive Check (Fixing the 'else' and 'quote' bugs)
# 最后的交互逻辑：彻底修复之前的语法错误
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "❓ Do you want to verify the sync now? (y/n): "
read -r choice < /dev/tty

if [[ "$choice" =~ ^[Yy]$ ]]; then
    # 8. Dependency Check Logic
    # 自动检查并安装脚本所需的 Python 依赖
    if ! python3 -c "import requests" 2>/dev/null; then
        echo -e "📦 Installing missing Python dependencies (requests)..."
        pip3 install requests --user
    fi

    echo -e "🚀 Testing synchronization..."
    python3 uniskill_run.py
else
    echo -e "🎉 Setup complete! Use 'python3 uniskill_run.py' to start."
fi
