/**
 * 入口模块。用原生 ES Module 动态 import，各页面只下载自己需要的代码：
 *   · 有搜索框的页面才加载 search.js
 *   · 有小贴士/自查器/文章追踪的页面才加载对应逻辑及其语料
 * 免去打包步骤，GitHub Pages 直接托管即可。
 */

import { initNav, initNavDropdown } from './nav.js';
import { initTheme } from './theme.js';
import { initReveal, initToTop } from './tools.js';

const has = (selector) => document.querySelector(selector) !== null;

async function boot() {
  initTheme();
  initNav();
  initNavDropdown();
  initReveal();
  initToTop();

  // 页脚的「隐私设置」入口：每页都有，但只有在 CMP 就绪时才由模块显出来
  if (has('#privacySettings')) {
    const { initConsentControls } = await import('./consent.js');
    initConsentControls();
  }

  if (has('#globalSearch')) {
    const { initSearch } = await import('./search.js');
    initSearch();
  }

  if (has('#dailyTipText')) {
    const { initDailyTip } = await import('./tools.js');
    await initDailyTip();
  }

  if (has('#checkerWidget')) {
    const { initChecker } = await import('./tools.js');
    await initChecker();
  }

  if (has('#plantGrid')) {
    const { initEncyclopedia } = await import('./encyclopedia.js');
    initEncyclopedia();
  }

  if (has('#contactForm')) {
    const { initContactForm } = await import('./tools.js');
    initContactForm();
  }

  if (document.body.dataset.pageKind === 'article') {
    const { initReadTracking } = await import('./tools.js');
    initReadTracking();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
