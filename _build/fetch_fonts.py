"""构建自托管中文字体：从 google/fonts 官方仓库取可变字体 → 实例化字重 → 按站点字符集子集化。

为什么不用 Google Fonts CDN：
  1. @import 在 CSS 内会造成串行阻塞；
  2. fonts.googleapis.com / fonts.gstatic.com 在中国大陆不可达，中文站点访客 100% 拿不到字体；
  3. 全字库数 MB，而实际用到的汉字只有几百个。

产物：fonts/noto-serif-sc-600.woff2（用于标题），体积从数 MB 压到几百 KB。
正文与 UI 使用系统字体栈（PingFang SC / Microsoft YaHei / HarmonyOS Sans），零下载。

新增内容后重新运行本脚本，把新出现的汉字补充进子集：
  python _build/fetch_fonts.py
未收录的个别字会回落到系统衬线字体，不会出现方块。
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "_build" / "fonts-raw"
OUT_DIR = ROOT / "fonts"
UA = "WorkBuddy-build/1.0"

# 通用规范汉字表一级字表常用标点 + 站点会用到的基础符号，作为子集缓冲
BASE_CHARS = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "　、。〃〈〉《》「」『』【】〔〕〖〗！＃＄％＆（）＊＋，－．／０１２３４５６７８９：；＜＝＞？＠ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ［］＿ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ｛｜｝～"
    + "·×÷°℃±≈≤≥→←↑↓■□●○◆◇★☆√∞…—‘’“”·﹣－"
)

# (输出名, google/fonts 仓库路径, 可变字体 wght 轴需要实例化的字重)
FONTS = [
    ("noto-serif-sc-600", "ofl/notoserifsc/NotoSerifSC[wght].ttf", 600),
]


def api_get(url: str, raw: bool = False) -> bytes:
    accept = "application/vnd.github.raw" if raw else "application/vnd.github+json"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()


def fetch_font(repo_path: str, dest: Path) -> Path:
    """通过 GitHub Blobs API 取单个字体文件（绕过被拦截的 raw.githubusercontent.com）。"""
    if dest.exists() and dest.stat().st_size > 1_000_000:
        print(f"  [缓存] {dest.name}  {dest.stat().st_size // 1024 // 1024} MB")
        return dest

    listing = json.loads(api_get(f"https://api.github.com/repos/google/fonts/contents/{repo_path}"))
    if isinstance(listing, list):  # 目录，按文件名匹配
        target = Path(repo_path).name
        entry = next((x for x in listing if x["name"] == target), None)
        if entry is None:
            raise RuntimeError(f"{repo_path} 下未找到 {target}")
        sha = entry["sha"]
    else:
        sha = listing["sha"]

    print(f"  [下载] blob {sha[:12]} …")
    data = api_get(f"https://api.github.com/repos/google/fonts/git/blobs/{sha}", raw=True)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    print(f"  [完成] {dest.name}  {len(data) / 1048576:.1f} MB")
    return dest


def collect_charset() -> set[str]:
    """只收集真正会用衬线字体渲染的文字。

    衬线字体在我们的样式表里只服务于标题类元素（h1-h6 以及
    .logo / .footer__brand / .checker__question）。如果按整站字符集子集化，
    会带上大量只在正文出现的汉字，产物要多出一倍以上。标题用字范围小且稳定，
    正文则走系统字体栈、零下载。
    """
    chars: set[str] = set(BASE_CHARS)
    target_dirs = [ROOT, ROOT / "src" / "pages", ROOT / "src" / "partials"]
    scanned = 0

    for directory in target_dirs:
        if not directory.exists():
            continue
        for path in sorted(directory.glob("*.html")):
            try:
                html = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            scanned += 1
            chars |= _serif_text_chars(html)

    print(f"  扫描 {scanned} 个页面，标题用字 {len(chars)} 个字符")
    return {c for c in chars if ord(c) >= 0x20}


HEADING_RE = re.compile(r"<(h[1-6])\b[^>]*>(.*?)</\1>", re.S | re.I)
SERIF_CLASS_RE = re.compile(
    r'<(\w+)\b[^>]*class="[^"]*\b(?:logo|footer__brand|checker__question)\b[^"]*"[^>]*>(.*?)</\1>',
    re.S | re.I,
)
TAG_RE = re.compile(r"<[^>]+>")


def _serif_text_chars(html: str) -> set[str]:
    collected = set()
    for pattern in (HEADING_RE, SERIF_CLASS_RE):
        for match in pattern.finditer(html):
            inner = match.group(2)
            # <noscript> / <svg> 里的文字不会用衬线字体渲染，剔除
            inner = re.sub(r"<(script|style|svg|noscript)\b.*?</\1>", " ", inner, flags=re.S | re.I)
            collected |= set(TAG_RE.sub("", inner))
    return collected


def build_one(name: str, repo_path: str, weight: int, chars: set[str]) -> Path | None:
    print(f"\n[{name}] wght={weight}")
    try:
        src = fetch_font(repo_path, CACHE / f"{name}-var.ttf")
    except Exception as exc:  # noqa: BLE001
        print(f"  !! 下载失败：{exc}")
        return None

    font = TTFont(str(src), lazy=False)
    if "fvar" in font:
        axes = {a.axisTag for a in font["fvar"].axes}
        if "wght" in axes:
            print(f"  实例化 wght={weight}")
            font = instancer.instantiateVariableFont(font, {"wght": weight}, inplace=False, updateFontNames=True)
    else:
        print("  静态字体，跳过实例化")

    options = subset.Options()
    options.flavor = "woff2"
    options.desubroutinize = True
    options.hinting = False
    options.legacy_kern = False
    options.layout_features = ["*"]
    options.notdef_outline = True
    options.drop_tables += ["DSIG"]

    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text="".join(sorted(chars)))
    subsetter.subset(font)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dest = OUT_DIR / f"{name}.woff2"
    font.save(str(dest))
    font.close()
    print(f"  [产物] {dest.name}  {dest.stat().st_size / 1024:.1f} KB")
    return dest


def main() -> int:
    print("收集站点字符集 …")
    chars = collect_charset()
    cjk = sum(1 for c in chars if ord(c) > 0x2E7F)
    print(f"  合计 {len(chars)} 个字符，其中中日韩汉字 {cjk} 个\n")

    total = 0
    for name, repo_path, weight in FONTS:
        dest = build_one(name, repo_path, weight, chars)
        if dest is None:
            return 1
        total += dest.stat().st_size

    print(f"\n字体总产物：{total / 1024:.1f} KB（原方案需从 Google Fonts 加载 8 个字重，大陆不可达）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
