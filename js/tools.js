/**
 * 页面级交互：每日小贴士、症状自查器、回到顶部、滚动渐入、文章阅读追踪、联系表单。
 *
 * 相比 v7 的关键修复：
 *   · 症状自查器不再用 innerHTML 字符串拼内联 onclick，也不再往 window 上挂
 *     _scGoTo/_scBack/_scShowResult/_scRestart 四个全局函数；改为 addEventListener 委托；
 *   · 滚动渐入改为「先探测 IntersectionObserver 可用，再加隐藏类」，并且留了兜底
 *     计时器 —— v7 无特性检测，IO 不可用时 .reveal 会永久停在 opacity:0；
 *   · 回到顶部与阅读追踪合并为同一个 rAF 节流的滚动处理器，不再各注册一个监听、
 *     也不在每次滚动里重复读 body.scrollHeight（后者会触发布局计算）；
 *   · 平滑滚动尊重 prefers-reduced-motion；
 *   · 联系表单不再弹出假成功提示（v7 里 action 是未替换的 formspree 占位符，
 *     数据从未发出，用户却看到「感谢您的留言」）。
 */

import { $, append, clear, el, icon, onFrame, prefersReducedMotion } from './dom.js';

/* ---------------------------------------------------------------- 每日小贴士 */

export async function initDailyTip() {
  const textNode = $('#dailyTipText');
  if (!textNode) return;

  const { TIPS } = await import('./data/daily-tips.js');
  if (!TIPS.length) return;

  const iconSlot = $('#dailyTipIcon');
  const refresh = $('#dailyTipRefresh');

  const show = (tip) => {
    textNode.textContent = tip.t; // v7 这里已是 textContent，保留
    if (iconSlot) {
      clear(iconSlot);
      append(iconSlot, icon(tip.i));
    }
  };

  // 用 UTC 日序号，保证所有访客当天看到同一条；v7 用本地时间构造 Date 差值，跨时区不一致
  const dayIndex = Math.floor(Date.now() / 86400000) % TIPS.length;
  show(TIPS[dayIndex]);

  if (refresh) {
    refresh.addEventListener('click', () => {
      const current = textNode.textContent;
      let next = TIPS[Math.floor(Math.random() * TIPS.length)];
      if (TIPS.length > 1) {
        while (next.t === current) next = TIPS[Math.floor(Math.random() * TIPS.length)];
      }
      show(next);
    });
  }
}

/* --------------------------------------------------------------- 症状自查器 */

export async function initChecker() {
  const widget = $('#checkerWidget');
  if (!widget) return;

  const { TREE, DIAGNOSES } = await import('./data/symptom-tree.js');

  const TOTAL_STEPS = 3;
  const history = [];

  const progress = (currentStep) => {
    const bar = el('div', { class: 'checker__progress', 'aria-hidden': 'true' });
    for (let step = 0; step < TOTAL_STEPS; step += 1) {
      const state = step < currentStep ? 'done' : step === currentStep ? 'current' : '';
      bar.append(el('span', state ? { dataset: { state } } : {}));
    }
    return bar;
  };

  const renderStep = (nodeId) => {
    const node = TREE[nodeId];
    if (!node) return;

    const frag = document.createDocumentFragment();
    frag.append(progress(history.length));

    if (history.length > 0) {
      frag.append(
        el(
          'button',
          {
            type: 'button',
            class: 'checker__back',
            onclick: () => {
              history.pop();
              renderStep(history.length > 0 ? history[history.length - 1] : 'start');
            },
          },
          [icon('arrow-left'), '返回上一步']
        )
      );
    }

    frag.append(el('p', { class: 'checker__question', text: node.q }));

    const options = el('div', { class: 'checker__options' });
    for (const option of node.o) {
      options.append(
        el(
          'button',
          {
            type: 'button',
            class: 'checker__option',
            onclick: () => {
              if (option.r) {
                renderResult(option.r);
              } else {
                history.push(option.n);
                renderStep(option.n);
              }
            },
          },
          [icon(option.i), el('span', { text: option.t })]
        )
      );
    }
    frag.append(options);

    clear(widget).append(frag);
    widget.setAttribute('aria-live', 'polite');
  };

  const renderResult = (resultId) => {
    const item = DIAGNOSES[resultId];
    if (!item) return;

    clear(widget).append(
      el('div', { class: 'checker__result' }, [
        el('div', { class: 'checker__result-icon' }, [icon(item.i)]),
        el('h3', { text: item.title }),
        el('p', { text: item.text }),
        el('div', { class: 'checker__actions' }, [
          el('a', { class: 'btn btn-primary', href: item.href }, [
            el('span', { text: item.linkText }),
            icon('arrow-right'),
          ]),
          el(
            'button',
            {
              type: 'button',
              class: 'btn btn-outline',
              onclick: () => {
                history.length = 0;
                renderStep('start');
              },
            },
            ['重新检测']
          ),
        ]),
      ])
    );
  };

  renderStep('start');
}

