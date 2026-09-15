"""从旧版 encyclopedia.html 抽取植物数据，生成为单一数据源 src/data/plants.json。

目的：旧站点的百科条目与 JS 里的搜索索引是两份互不相干的手写清单，已经不同步
（搜索里有 4 个百科不存在的植物，百科里有 5 个植物搜不到）。
抽成 JSON 之后，百科页面与 search-index.json 都由 build.mjs 从同一份数据生成。
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / "repo_src" / "plant-care-guide-master" / "encyclopedia.html"
DEST = ROOT / "src" / "data" / "plants.json"

SLUG_OVERRIDES = {
    "绿萝": "pothos",
    "虎皮兰": "snake",
    "龟背竹": "monstera",
    "吊兰": "spider",
    "琴叶榕": "fiddle",
    "多肉": "succulent",
    "富贵竹": "lucky-bamboo",
    "巴西铁树": "dracaena",
    "常春藤": "english-ivy",
    "天堂鸟": "bird-of-paradise",
    "金钱树": "zz",
    "万年青": "evergreen",
    "兰花": "orchid",
    "蕨类": "fern",
    "发财树": "fortune",
}

CARD_RE = re.compile(r'<article class="plant-card"(.*?)</article>', re.S)
RE_ATTR = re.compile(r'data-(\w+)="([^"]*)"')
RE_IMG = re.compile(r'src="(assets/encyclopedia/plant-([a-z-]+)\.jpg)"')
RE_ZH = re.compile(r'<h3 class="plant-name-zh">([^<]+)</h3>')
RE_LA = re.compile(r'<p class="plant-name-la">([^<]+)</p>')
RE_DESC = re.compile(r'<p class="plant-desc">(.*?)</p>', re.S)
RE_DETAIL = re.compile(r'<div class="detail-item"><strong>([^<]+)：</strong>([^<]*)</div>')
RE_H4 = re.compile(r"<h4>([^<]+)</h4>\s*<p>(.*?)</p>", re.S)

# 搜索结果用的图标（对应 src/partials/icons.svg 的 symbol id）
ICONS = {
    "pothos": "leaf",
    "snake": "cactus",
    "monstera": "herb",
    "spider": "seedling",
    "fiddle": "tree",
    "succulent": "flower",
    "lucky-bamboo": "bamboo",
    "dracaena": "tree",
    "english-ivy": "clover",
    "bird-of-paradise": "flower",
    "zz": "money",
    "evergreen": "leaf",
    "orchid": "butterfly",
    "fern": "feather",
    "fortune": "money",
}

# 搜索别名。旧索引里写死的「橡皮树 / 白掌 / 文竹 / 蝴蝶兰」在百科页面中并不存在，
# 这里改为这些植物真实俗名的等价说法。
ALIASES = {
    "pothos": ["绿萝", "魔鬼藤", "黄金葛"],
    "snake": ["虎皮兰", "虎尾兰", "千岁兰"],
    "monstera": ["龟背竹", "蓬莱蕉"],
    "spider": ["吊兰", "挂兰", "钓兰"],
    "succulent": ["多肉植物", "多肉", "景天科"],
    "lucky-bamboo": ["富贵竹", "转运竹", "开运竹"],
    "fiddle": ["琴叶榕", "大琴叶榕"],
    "english-ivy": ["常春藤", "洋常春藤"],
    "bird-of-paradise": ["天堂鸟", "鹤望兰"],
    "zz": ["金钱树", "雪铁芋", "泽米芋"],
    "evergreen": ["万年青", "粉黛万年青"],
    "orchid": ["兰花", "蝴蝶兰", "国兰"],
    "fern": ["蕨类", "铁线蕨", "波士顿蕨"],
    "fortune": ["发财树", "瓜栗", "马拉巴栗"],
    "dracaena": ["巴西铁树", "香龙血树", "巴西木"],
}


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text)).strip()


def main() -> int:
    if not SOURCE.exists():
        print(f"!! 找不到源文件 {SOURCE}")
        return 1

    html = SOURCE.read_text(encoding="utf-8")
    plants: list[dict] = []

    for block in CARD_RE.findall(html):
        attrs = dict(RE_ATTR.findall(block))
        img = RE_IMG.search(block)
        zh = RE_ZH.search(block)
        if not (img and zh):
            continue

        name_zh = zh.group(1).strip()
        slug = img.group(2)
        detail = {k: v.strip() for k, v in RE_DETAIL.findall(block)}
        sections = {clean(k): clean(v) for k, v in RE_H4.findall(block)}
        la = RE_LA.search(block)
        desc = RE_DESC.search(block)

        plants.append(
            {
                "id": f"plant-{slug}",
                "slug": slug,
                "nameZh": name_zh,
                "nameLa": la.group(1).strip() if la else "",
                "aliases": ALIASES.get(slug, []),
                "icon": ICONS.get(slug, "leaf"),
                "image": f"assets/encyclopedia/plant-{slug}",
                "light": attrs.get("light", ""),
                "difficulty": attrs.get("diff", ""),
                "function": attrs.get("func", ""),
                "summary": clean(desc.group(1)) if desc else "",
                "care": detail,
                "faq": sections.get("常见问题", ""),
                "tips": sections.get("养护小贴士", ""),
            }
        )

    # 按已有图片顺序稳定排序，保持与旧页面一致的展示次序
    order = [m[1] for m in RE_IMG.findall(html)]
    plants.sort(key=lambda p: order.index(p["slug"]) if p["slug"] in order else 999)

    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(plants, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"抽取 {len(plants)} 种植物 → {DEST.relative_to(ROOT)}")
    for p in plants:
        print(f"  {p['id']:<26} {p['nameZh']:<8} {p['light']:<5} {p['difficulty']:<4} {p['function']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
