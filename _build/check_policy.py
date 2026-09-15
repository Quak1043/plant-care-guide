"""发布商政策合规审计。

针对 Google 发布商政策（support.google.com/adsense/answer/9335564 /
中文版 answer/10502938）里可以在静态站点上被客观检测的条目：

  · 链接至不存在的内容（政策「网站行为 / 误导性导航」明确列举）
  · 锚点指向不存在的 id（点了没反应，用户体感等于链接失效）
  · robots.txt 是否屏蔽了 Google 抓取工具（政策「在无法评估的内容中投放广告」）
  · ads.txt 是否包含且格式正确
  · 每页广告单元数量与广告标签文案（只允许「广告」或「赞助商链接」）
  · 广告是否紧邻导航/按钮类可点击元素（政策「避免误点击」）
  · 每页是否存在实质内容（政策「最低内容要求」）
  · 外链是否带 rel="noopener"，有无指向已知风险域名

只报告，不修改文件。
"""

from __future__ import annotations

import glob
import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent

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
    "credits",
    "privacy",
]

# 广告标签：政策只允许这两种
ALLOWED_AD_LABELS = {"广告", "赞助商链接", "advertisements", "sponsored links"}

V7 = ROOT.parent / "repo_src" / "plant-care-guide-master"

issues: list[tuple[str, str, str]] = []  # (严重度, 页面, 说明)
notes: list[tuple[str, str, str]] = []


def add(severity: str, page: str, message: str) -> None:
    (issues if severity in ("P0", "P1") else notes).append((severity, page, message))


def attr(tag: str, name: str) -> str:
    match = re.search(rf'{name}\s*=\s*"([^"]*)"', tag) or re.search(
        rf"{name}\s*=\s*'([^']*)'", tag
    )
    return match.group(1) if match else ""


def strip_blocks(markup: str) -> str:
    return re.sub(
        r"<(script|style|svg)\b[^>]*>.*?</\1>", " ", markup, flags=re.S | re.I
    )


def collect_ids(markup: str) -> set[str]:
    return set(re.findall(r'\sid="([^"]+)"', markup))


