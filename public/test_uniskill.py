import os
import ssl
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# 挂载您的 API 钥匙
os.environ["UNISKILL_KEY"] = "us-77138f63-df6e-45ea-a8fa-9050bd0140a0"

# 因为测试文件和 uniskill_loader.py 在同一个目录下，我们可以直接导入
from uniskill_loader import load_skills

print("开始测试 UniSkill 网关...")
try:
    # 尝试连接云端并拉取技能清单
    tools = load_skills(verbose=True)
    print("\n✅ 测试通过！成功获取到了以下技能：")
    for tool in tools:
        print(f" - {tool['name']}")
except Exception as e:
    print(f"\n❌ 测试失败，错误信息：{e}")
