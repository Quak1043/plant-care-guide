/**
 * 移动端导航菜单。
 *
 * v7 只做了 class 切换，缺少：Esc 关闭、点击外部关闭、body 滚动锁定、
 * 回到桌面宽度时重置状态（导致从窄屏切到宽屏后 body 可能仍被锁滚动）。
 */

import { $ } from './dom.js';

export function initNav() {
  const toggle = $('#menuToggle');
  const links = $('#navLinks');
  if (!toggle || !links) return;

  const isOpen = () => links.dataset.open === 'true';

  const setOpen = (open) => {
    links.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    document.body.classList.toggle('nav-open', open);
  };

  setOpen(false);

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(!isOpen());
  });

  // 点击菜单里的链接后自动收起
  links.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!isOpen()) return;
    if (!links.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  // 视口回到桌面宽度时收起，避免残留的 nav-open 锁住页面滚动
  const desktop = window.matchMedia('(min-width: 769px)');
  const onBreakpoint = (event) => {
    if (event.matches) setOpen(false);
  };

  if (typeof desktop.addEventListener === 'function') desktop.addEventListener('change', onBreakpoint);
  else if (typeof desktop.addListener === 'function') desktop.addListener(onBreakpoint);
}

/**
 * 导航栏「植物分类」下拉菜单交互。
 * 桌面端：点击切换，点击外部关闭，Esc 关闭。
 * 移动端：作为汉堡菜单的一部分展开。
 */
export function initNavDropdown() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if (dropdowns.length === 0) return;

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector('.nav-dropdown__toggle');
    const menu = dropdown.querySelector('.nav-dropdown__menu');
    if (!toggle || !menu) return;

    const isOpen = () => dropdown.classList.contains('is-open');

    const setOpen = (open) => {
      dropdown.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      setOpen(!isOpen());
    });

    // 点击菜单内链接后关闭
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    // 点击外部关闭
    document.addEventListener('click', (event) => {
      if (!isOpen()) return;
      if (!dropdown.contains(event.target)) setOpen(false);
    });

    // Esc 关闭
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // 桌面端悬停展开（仅宽屏）
    const desktop = window.matchMedia('(min-width: 769px)');
    const onEnter = () => { if (desktop.matches) setOpen(true); };
    const onLeave = () => { if (desktop.matches) setOpen(false); };

    dropdown.addEventListener('mouseenter', onEnter);
    dropdown.addEventListener('mouseleave', onLeave);
  });
}
