#!/usr/bin/env python3
"""Validate the published shuyi-learning skill structure."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
REQUIRED_HEADER = ("> **接口**", "> **依赖**", "> **不负责**", "> **触发**")


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def count_hanzi(text: str) -> int:
    return sum("\u4e00" <= char <= "\u9fff" for char in text)


def main() -> None:
    skill = ROOT / "SKILL.md"
    if not skill.exists():
        fail("SKILL.md 不存在")

    skill_text = skill.read_text(encoding="utf-8")
    routes = re.findall(r"`(references/[^`]+\.md)`", skill_text)
    if not routes:
        fail("SKILL.md 未找到 references 路由")

    for route in routes:
        path = ROOT / route
        if not path.exists():
            fail(f"路由文件不存在: {route}")
        text = path.read_text(encoding="utf-8")
        missing = [item for item in REQUIRED_HEADER if item not in text[:600]]
        if missing:
            fail(f"接口头不完整: {route}（缺少 {'、'.join(missing)}）")

    hanzi = count_hanzi(skill_text)
    if hanzi > 1000:
        fail(f"SKILL.md 超过 1000 汉字: {hanzi}")

    for path in sorted((ROOT / "references").glob("*.md")):
        length = count_hanzi(path.read_text(encoding="utf-8"))
        if length > 3000:
            fail(f"模块超过 3000 汉字: {path.relative_to(ROOT)}（{length}）")

    if not (ROOT / "LICENSE").exists():
        fail("LICENSE 不存在")

    print(f"OK: {len(routes)} 个路由、接口头、字数限制和 LICENSE 均通过")


if __name__ == "__main__":
    main()