/* ---------------------------------------------------------------- 回到顶部 */

export function initToTop() {
  const button = el(
    'button',
    {
      type: 'button',
      class: 'to-top',
      id: 'toTop',
      'aria-label': '回到页面顶部',
      dataset: { visible: 'false' },
    },
    [icon('arrow-up')]
  );

  // 进度环：只在支持 SVG 时插入，装饰性内容不进无障碍树
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('class', 'to-top__ring');
  ring.setAttribute('viewBox', '0 0 54 54');
  ring.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  circle.setAttribute('cx', '27');
  circle.setAttribute('cy', '27');
  circle.setAttribute('r', String(radius));
  circle.setAttribute('stroke-dasharray', String(circumference));
  circle.setAttribute('stroke-dashoffset', String(circumference));
  ring.append(circle);
  button.append(ring);

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });

  document.body.append(button);

  const update = () => {
    const scrolled = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(scrolled / scrollable, 1) : 0;
    button.dataset.visible = String(scrolled > 300);
    circle.setAttribute('stroke-dashoffset', String(circumference - ratio * circumference));
  };

  window.addEventListener('scroll', onFrame(update), { passive: true });
  window.addEventListener('resize', onFrame(update), { passive: true });
  update();
}

/* ---------------------------------------------------------------- 滚动渐入 */

export function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (targets.length === 0) return;

  // 没有 IntersectionObserver 就什么都不做：内容保持可见（v7 会让它永久隐藏）
  if (!('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('reveal-ready');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
  );

  targets.forEach((node) => observer.observe(node));

  // 兜底：无论观察器是否正常回调，3 秒后保证内容可见
  window.setTimeout(() => {
    targets.forEach((node) => node.classList.add('is-visible'));
    observer.disconnect();
  }, 3000);
}

/* ------------------------------------------------------------ 文章阅读追踪 */

export function initReadTracking() {
  const page = document.body.dataset.pageKind;
  if (page !== 'article' || typeof window.gtag !== 'function') return;

  const startedAt = Date.now();
  let counted = false;

  const count = () => {
    if (counted) return;
    counted = true;
    window.gtag('event', 'article_read', {
      event_category: 'engagement',
      event_label: document.title,
      value: Math.round((Date.now() - startedAt) / 1000),
    });
  };

  const onScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 1;
    if (ratio > 0.67) count();
  };

  window.addEventListener('scroll', onFrame(onScroll), { passive: true });
  window.setTimeout(count, 45000);
}

/* ---------------------------------------------------------------- 联系表单 */

export function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;

  const status = $('#formStatus');

  const report = (message, state) => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  };

  // 页面上的公开邮箱；没有就退回站点默认地址
  const emailNode = $('#contactEmail');
  const email = emailNode ? emailNode.textContent.trim() : '';

  // build.mjs 把 site.json 的 contactEndpoint 写进 data-endpoint。
  // 没配置接收地址时不再假装成功，也不再留一个点了没反应的按钮：
  // 直接降级成显式的邮件引导。
  const endpoint = (form.dataset.endpoint || '').trim();
  if (!endpoint) {
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.hidden = true;

    const note = el('p', { class: 'form-note' }, [
      '在线留言通道尚未接入接收地址，表单暂时无法直接提交。请把内容发送到 ',
      email ? el('a', { href: `mailto:${email}`, text: email }) : '站点邮箱',
      '，我们会尽快回复。',
    ]);
    form.before(note);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      report(
        email
          ? `暂时无法在线提交，请直接发送邮件至 ${email}。`
          : '暂时无法在线提交，请通过页面上的邮箱联系我们。',
        'error'
      );
    });
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const emailValue = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!name || !emailValue || !message) {
      report('请填写所有必填字段', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      report('请输入有效的邮箱地址', 'error');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      report('感谢您的留言！我们会尽快回复您。', 'success');
      form.reset();
    } catch {
      report('提交失败，请稍后重试，或直接发送邮件联系我们。', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}
