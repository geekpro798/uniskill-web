# uniskill_run.py
# Intelligent Wrapper with Auto-discovery for OpenClaw
# 具备自动探测功能的 UniSkill 智能启动包装器
# Usage: python uniskill_run.py

import os
import sys
import importlib.util

# 1. 确保环境变量（如果有额外的配置，可以放在 .env）
if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("UNISKILL_PROXY_URL="):
                url = line.strip().split("=", 1)[1]
                os.environ["UNISKILL_PROXY_URL"] = url.strip("\"'")
                break

try:
    from utils.uniskill_loader import load_skills  # type: ignore[import-not-found]
except ImportError:
    print("\n❌ [UniSkill Error] utils/uniskill_loader.py not found!", file=sys.stderr)
    print("Please run the setup script first:", file=sys.stderr)
    print("curl -fsSL https://uniskill.ai/connect.sh | bash\n", file=sys.stderr)
    sys.exit(1)


def find_entry_point():
    """
    1. Check if an entry point was provided as a command-line argument
    首先检查是否通过命令行参数指定了入口点
    """
    if len(sys.argv) > 1:
        arg_file = sys.argv[1]
        if os.path.exists(arg_file) and arg_file.endswith(".py"):
            return arg_file
        else:
            print(f"⚠️  Manual entry point '{arg_file}' not found or invalid. Falling back to auto-discovery...")

    """
    2. Define common entry filenames for Agent projects
    定义 Agent 项目常见的入口文件名，按常用度优先级排序
    """
    candidates = ["main.py", "app.py", "run.py", "bot.py", "agent.py", "openclaw_main.py"]
    for file in candidates:
        if os.path.exists(file):
            return file
    return None


def start_with_uniskill():
    print("🚀 UniSkill: Initializing Auto-discovery...")
    
    # 2. Sync skills from local proxy first
    # 首先从 Proxy 同步技能清单，确保版本最新
    print("🔄 Syncing remote tools from UniSkill Cloud...")
    try:
        dynamic_tools = load_skills(verbose=True)
        print(f"\n✅ UniSkill: Successfully pre-loaded {len(dynamic_tools)} cloud tools into memory!\n")
    except Exception as e:
        print(f"\n❌ [UniSkill Error] Failed to load remote skills: {e}", file=sys.stderr)
        sys.exit(1)
        
    entry_file = find_entry_point()
    if not entry_file:
        print("❌ Error: Could not find project entry point (searched for main.py, app.py, run.py, etc.)", file=sys.stderr)
        print("Please ensure you are running this in your Agent's root directory.", file=sys.stderr)
        sys.exit(1)

    # 3. Dynamic Module Loading
    # 动态加载模块：在完全不修改用户原始源码的前提下，将自身作为环境启动
    print(f"📦 Discovery: Found entry point -> '{entry_file}'")
    print(f"⚡ Injecting UniSkill tools into module scope and launching...")
    print("------------------------------------------------------------------")
    
    module_name = os.path.splitext(entry_file)[0]
    spec = importlib.util.spec_from_file_location(module_name, entry_file)
    if spec is None or spec.loader is None:
        print(f"❌ Error: Could not load module spec for {entry_file}", file=sys.stderr)
        sys.exit(1)
        
    module = importlib.util.module_from_spec(spec)
    
    # Inject tools into the module scope before execution
    # [核心黑科技]：在执行目标文件的代码之前，直接往其模块级全局作用域中注入变量
    # 这样在目标 Agent 的代码中，就算没有 import，也可以直接使用 `uniskill_tools` 这个全局变量
    setattr(module, 'uniskill_tools', dynamic_tools)
    
    # 将入口文件所在的目录加入 sys.path，防止原应用的 import 路径断裂
    sys.path.insert(0, os.path.abspath(os.path.dirname(entry_file)))
    
    try:
        # 正式开始执行被包裹的原始入口点文件
        spec.loader.exec_module(module)
        # 如果执行到下面（通常不会，因为大多 agent 是阻塞常驻进程），说明执行完毕
        print(f"\n✅ UniSkill: Execution of {entry_file} completed gracefully.")
    except KeyboardInterrupt:
        print(f"\n✋ UniSkill: Execution interrupted by user.")
    except Exception as e:
        print(f"\n❌ UniSkill: Failed during execution of {entry_file}. Error: {e}")

if __name__ == "__main__":
    start_with_uniskill()
