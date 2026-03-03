"""
uniskill_loader.py — UniSkill Dynamic Skill Loader
Fetches the live skill manifest from the UniSkill gateway and
registers each skill as a callable function in your Python environment.

Usage:
    from utils.uniskill_loader import load_skills
    tools = load_skills()  # returns list of skill definitions
"""

import os
import json
import urllib.request
import urllib.error

# 云端清单地址 — 由 setup-skills.sh 写入，始终指向最新版本
MANIFEST_URL = "https://uniskill-gateway.geekpro798.workers.dev/v1/skills"

# 从环境变量读取 API Key，避免硬编码敏感信息
API_KEY = os.environ.get("UNISKILL_API_KEY", "")


def _fetch_manifest() -> dict:
    """从云端拉取技能清单 JSON，失败时抛出带有可读信息的异常。"""
    if not API_KEY:
        raise EnvironmentError(
            "[UniSkill] UNISKILL_API_KEY is not set. "
            "Run setup-skills.sh first or export the variable manually."
        )

    # 构造带 Bearer 认证头的请求
    req = urllib.request.Request(
        MANIFEST_URL,
        headers={"Authorization": f"Bearer {API_KEY}"},
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            # 解析响应体为 JSON 清单对象
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        raise RuntimeError(
            f"[UniSkill] Failed to fetch manifest: HTTP {e.code} {e.reason}"
        ) from e
    except urllib.error.URLError as e:
        raise RuntimeError(
            f"[UniSkill] Network error while fetching manifest: {e.reason}"
        ) from e


def _make_caller(skill: dict):
    """
    根据技能定义动态生成一个可调用函数。
    函数签名与清单中声明的 parameters 保持一致。
    """
    endpoint = skill.get("endpoint", "")
    # 推断完整 URL（若 endpoint 已含完整地址则直接使用）
    base = "https://uniskill-gateway.geekpro798.workers.dev"
    url = endpoint if endpoint.startswith("http") else f"{base}{endpoint}"

    def caller(**kwargs) -> dict:
        # 将关键字参数序列化为 JSON 请求体
        body = json.dumps(kwargs).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))

    # 将清单描述附加到函数文档，方便 IDE 工具提示
    caller.__name__ = skill.get("name", "uniskill_tool")
    caller.__doc__ = skill.get("description", "")
    return caller


def load_skills(verbose: bool = True) -> list:
    """
    拉取云端清单并返回技能列表。
    每个条目包含 name、description、endpoint 及动态生成的 callable。

    Args:
        verbose: 是否在控制台打印已加载技能列表，默认 True。

    Returns:
        List of skill dicts, each with an extra 'call' key holding the callable.
    """
    manifest = _fetch_manifest()

    # 兼容清单返回 {"skills": [...]} 或直接返回数组两种格式
    skills_raw = manifest.get("skills", manifest) if isinstance(manifest, dict) else manifest

    skills = []
    for skill in skills_raw:
        enriched = dict(skill)
        # 为每个技能注入可直接调用的函数
        enriched["call"] = _make_caller(skill)
        skills.append(enriched)

    if verbose:
        print(f"[UniSkill] ✓ Loaded {len(skills)} skill(s) from remote manifest:")
        for s in skills:
            print(f"           • {s.get('name', 'unknown')} — {s.get('description', '')}")

    return skills


# ── 直接运行时执行快速自检 ────────────────────────────────────────────────
if __name__ == "__main__":
    print("[UniSkill] Running self-check...")
    result = load_skills()
    print(f"[UniSkill] Self-check passed. {len(result)} skill(s) available.")
