#!/usr/bin/env node
/**
 * 绿植养护指南 · 静态站点构建脚本
 * ---------------------------------------------------------------------------
 * 零第三方依赖，只需要 Node.js（>=18）。运行：node build.mjs
 *
 * 解决的问题：v7 里导航栏（27 行）、页脚（21 行）、head 里的第三方脚本块
 * 各自被复制到 14 个 HTML 页面，改一个导航项就要手工改 14 个文件；同时每页
 * 还内联了几十到四百行 CSS，全站内联 CSS 累计 2739 行。这里把片段抽成
 * src/partials/ 下的单份文件，由本脚本拼装输出到仓库根目录，
 * GitHub Pages 的托管方式完全不变。
 *
 * 主要能力：
 *   1. 片段注入：head / navbar / footer / 内联图标雪碧图
 *   2. 页面元信息 front-matter（<!-- @meta -->）驱动 title、canonical、OG、JSON-LD
 *   3. {{picture:key|...}} 依据 assets/manifest.json 生成 <picture srcset sizes>，
 *      自动补 width/height（v7 里 64 张图片 100% 缺失尺寸属性，CLS 必然超标）
 *   4. {{icon:name}} 生成对雪碧图的引用
 *   5. 区块由数据生成，杜绝手写副本走形：
 *        {{plants}}            植物百科 15 张卡片（src/data/plants.json）
 *        {{articles}}          文章列表（src/data/pages.json）
 *        {{related:<id>}}      相关推荐 3 张卡（自动排除当前页，修掉 v7 的自链接）
 *        {{faq:<id>}}          可见 FAQ（原生 <details>），与 JSON-LD 的 FAQPage 同源
 *        {{ad}}                广告位，统一预留高度 + 官方 push 调用
 *        {{breadcrumb}}        面包屑，与 JSON-LD 的 BreadcrumbList 对应
 *   6. 由 src/data/{pages,plants,faq}.json 生成 js/search-index.json —— 单一数据源，
 *      避免 v7 中「搜索索引」与「百科页面」两份手写清单不同步
 *   7. 生成 sitemap.xml 与 robots.txt
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');

/* ----------------------------------------------------------------- 工具函数 */

const read = (path) => readFile(path, 'utf8');

