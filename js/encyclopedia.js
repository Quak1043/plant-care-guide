/**
 * 植物百科：筛选 + 深链展开。
 *
 * 相比 v7 的关键修复：
 *   · 筛选项原本是 <span class="filter-pill"> + 内联 onclick，span 既不可聚焦、
 *     也没有任何状态语义。键盘用户完全无法筛选，读屏用户听到的是一串纯文本。
 *     现在改成 <button type="button" aria-pressed>，并给结果计数加了 live region；
 *   · 15 张植物卡各自内联一份 onclick="togglePlantDetail(this)"，展开状态靠
 *     直接改 style.display。现在展开区是原生 <details>，本模块完全不参与折叠逻辑；
 *   · 搜索跳转到 encyclopedia.html#plant-pothos 时，卡片只是被 :target 描个边，
 *     详情依然折着。现在会自动展开并滚动到位，并把焦点交给该卡片。
 */

import { $, $$, prefersReducedMotion } from './dom.js';

const FILTER_KEYS = ['light', 'diff', 'func'];

/** URL hash 指向某张植物卡时，展开它并滚过去。 */
function revealFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;

  const card = document.getElementById(id);
  if (!card || !card.classList.contains('plant-card')) return;

  const details = card.querySelector('details');
  if (details) details.open = true;

  card.tabIndex = -1;
  card.focus({ preventScroll: true });
  card.scrollIntoView({
    block: 'start',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

export function initEncyclopedia() {
  const grid = $('#plantGrid');
  if (!grid) return;

  const cards = $$('.plant-card', grid);
  const pills = $$('.filter-pill');
  const bar = $('.filter-section');
  const count = $('#resultCount');
  const info = $('.results-info');

  const active = { light: 'all', diff: 'all', func: 'all' };

  const syncPills = () => {
    for (const pill of pills) {
      const on = active[pill.dataset.filter] === pill.dataset.value;
      pill.setAttribute('aria-pressed', String(on));
    }
  };

  const apply = () => {
    let shown = 0;
    for (const card of cards) {
      const ok =
        (active.light === 'all' || card.dataset.light === active.light) &&
        (active.diff === 'all' || card.dataset.diff === active.diff) &&
        (active.func === 'all' || card.dataset.func === active.func);

      // 用 data-hidden 而不是改 style.display：状态留在属性上，
      // 也方便 CSS 与测试脚本读取
      card.dataset.hidden = ok ? 'false' : 'true';
      if (ok) shown += 1;
    }
    if (count) count.textContent = String(shown); // 父级 role=status 会播报变化
  };

  // 事件委托：3 组共十几个按钮只挂一个监听
  bar?.addEventListener('click', (event) => {
    const pill = event.target.closest('.filter-pill');
    if (!pill || !bar.contains(pill)) return;

    active[pill.dataset.filter] = pill.dataset.value;
    syncPills();
    apply();
  });

  // 深链目标可能正被筛选条件挡着，先放开筛选再展开
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const card = id ? document.getElementById(id) : null;
    if (card && card.classList.contains('plant-card') && card.dataset.hidden === 'true') {
      for (const key of FILTER_KEYS) active[key] = 'all';
      syncPills();
      apply();
    }
    revealFromHash();
  });

  apply();
  if (window.location.hash) revealFromHash();

  // 计数变化播报：把结果数也写进 live region 的标题属性，方便读屏定位
  if (info) info.setAttribute('aria-live', 'polite');
}