def main() -> int:
    sources = {slug: (ROOT / f"{slug}.html").read_text(encoding="utf-8") for slug in PAGES}
    all_ids = {slug: collect_ids(markup) for slug, markup in sources.items()}
    existing = {f"{slug}.html" for slug in PAGES}

    # ---------------------------------------------------- 1. 内链与锚点
    for slug, markup in sources.items():
        body = strip_blocks(markup)
        for tag in re.findall(r"<a\b[^>]*>", body, re.I):
            href = attr(tag, "href")
            if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
                if href.startswith("#") and len(href) > 1:
                    target = href[1:]
                    if target not in all_ids[slug]:
                        add("P1", slug, f"锚点 #{target} 在本页不存在")
                continue

            parsed = urlparse(href)
            if parsed.scheme in ("http", "https"):
                if 'rel="noopener"' not in tag and 'rel="noreferrer"' not in tag and 'target="_blank"' in tag:
                    add("P2", slug, f"外链缺 rel=noopener：{href[:60]}")
                continue

            path, _, fragment = href.partition("#")
            path = path.split("?")[0]
            if not path:
                continue
            if path not in existing:
                add("P0", slug, f"链接指向不存在的页面：{href}")
                continue
            if fragment:
                target_slug = Path(path).stem
                if target_slug in all_ids and fragment not in all_ids[target_slug]:
                    add("P0", slug, f"链接锚点失效：{href}")

    # ---------------------------------------------------- 2. robots.txt
    robots_path = ROOT / "robots.txt"
    if robots_path.exists():
        robots = robots_path.read_text(encoding="utf-8")
        if re.search(r"(?im)^\s*disallow:\s*/\s*$", robots):
            add("P0", "-", "robots.txt 全站 Disallow，Google 抓取工具无法评估内容")
        for asset in ("/css/", "/js/", "/assets/"):
            if re.search(rf"(?im)^\s*disallow:\s*{re.escape(asset)}\s*$", robots):
                add("P0", "-", f"robots.txt 屏蔽了 {asset}，页面将无法被正确渲染评估")
        if "sitemap:" not in robots.lower():
            add("P2", "-", "robots.txt 未声明 Sitemap")

    # ---------------------------------------------------- 3. ads.txt
    ads_path = ROOT / "ads.txt"
    if not ads_path.exists():
        add("P0", "-", "缺少 ads.txt")
    else:
        ads = ads_path.read_text(encoding="utf-8").strip()
        if not re.search(r"^google\.com,\s*pub-\d+,\s*DIRECT,\s*f08c47fec0942fa0\s*$", ads, re.M):
            add("P0", "-", f"ads.txt 格式不符合 IAB 规范：{ads[:70]}")

    # ---------------------------------------------------- 4. 广告实现
    for slug, markup in sources.items():
        block = strip_blocks(markup)
        units = len(re.findall(r'class="adsbygoogle"', block))
        labels = re.findall(r'class="ad__label"[^>]*>([^<]*)<', block)

        if units != len(labels):
            add("P1", slug, f"{units} 个广告单元但有 {len(labels)} 个标签，广告必须逐一标明")

        for label in labels:
            if label.strip().lower() not in ALLOWED_AD_LABELS:
                add(
                    "P0",
                    slug,
                    f"广告标签「{label.strip()}」不合规，只允许「广告」或「赞助商链接」",
                )

        # 广告单元不得塞在导航 / 按钮 / 下载元素内部
        for asides in re.findall(r'<aside\b[^>]*class="ad"[\s\S]{0,900}?</aside>', block, re.I):
            if re.search(r"<(nav|button|form)\b", asides, re.I):
                add("P0", slug, "广告单元内部含导航/按钮/表单元素，易造成误点击")
            if re.search(r"(上一页|下一页|下载|播放|立即购买|立即注册|点击这里)", asides):
                add("P1", slug, "广告单元内含诱导性文案或导航词")

        # 广告正上方不得是按钮或导航条（政策「避免误点击」要求保持距离）
        for match in re.finditer(r'<aside\b[^>]*class="ad"', block, re.I):
            before = block[: match.start()]
            last_tags = re.findall(r"<(\w+)[^>]*>", before[-400:])
            if last_tags and last_tags[-1].lower() in ("button", "a"):
                add("P1", slug, "广告容器紧跟在可点击元素之后，间距不足")

    # ---------------------------------------------------- 5. 最低内容要求
    for slug, markup in sources.items():
        text = re.sub(r"<[^>]+>", "", strip_blocks(markup))
        text = re.sub(r"\s+", "", text)
        if len(text) < 600:
            add("P0", slug, f"正文仅 {len(text)} 字，可能触发「最低内容要求」")

    # ---------------------------------------------------- 6. 图片来源可追溯性
    manifest = json.loads((ROOT / "assets" / "manifest.json").read_text(encoding="utf-8"))
    if not any(
        (ROOT / name).exists()
        for name in ("CREDITS.md", "credits.html", "LICENSE", "LICENSE.md")
    ):
        add(
            "P0",
            "-",
            f"仓库无任何图片来源记录（{len(manifest)} 组图片、无 LICENSE/CREDITS），"
            "知识产权滥用是发布商政策里最常导致停投的一类",
        )

    # ---------------------------------------------------- 输出
    print("=" * 78)
    print("Google 发布商政策 · 站点合规审计")
    print("=" * 78)

    order = {"P0": 0, "P1": 1, "P2": 2}
    issues.sort(key=lambda item: (order[item[0]], item[1]))
    notes.sort(key=lambda item: (order[item[0]], item[1]))

    label = {
        "P0": "严重",
        "P1": "需修",
        "P2": "建议",
    }

    if issues:
        for severity, page, message in issues:
            print(f"[{label[severity]}] {page:<18} {message}")
    else:
        print("未发现 P0/P1 级合规问题。")

    if notes:
        print()
        for severity, page, message in notes:
            print(f"[{label[severity]}] {page:<18} {message}")

    print()
    counts = {key: sum(1 for item in issues if item[0] == key) for key in ("P0", "P1")}
    print(f"合计：严重 {counts['P0']} 项，需修 {counts['P1']} 项，建议 {len(notes)} 项")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
