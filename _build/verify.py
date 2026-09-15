"""用真实浏览器验证构建产物：控制台错误、响应式溢出、无 JS 可用性、
图片实际加载情况、交互行为（主题/菜单/搜索），并输出多尺寸截图。"""

from __future__ import annotations

import http.server
import json
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "_build" / "shots"
PORT = 8770


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):  # 静默访问日志
        pass

    def handle_error(self, request, client_address):  # 浏览器关连接时的 10053 噪声
        pass


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), QuietHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


# 第三方脚本在测试环境里会一直挂起，导致 networkidle 永不触发；
# 这里统一拦截，既让测试确定，也顺带模拟大陆网络下 AdSense/GA 不可达的情形。
BLOCKED = (
    "googlesyndication.com",
    "googletagmanager.com",
    "fundingchoicesmessages.google.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "doubleclick.net",
)


def block_third_party(context):
    context.route(
        "**/*",
        lambda route: route.abort()
        if any(host in route.request.url for host in BLOCKED)
        else route.continue_(),
    )


def settle(page):
    """模拟用户滚动到底再回到顶部，触发所有 IntersectionObserver 动画。

    必须由 Python 侧逐步驱动滚动并让出真实帧，否则连续 scrollTo 会被合并到同一帧，
    观察器只会看到最后一次滚动位置。
    """
    height = page.evaluate("() => document.documentElement.scrollHeight")
    view = page.viewport_size["height"]
    step = max(int(view * 0.7), 200)
    for y in range(0, height, step):
        page.evaluate("(y) => window.scrollTo(0, y)", y)
        page.wait_for_timeout(120)
    page.evaluate("() => window.scrollTo(0, 0)")
    page.wait_for_timeout(300)


def new_page(browser, **kwargs):
    context = browser.new_context(**kwargs)
    block_third_party(context)
    return context, context.new_page()


def transferred(page):
    """按资源类型统计首屏传输字节数（不含被本测试拦截的第三方脚本）。"""
    entries = page.evaluate(
        """() => performance.getEntriesByType('resource').map(e => ({
            name: e.name, size: e.transferSize || 0, type: e.initiatorType
        }))"""
    )
    buckets: dict[str, int] = {}
    for entry in entries:
        if any(host in entry["name"] for host in BLOCKED):
            continue
        name = entry["name"].split("?")[0]
        if name.endswith(".woff2"):
            kind = "字体"
        elif name.endswith(".css"):
            kind = "样式"
        elif name.endswith(".js") or name.endswith(".json"):
            kind = "脚本"
        elif any(name.endswith(ext) for ext in (".avif", ".webp", ".jpg", ".png", ".svg")):
            kind = "图片"
        else:
            kind = "文档"
        buckets[kind] = buckets.get(kind, 0) + entry["size"]
    return sum(buckets.values()), buckets


def check(name, condition, detail=""):
    print(f"  {'✓' if condition else '✗'} {name}{('  ' + detail) if detail else ''}")
    return condition


