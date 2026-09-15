"""为本次新迁移的 10 个页面输出视觉检查图（桌面首屏 + 中部内容 + 窄屏）。

verify.py 负责"对不对"，这个脚本只负责"好不好看"——给人看裁剪图。
"""

from __future__ import annotations

import http.server
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "_build" / "shots"
PORT = 8773

PAGES = [
    ("articles", "文章列表"),
    ("top10-plants", "新手绿植推荐"),
    ("lighting-guide", "室内光照指南"),
    ("repotting-guide", "换盆与土壤全攻略"),
    ("fertilizer-guide", "施肥入门指南"),
    ("pest-article", "病虫害防治大全"),
    ("propagation-guide", "植物繁殖入门"),
    ("about", "关于我们"),
    ("contact", "联系我们"),
    ("privacy", "隐私政策"),
]

BLOCKED = (
    "googlesyndication.com",
    "googletagmanager.com",
    "fundingchoicesmessages.google.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "doubleclick.net",
)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), QuietHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def settle(page):
    height = page.evaluate("() => document.documentElement.scrollHeight")
    step = max(int(page.viewport_size["height"] * 0.7), 200)
    for y in range(0, height, step):
        page.evaluate("(y) => window.scrollTo(0, y)", y)
        page.wait_for_timeout(110)
    page.evaluate("() => window.scrollTo(0, 0)")
    page.wait_for_timeout(250)


def main() -> int:
    SHOTS.mkdir(parents=True, exist_ok=True)
    httpd = serve()
    base = f"http://127.0.0.1:{PORT}"

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for index, (slug, label) in enumerate(PAGES, start=1):
            context = browser.new_context(viewport={"width": 1280, "height": 900})
            context.route(
                "**/*",
                lambda route: route.abort()
                if any(host in route.request.url for host in BLOCKED)
                else route.continue_(),
            )
            page = context.new_page()
            page.goto(f"{base}/{slug}.html", wait_until="load")
            settle(page)

            tag = f"n{index:02d}-{slug}"
            # 首屏（含面包屑与标题区）
            page.evaluate("() => window.scrollTo(0, 0)")
            page.wait_for_timeout(150)
            page.screenshot(path=str(SHOTS / f"{tag}-top.png"))

            # 中部内容（文章页主要看正文组件，功能页主要看卡片区）
            page.evaluate("() => window.scrollTo(0, document.documentElement.scrollHeight * 0.38)")
            page.wait_for_timeout(250)
            page.screenshot(path=str(SHOTS / f"{tag}-mid.png"))

            print(f"  ✓ {slug:20s} {label}")
            context.close()

        # 窄屏抽查 3 个结构最复杂的页面
        for slug in ("encyclopedia", "top10-plants", "pest-article"):
            context = browser.new_context(
                viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True
            )
            context.route(
                "**/*",
                lambda route: route.abort()
                if any(host in route.request.url for host in BLOCKED)
                else route.continue_(),
            )
            page = context.new_page()
            page.goto(f"{base}/{slug}.html", wait_until="load")
            settle(page)
            page.screenshot(path=str(SHOTS / f"m-{slug}-360.png"), full_page=True)
            print(f"  ✓ {slug:20s} 窄屏全页")
            context.close()

        browser.close()

    httpd.shutdown()
    print(f"\n输出目录：{SHOTS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
