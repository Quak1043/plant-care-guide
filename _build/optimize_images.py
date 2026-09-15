"""图片资源优化：去水印 → 清理死文件 → 生成多尺寸 AVIF/WebP/JPEG → 输出清单供 build.mjs 生成 <picture>。

要点：
  · 源图右下角带图像生成工具的水印（"TRAE AI 生成"，约 100x22px，距底 16-20px、
    距右约 21px，像素级固定偏移、与图片尺寸无关）。水印整体落在底部 36px 内，
    因此统一从源图底部裁掉 WATERMARK_BAND 像素——不修补、不生成像素，
    彻底避免残留与涂抹痕迹；
  · 旧站图片 100% 没有 width/height，卡片图 1216x912 只用于渲染 200px 高的位置，过度下载 8-10 倍；
  · 旧站 0 个 WebP/AVIF；
  · 旧站有 7 个从未被任何页面引用的死文件（含 hero 与卡片图的历史版本），约 1.6 MB。

产物：
  assets/**.{avif,webp,jpg}  多尺寸派生图
  assets/manifest.json       供 build.mjs 生成 <picture srcset sizes> 与宽高属性

注意：裁剪只发生在内存里，repo_src/ 下的原始克隆保持原样，随时可以复现。
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT.parent / "repo_src" / "plant-care-guide-master" / "assets"
OUT_DIR = ROOT / "assets"

# 旧文件名 → 规整后的基名（去掉 -v2 / -new 这类历史版本后缀）
RENAME = {
    "hero-v2": "hero",
    "card-beginner-v2": "card-beginner",
    "card-monstera-v2": "card-monstera",
}

# 确认无人引用、不再带入新工程的死文件（只统计体积，不改动原始克隆）
DEAD = [
    "hero.jpg",
    "hero-new.jpg",
    "card-beginner.jpg",
    "card-beginner-new.jpg",
    "card-monstera.jpg",
    "card-monstera-new.jpg",
    "encyclopedia/plant-money-tree.jpg",
]
DEAD_NAMES = {Path(p).name for p in DEAD}

# 基名 → (需要生成的宽度列表, 是否作为视口铺满的大图)
TARGETS: dict[str, list[int]] = {
    "hero": [640, 960, 1368],
    "propagation-methods": [400, 800, 1216],
    "card-beginner": [400, 800, 1216],
    "card-fertilizer": [400, 800, 1216],
    "card-light": [400, 800, 1216],
    "card-monstera": [400, 800, 1216],
    "card-pests": [400, 800, 1216],
    "card-propagation": [400, 800, 1368],
    "card-repot": [400, 800, 1216],
    "card-watering": [400, 800, 1216],
}
DEFAULT_WIDTHS = [320, 640]

# 生成工具的水印贴在右下角、距底 16-20px、纵向不超过 36px。整体裁掉底部这么多像素，
# 可以保证不带任何残留，同时不引入涂抹痕迹。（裁掉的部分约占高度 4%-6%，画面重心不受影响。）
WATERMARK_BAND = 44

QUALITY = {"avif": 52, "webp": 78, "jpeg": 80}


def strip_watermark(img: Image.Image) -> Image.Image:
    """裁掉底部的水印带。只改内存里的图，不动源文件。"""
    if img.height <= WATERMARK_BAND + 64:
        return img
    return img.crop((0, 0, img.width, img.height - WATERMARK_BAND))


def load(name: str) -> tuple[Image.Image, Path]:
    """按优先级找源文件：先找规整后的名字，再找历史版本名。"""
    candidates = [SRC_DIR / f"{name}.jpg"]
    for legacy, clean in RENAME.items():
        if clean == name:
            candidates.insert(0, SRC_DIR / f"{legacy}.jpg")
    for path in candidates:
        if path.exists():
            img = Image.open(path)
            img = ImageOps.exif_transpose(img)
            return strip_watermark(img.convert("RGB")), path
    raise FileNotFoundError(f"找不到源素材 {name}")


def fit(img: Image.Image, width: int) -> Image.Image:
    """等比缩放到目标宽度；源图更窄时保持原尺寸，不做放大插值。"""
    if width >= img.width:
        return img.copy()
    height = round(img.height * width / img.width)
    return img.resize((width, height), Image.LANCZOS)


def save_variants(img: Image.Image, base: str, width: int, out_dir: Path) -> dict[str, str]:
    stem = f"{base}-{width}"
    out: dict[str, str] = {}

    path = out_dir / f"{stem}.avif"
    img.save(path, "AVIF", quality=QUALITY["avif"], speed=4)
    out["avif"] = f"assets/{path.name}"

    path = out_dir / f"{stem}.webp"
    img.save(path, "WEBP", quality=QUALITY["webp"], method=6)
    out["webp"] = f"assets/{path.name}"

    path = out_dir / f"{stem}.jpg"
    img.save(path, "JPEG", quality=QUALITY["jpeg"], optimize=True, progressive=True)
    out["jpeg"] = f"assets/{path.name}"

    return out


def main() -> int:
    if not SRC_DIR.exists():
        print(f"!! 找不到源素材目录 {SRC_DIR}")
        return 1

    print("排除的死文件（无人引用，不再带入新工程）：")
    dead_bytes = 0
    for rel in DEAD:
        p = SRC_DIR / rel
        if p.exists():
            size = p.stat().st_size
            dead_bytes += size
            print(f"  - {rel}  {size / 1024:.0f} KB")
    print(f"  合计省下 {dead_bytes / 1048576:.2f} MB\n")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "encyclopedia").mkdir(exist_ok=True)

    # 先清掉上一轮遗留的派生图。源图被移入 DEAD 清单后，旧派生图仍留在目录里，
    # 就会变成没人引用的死文件，还会被一起提交、一起发布。
    stale_removed = 0
    for folder in (OUT_DIR, OUT_DIR / "encyclopedia"):
        for pattern in ("*.avif", "*.webp", "*.jpg"):
            for stale in folder.glob(pattern):
                stale.unlink()
                stale_removed += 1
    if stale_removed:
        print(f"清理上一轮遗留的派生图 {stale_removed} 个（源图已不在清单里）\n")

    manifest: dict[str, dict] = {}
    total_out = 0

    # 通用卡片图
    for base, widths in TARGETS.items():
        try:
            img, src = load(base)
        except FileNotFoundError as exc:
            print(f"  !! {exc}")
            continue

        entry = {
            "base": base,
            "intrinsic": {"width": img.width, "height": img.height},
            "ratio": round(img.width / img.height, 4),
            "source": src.name,
            "avif": {},
            "webp": {},
            "jpeg": {},
        }
        for w in widths:
            if w > img.width:
                continue
            variant = fit(img, w)
            files = save_variants(variant, base, w, OUT_DIR)
            for fmt, path in files.items():
                entry[fmt][str(w)] = path
                total_out += (ROOT / path).stat().st_size

        manifest[base] = entry
        best = entry["webp"]
        sample = (ROOT / best[max(best, key=int)]).stat().st_size
        print(f"  {base:<22} {img.width}x{img.height} → {sorted(int(k) for k in best)} 最大 webp {sample / 1024:.0f} KB")

    # 百科植物图（统一 320/640，展示宽度约 260px）
    enc_dir = OUT_DIR / "encyclopedia"
    enc_sources = [p for p in sorted((SRC_DIR / "encyclopedia").glob("*.jpg")) if p.name not in DEAD_NAMES]
    for src in enc_sources:
        base = src.stem
        img = strip_watermark(ImageOps.exif_transpose(Image.open(src)).convert("RGB"))
        entry = {
            "base": base,
            "intrinsic": {"width": img.width, "height": img.height},
            "ratio": round(img.width / img.height, 4),
            "source": src.name,
            "avif": {},
            "webp": {},
            "jpeg": {},
        }
        for w in DEFAULT_WIDTHS:
            if w > img.width:
                continue
            variant = fit(img, w)
            stem = f"{base}-{w}"
            for fmt, params in (
                ("avif", ("AVIF", {"quality": QUALITY["avif"], "speed": 4})),
                ("webp", ("WEBP", {"quality": QUALITY["webp"], "method": 6})),
                ("jpeg", ("JPEG", {"quality": QUALITY["jpeg"], "optimize": True, "progressive": True})),
            ):
                ext = "jpg" if fmt == "jpeg" else fmt
                path = enc_dir / f"{stem}.{ext}"
                variant.save(path, params[0], **params[1])
                entry[fmt][str(w)] = f"assets/encyclopedia/{path.name}"
                total_out += path.stat().st_size
        manifest[f"encyclopedia/{base}"] = entry

    print(f"  百科植物图 {len(list((SRC_DIR / 'encyclopedia').glob('*.jpg')))} 张 → 320/640 三格式")

    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"\n产物合计 {total_out / 1048576:.2f} MB，清单 {len(manifest)} 项 → assets/manifest.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
