#!/usr/bin/env python3
"""从原站页面里剥离 head / 内联样式 / 脚本 / 导航 / 页脚，只留下正文主体，
输出到 _build/migrate/<page>.body.html，供人工改写为 src/pages/*.html。

一次性脚本，迁移完成后可删。
"""
import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent.parent / "repo_src" / "plant-care-guide-master"
OUT = Path(__file__).resolve().parent / "migrate"
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    "articles", "article-detail", "encyclopedia", "top10-plants",
    "lighting-guide", "repotting-guide", "fertilizer-guide",
    "pest-article", "propagation-guide", "about", "contact", "privacy",
]


def strip_block(text, tag):
    return re.sub(rf"<{tag}\b[^>]*>.*?</{tag}>\s*", "", text, flags=re.S | re.I)


def main():
    for name in PAGES:
        path = SRC / f"{name}.html"
        if not path.exists():
            print(f"  ! 缺少 {path.name}")
            continue
        s = path.read_text(encoding="utf-8")

        s = strip_block(s, "style")
        s = strip_block(s, "script")
        s = strip_block(s, "svg")          # 雪碧图定义
        s = strip_block(s, "noscript")

        # 取 body 内部
        m = re.search(r"<body\b[^>]*>(.*)</body>", s, flags=re.S | re.I)
        body = m.group(1) if m else s

        # 去掉导航栏与页脚（含其前后包裹）
        body = re.sub(r"<nav\b[^>]*>.*?</nav>\s*", "", body, flags=re.S | re.I)
        body = re.sub(r"<header class=\"navbar\".*?</header>\s*", "", body, flags=re.S | re.I)
        body = re.sub(r"<footer\b[^>]*>.*?</footer>\s*", "", body, flags=re.S | re.I)
        # 去掉回到顶部按钮与滚动提示
        body = re.sub(r"<button[^>]*id=\"toTop\".*?</button>\s*", "", body, flags=re.S | re.I)

        # 压缩空白
        body = re.sub(r"[ \t]+\n", "\n", body)
        body = re.sub(r"\n{3,}", "\n\n", body).strip()

        (OUT / f"{name}.body.html").write_text(body, encoding="utf-8")
        print(f"  ✓ {name:22s} {len(body):>7d} 字符")

    # 顺带输出三份数据清单，便于比对
    for f in ("pages.json", "plants.json", "faq.json"):
        pass
    print(f"\n输出目录：{OUT}")


if __name__ == "__main__":
    main()
