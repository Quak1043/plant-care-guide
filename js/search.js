/**
 * 全站搜索。
 *
 * 相比 v7 的变化：
 *   · 索引从 main.js 里硬编码的数组改为 js/search-index.json，由 build.mjs 依据
 *     src/data/pages.json 与 src/data/plants.json 生成 —— 单一数据源，不会再出现
 *     「搜得到但页面里没有」或「页面里有但搜不到」的不同步问题；
 *   · 首次聚焦才加载索引，不占用首屏；
 *   · 结果用 createElement + textContent 构建，不再拼 innerHTML；
 *   · 植物结果带 #plant-xxx 锚点，点击后直接定位到那一株（v7 里 13 种植物
 *     全部指向 encyclopedia.html 顶部，用户还要自己滚）；
 *   · 补了 listbox/option 语义与 aria-activedescendant。
 */

import { $, clear, el, icon } from './dom.js';

const INDEX_URL = 'js/search-index.json';

export function initSearch() {
  const input = $('#globalSearch');
  const results = $('#searchResults');
  if (!input || !results) return;

  let index = null;
  let pending = null;
  let activeIndex = -1;

  results.setAttribute('role', 'listbox');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', results.id);

  // 索引只在用户真正要搜索时才下载
  const loadIndex = () => {
    if (!pending) {
      pending = fetch(INDEX_URL, { credentials: 'same-origin' })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => {
          index = Array.isArray(data) ? data : [];
          return index;
        })
        .catch(() => {
          index = [];
          return index;
        });
    }
    return pending;
  };

  const close = () => {
    results.dataset.open = 'false';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  };

  const open = () => {
    results.dataset.open = 'true';
    input.setAttribute('aria-expanded', 'true');
  };

  const search = (query) => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      clear(results);
      close();
      return;
    }

    const hits = (index || []).filter((item) =>
      `${item.title} ${item.sub} ${item.keywords || ''}`.toLowerCase().includes(needle)
    );

    clear(results);
    activeIndex = -1;

    if (hits.length === 0) {
      results.append(el('p', { class: 'search__empty', text: '未找到相关内容，试试其他关键词' }));
    } else {
      hits.slice(0, 30).forEach((item, position) => {
        const link = el(
          'a',
          {
            class: 'result-item',
            href: item.url,
            role: 'option',
            id: `search-option-${position}`,
            dataset: { position: String(position) },
          },
          [
            icon(item.icon || 'leaf', 'icon result-item__icon'),
            el('span', { class: 'result-item__body' }, [
              el('span', { class: 'result-item__title', text: item.title }),
              el('span', { class: 'result-item__sub', text: item.sub }),
            ]),
          ]
        );
        results.append(link);
      });
      // 用原生链接，回车/点击都直接跳转，无需 JS 接管导航
    }

    open();
  };

  const items = () => Array.from(results.querySelectorAll('.result-item'));

  const highlight = (nextIndex) => {
    const list = items();
    if (list.length === 0) return;
    activeIndex = (nextIndex + list.length) % list.length;
    list.forEach((item, position) => {
      item.dataset.active = String(position === activeIndex);
    });
    const current = list[activeIndex];
    input.setAttribute('aria-activedescendant', current.id);
    current.scrollIntoView({ block: 'nearest' });
  };

  let timer = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    const value = input.value;
    timer = window.setTimeout(async () => {
      await loadIndex();
      search(value);
    }, 120);
  });

  input.addEventListener('focus', async () => {
    if (!input.value.trim()) return;
    await loadIndex();
    search(input.value);
  });

  input.addEventListener('keydown', (event) => {
    const list = items();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      loadIndex();
      highlight(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlight(activeIndex - 1);
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0 && list[activeIndex]) {
        event.preventDefault();
        window.location.href = list[activeIndex].href;
        return;
      }
      // 没有高亮项时，若只有一条结果就直接进
      if (list.length === 1) {
        event.preventDefault();
        window.location.href = list[0].href;
      }
    } else if (event.key === 'Escape') {
      close();
      input.blur();
    }
  });

  document.addEventListener('click', (event) => {
    if (!input.contains(event.target) && !results.contains(event.target)) close();
  });

  // 站内链接跳转前不下拉，交给浏览器即可
  results.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });
}