/** 从 JSON 字符串中剥离行注释和块注释（尊重字符串边界）。 */
function stripJsonComments(str) {
  let result = '';
  let inString = false;
  let escape = false;
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (escape) {
      result += ch;
      escape = false;
      i++;
      continue;
    }
    if (inString) {
      if (ch === '\\') {
        result += ch;
        escape = true;
        i++;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      result += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      result += ch;
      i++;
      continue;
    }
    if (ch === '/' && str[i + 1] === '/') {
      // 行注释
      while (i < str.length && str[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && str[i + 1] === '*') {
      // 块注释
      i += 2;
      while (i < str.length && !(str[i] === '*' && str[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    result += ch;
    i++;
  }
  return result;
}

const readJSON = async (path) => JSON.parse(stripJsonComments(await read(path)));

/** JSON 内联到 <script> 时转义 `<`，避免内容里出现 </script> 破坏文档。 */
const jsonForScript = (value) => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');

const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** 替代模板里形如 {{KEY}} 的占位符。未提供的占位符会被清空。 */
function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '');
}

/** 2026-06-12 → 2026年6月12日 */
function dateZh(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

/** 缩进一段多行 HTML。 */
const indent = (html, spaces) =>
  html
    .split('\n')
    .map((line) => (line.trim() ? ' '.repeat(spaces) + line : line))
    .join('\n');

/* --------------------------------------------------------------- 页面元信息 */

/**
 * 解析页面开头的 front-matter：
 *   <!-- @meta
 *   title: ...
 *   description: ...
 *   -->
 * 支持 `key: value` 与 `key: [a, b, c]` 两种形式（后者用于 keywords、faq 等）。
 */
function parseMeta(source) {
  const match = source.match(/^\s*<!--\s*@meta([\s\S]*?)-->\s*/);
  if (!match) return { meta: {}, body: source };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    meta[key] = value;
  }

  return { meta, body: source.slice(match[0].length) };
}

/* --------------------------------------------------------------- 图片短代码 */

/**
 * {{picture:card-watering | sizes=(max-width:768px) 100vw, 300px | alt=... | lazy=1 | class=card__img}}
 * 依据 assets/manifest.json 生成 <picture>，自动带 srcset、sizes、width/height。
 */
function renderPicture(argument, manifest, position = 0) {
  const parts = argument.split('|').map((part) => part.trim());
  const key = parts[0];
  const entry = manifest[key];

  if (!entry) {
    console.warn(`  ! 图片清单缺少 "${key}"，跳过 srcset 生成`);
    return '';
  }

  const options = {};
  for (const part of parts.slice(1)) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    options[part.slice(0, separator).trim()] = part.slice(separator + 1).trim();
  }

  const sizes = options.sizes || '100vw';
  const lazy = options.lazy !== '0';
  const className = options.class ? ` class="${escapeAttr(options.class)}"` : '';
  const alt = escapeAttr(options.alt || '');

  const widths = Object.keys(entry.webp)
    .map(Number)
    .sort((a, b) => a - b);
  if (widths.length === 0) return '';

  const srcset = (format) =>
    widths.map((width) => `${entry[format][String(width)]} ${width}w`).join(', ');

  const largest = widths.at(-1);
  const height = Math.round((largest * entry.intrinsic.height) / entry.intrinsic.width);

  // LCP 图（lazy=0）抬高优先级；其余延迟加载。position 只在同页出现多张 LCP 图时区分。
  const meta = lazy
    ? ' loading="lazy" decoding="async"'
    : ` fetchpriority="high" decoding="async"${position ? ` data-priority="${position}"` : ''}`;

  const pad = ' '.repeat(0);
  return [
    `${pad}<picture>`,
    `${pad}  <source type="image/avif" srcset="${srcset('avif')}" sizes="${escapeAttr(sizes)}">`,
    `${pad}  <source type="image/webp" srcset="${srcset('webp')}" sizes="${escapeAttr(sizes)}">`,
    `${pad}  <img src="${entry.jpeg[String(largest)]}" srcset="${srcset('jpeg')}" sizes="${escapeAttr(
      sizes
    )}" width="${largest}" height="${height}" alt="${alt}"${className}${meta}>`,
    `${pad}</picture>`,
  ].join('\n');
}

/* ------------------------------------------------------------- 区块生成器 */

/** 广告位：统一预留高度（.ad 的 min-height）+ AdSense 官方 push 调用。
 *  v7 每个广告位后面都跟着一句 push；写成简码后不会漏。 */
function renderAd(site) {
  return `<div class="container">
  <aside class="ad" aria-label="广告">
    <p class="ad__label">广告</p>
    <ins class="adsbygoogle" style="display:block" data-ad-client="${escapeAttr(
      site.adsense
    )}" data-ad-format="auto" data-full-width-responsive="true"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  </aside>
</div>`;
}

/** 面包屑（与 JSON-LD 的 BreadcrumbList 对应，同时给用户一个返回入口）。 */
function renderBreadcrumb(page, site) {
  const trail = [{ label: '首页', href: 'index.html' }];
  if (page.kind === 'article') trail.push({ label: '全部文章', href: 'articles.html' });
  if (page.kind === 'category') {
    trail.push({ label: '植物百科', href: 'encyclopedia.html' });
    if (page.level === 2 && page.parentName) {
      trail.push({ label: page.parentName, href: `category-${page.parentSlug}.html` });
    }
  }
  if (page.id !== 'home') trail.push({ label: page.crumb || page.title, href: null });

  const items = trail
    .map((item, index) => {
      const last = index === trail.length - 1;
      if (item.href && !last) return `<li><a href="${item.href}">${item.label}</a></li>`;
      return `<li><span aria-current="page">${item.label}</span></li>`;
    })
    .join('\n        ');

  return `<nav class="breadcrumb" aria-label="面包屑">
      <div class="container container--prose">
        <ol>
        ${items}
        </ol>
      </div>
    </nav>`;
}

/** 筛选栏：维度取值直接从 plants.json 里按出现顺序收集，
 *  避免出现「数据里加了新功能，筛选按钮却忘了加」的静默走形。 */
const FILTER_GROUPS = [
  { key: 'light', label: '光照需求', field: 'light' },
  { key: 'diff', label: '养护难度', field: 'difficulty' },
  { key: 'func', label: '植物功能', field: 'function' },
];

function renderFilters(plants) {
  return FILTER_GROUPS.map((group) => {
    const values = [...new Set(plants.map((plant) => plant[group.field]))].filter(Boolean);
    const pills = ['all', ...values]
      .map((value) => {
        const active = value === 'all';
        return `<button type="button" class="filter-pill" data-filter="${group.key}" data-value="${escapeAttr(
          value
        )}" aria-pressed="${active}">${active ? '全部' : escapeAttr(value)}</button>`;
      })
      .join('\n          ');

    return `<div class="filter-group" role="group" aria-label="${group.label}">
        <span class="filter-label" aria-hidden="true">${group.label}</span>
        <div class="filter-pills">
          ${pills}
        </div>
      </div>`;
  }).join('\n\n      ');
}

/** 文章列表（articles.html）：由 pages.json 生成，按日期倒序。
 *  v7 是手写 10 条，其中 2 条指向了错误的页面（龟背竹/多肉都链到 article-detail）。 */
function renderArticleList(pages, manifest) {
  const articles = pages
    .filter((page) => page.kind === 'article' && page.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return articles
    .map((page) => {
      const picture = renderPicture(
        `${page.image}|sizes=(max-width:768px) 92vw, 200px|alt=${page.imageAlt || page.title}`,
        manifest
      );
      return `<article class="article-item">
        <a class="article-item__thumb" href="${page.file}" tabindex="-1" aria-hidden="true">
          ${indent(picture, 10).trimStart()}
        </a>
        <div class="article-item__body">
          <h3 class="article-item__title"><a href="${page.file}">${page.title}</a></h3>
          <p class="article-item__excerpt">${page.description}</p>
          <div class="article-item__meta">
            <span><time datetime="${page.date}">${dateZh(page.date)}</time></span>
            <span>阅读 ${page.read || 5} 分钟</span>
          </div>
        </div>
      </article>`;
    })
    .join('\n\n')
    .split('\n')
    .map((line) => (line ? `      ${line}` : line))
    .join('\n');
}

/** 植物百科卡片：由 plants.json 生成，避免 15 段结构手写不同步。
 *  展开用原生 <details>，无 JS 也能看；原站是 innerHTML + 内联 onclick。
 *  id 用 plant.id，搜索深链 encyclopedia.html#plant-pothos 直接命中。 */
function renderPlantCards(plants, manifest) {
  return plants
    .map((plant) => {
      const key = plant.image.replace(/^assets\//, '');
      const picture = renderPicture(
        `${key}|sizes=(max-width:560px) 92vw, (max-width:900px) 45vw, 340px|alt=${plant.nameZh}`,
        manifest
      );
      const care = Object.entries(plant.care)
        .map(([label, value]) => `<div><strong>${label}：</strong>${value}</div>`)
        .join('\n                ');

      return `<article class="plant-card" id="${plant.id}" data-light="${escapeAttr(
        plant.light
      )}" data-diff="${escapeAttr(plant.difficulty)}" data-func="${escapeAttr(plant.function)}">
        <div class="plant-card__media">
          ${indent(picture, 10).trimStart()}
        </div>
        <div class="plant-card__body">
          <h3 class="plant-card__name">${plant.nameZh}</h3>
          <p class="plant-card__latin">${plant.nameLa}</p>
          <div class="plant-tags">
            <span class="tag-light">${plant.light}</span>
            <span>${plant.difficulty}</span>
            <span>${plant.function}</span>
          </div>
          <p class="plant-card__desc">${plant.summary}</p>
          <details class="plant-card__more">
            <summary class="plant-card__toggle">查看养护指南</summary>
            <div class="plant-detail">
              <div class="detail-grid">
                ${care}
              </div>
              <h4>常见问题</h4>
              <p>${plant.faq}</p>
              <h4>养护小贴士</h4>
              <p>${plant.tips}</p>
            </div>
          </details>
        </div>
      </article>`;
    })
    .join('\n\n')
    .split('\n')
    .map((line) => (line ? `        ${line}` : line))
    .join('\n');
}

/** 植物推荐卡片：根据植物 ID 列表生成推荐卡片，链接到植物百科锚点。
 *  用于文章底部展示与内容相关的植物，引导用户浏览百科。 */
function renderRelatedPlants(plantIds, plants, manifest) {
  const ids = plantIds.split(',').map((s) => s.trim());
  const picked = ids
    .map((id) => plants.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 3);

  if (picked.length === 0) return '';

  const cards = picked
    .map((plant) => {
      const key = plant.image.replace(/^assets\//, '');
      const picture = renderPicture(
        `${key}|sizes=(max-width:560px) 92vw, (max-width:900px) 45vw, 300px|alt=${plant.nameZh}`,
        manifest
      );
      return `<article class="card">
        <a class="card__media" href="encyclopedia.html#${plant.id}" tabindex="-1" aria-hidden="true">
          ${indent(picture, 10).trimStart()}
        </a>
        <div class="card__body">
          <span class="card__tag">${plant.function} · ${plant.difficulty}</span>
          <h3 class="card__title"><a href="encyclopedia.html#${plant.id}">${plant.nameZh}</a></h3>
          <p class="card__text">${plant.summary}</p>
        </div>
      </article>`;
    })
    .join('\n\n')
    .split('\n')
    .map((line) => (line ? `          ${line}` : line))
    .join('\n');

  return `<section class="related">
    <div class="container">
      <h2>相关植物</h2>
      <div class="card-grid">
${cards}
      </div>
    </div>
  </section>`;
}

/** 相关推荐：从 pages.json 里挑同栏目、优先级高的 3 篇，自动排除当前页。
 *  v7 的 article-detail 相关推荐 3 张卡全部链接到自己（自链接死循环）。 */
function renderRelated(currentId, pages, manifest) {
  const current = pages.find((page) => page.id === currentId);
  const pool = pages.filter((page) => page.kind === 'article' && page.id !== currentId);
  const rank = (page) => (page.active === current?.active ? 0 : 1);

  const picked = pool
    .sort(
      (a, b) =>
        rank(a) - rank(b) || (b.priority || 0) - (a.priority || 0) || (a.date < b.date ? 1 : -1)
    )
    .slice(0, 3);

  const cards = picked
    .map((page) => {
      const picture = renderPicture(
        `${page.image}|sizes=(max-width:560px) 92vw, (max-width:900px) 45vw, 300px|alt=${
          page.imageAlt || page.title
        }`,
        manifest
      );
      return `<article class="card">
        <a class="card__media" href="${page.file}" tabindex="-1" aria-hidden="true">
          ${indent(picture, 10).trimStart()}
        </a>
        <div class="card__body">
          <span class="card__tag">${page.crumb || page.title}</span>
          <h3 class="card__title"><a href="${page.file}">${page.title}</a></h3>
          <p class="card__text">${page.description}</p>
        </div>
      </article>`;
    })
    .join('\n\n')
    .split('\n')
    .map((line) => (line ? `          ${line}` : line))
    .join('\n');

  return `<section class="related">
    <div class="container">
      <h2>相关推荐</h2>
      <div class="card-grid">
        ${cards}
      </div>
    </div>
  </section>`;
}

/** 可见 FAQ：用原生 <details>/<summary>，零 JS、键盘可达、可折叠。
 *  FAQPage 结构化数据要求问答在本页可见，所以这份渲染是必需项而非可选装饰。 */
function renderFaq(items) {
  if (!items?.length) return '';

  const list = items
    .map(
      (item) => `<details class="faq">
          <summary class="faq__q">${item.q}</summary>
          <div class="faq__a"><p>${item.a}</p></div>
        </details>`
    )
    .join('\n        ');

  return `<section class="faq-section">
    <div class="container container--prose">
      <h2>常见问题</h2>
      <div class="faq-list">
        ${list}
      </div>
    </div>
  </section>`;
}

/* -------------------------------------------------------------- 分类系统 */

/** 根据 id 查找分类 */
function findCategory(categories, id) {
  return categories.find((c) => c.id === id);
}

/** 获取某个一级分类下的所有二级分类（按 order 排序） */
function getSubcategories(categories, parentId) {
  return categories
    .filter((c) => c.level === 2 && c.parent === parentId)
    .sort((a, b) => a.order - b.order);
}

/** 获取某个分类下的植物（一级分类包含所有子类植物，二级只含自身） */
function getPlantsInCategory(plants, categoryId) {
  return plants.filter((plant) => plant.categories?.includes(categoryId));
}

/** 获取某个分类相关的文章（按日期倒序） */
function getArticlesInCategory(pages, categoryId) {
  return pages
    .filter((page) => page.kind === 'article' && page.categories?.includes(categoryId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 一级分类页的子分类横向标签条 */
function renderCategorySubcats(category, categories) {
  if (category.level !== 1) return '';
  const subcats = getSubcategories(categories, category.id);
  if (subcats.length === 0) return '';

  const tabs = subcats
    .map(
      (sub) =>
        `<a href="category-${sub.slug}.html" class="subcat-tab">${sub.name}</a>`
    )
    .join('\n          ');

  return `<section class="subcat-bar">
      <div class="container">
        <div class="subcat-tabs">
          <a href="category-${category.slug}.html" class="subcat-tab subcat-tab--active">全部</a>
          ${tabs}
        </div>
      </div>
    </section>`;
}

/** 首页分类卡片（6个一级分类，3列 x 2行） */
function renderCategoryCards(categories, plants, manifest) {
  const level1 = categories
    .filter((c) => c.level === 1)
    .sort((a, b) => a.order - b.order);

  return level1
    .map((cat) => {
      const count = getPlantsInCategory(plants, cat.id).length;
      const picture = renderPicture(
        `${cat.image}|sizes=(max-width:560px) 92vw, (max-width:900px) 45vw, 300px|alt=${cat.imageAlt || cat.name}`,
        manifest
      );
      return `<article class="category-card">
          <a class="category-card__media" href="category-${cat.slug}.html" tabindex="-1" aria-hidden="true">
            ${indent(picture, 12).trimStart()}
          </a>
          <div class="category-card__body">
            <div class="category-card__icon">
              <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${cat.icon}"></use></svg>
            </div>
            <h3 class="category-card__name"><a href="category-${cat.slug}.html">${cat.name}</a></h3>
            <p class="category-card__count">${count} 种植物</p>
          </div>
        </article>`;
    })
    .join('\n\n')
    .split('\n')
    .map((line) => (line ? `      ${line}` : line))
    .join('\n');
}

/** 文章卡片列表（仅卡片元素，用于分类页等自定义容器） */
function renderArticleCardList(articles, manifest) {
  if (articles.length === 0) return '<p class="empty-hint">暂无相关文章</p>';

  return articles
    .map((page) => {
      const picture = renderPicture(
        `${page.image}|sizes=(max-width:560px) 92vw, (max-width:900px) 45vw, 300px|alt=${
          page.imageAlt || page.title
        }`,
        manifest
      );
      return `<article class="card">
          <a class="card__media" href="${page.file}" tabindex="-1" aria-hidden="true">
            ${indent(picture, 12).trimStart()}
          </a>
          <div class="card__body">
            <span class="card__tag">${page.crumb || page.title}</span>
            <h3 class="card__title"><a href="${page.file}">${page.title}</a></h3>
            <p class="card__text">${page.description}</p>
          </div>
        </article>`;
    })
    .join('\n\n')
    .split('\n')
    .map((line) => (line ? `      ${line}` : line))
    .join('\n');
}

/** 导航栏「植物分类」下拉菜单（两列布局） */
function renderNavDropdown(categories) {
  const level1 = categories
    .filter((c) => c.level === 1)
    .sort((a, b) => a.order - b.order);

  const half = Math.ceil(level1.length / 2);
  const col1 = level1.slice(0, half);
  const col2 = level1.slice(half);

  const renderCol = (items) =>
    items
      .map((cat) => `<li><a href="category-${cat.slug}.html">${cat.name}</a></li>`)
      .join('\n              ');

  return `      <li class="nav-dropdown">
        <button type="button" class="nav-dropdown__toggle" aria-expanded="false" aria-haspopup="true">
          植物分类
          <svg class="icon icon--chevron" aria-hidden="true"><use href="#i-chevron-down"></use></svg>
        </button>
        <div class="nav-dropdown__menu" role="menu">
          <div class="nav-dropdown__cols">
            <ul>
              ${renderCol(col1)}
            </ul>
            <ul>
              ${renderCol(col2)}
            </ul>
          </div>
        </div>
      </li>`;
}

/** 页脚分类链接列 */
function renderFooterCatLinks(categories) {
  const level1 = categories
    .filter((c) => c.level === 1)
    .sort((a, b) => a.order - b.order);

  const links = level1
    .map((cat) => `          <li><a href="category-${cat.slug}.html">${cat.name}</a></li>`)
    .join('\n');

  return `      <div>
        <p class="footer__title">植物分类</p>
        <ul class="footer__links">
${links}
        </ul>
      </div>`;
}

/* ------------------------------------------------------------------- JSON-LD */

function buildJsonLd({ meta, page, site, canonical, manifest }) {
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: site.lang,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/articles.html?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: { '@type': 'ImageObject', url: `${site.url}/assets/favicon.svg` },
    },
  ];

  if (meta.kind === 'article') {
    graph.push({
      '@type': 'Article',
      '@id': `${canonical}#article`,
      headline: meta.title,
      description: meta.description,
      inLanguage: site.lang,
      datePublished: meta.date,
      dateModified: meta.updated || meta.date,
      author: { '@type': 'Organization', name: site.name },
      publisher: { '@id': `${site.url}/#organization` },
      isPartOf: { '@id': `${site.url}/#website` },
      mainEntityOfPage: canonical,
      image: meta.image ? `${site.url}/${manifestSource(meta.image, manifest)}` : undefined,
    });
  }

  if (meta.faq) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: meta.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  graph.push({
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement:
      page.id === 'home'
        ? [{ '@type': 'ListItem', position: 1, name: '首页', item: `${site.url}/` }]
        : page.kind === 'article'
          ? [
              { '@type': 'ListItem', position: 1, name: '首页', item: `${site.url}/` },
              {
                '@type': 'ListItem',
                position: 2,
                name: '全部文章',
                item: `${site.url}/articles.html`,
              },
              { '@type': 'ListItem', position: 3, name: page.crumb || page.title, item: canonical },
            ]
          : page.kind === 'category'
            ? page.level === 1
              ? [
                  { '@type': 'ListItem', position: 1, name: '首页', item: `${site.url}/` },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: '植物百科',
                    item: `${site.url}/encyclopedia.html`,
                  },
                  { '@type': 'ListItem', position: 3, name: page.crumb || page.title, item: canonical },
                ]
              : [
                  { '@type': 'ListItem', position: 1, name: '首页', item: `${site.url}/` },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: '植物百科',
                    item: `${site.url}/encyclopedia.html`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: page.parentName || '',
                    item: `${site.url}/category-${page.parentSlug || ''}.html`,
                  },
                  { '@type': 'ListItem', position: 4, name: page.crumb || page.title, item: canonical },
                ]
            : [
                { '@type': 'ListItem', position: 1, name: '首页', item: `${site.url}/` },
                { '@type': 'ListItem', position: 2, name: page.crumb || page.title, item: canonical },
              ],
  });

  return `<script type="application/ld+json">\n${jsonForScript({
    '@context': 'https://schema.org',
    '@graph': graph,
  })}\n</script>`;
}

/** 从清单键还原一个可用于 OG 图的绝对路径。 */
function manifestSource(key, manifest) {
  const entry = manifest[key];
  if (!entry) return 'assets/hero-960.jpg';
  const widths = Object.keys(entry.jpeg).map(Number).sort((a, b) => a - b);
  return entry.jpeg[String(widths.at(-1))];
}

/* --------------------------------------------------------------- 短代码展开 */

/**
 * 展开正文里的全部简码。顺序很重要：
 *   1. 区块（plants / articles / related / faq / ad / breadcrumb）—— 内部会自己调 renderPicture
 *   2. {{KEY}} 站点级占位符（SITE_URL、CONTACT_ENDPOINT…）
 *   3. {{picture:...}}、{{icon:...}} —— 兜住第 1 步生成内容里可能残留的书写
 */
function renderShortcodes(html, ctx) {
  const { manifest, pages, plants, faq, page, site, partials, categories } = ctx;

  let out = html
    .replace(/\{\{articleHeader\}\}/g, () =>
      fill(partials.articleHeader, {
        PAGE_TAG: page.crumb || '',
        PAGE_TITLE: page.title,
        PAGE_AUTHOR: page.author || site.author,
        PAGE_DATE: page.date || '',
        PAGE_DATE_ZH: dateZh(page.date),
        PAGE_READ: String(page.read || 5),
      })
    )
    .replace(/\{\{plants\}\}/g, () => renderPlantCards(plants, manifest))
    .replace(/\{\{filters\}\}/g, () => renderFilters(plants))
    .replace(/\{\{CATEGORY_CARDS\}\}/g, () =>
      categories ? renderCategoryCards(categories, plants, manifest) : ''
    )
    .replace(/\{\{articles\}\}/g, () => renderArticleList(pages, manifest))
    .replace(/\{\{related:([a-z0-9-]+)\}\}/g, (_, id) => renderRelated(id, pages, manifest))
    .replace(/\{\{relatedPlants:([^}]+)\}\}/g, (_, ids) => renderRelatedPlants(ids, plants, manifest))
    .replace(/\{\{faq:([a-z0-9-]+)\}\}/g, (_, id) => renderFaq(faq[id]))
    .replace(/\{\{ad\}\}/g, () => renderAd(site))
    .replace(/\{\{breadcrumb\}\}/g, () => renderBreadcrumb(page, site));

  out = fill(out, {
    SITE_URL: site.url,
    SITE_NAME: site.name,
    SITE_EMAIL: site.email || '',
    CONTACT_ENDPOINT: site.contactEndpoint || '',
    ADSENSE: site.adsense,
    YEAR: String(new Date().getFullYear()),
    PLANT_COUNT: String(plants.length),
    ARTICLE_COUNT: String(pages.filter((item) => item.kind === 'article').length),
  });

  out = out
    .replace(/\{\{picture:([^}]+)\}\}/g, (_, argument) => renderPicture(argument, manifest))
    .replace(
      /\{\{icon:([a-z0-9-]+)(?:\|([^}]*))?\}\}/g,
      (_, name, extra) =>
        `<svg class="icon${extra ? ` ${extra}` : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`
    );

  return out;
}

/* ------------------------------------------------------------------ 片段拼装 */

function renderNavLinks(site, activeId, categories) {
  const items = site.nav
    .map((item) => {
      const current = item.id === activeId ? ' aria-current="page"' : '';
      return `      <li><a href="${item.href}"${current}>${item.label}</a></li>`;
    })
    .join('\n');

  // 在「植物百科」之后插入植物分类下拉菜单
  if (categories && categories.length) {
    const dropdown = renderNavDropdown(categories);
    const encyclopediaItem = `      <li><a href="encyclopedia.html"`;
    if (items.includes(encyclopediaItem)) {
      // 找到 encyclopedia 那一行并在其后插入 dropdown
      const lines = items.split('\n');
      const insertIdx = lines.findIndex((l) => l.includes('encyclopedia.html'));
      if (insertIdx !== -1) {
        lines.splice(insertIdx + 1, 0, dropdown);
        return lines.join('\n');
      }
    }
    return items + '\n' + dropdown;
  }

  return items;
}

function renderFooterColumns(site) {
  return site.footer.columns
    .map((column) => {
      const links = column.links
        .map((link) => `          <li><a href="${link.href}">${link.label}</a></li>`)
        .join('\n');
      return `      <div>\n        <p class="footer__title">${column.title}</p>\n        <ul class="footer__links">\n${links}\n        </ul>\n      </div>`;
    })
    .join('\n');
}

/* ---------------------------------------------------------------------- 主流程 */

async function main() {
  const site = await readJSON(join(SRC, 'data', 'site.json'));
  const pages = await readJSON(join(SRC, 'data', 'pages.json'));
  const plants = await readJSON(join(SRC, 'data', 'plants.json'));
  const faq = existsSync(join(SRC, 'data', 'faq.json'))
    ? await readJSON(join(SRC, 'data', 'faq.json'))
    : {};
  const categories = existsSync(join(SRC, 'data', 'categories.json'))
    ? await readJSON(join(SRC, 'data', 'categories.json'))
    : [];
  const manifest = await readJSON(join(ROOT, 'assets', 'manifest.json'));

  const partials = {
    head: await read(join(SRC, 'partials', 'head.html')),
    navbar: await read(join(SRC, 'partials', 'navbar.html')),
    footer: await read(join(SRC, 'partials', 'footer.html')),
    icons: await read(join(SRC, 'partials', 'icons.svg')),
    articleHeader: await read(join(SRC, 'partials', 'article-header.html')),
  };

  const pageFiles = existsSync(join(SRC, 'pages')) ? await readdir(join(SRC, 'pages')) : [];
  const sources = pageFiles
    .filter((name) => name.endsWith('.html') && name !== 'category.html')
    .sort();

  console.log(`构建 ${sources.length} 个页面（页面注册表共 ${pages.length} 项）\n`);

  const built = [];
  const missing = pages.filter((page) => !sources.includes(page.file));

  for (const filename of sources) {
    const raw = await read(join(SRC, 'pages', filename));
    const { meta, body } = parseMeta(raw);

    const page = pages.find((item) => item.file === filename);
    if (!page) {
      console.warn(`  ! ${filename} 不在 src/data/pages.json 注册表里，跳过`);
      continue;
    }

    const merged = { ...page, ...meta };
    if (faq[merged.id]) merged.faq = faq[merged.id];

    const canonical = merged.id === 'home' ? `${site.url}/` : `${site.url}/${merged.file}`;
    const ogImageKey = merged.image || 'hero';
    const ogEntry = manifest[ogImageKey];
    const ogImage = `${site.url}/${manifestSource(ogImageKey, manifest)}`;

    // 首屏 LCP 图：预加载并抬高优先级
    const preload =
      merged.image && merged.lazy === '0' && ogEntry
        ? `<link rel="preload" as="image" imagesrcset="${Object.keys(ogEntry.webp)
            .map(Number)
            .sort((a, b) => a - b)
            .map((width) => `${ogEntry.webp[String(width)]} ${width}w`)
            .join(', ')}" imagesizes="100vw" type="image/webp">`
        : '';

    const skipLink = '<a class="skip-link" href="#main">跳到主要内容</a>';

    const head = fill(partials.head, {
      LANG: site.lang,
      TITLE: merged.fullTitle ? merged.title : `${merged.title} - ${site.name}`,
      DESCRIPTION: merged.description,
      THEME_COLOR: site.themeColor,
      CANONICAL: canonical,
      SITE_NAME: site.name,
      OG_TYPE: merged.kind === 'article' ? 'article' : 'website',
      OG_IMAGE: ogImage,
      OG_IMAGE_W: ogEntry?.intrinsic.width ?? 1368,
      OG_IMAGE_H: ogEntry?.intrinsic.height ?? 768,
      TWITTER_CARD: site.twitter,
      ADSENSE: site.adsense,
      GA4: site.ga4,
      PRELOAD: preload,
      JSONLD: buildJsonLd({ meta: merged, page: merged, site, canonical, manifest }),
      SKIP_LINK: skipLink,
      ICONS: partials.icons,
      HEAD_EXTRA: merged.headExtra || '',
    });

    const navbar = fill(partials.navbar, {
      SITE_NAME: site.name,
      NAV_LINKS: renderNavLinks(site, merged.active, categories),
    });

    const footer = fill(partials.footer, {
      SITE_NAME: site.name,
      FOOTER_DESC: site.footer.brandDesc,
      FOOTER_COLUMNS: renderFooterColumns(site),
      FOOTER_CAT_LINKS: categories.length ? renderFooterCatLinks(categories) : '',
      SITE_EMAIL: site.email || '',
      YEAR: new Date().getFullYear(),
    });

    const content = renderShortcodes(body.trim(), {
      manifest,
      pages,
      plants,
      faq,
      page: merged,
      site,
      partials,
      categories,
    });

    const bodyAttrs = [
      merged.kind ? `data-page-kind="${merged.kind}"` : '',
      merged.id ? `data-page="${merged.id}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const html = [
      head,
      navbar,
      '<main id="main">',
      content,
      '</main>',
      footer,
      '<script type="module" src="js/app.js"></script>',
      '</body>',
      '</html>',
      '',
    ]
      .join('\n')
      .replace('<body>', `<body ${bodyAttrs}>`);

    await writeFile(join(ROOT, filename), html, 'utf8');
    const size = Buffer.byteLength(html, 'utf8');
    built.push({ file: filename, size });
    console.log(`  ✓ ${filename.padEnd(26)} ${(size / 1024).toFixed(1)} KB`);
  }

  /* ------------------------------------------------------- 分类页面生成 */

  const catTemplate = existsSync(join(SRC, 'pages', 'category.html'))
    ? await read(join(SRC, 'pages', 'category.html'))
    : null;

  if (catTemplate && categories.length) {
    const { meta: catMeta, body: catBody } = parseMeta(catTemplate);
    const levelCats = categories.filter((c) => c.level === 1 || c.level === 2);
    console.log(`\n生成 ${levelCats.length} 个分类页面（${categories.filter((c) => c.level === 1).length} 个一级 + ${categories.filter((c) => c.level === 2).length} 个二级）\n`);

    for (const cat of levelCats) {
      const catPlants = getPlantsInCategory(plants, cat.id);
      const catArticles = getArticlesInCategory(pages, cat.id);
      const parentCat = cat.parent ? findCategory(categories, cat.parent) : null;

      const catPage = {
        id: `cat-${cat.id}`,
        file: `category-${cat.slug}.html`,
        title: `${cat.name} - 植物分类`,
        description: cat.description,
        kind: 'category',
        active: 'encyclopedia',
        icon: cat.icon,
        crumb: cat.name,
        level: cat.level,
        parent: cat.parent,
        parentName: parentCat?.name || '',
        parentSlug: parentCat?.slug || '',
        priority: cat.level === 1 ? 0.7 : 0.5,
        image: cat.image,
        imageAlt: cat.imageAlt || cat.name,
      };

      const merged = { ...catPage, ...catMeta };

      const canonical = `${site.url}/${catPage.file}`;
      const ogImageKey = cat.image || 'hero';
      const ogEntry = manifest[ogImageKey];
      const ogImage = `${site.url}/${manifestSource(ogImageKey, manifest)}`;

      const preload = '';
      const skipLink = '<a class="skip-link" href="#main">跳到主要内容</a>';

      const head = fill(partials.head, {
        LANG: site.lang,
        TITLE: `${cat.name} - 植物分类 - ${site.name}`,
        DESCRIPTION: cat.description,
        THEME_COLOR: site.themeColor,
        CANONICAL: canonical,
        SITE_NAME: site.name,
        OG_TYPE: 'website',
        OG_IMAGE: ogImage,
        OG_IMAGE_W: ogEntry?.intrinsic.width ?? 1368,
        OG_IMAGE_H: ogEntry?.intrinsic.height ?? 768,
        TWITTER_CARD: site.twitter,
        ADSENSE: site.adsense,
        GA4: site.ga4,
        PRELOAD: preload,
        JSONLD: buildJsonLd({ meta: merged, page: catPage, site, canonical, manifest }),
        SKIP_LINK: skipLink,
        ICONS: partials.icons,
        HEAD_EXTRA: '',
      });

      const navbar = fill(partials.navbar, {
        SITE_NAME: site.name,
        NAV_LINKS: renderNavLinks(site, catPage.active, categories),
      });

      const footer = fill(partials.footer, {
        SITE_NAME: site.name,
        FOOTER_DESC: site.footer.brandDesc,
        FOOTER_COLUMNS: renderFooterColumns(site),
        FOOTER_CAT_LINKS: categories.length ? renderFooterCatLinks(categories) : '',
        SITE_EMAIL: site.email || '',
        YEAR: new Date().getFullYear(),
      });

      // 先填充分类特有的占位符（只用定向替换，避免清空其他短代码）
      let catContent = catBody
        .trim()
        .replace(/\{\{CATEGORY_NAME\}\}/g, cat.name)
        .replace(/\{\{CATEGORY_DESCRIPTION\}\}/g, cat.description)
        .replace(/\{\{CATEGORY_PLANT_COUNT\}\}/g, String(catPlants.length))
        .replace(/\{\{CATEGORY_ARTICLE_COUNT\}\}/g, String(catArticles.length))
        .replace(/\{\{CATEGORY_SUBCATS\}\}/g, renderCategorySubcats(cat, categories))
        .replace(/\{\{CATEGORY_PLANTS\}\}/g, renderPlantCards(catPlants, manifest))
        .replace(
          /\{\{CATEGORY_ARTICLES\}\}/g,
          renderArticleCardList(catArticles.slice(0, 6), manifest)
        );

      // 再展开通用短代码
      catContent = renderShortcodes(catContent, {
        manifest,
        pages,
        plants,
        faq,
        page: catPage,
        site,
        partials,
        categories,
      });

      const bodyAttrs = [
        `data-page-kind="category"`,
        `data-page="${catPage.id}"`,
      ].join(' ');

      const html = [
        head,
        navbar,
        '<main id="main">',
        catContent,
        '</main>',
        footer,
        '<script type="module" src="js/app.js"></script>',
        '</body>',
        '</html>',
        '',
      ]
        .join('\n')
        .replace('<body>', `<body ${bodyAttrs}>`);

      await writeFile(join(ROOT, catPage.file), html, 'utf8');
      const size = Buffer.byteLength(html, 'utf8');
      built.push({ file: catPage.file, size });
      console.log(`  ✓ ${catPage.file.padEnd(26)} ${(size / 1024).toFixed(1)} KB`);
    }
  }

  /* --------------------------------------------------- 搜索索引（单一数据源） */

  const index = [];

  for (const plant of plants) {
    index.push({
      title: plant.nameZh,
      sub: `植物 · ${plant.light} · ${plant.difficulty} · ${plant.function}`,
      url: `encyclopedia.html#${plant.id}`,
      icon: plant.icon || 'leaf',
      keywords: [plant.nameZh, plant.nameLa, ...(plant.aliases || [])].join(' '),
    });
  }

  for (const page of pages) {
    if (page.omitFromSearch) continue;
    index.push({
      title: page.searchTitle || page.title,
      sub: page.sub,
      url: page.id === 'home' ? 'index.html' : page.file,
      icon: page.icon || 'book',
      keywords: (page.keywords || []).join(' '),
    });
  }

  // 分类页面加入搜索索引
  for (const cat of categories) {
    if (cat.level === 0) continue; // 跳过功能标签
    index.push({
      title: cat.name,
      sub: cat.level === 1 ? '分类 · 一级分类' : '分类 · 二级分类',
      url: `category-${cat.slug}.html`,
      icon: cat.icon || 'leaf',
      keywords: cat.name,
    });
  }

  await mkdir(join(ROOT, 'js'), { recursive: true });
  await writeFile(
    join(ROOT, 'js', 'search-index.json'),
    `${JSON.stringify(index, null, 2)}\n`,
    'utf8'
  );
  console.log(
    `\n  ✓ js/search-index.json          ${index.length} 条（含 ${plants.length} 种植物，全部带锚点）`
  );

  /* -------------------------------------------------------- sitemap / robots */

  const today = new Date().toISOString().slice(0, 10);
  const pageUrls = pages
    .filter((page) => page.priority)
    .map((page) => {
      const loc = page.id === 'home' ? `${site.url}/` : `${site.url}/${page.file}`;
      const lastmod = existsSync(join(SRC, 'pages', page.file)) ? today : '';
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const catUrls = categories
    .filter((c) => c.level === 1 || c.level === 2)
    .map((cat) => {
      const priority = cat.level === 1 ? '0.7' : '0.5';
      return [
        '  <url>',
        `    <loc>${site.url}/category-${cat.slug}.html</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  const urls = pageUrls + (catUrls ? '\n' + catUrls : '');

  await writeFile(
    join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8'
  );

  // v7 的 robots.txt 屏蔽了 /css/ 与 /js/，会让 Google 无法抓取渲染所需的样式与脚本。
  // 仓库里的 src/ 是构建输入（片段与模板），不是可访问的页面，单独屏蔽掉，
  // 避免它们被当成「内容稀薄的页面」收录。
  await writeFile(
    join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nDisallow: /src/\nDisallow: /_build/\n\nSitemap: ${site.url}/sitemap.xml\n`,
    'utf8'
  );

  if (existsSync(join(ROOT, 'CNAME'))) console.log('  ✓ CNAME / ads.txt 保持不变');
  const totalSitemap =
    pages.filter((p) => p.priority).length +
    categories.filter((c) => c.level === 1 || c.level === 2).length;
  console.log(`  ✓ sitemap.xml                  ${totalSitemap} 条`);
  console.log('  ✓ robots.txt                   已移除对 /css/ 与 /js/ 的屏蔽');

  if (missing.length) {
    console.log(
      `\n  ! 注册表里还有 ${missing.length} 页尚未迁移：${missing.map((p) => p.file).join(', ')}`
    );
  }

  const total = built.reduce((sum, item) => sum + item.size, 0);
  console.log(`\n完成：${built.length} 个页面，合计 ${(total / 1024).toFixed(1)} KB`);
}

main().catch((error) => {
  console.error('\n构建失败：', error);
  process.exitCode = 1;
});
