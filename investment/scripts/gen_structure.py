"""Generate docs/structure.md — project file tree in Markdown format."""

import os
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

IGNORE = {
    "node_modules", ".git", "dist", "__pycache__", ".vscode", ".idea",
    "venv", ".env", ".DS_Store", "Thumbs.db", ".mypy_cache", ".pytest_cache",
}

IGNORE_EXTENSIONS = {".pfx", ".pyc", ".pyo"}

OUTPUT = PROJECT_ROOT / "docs" / "structure" / "structure.md"
MAX_DEPTH = 5


def should_ignore(name: str) -> bool:
    if name in IGNORE:
        return True
    if any(name.endswith(ext) for ext in IGNORE_EXTENSIONS):
        return True
    if name.startswith(".") and name != ".gitignore":
        return True
    return False


def scan_dir(dir_path: Path, prefix: str = "", depth: int = 0) -> list[str]:
    if depth > MAX_DEPTH:
        return [f"{prefix}..."]

    entries = sorted(dir_path.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower()))
    entries = [e for e in entries if not should_ignore(e.name)]

    lines: list[str] = []
    for i, entry in enumerate(entries):
        is_last = i == len(entries) - 1
        connector = "\u2514\u2500\u2500 " if is_last else "\u251c\u2500\u2500 "
        child_prefix = prefix + ("    " if is_last else "\u2502   ")

        if entry.is_dir():
            lines.append(f"{prefix}{connector}{entry.name}/")
            lines.extend(scan_dir(entry, child_prefix, depth + 1))
        else:
            lines.append(f"{prefix}{connector}{entry.name}")

    return lines


def main():
    tree_lines = scan_dir(PROJECT_ROOT)
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    content = f"""# 專案檔案結構

> 自動生成於 {now}，由 `scripts/gen_structure.py` 產生。

```
investment/
{chr(10).join(tree_lines)}
```
"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Generated {OUTPUT}")


if __name__ == "__main__":
    main()
