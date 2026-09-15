"""迁移内容完整性比对：把 v7 原站与 v2 构建产物的正文纯文本对齐比较。

v7 的每个页面里都内联了导航栏、页脚、内联样式与脚本；v2 把这些抽走了，
所以不能比总字数。这里提取"正文区间"的纯文本（去掉标签、脚本、样式、导航、
页脚、广告占位），再逐行做 6-gram 覆盖率比对：

    对 v7 的每一行，切成所有长度 6 的字串（shingle），看其中多少比例能在 v2
    全文里找到。覆盖率 < 70% 才判定"这行内容丢了"。

为什么不用精确子串：这次迁移有意重写了若干处（人称统一、10 篇→一组、标点全角化、
把手写清单换成由数据生成），还有 v7 把整张卡片压成一行、v2 拆成多行的情况。
精确子串会把这些全部误报成"丢失"。shingle 覆盖率能容忍局部改写与重新分行，
但只要某段内容被整段删掉，覆盖率就会断崖式下跌，依然抓得住。

只报告，不修改任何文件。
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V7 = ROOT.parent / "repo_src" / "plant-care-guide-master"

PAGES = [
    "index",
    "articles",
    "watering-guide",
    "top10-plants",
    "propagation-guide",
    "encyclopedia",
    "article-detail",
    "lighting-guide",
    "repotting-guide",
    "fertilizer-guide",
    "pest-article",
    "about",
    "contact",
    "privacy",
]

DROP_BLOCKS = re.compile(
    r"<(script|style|nav|footer|svg|noscript)\b[^>]*>.*?</\1>", re.S | re.I
)
BLOCK_END = re.compile(r"</(p|div|li|h[1-6]|td|th|tr|section|article|blockquote|summary)>", re.I)

# 只保留汉字与字母数字：比对前折叠掉所有标点（全站做过一轮中文标点归一化）
KEEP = re.compile(r"[\u4e00-\u9fffA-Za-z0-9]")
SHINGLE = 6
THRESHOLD = 0.70


def strip_to_text(markup: str) -> str:
    """去掉整块脚本/样式/导航/页脚，拍平标签，返回按块级边界分行的纯文本。"""
    text = DROP_BLOCKS.sub(" ", markup)
    text = BLOCK_END.sub("\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.replace("\u00a0", " ").replace("\u200b", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    return text.strip()


def fold(text: str) -> str:
    """丢掉标点与空白，只留实义字符。"""
    return "".join(ch for ch in text if KEEP.match(ch))


def content_lines(text: str, minimum: int = 20) -> list[str]:
    """取长度 ≥ minimum 的块级行；过短的多是按钮文字与标签，不参与评估。"""
    out = []
    for raw in text.split("\n"):
        line = fold(raw)
        if len(line) >= minimum:
            out.append((raw.strip(), line))
    return out


def coverage(line: str, flat_new: str, k: int = SHINGLE) -> float:
    """该行有多少比例的 6-gram 能在 v2 里找到。"""
    if len(line) < k:
        return 1.0 if line in flat_new else 0.0
    grams = [line[i : i + k] for i in range(len(line) - k + 1)]
    hits = sum(1 for gram in grams if gram in flat_new)
    return hits / len(grams)


def counts(markup: str) -> dict[str, int]:
    text = DROP_BLOCKS.sub(" ", markup)
    return {
        key: len(re.findall(rf"<{tag}\b", text, re.I))
        for key, tag in (("h2", "h2"), ("h3", "h3"), ("li", "li"), ("td", "td"))
    }


def main() -> int:
    report = []
    print(f"{'页面':<20}{'内容覆盖':>10}{'疑似丢失':>10}   结构 v7→v2（h2 / h3 / li / td）")
    print("-" * 86)

    worst: list[tuple[str, float, list[tuple[float, str]]]] = []

    for slug in PAGES:
        old_file = V7 / f"{slug}.html"
        new_file = ROOT / f"{slug}.html"
        if not old_file.exists() or not new_file.exists():
            print(f"{slug:<20}{'文件缺失':>10}")
            continue

        old_text = strip_to_text(old_file.read_text(encoding="utf-8"))
        new_text = strip_to_text(new_file.read_text(encoding="utf-8"))
        flat_new = fold(new_text)

        lines = content_lines(old_text)
        scored = [(coverage(flat, flat_new), raw) for raw, flat in lines]
        lost = [(score, raw) for score, raw in scored if score < THRESHOLD]

        total = len(lines) or 1
        agg = sum(score for score, _ in scored) / total

        old_counts = counts(old_file.read_text(encoding="utf-8"))
        new_counts = counts(new_file.read_text(encoding="utf-8"))
        struct = " / ".join(f"{old_counts[key]}→{new_counts[key]}" for key in ("h2", "h3", "li", "td"))

        print(f"{slug:<20}{agg:>9.1%}{len(lost):>10}   {struct}")
        report.append(
            {
                "page": slug,
                "coverage": round(agg, 4),
                "lostCount": len(lost),
                "lost": [{"score": round(s, 2), "text": t} for s, t in lost],
            }
        )

        if agg < 0.97:
            worst.append((slug, agg, lost[:3]))

    print("-" * 86)
    if worst:
        print("\n按行覆盖率 <70% 判定的疑似丢失（需人工确认）：")
        for slug, agg, sample in worst:
            print(f"\n  [{slug}] 整体覆盖 {agg:.1%}")
            for score, text in sample:
                print(f"    ({score:.0%}) {text[:76]}")
    else:
        print("\n全部页面内容覆盖 ≥97%，迁移未发现成段丢失。")

    out = ROOT / "_build" / "migrate" / "coverage.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n明细已写入 {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
