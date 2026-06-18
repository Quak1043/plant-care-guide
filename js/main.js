/**
 * 绿植养护指南 - 全局 JavaScript v6
 * SVG 图标库 + 暗色模式 + 回到顶部 + 搜索 + 症状检查器 + 每日小贴士
 */
(function() {
  'use strict';

  /* ==================== SVG 图标库 ==================== */
  var I = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.74 5.88-5.74 5.88-5.74-5.88z"/><path d="M12 14.45l5.74 5.88-5.74 5.88-5.74-5.88z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v7.26L4.07 18.34A2 2 0 0 0 5.66 21h12.68a2 2 0 0 0 1.59-2.66L14 10.26V3"/></svg>',
    bug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0v-4a3 3 0 0 1 3-3z"/><path d="M19 7h1a2 2 0 0 1 0 4h-1"/><path d="M5 7H4a2 2 0 0 0 0 4h1"/><path d="M19 11h1a2 2 0 0 1 0 4h-1"/><path d="M5 11H4a2 2 0 0 0 0 4h1"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="12" y1="18" x2="12" y2="21"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 6 19.5 6 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 18 19.5 18 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 13 13 13 8"/></svg>',
    seedling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-7"/><path d="M12 7a4 4 0 0 0-4-4c-2 0-3 1.5-3 3 0 2 1.5 3 3 3 1.5 0 2.5-1 4-2z"/><path d="M12 7a4 4 0 0 1 4-4c2 0 3 1.5 3 3 0 2-1.5 3-3 3-1.5 0-2.5-1-4-2z"/></svg>',
    cactus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-6"/><path d="M8 16V8a4 4 0 0 1 8 0v8"/><path d="M10 8V6a2 2 0 0 1 4 0v2"/><path d="M8 4h8"/><circle cx="12" cy="4" r="1"/></svg>',
    herb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1 5-3 7h-1c-1.5 2-2 4-2 6H9c0-2-.5-4-2-6H6c-2-2-3-4.5-3-7a7 7 0 0 1 7-7z"/></svg>',
    flower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>',
    tree: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-5"/><path d="M7 21v-5"/><path d="M12 21v-10"/><path d="M12 11a4 4 0 0 1-4-4V4h8v3a4 4 0 0 1-4 4z"/><path d="M4 17h16"/></svg>',
    clover: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 17c0-2.5 2-4 4-4"/><path d="M8 17c0-2.5-2-4-4-4"/><path d="M12 12c-2.5 0-4 2-4 4"/><path d="M12 12c2.5 0 4 2 4 4"/><path d="M12 12V2"/><path d="M12 2a4 4 0 0 0-4 4c0 2.5 2 4 4 4"/><path d="M12 2a4 4 0 0 1 4 4c0 2.5-2 4-4 4"/></svg>',
    bamboo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="2" x2="8" y2="22"/><line x1="16" y1="2" x2="16" y2="22"/><line x1="12" y1="8" x2="12" y2="22"/><line x1="6" y1="6" x2="18" y2="6"/><line x1="6" y1="14" x2="18" y2="14"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    butterfly: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v7"/><path d="M12 9c-3-4-8-4-9-2 0 2 3 5 9 7"/><path d="M12 9c3-4 8-4 9-2 0 2-3 5-9 7"/><path d="M12 16v6"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
    pot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><path d="M12 8a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0v-6a4 4 0 0 0-4-4z"/><path d="M6 11H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/><path d="M18 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/></svg>',
    alertCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    thermometer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    brooms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2.5l-3 3L14 4l-3 3-4 4 2 2-10 9 2 2 9-10 2 2 4-4 3-3-1.5-4.5 3-3z"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.74 5.88-5.74 5.88-5.74-5.88z"/></svg>',
    snowflake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M12 6l4-4"/><path d="M12 6l-4-4"/><path d="M12 18l4 4"/><path d="M12 18l-4 4"/><path d="M21 10l-3 2 3 2"/><path d="M3 10l3 2-3 2"/></svg>',
    pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5L3.5 13.5a4.95 4.95 0 1 1 7-7l7 7a4.95 4.95 0 1 1-7 7z"/><path d="M8.5 8.5l7 7"/></svg>',
    wind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
    sunIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    feather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>'
  };

  /* ==================== 暗色模式切换 ==================== */
  var themeToggle = document.getElementById('themeToggle');
  var html = document.documentElement;
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.setAttribute('data-theme', 'dark');
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      var isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) { html.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); }
      else { html.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
    });
  }

  /* ==================== 回到顶部按钮 ==================== */
  function createBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', '回到顶部');
    btn.innerHTML = I.arrowUp;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'progress-ring');
    svg.setAttribute('viewBox', '0 0 54 54');
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '27'); circle.setAttribute('cy', '27'); circle.setAttribute('r', '24');
    var c = 2 * Math.PI * 24;
    circle.setAttribute('stroke-dasharray', c);
    circle.setAttribute('stroke-dashoffset', c);
    svg.appendChild(circle); btn.appendChild(svg);
    btn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.body.appendChild(btn);
    window.addEventListener('scroll', function() {
      var sy = window.scrollY, dh = document.documentElement.scrollHeight - window.innerHeight;
      var p = dh > 0 ? Math.min(sy / dh, 1) : 0;
      btn.classList.toggle('visible', sy > 300);
      circle.setAttribute('stroke-dashoffset', c - p * c);
    }, { passive: true });
  }
  createBackToTop();

  /* ==================== 全站搜索 ==================== */
  function initSearch() {
    var input = document.getElementById('globalSearch');
    if (!input) return;
    var results = document.getElementById('searchResults');
    if (!results) {
      results = document.createElement('div');
      results.className = 'search-results';
      results.id = 'searchResults';
      input.parentNode.appendChild(results);
    }

    var data = [
      { t: '新手入门：选对第一盆植物', s: '文章 · 新手入门', u: 'article-detail.html', i: 'book' },
      { t: '90%的花都是浇死的：浇水完全指南', s: '文章 · 浇水技巧', u: 'watering-guide.html', i: 'water' },
      { t: '室内光照完全指南', s: '文章 · 光照环境', u: 'lighting-guide.html', i: 'sunIcon' },
      { t: '换盆与土壤选择全攻略', s: '文章 · 换盆技巧', u: 'repotting-guide.html', i: 'pot' },
      { t: '家庭养花施肥完全攻略', s: '文章 · 施肥指南', u: 'fertilizer-guide.html', i: 'flask' },
      { t: '常见病虫害识别与防治大全', s: '文章 · 病虫害', u: 'pest-article.html', i: 'bug' },
      { t: '十大最适合新手的室内植物', s: '文章 · 植物推荐', u: 'top10-plants.html', i: 'trophy' },
      { t: '植物百科', s: '页面 · 15种植物详解', u: 'encyclopedia.html', i: 'grid' },
      { t: '绿萝', s: '植物 · 新手首选 · 耐阴', u: 'encyclopedia.html', i: 'leaf' },
      { t: '虎皮兰', s: '植物 · 几乎不用管 · 耐旱', u: 'encyclopedia.html', i: 'cactus' },
      { t: '龟背竹', s: '植物 · 网红植物 · 耐阴', u: 'encyclopedia.html', i: 'herb' },
      { t: '吊兰', s: '植物 · 空气净化 · 好养', u: 'encyclopedia.html', i: 'seedling' },
      { t: '多肉植物', s: '植物 · 喜光 · 少浇水', u: 'encyclopedia.html', i: 'flower' },
      { t: '白掌（一帆风顺）', s: '植物 · 耐阴 · 水培可', u: 'encyclopedia.html', i: 'flower' },
      { t: '琴叶榕', s: '植物 · 喜光 · 北欧风', u: 'encyclopedia.html', i: 'tree' },
      { t: '橡皮树', s: '植物 · 耐旱 · 大型绿植', u: 'encyclopedia.html', i: 'tree' },
      { t: '常春藤', s: '植物 · 垂吊 · 耐阴', u: 'encyclopedia.html', i: 'clover' },
      { t: '富贵竹', s: '植物 · 水培 · 寓意好', u: 'encyclopedia.html', i: 'bamboo' },
      { t: '发财树', s: '植物 · 耐旱 · 风水植物', u: 'encyclopedia.html', i: 'money' },
      { t: '文竹', s: '植物 · 喜阴 · 书房', u: 'encyclopedia.html', i: 'feather' },
      { t: '蝴蝶兰', s: '植物 · 开花 · 需技巧', u: 'encyclopedia.html', i: 'butterfly' },
      { t: '关于我们', s: '页面', u: 'about.html', i: 'info' },
      { t: '联系我们', s: '页面', u: 'contact.html', i: 'mail' }
    ];

    var ai = -1;
    function doSearch(q) {
      if (!q || q.trim().length < 1) { results.classList.remove('active'); results.innerHTML = ''; ai = -1; return; }
      var ql = q.trim().toLowerCase();
      var hits = data.filter(function(d) { return d.t.toLowerCase().indexOf(ql) !== -1 || d.s.toLowerCase().indexOf(ql) !== -1; });
      if (hits.length === 0) {
        results.innerHTML = '<div class="search-empty">未找到相关内容，试试其他关键词</div>';
      } else {
        results.innerHTML = hits.map(function(d, i) {
          return '<div class="search-result-item" data-idx="' + i + '" data-url="' + d.u + '">' +
            '<span class="sri-icon">' + (I[d.i] || I.leaf) + '</span>' +
            '<div class="sri-info"><div class="sri-title">' + d.t + '</div><div class="sri-sub">' + d.s + '</div></div></div>';
        }).join('');
        results.querySelectorAll('.search-result-item').forEach(function(el) {
          el.addEventListener('click', function() { window.location.href = el.getAttribute('data-url'); });
        });
      }
      results.classList.add('active'); ai = -1;
    }
    input.addEventListener('input', function() { doSearch(this.value); });
    input.addEventListener('focus', function() { if (this.value.trim().length > 0) doSearch(this.value); });
    input.addEventListener('keydown', function(e) {
      var items = results.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); ai = Math.min(ai + 1, items.length - 1); upd(items); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); ai = Math.max(ai - 1, -1); upd(items); }
      else if (e.key === 'Enter' && ai >= 0 && items[ai]) { e.preventDefault(); window.location.href = items[ai].getAttribute('data-url'); }
      else if (e.key === 'Escape') { results.classList.remove('active'); ai = -1; }
    });
    function upd(items) { items.forEach(function(it, i) { it.classList.toggle('active', i === ai); }); }
    document.addEventListener('click', function(e) {
      if (!input.contains(e.target) && !results.contains(e.target)) { results.classList.remove('active'); ai = -1; }
    });
  }
  initSearch();

  /* ==================== 植物症状自查器 ==================== */
  function initSymptomChecker() {
    var widget = document.getElementById('symptomCheckerWidget');
    if (!widget) return;

    var tree = {
      start: { q: '你的植物主要出现了什么问题？', o: [
        { t: '叶片发黄', i: 'alertCircle', n: 'yellow' },
        { t: '叶片有斑点/斑块', i: 'alertTriangle', n: 'spots' },
        { t: '叶子上有虫子', i: 'bug', n: 'bugs' },
        { t: '叶片枯萎/下垂', i: 'droplet', n: 'wilt' },
        { t: '植物停止生长', i: 'clock', n: 'stunt' }
      ]},
      yellow: { q: '叶片发黄的具体情况是？', o: [
        { t: '老叶先黄，逐渐脱落', i: 'leaf', r: 'old_yellow' },
        { t: '新叶发黄，叶脉绿色', i: 'feather', r: 'iron_def' },
        { t: '整株叶片均匀发黄', i: 'water', r: 'overwater' },
        { t: '叶尖和叶缘发黄干枯', i: 'sunIcon', r: 'underwater' }
      ]},
      spots: { q: '斑点是什么样子的？', o: [
        { t: '白色粉末状斑点', i: 'wind', r: 'powdery' },
        { t: '褐色/黑色圆形斑点', i: 'alertCircle', r: 'leaf_spot' },
        { t: '黄白色小点（密集）', i: 'grid', r: 'spider_mite' },
        { t: '水渍状软烂斑点', i: 'water', r: 'bacteria' }
      ]},
      bugs: { q: '你看到的是什么虫子？', o: [
        { t: '绿色/黑色小虫聚集在嫩芽', i: 'bug', r: 'aphids' },
        { t: '褐色小壳状突起', i: 'shield', r: 'scale' },
        { t: '花盆周围飞的小黑虫', i: 'wind', r: 'fungus_gnat' },
        { t: '白色棉絮状物', i: 'snowflake', r: 'mealybug' }
      ]},
      wilt: { q: '叶片枯萎伴随什么情况？', o: [
        { t: '盆土很湿，但叶片发软下垂', i: 'water', r: 'root_rot' },
        { t: '盆土很干，叶片卷曲发脆', i: 'sunIcon', r: 'underwater' },
        { t: '叶片边缘焦枯卷曲', i: 'fire', r: 'sunburn' },
        { t: '突然大面积萎蔫', i: 'snowflake', r: 'cold_damage' }
      ]},
      stunt: { q: '停止生长持续多久了？', o: [
        { t: '刚换盆/换环境不久', i: 'box', r: 'adapting' },
        { t: '冬季/低温期', i: 'snowflake', r: 'dormancy' },
        { t: '已经很久了，根系钻出盆底', i: 'pot', r: 'root_bound' },
        { t: '长期没施肥', i: 'flask', r: 'nutrient_def' }
      ]}
    };

    var dx = {
      old_yellow: { i: 'leaf', ti: '正常老化', d: '老叶自然发黄脱落是正常现象，不必担心。植物会优先将养分供给新叶，老叶会逐渐被淘汰。只需剪掉黄叶即可。', l: 'fertilizer-guide.html', lt: '了解施肥技巧 \u2192' },
      iron_def: { i: 'feather', ti: '缺铁性黄化', d: '新叶发黄但叶脉仍绿，是典型的缺铁症状。可使用螯合铁或硫酸亚铁补充，同时检查土壤pH是否偏碱。', l: 'fertilizer-guide.html', lt: '施肥指南 \u2192' },
      overwater: { i: 'water', ti: '浇水过多', d: '这是新手最常见的问题！盆土长期过湿导致根系缺氧。立即停止浇水，检查盆底排水孔，必要时换土修剪烂根。记住：宁干勿湿。', l: 'watering-guide.html', lt: '浇水完全指南 \u2192' },
      underwater: { i: 'sunIcon', ti: '缺水干旱', d: '植物严重缺水。将花盆浸入水中10-15分钟让土壤充分吸水，之后恢复正常浇水频率。用手指插入土中2-3cm检测干湿度。', l: 'watering-guide.html', lt: '浇水完全指南 \u2192' },
      powdery: { i: 'wind', ti: '白粉病', d: '真菌病害，通风不良时高发。用湿布擦除白粉，喷洒小苏打溶液（1L水+1茶匙小苏打），严重时使用三唑酮等杀菌剂。增加通风、降低湿度。', l: 'pest-article.html', lt: '病虫害防治大全 \u2192' },
      leaf_spot: { i: 'alertCircle', ti: '叶斑病', d: '真菌或细菌引起的叶部病害。立即剪除病叶并销毁，避免叶面浇水，喷洒多菌灵或波尔多液。增强通风，合理施肥提高抗性。', l: 'pest-article.html', lt: '病虫害防治大全 \u2192' },
      spider_mite: { i: 'bug', ti: '红蜘蛛（叶螨）', d: '干燥炎热环境高发。提高空气湿度，用清水冲洗叶片正反面，严重时使用阿维菌素等杀螨剂。白纸测试法可快速确认。', l: 'pest-article.html', lt: '红蜘蛛防治详情 \u2192' },
      bacteria: { i: 'alertTriangle', ti: '细菌性软腐病', d: '细菌感染导致组织软烂，有恶臭。立即剪除所有病部，伤口涂抹多菌灵，减少浇水，增强通风。严重时整株可能无法挽救。', l: 'pest-article.html', lt: '更多病害知识 \u2192' },
      aphids: { i: 'bug', ti: '蚜虫', d: '最常见的害虫之一。用强力水流冲洗，喷洒肥皂水（1L水+5ml洗洁精），投放瓢虫等天敌。黄色粘虫板可辅助诱捕。', l: 'pest-article.html', lt: '蚜虫防治详情 \u2192' },
      scale: { i: 'shield', ti: '介壳虫', d: '体表有蜡质壳，普通农药难以渗透。用旧牙刷蘸肥皂水刷洗，75%酒精棉签涂抹溶解蜡壳，严重时使用噻嗪酮等专用药剂。', l: 'pest-article.html', lt: '介壳虫防治详情 \u2192' },
      fungus_gnat: { i: 'wind', ti: '小黑飞（蕈蚊）', d: '因盆土长期潮湿引起。最根本的办法是控制浇水，表土覆盖粗砂或陶粒，使用黄色粘虫板。Bti菌剂浇灌可杀灭幼虫。', l: 'pest-article.html', lt: '小黑飞防治详情 \u2192' },
      mealybug: { i: 'snowflake', ti: '粉蚧', d: '白色棉絮状害虫，藏在叶腋和茎节。用酒精棉签清除，喷洒矿物油窒息。每周检查一次，发现立即处理防止扩散。', l: 'pest-article.html', lt: '病虫害防治大全 \u2192' },
      root_rot: { i: 'alertTriangle', ti: '烂根', d: '浇水过多或排水不良导致根系腐烂。立即脱盆，剪除所有黑色软烂的根系，用新土重新上盆，暂时减少浇水。这是最严重的养护问题之一。', l: 'watering-guide.html', lt: '浇水技巧 \u2192' },
      sunburn: { i: 'fire', ti: '日灼/晒伤', d: '突然暴晒或光照过强导致。将植物移至散射光处，剪除已焦枯的叶片（无法恢复），逐步增加光照让植物适应。', l: 'lighting-guide.html', lt: '光照指南 \u2192' },
      cold_damage: { i: 'snowflake', ti: '冻害/冷害', d: '温度骤降导致。立即移至温暖处（15℃以上），剪除已冻伤变黑的叶片，暂停浇水施肥，等待恢复。多数热带植物不耐10℃以下低温。', l: 'encyclopedia.html', lt: '查看植物耐寒性 \u2192' },
      adapting: { i: 'box', ti: '正常适应期', d: '植物换盆或换环境后有1-3周的适应期，期间生长缓慢甚至落叶都是正常的。保持原有养护习惯，给它时间适应新环境，不要频繁移动。', l: 'articles.html', lt: '更多养护文章 \u2192' },
      dormancy: { i: 'clock', ti: '自然休眠', d: '许多植物在冬季会进入休眠期，生长几乎停滞，部分叶片发黄脱落。这是正常现象，应减少浇水和施肥，待春季回暖后会重新生长。', l: 'articles.html', lt: '了解植物习性 \u2192' },
      root_bound: { i: 'pot', ti: '根系拥挤（需要换盆）', d: '根系长满花盆导致生长受限。检查盆底是否有根钻出，换一个比原盆大2-3cm的新盆，修剪部分老根，添加新土。', l: 'repotting-guide.html', lt: '换盆全攻略 \u2192' },
      nutrient_def: { i: 'flask', ti: '养分不足', d: '长期未施肥导致生长缓慢、叶片变薄变淡。生长季节（春夏季）每月施一次稀释的液体肥，秋冬减少或停止施肥。薄肥勤施，切忌浓肥。', l: 'fertilizer-guide.html', lt: '施肥完全攻略 \u2192' }
    };

    var hist = [];
    var steps = 3;

    function renderStep(nid) {
      var node = tree[nid];
      if (!node) return;
      var h = '';
      h += '<div class="sc-progress">';
      for (var i = 0; i < steps; i++) {
        var cls = i < hist.length ? 'done' : (i === hist.length ? 'current' : '');
        h += '<span class="' + cls + '"></span>';
      }
      h += '</div>';
      if (hist.length > 0) h += '<button class="sc-back" onclick="window._scBack()">\u2190 返回上一步</button>';
      h += '<div class="sc-question">' + node.q + '</div><div class="sc-options">';
      node.o.forEach(function(o) {
        var fn = o.r ? "window._scShowResult('" + o.r + "')" : "window._scGoTo('" + o.n + "')";
        h += '<button class="sc-option" onclick="' + fn + '"><span class="sc-icon">' + (I[o.i] || I.leaf) + '</span>' + o.t + '</button>';
      });
      h += '</div>';
      widget.innerHTML = h;
    }

    function renderResult(rid) {
      var d = dx[rid];
      if (!d) return;
      var h = '<div class="sc-result">';
      h += '<div class="sc-result-icon">' + (I[d.i] || I.leaf) + '</div>';
      h += '<h3>' + d.ti + '</h3><p>' + d.d + '</p>';
      h += '<div class="sc-actions"><a href="' + d.l + '" class="btn btn-primary">' + d.lt + '</a>';
      h += '<button class="btn btn-outline" onclick="window._scRestart()">重新检测</button></div></div>';
      widget.innerHTML = h;
    }

    window._scGoTo = function(nid) { hist.push(nid); renderStep(nid); };
    window._scBack = function() { hist.pop(); renderStep(hist.length > 0 ? hist[hist.length - 1] : 'start'); };
    window._scShowResult = function(rid) { renderResult(rid); };
    window._scRestart = function() { hist = []; renderStep('start'); };
    renderStep('start');
  }
  initSymptomChecker();

  /* ==================== 每日小贴士 ==================== */
  function initDailyTip() {
    var tipEl = document.getElementById('dailyTipText');
    var refreshBtn = document.getElementById('dailyTipRefresh');
    if (!tipEl) return;

    var tips = [
      { i: 'water', t: '浇水前用手指插入土壤2-3cm，如果感觉湿润就暂缓浇水。这是最简单的判断方法。' },
      { i: 'sunIcon', t: '每隔两周旋转花盆90度，让植物均匀受光，避免长歪。' },
      { i: 'brooms', t: '定期用湿布擦拭叶片，不仅能去除灰尘，还能预防红蜘蛛等害虫。' },
      { i: 'pot', t: '春天是换盆的最佳季节。如果你看到根从盆底钻出来，说明该换大一号的盆了。' },
      { i: 'thermometer', t: '大多数室内植物喜欢15-25℃的环境，远离空调出风口和暖气片。' },
      { i: 'leaf', t: '植物下面几片老叶发黄是正常的自然老化，不要急着施肥或浇水。' },
      { i: 'eye', t: '每周花两分钟检查叶片背面，这是发现早期病虫害的最佳方式。' },
      { i: 'pill', t: '施肥要"薄肥勤施"——浓度减半，频率加倍，比一次施浓肥安全得多。' },
      { i: 'water', t: '给植物"洗澡"——把花盆放进水盆里浸泡10分钟，让土壤均匀吸水，比从上面浇水更好。' },
      { i: 'moon', t: '新买的植物先隔离一周观察，确认没有病虫害后再和其他植物放在一起。' },
      { i: 'shield', t: '在盆底铺一层陶粒或碎石，能有效防止积水烂根。' },
      { i: 'scissors', t: '定期修剪枯叶和弱枝，让养分集中供给健康的部分，植物会长得更好。' },
      { i: 'leaf', t: '植物叶片下垂不一定是缺水——先摸一下土壤，如果很湿，可能是烂根了。' },
      { i: 'home', t: '每种植物都有自己的"舒适区"，了解它的原生环境能帮你更好地养护。' },
      { i: 'calendar', t: '建立一个简单的养护日历，记录浇水、施肥的日期，避免遗忘或过度养护。' }
    ];

    var today = new Date();
    var doy = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    var cur = tips[doy % tips.length];

    function showTip(tip) {
      tipEl.textContent = tip.t;
      var iconEl = document.getElementById('dailyTipIcon');
      if (iconEl) iconEl.innerHTML = I[tip.i] || I.leaf;
    }

    showTip(cur);

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        showTip(tips[Math.floor(Math.random() * tips.length)]);
      });
    }
  }
  initDailyTip();

  /* ==================== 滚动渐入动画 ==================== */
  var ro = new IntersectionObserver(function(es) {
    es.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(function(el) { ro.observe(el); });

  /* ==================== 移动端菜单 ==================== */
  var mt = document.querySelector('.menu-toggle');
  var nl = document.querySelector('.nav-links');
  if (mt && nl) {
    mt.addEventListener('click', function() { nl.classList.toggle('active'); mt.setAttribute('aria-expanded', nl.classList.contains('active')); });
    nl.querySelectorAll('a').forEach(function(l) { l.addEventListener('click', function() { nl.classList.remove('active'); mt.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ==================== 联系表单 ==================== */
  var cf = document.getElementById('contactForm');
  if (cf) {
    cf.addEventListener('submit', function(e) {
      e.preventDefault();
      var n = document.getElementById('name').value.trim();
      var em = document.getElementById('email').value.trim();
      var msg = document.getElementById('message').value.trim();
      if (!n || !em || !msg) { showFS('请填写所有必填字段', 'error'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { showFS('请输入有效的邮箱地址', 'error'); return; }
      showFS('感谢您的留言！我们会尽快回复您。', 'success');
      cf.reset();
    });
  }
  function showFS(t, tp) {
    var fs = document.getElementById('formStatus');
    if (!fs) return;
    fs.textContent = t; fs.className = 'form-status ' + tp; fs.style.display = 'block';
    setTimeout(function() { fs.style.display = 'none'; }, 5000);
  }
})();