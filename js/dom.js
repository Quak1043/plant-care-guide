/**
 * 通用 DOM 与存储辅助。
 *
 * 全站不再使用 innerHTML 拼接：v7 的 main.js 有 7 处 innerHTML，
 * 并用字符串拼出内联 onclick、在 window 上挂了 4 个全局函数
 * （_scGoTo / _scBack / _scShowResult / _scRestart），既无法启用严格 CSP，
 * 也容易在数据来源变化时变成注入点。这里统一用 createElement + textContent。
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export const $ = (selector, root = document) => root.querySelector(selector);

export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/**
 * 创建元素。text 走 textContent，永远不解析 HTML。
 * @param {string} tag
 * @param {Record<string, unknown>} [props]
 * @param {Array<Node|string|null|undefined>} [children]
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class') {
      node.className = String(value);
    } else if (key === 'text') {
      node.textContent = String(value);
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) {
      node.setAttribute(key, '');
    } else {
      node.setAttribute(key, String(value));
    }
  }

  append(node, children);
  return node;
}

export function append(parent, children) {
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/**
 * 引用内联 SVG 雪碧图中的图标。
 * @param {string} name 对应 src/partials/icons.svg 里 #i-<name>
 * @param {string} [className]
 */
export function icon(name, className = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/**
 * localStorage 包装。
 * v7 直接读写 localStorage，在 Safari 无痕模式 / 禁用 Cookie 时会抛
 * SecurityError，导致整个 IIFE 中断——主题、搜索、症状自查、每日贴士全部失效。
 */
export const store = {
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
};

/** 节流到下一帧，用于 scroll 这类高频事件。 */
export function onFrame(handler) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      handler();
    });
  };
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
