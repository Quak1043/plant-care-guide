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
