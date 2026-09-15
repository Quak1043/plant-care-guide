/**
 * 主题切换。
 *
 * 首帧防闪烁的极小脚本内联在 <head>（见 src/partials/head.html），
 * 这里只负责按钮交互与状态同步。
 */

import { $, store } from './dom.js';

const KEY = 'theme';
const DARK = 'dark';

function isDark() {
  return document.documentElement.getAttribute('data-theme') === DARK;
}

function paint(dark) {
  const root = document.documentElement;
  if (dark) root.setAttribute('data-theme', DARK);
  else root.removeAttribute('data-theme');

  const button = $('#themeToggle');
  if (button) button.setAttribute('aria-pressed', String(dark));
}

function apply(dark, { persist = true } = {}) {
  paint(dark);
  if (persist) store.set(KEY, dark ? DARK : 'light');
}

export function initTheme() {
  const button = $('#themeToggle');
  paint(isDark());

  if (button) {
    button.addEventListener('click', () => apply(!isDark()));
  }

  // 用户没有手动选择过时，跟随系统切换
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = (event) => {
    if (store.get(KEY) === null) apply(event.matches, { persist: false });
  };

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onSystemChange);
  } else if (typeof media.addListener === 'function') {
    media.addListener(onSystemChange);
  }
}