def main() -> int:
    SHOTS.mkdir(parents=True, exist_ok=True)
    httpd = serve()
    base = f"http://127.0.0.1:{PORT}"
    failures = 0

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ---------------------------------------------------------- 桌面端首页
        print("【首页 · 桌面 1280×900】")
        ctx, page = new_page(browser, viewport={"width": 1280, "height": 900}, device_scale_factor=1)
        raw_errors: list[str] = []
        page.on("console", lambda m: raw_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: raw_errors.append(str(e)))
        page.goto(f"{base}/index.html", wait_until="load")

        # 被本测试主动拦截的第三方请求会报 net::ERR_FAILED，不算页面自身错误
        errors = [e for e in raw_errors if "ERR_FAILED" not in e and "ERR_BLOCKED" not in e]
        failures += not check("无页面自身错误", not errors, str(errors[:2]))
        failures += not check("标题正确", "绿植养护指南" in page.title(), page.title())

        # 布局：无横向溢出
        overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        failures += not check("无横向溢出", overflow <= 1, f"溢出 {overflow}px")

        # LCP 图已加载
        hero_ok = page.evaluate(
            """() => { const i = document.querySelector('.hero__bg');
                 return i && i.complete && i.naturalWidth > 0; }"""
        )
        failures += not check("hero 图片已加载", hero_ok)

        # 图片都有尺寸属性（CLS 防线）
        missing = page.evaluate(
            """() => [...document.querySelectorAll('img')].filter(i => !i.getAttribute('width') || !i.getAttribute('height')).length"""
        )
        failures += not check("全部 img 带 width/height", missing == 0, f"缺失 {missing}")

        # JSON-LD 可解析
        ld = page.evaluate(
            """() => { const s = document.querySelector('script[type="application/ld+json"]');
                 if (!s) return null; const d = JSON.parse(s.textContent);
                 return d['@graph'].map(x => x['@type']); }"""
        )
        failures += not check("JSON-LD 可解析", bool(ld), str(ld))

        # 主题切换
        page.click("#themeToggle")
        theme = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
        pressed = page.get_attribute("#themeToggle", "aria-pressed")
        failures += not check("主题切换生效", theme == "dark" and pressed == "true", f"data-theme={theme} aria-pressed={pressed}")
        page.wait_for_timeout(400)
        settle(page)
        page.screenshot(path=str(SHOTS / "01-index-dark-1280.png"), full_page=True)

        # 深色页脚对比度（v7 的 bug 点）
        contrast = page.evaluate(
            """() => {
                const f = document.querySelector('.footer');
                const cs = getComputedStyle(f);
                const link = f.querySelector('.footer__links a');
                return { bg: cs.backgroundColor, fg: getComputedStyle(link).color };
            }"""
        )
        failures += not check("深色页脚取到对比色", contrast["bg"] != contrast["fg"], str(contrast))

        page.click("#themeToggle")
        page.wait_for_timeout(300)

        # 搜索
        page.fill("#globalSearch", "绿萝")
        page.wait_for_selector(".result-item", timeout=5000)
        first = page.get_attribute(".result-item", "href")
        failures += not check("搜索命中并带植物锚点", "#plant-pothos" in (first or ""), str(first))
        page.screenshot(path=str(SHOTS / "02-index-search.png"), clip={"x": 300, "y": 150, "width": 700, "height": 560})
        page.keyboard.press("Escape")

        # 滚动后所有渐入元素必须可见（防止动画把内容永久藏住）
        hidden = page.evaluate(
            """() => [...document.querySelectorAll('.reveal')]
                 .filter(el => !el.classList.contains('is-visible')).length"""
        )
        failures += not check("滚动后 reveal 元素全部可见", hidden == 0, f"仍有 {hidden} 个隐藏")

        # 字节数
        size, buckets = transferred(page)
        breakdown = "  ".join(f"{k} {v / 1024:.0f}KB" for k, v in sorted(buckets.items(), key=lambda x: -x[1]))
        print(f"    · 首屏传输合计 {size / 1024:.0f} KB  [{breakdown}]")
        print(f"    · 不含被拦截的 AdSense / GA / CMP 第三方脚本")
        settle(page)
        page.screenshot(path=str(SHOTS / "03-index-light-1280.png"), full_page=True)

        # ---------------------------------------------------------- 移动端首页
        print("\n【首页 · 移动 360×780】")
        m, mp = new_page(browser, viewport={"width": 360, "height": 780}, device_scale_factor=2, is_mobile=True, has_touch=True)
        m_errors: list[str] = []
        mp.on("pageerror", lambda e: m_errors.append(str(e)))
        mp.goto(f"{base}/index.html", wait_until="load")

        m_overflow = mp.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        failures += not check("360px 无横向溢出", m_overflow <= 1, f"溢出 {m_overflow}px")

        # 触控目标尺寸
        small_targets = mp.evaluate(
            """() => [...document.querySelectorAll('button, .btn')]
                 .filter(el => el.offsetParent !== null)
                 .filter(el => { const r = el.getBoundingClientRect(); return r.height > 0 && r.height < 44; })
                 .map(el => el.className + ':' + Math.round(el.getBoundingClientRect().height))"""
        )
        failures += not check("按钮触控高度 ≥44px", not small_targets, str(small_targets[:4]))

        # 汉堡菜单
        mp.click("#menuToggle")
        open_state = mp.evaluate("() => document.getElementById('navLinks').dataset.open")
        locked = mp.evaluate("() => document.body.classList.contains('nav-open')")
        failures += not check("移动菜单展开并锁定滚动", open_state == "true" and locked)
        mp.screenshot(path=str(SHOTS / "04-mobile-menu.png"))

        mp.keyboard.press("Escape")
        closed = mp.evaluate("() => document.getElementById('navLinks').dataset.open")
        failures += not check("Escape 可关闭菜单", closed == "false")

        settle(mp)
        mp.screenshot(path=str(SHOTS / "05-index-mobile-360.png"), full_page=True)

        # ------------------------------------------------- 无 JS / 文章页 / 深色
        print("\n【无 JavaScript 降级】")
        nj, njp = new_page(browser, viewport={"width": 1280, "height": 900}, java_script_enabled=False)
        njp.goto(f"{base}/index.html", wait_until="load")
        nav_visible = njp.locator(".nav-links a").count()
        body_text = njp.locator("body").inner_text()
        failures += not check("无 JS 时导航链接仍在 DOM", nav_visible >= 5, f"{nav_visible} 个")
        failures += not check("无 JS 时正文可读", "为什么选择我们" in body_text and "浇水太多" in body_text)
        failures += not check("无 JS 时未启用隐藏动画类", "reveal-ready" not in njp.content())
        njp.screenshot(path=str(SHOTS / "06-index-nojs.png"), full_page=True)

        print("\n【文章页 · 桌面】")
        a, ap = new_page(browser, viewport={"width": 1280, "height": 900})
        a_errors: list[str] = []
        ap.on("pageerror", lambda e: a_errors.append(str(e)))
        ap.goto(f"{base}/watering-guide.html", wait_until="load")
        failures += not check("文章页无 JS 错误", not a_errors, str(a_errors[:2]))

        a_overflow = ap.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        failures += not check("文章页无横向溢出", a_overflow <= 1, f"溢出 {a_overflow}px")

        has_faq = ap.evaluate(
            """() => { const s = document.querySelector('script[type="application/ld+json"]');
                 return JSON.parse(s.textContent)['@graph'].some(x => x['@type'] === 'FAQPage'); }"""
        )
        failures += not check("FAQPage 结构化数据存在", has_faq)
        settle(ap)
        ap.screenshot(path=str(SHOTS / "07-article-1280.png"), full_page=True)

        # 文章页移动端表格横向滚动容器
        am, amp = new_page(browser, viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True)
        amp.goto(f"{base}/watering-guide.html", wait_until="load")
        table_scrollable = amp.evaluate(
            """() => { const w = document.querySelector('.table-scroll');
                 return w && w.scrollWidth > w.clientWidth && w.clientWidth > 0; }"""
        )
        failures += not check("表格在窄屏内可横向滚动", table_scrollable)
        settle(amp)
        amp.screenshot(path=str(SHOTS / "08-article-mobile-360.png"), full_page=True)

        # ------------------------------------------- 相关推荐不得出现自链接
        print("\n【相关推荐 · 排查自链接（v7 的 article-detail 三张卡全链向自己）】")
        ARTICLE_SLUGS = (
            "watering-guide",
            "top10-plants",
            "propagation-guide",
            "article-detail",
            "lighting-guide",
            "repotting-guide",
            "fertilizer-guide",
            "pest-article",
        )
        self_links = []
        for slug in ARTICLE_SLUGS:
            r, rp = new_page(browser, viewport={"width": 1280, "height": 900})
            rp.goto(f"{base}/{slug}.html", wait_until="load")
            hrefs = rp.eval_on_selector_all(
                ".related .card__title a", "els => els.map(e => e.getAttribute('href'))"
            )
            if not hrefs:
                self_links.append(f"{slug} 无相关推荐")
            elif f"{slug}.html" in hrefs:
                self_links.append(f"{slug} → {hrefs}")
            r.close()
        failures += not check("8 篇文章页相关推荐均存在且无自链接", not self_links, str(self_links[:2]))

        # ------------------------------------------- 植物百科：筛选 + 深链
        print("\n【植物百科 · 筛选可用性与深链展开】")
        e, ep = new_page(browser, viewport={"width": 1280, "height": 900})
        e_errors: list[str] = []
        ep.on("pageerror", lambda x: e_errors.append(str(x)))
        ep.goto(f"{base}/encyclopedia.html", wait_until="load")
        failures += not check("百科页无 JS 错误", not e_errors, str(e_errors[:2]))

        cards = ep.eval_on_selector_all(".plant-card", "els => els.length")
        failures += not check("渲染 15 张植物卡", cards == 15, str(cards))

        # v7 用 <span> + onclick，键盘完全不可达；这里必须是原生 button 且带 aria-pressed
        pills_ok = ep.evaluate(
            """() => [...document.querySelectorAll('.filter-pill')]
                 .every(el => el.tagName === 'BUTTON' && el.hasAttribute('aria-pressed'))"""
        )
        failures += not check("筛选控件为可聚焦 button[aria-pressed]", pills_ok)

        total = int(ep.text_content("#resultCount"))
        ep.click('.filter-pill[data-filter="light"]:not([data-value="all"])')
        ep.wait_for_timeout(250)
        filtered = int(ep.text_content("#resultCount"))
        visible = ep.evaluate(
            """() => [...document.querySelectorAll('.plant-card')]
                 .filter(c => c.dataset.hidden !== 'true').length"""
        )
        failures += not check(
            "筛选后计数与可见卡一致且确实收敛",
            filtered == visible and 0 < filtered < total,
            f"显示 {filtered} / 共 {total}，可见 {visible}",
        )

        hidden_now = ep.evaluate(
            """() => [...document.querySelectorAll('.plant-card')]
                 .filter(c => c.dataset.hidden === 'true').length"""
        )
        failures += not check("被筛掉的卡片以 data-hidden 隐藏（非删除）", hidden_now == total - filtered, str(hidden_now))

        # 重新点回「全部」
        ep.click('.filter-pill[data-filter="light"][data-value="all"]')
        ep.wait_for_timeout(200)
        restored = int(ep.text_content("#resultCount"))
        failures += not check("点回「全部」恢复完整列表", restored == total, f"{restored}/{total}")
        settle(ep)
        ep.screenshot(path=str(SHOTS / "09-encyclopedia-1280.png"), full_page=True)

        # 深链：从首页搜索点进来应自动展开对应植物
        ep.goto(f"{base}/encyclopedia.html#plant-pothos", wait_until="load")
        ep.wait_for_timeout(600)
        opened = ep.evaluate(
            """() => { const c = document.getElementById('plant-pothos');
                 if (!c) return 'missing'; const d = c.querySelector('details');
                 return d ? d.open : 'no-details'; }"""
        )
        failures += not check("深链 #plant-pothos 自动展开养护指南", opened is True, str(opened))

        # 窄屏百科：卡片不溢出
        em, emp = new_page(browser, viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True)
        emp.goto(f"{base}/encyclopedia.html", wait_until="load")
        em_overflow = emp.evaluate(
            "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        failures += not check("百科页 360px 无横向溢出", em_overflow <= 1, f"溢出 {em_overflow}px")
        settle(emp)
        emp.screenshot(path=str(SHOTS / "10-encyclopedia-mobile-360.png"), full_page=True)

        # ------------------------------------------- 无 JS 时百科仍可读
        print("\n【无 JavaScript · 百科与 FAQ】")
        nj2, njp2 = new_page(browser, viewport={"width": 1280, "height": 900}, java_script_enabled=False)
        njp2.goto(f"{base}/encyclopedia.html", wait_until="load")
        nj_cards = njp2.locator(".plant-card").count()
        nj_hidden = njp2.evaluate(
            """() => [...document.querySelectorAll('.plant-card')]
                 .filter(c => getComputedStyle(c).display === 'none').length"""
        )
        failures += not check("无 JS 时 15 张植物卡全部可见", nj_cards == 15 and nj_hidden == 0, f"{nj_cards} 张，隐藏 {nj_hidden}")

        details_native = njp2.evaluate(
            """() => { const d = document.querySelector('.plant-card details');
                 return d && d.tagName === 'DETAILS' && !!d.querySelector('summary'); }"""
        )
        failures += not check("养护指南用原生 details（无 JS 也能展开）", details_native)

        njp2.goto(f"{base}/contact.html", wait_until="load")
        faq_visible = njp2.locator("details.faq").count()
        failures += not check("联系页 FAQ 为原生 details（无 JS 可见）", faq_visible >= 3, f"{faq_visible} 条")

        # ------------------------------------------- 全站 15 页扫描
        print("\n【全站 15 页扫描】")
        ALL_PAGES = [
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
        bad = []
        for slug in ALL_PAGES:
            w, wp = new_page(browser, viewport={"width": 1280, "height": 900})
            werr: list[str] = []
            wp.on("pageerror", lambda x: werr.append(str(x)))
            wp.goto(f"{base}/{slug}.html", wait_until="load")
            info = wp.evaluate(
                """() => ({
                    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                    h1: document.querySelectorAll('main h1').length,
                    canonical: !!document.querySelector('link[rel="canonical"]'),
                    og: !!document.querySelector('meta[property="og:image"]'),
                    ld: (() => { const s = document.querySelector('script[type="application/ld+json"]');
                                 try { return JSON.parse(s.textContent)['@graph'].length > 0; }
                                 catch (err) { return false; } })(),
                    badImg: [...document.querySelectorAll('img')].filter(
                        i => !i.getAttribute('width') || !i.getAttribute('height')).length,
                    placeholder: /\\{\\{[a-zA-Z#]/.test(document.body.innerHTML),
                    revealLeft: [...document.querySelectorAll('.reveal')]
                        .filter(el => !el.classList.contains('is-visible')).length,
                })"""
            )
            wp.wait_for_timeout(150)
            problems = []
            if werr:
                problems.append(f"JS错误 {werr[0][:60]}")
            if info["overflow"] > 1:
                problems.append(f"溢出 {info['overflow']}px")
            if info["h1"] != 1:
                problems.append(f"h1×{info['h1']}")
            if not info["canonical"]:
                problems.append("缺 canonical")
            if not info["og"]:
                problems.append("缺 og:image")
            if not info["ld"]:
                problems.append("JSON-LD 异常")
            if info["badImg"]:
                problems.append(f"{info['badImg']} 张图缺尺寸")
            if info["placeholder"]:
                problems.append("残留未展开简码")
            if problems:
                bad.append((slug, problems))
            w.close()
        failures += not check("15 页均通过结构性检查", not bad, str(bad[:3]))

        # ------------------------------------------- 全站窄屏溢出扫描
        print("\n【全站 15 页 · 360px 无横向溢出】")
        widen = []
        for slug in ALL_PAGES:
            m2, mp2 = new_page(
                browser,
                viewport={"width": 360, "height": 780},
                is_mobile=True,
                has_touch=True,
            )
            mp2.goto(f"{base}/{slug}.html", wait_until="load")
            over = mp2.evaluate(
                """() => {
                    const de = document.documentElement;
                    const total = de.scrollWidth - de.clientWidth;
                    if (total <= 1) return total;
                    // 找出真正越界的元素，便于定位
                    const far = [...document.querySelectorAll('body *')]
                        .filter(el => el.getBoundingClientRect().right > de.clientWidth + 1)
                        .slice(0, 3)
                        .map(el => el.className || el.tagName);
                    return { total, far };
                }"""
            )
            if over != 0 and (isinstance(over, dict) or over > 1):
                widen.append((slug, over))
            m2.close()
        failures += not check("15 页在 360px 均无横向溢出", not widen, str(widen[:3]))

        # 宽表所在页：窄屏必须落在可滚动容器里，而不是撑破页面
        for slug in ("lighting-guide", "fertilizer-guide", "top10-plants", "repotting-guide"):
            m3, mp3 = new_page(
                browser,
                viewport={"width": 360, "height": 780},
                is_mobile=True,
                has_touch=True,
            )
            mp3.goto(f"{base}/{slug}.html", wait_until="load")
            ok = mp3.evaluate(
                """() => [...document.querySelectorAll('.table-scroll')].every(w => {
                    const r = w.getBoundingClientRect();
                    return r.right <= document.documentElement.clientWidth + 1 && w.clientWidth > 0;
                })"""
            )
            failures += not check(f"{slug} 宽表落在容器内（内部横向滚动）", ok)
            m3.close()

        browser.close()

    httpd.shutdown()

    # 构建产物层面的检查（不必开浏览器）
    print("\n【构建产物】")
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    failures += not check("sitemap 收录 15 条", sitemap.count("<loc>") == 15, f"{sitemap.count('<loc>')} 条")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    failures += not check(
        "robots.txt 不再屏蔽 /css/ 与 /js/",
        "/css/" not in robots and "/js/" not in robots,
        robots.splitlines()[1] if len(robots.splitlines()) > 1 else "",
    )

    index = json.loads((ROOT / "js" / "search-index.json").read_text(encoding="utf-8"))
    anchored = [item for item in index if "#" in item["url"]]
    failures += not check(
        "搜索索引 28 条且植物条目全部带锚点",
        len(index) == 28 and len(anchored) == 15,
        f"{len(index)} 条，带锚点 {len(anchored)}",
    )

    print(f"\n截图输出目录：{SHOTS}")
    print(f"结论：{'全部通过' if failures == 0 else f'{failures} 项未通过'}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
