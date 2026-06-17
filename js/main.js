/**
 * 绿植养护指南 - 全局 JavaScript v5
 * 暗色模式 + 回到顶部 + 搜索 + 症状检查器 + 每日小贴士 + 滚动渐入
 */
(function() {
  'use strict';

  // ==================== 暗色模式切换 ====================
  var themeToggle = document.getElementById('themeToggle');
  var html = document.documentElement;

  // 从 localStorage 读取主题
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.setAttribute('data-theme', 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      var isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
    });
  }

  // ==================== 回到顶部按钮 ====================
  function createBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', '回到顶部');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';

    // 进度环
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'progress-ring');
    svg.setAttribute('viewBox', '0 0 54 54');
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '27');
    circle.setAttribute('cy', '27');
    circle.setAttribute('r', '24');
    var circumference = 2 * Math.PI * 24;
    circle.setAttribute('stroke-dasharray', circumference);
    circle.setAttribute('stroke-dashoffset', circumference);
    svg.appendChild(circle);
    btn.appendChild(svg);

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(btn);

    // 滚动时显示/隐藏 + 更新进度环
    window.addEventListener('scroll', function() {
      var scrollY = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;

      if (scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }

      // 更新进度环
      var offset = circumference - progress * circumference;
      circle.setAttribute('stroke-dashoffset', offset);
    }, { passive: true });
  }

  createBackToTop();

  // ==================== 全站搜索 ====================
  function initSearch() {
    var searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;

    var searchResults = document.getElementById('searchResults');
    if (!searchResults) {
      searchResults = document.createElement('div');
      searchResults.className = 'search-results';
      searchResults.id = 'searchResults';
      searchInput.parentNode.appendChild(searchResults);
    }

    // 搜索数据
    var searchData = [
      { title: '新手入门：选对第一盆植物', sub: '文章 · 新手入门', url: 'article-detail.html', icon: '📖' },
      { title: '90%的花都是浇死的：浇水完全指南', sub: '文章 · 浇水技巧', url: 'watering-guide.html', icon: '💧' },
      { title: '室内光照完全指南', sub: '文章 · 光照环境', url: 'lighting-guide.html', icon: '☀️' },
      { title: '换盆与土壤选择全攻略', sub: '文章 · 换盆技巧', url: 'repotting-guide.html', icon: '🪴' },
      { title: '家庭养花施肥完全攻略', sub: '文章 · 施肥指南', url: 'fertilizer-guide.html', icon: '🧪' },
      { title: '常见病虫害识别与防治大全', sub: '文章 · 病虫害', url: 'pest-article.html', icon: '🐛' },
      { title: '十大最适合新手的室内植物', sub: '文章 · 植物推荐', url: 'top10-plants.html', icon: '🏆' },
      { title: '植物百科', sub: '页面 · 15种植物详解', url: 'encyclopedia.html', icon: '🌿' },
      { title: '绿萝', sub: '植物 · 新手首选 · 耐阴', url: 'encyclopedia.html', icon: '🌱' },
      { title: '虎皮兰', sub: '植物 · 几乎不用管 · 耐旱', url: 'encyclopedia.html', icon: '🌵' },
      { title: '龟背竹', sub: '植物 · 网红植物 · 耐阴', url: 'encyclopedia.html', icon: '🍃' },
      { title: '吊兰', sub: '植物 · 空气净化 · 好养', url: 'encyclopedia.html', icon: '🌾' },
      { title: '多肉植物', sub: '植物 · 喜光 · 少浇水', url: 'encyclopedia.html', icon: '🪷' },
      { title: '白掌（一帆风顺）', sub: '植物 · 耐阴 · 水培可', url: 'encyclopedia.html', icon: '🌺' },
      { title: '琴叶榕', sub: '植物 · 喜光 · 北欧风', url: 'encyclopedia.html', icon: '🌳' },
      { title: '橡皮树', sub: '植物 · 耐旱 · 大型绿植', url: 'encyclopedia.html', icon: '🪵' },
      { title: '常春藤', sub: '植物 · 垂吊 · 耐阴', url: 'encyclopedia.html', icon: '🍀' },
      { title: '富贵竹', sub: '植物 · 水培 · 寓意好', url: 'encyclopedia.html', icon: '🎋' },
      { title: '发财树', sub: '植物 · 耐旱 · 风水植物', url: 'encyclopedia.html', icon: '💰' },
      { title: '文竹', sub: '植物 · 喜阴 · 书房', url: 'encyclopedia.html', icon: '🎍' },
      { title: '蝴蝶兰', sub: '植物 · 开花 · 需技巧', url: 'encyclopedia.html', icon: '🦋' },
      { title: '关于我们', sub: '页面', url: 'about.html', icon: 'ℹ️' },
      { title: '联系我们', sub: '页面', url: 'contact.html', icon: '✉️' }
    ];

    var activeIndex = -1;

    function doSearch(query) {
      if (!query || query.trim().length < 1) {
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        activeIndex = -1;
        return;
      }

      var q = query.trim().toLowerCase();
      var results = searchData.filter(function(item) {
        return item.title.toLowerCase().indexOf(q) !== -1 || item.sub.toLowerCase().indexOf(q) !== -1;
      });

      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-empty">未找到相关内容，试试其他关键词</div>';
      } else {
        searchResults.innerHTML = results.map(function(item, i) {
          return '<div class="search-result-item" data-index="' + i + '" data-url="' + item.url + '">' +
            '<span class="sri-icon">' + item.icon + '</span>' +
            '<div class="sri-info"><div class="sri-title">' + item.title + '</div><div class="sri-sub">' + item.sub + '</div></div>' +
            '</div>';
        }).join('');

        // 点击跳转
        searchResults.querySelectorAll('.search-result-item').forEach(function(el) {
          el.addEventListener('click', function() {
            var url = el.getAttribute('data-url');
            window.location.href = url;
          });
        });
      }

      searchResults.classList.add('active');
      activeIndex = -1;
    }

    searchInput.addEventListener('input', function() {
      doSearch(this.value);
    });

    searchInput.addEventListener('focus', function() {
      if (this.value.trim().length > 0) {
        doSearch(this.value);
      }
    });

    // 键盘导航
    searchInput.addEventListener('keydown', function(e) {
      var items = searchResults.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        updateActive(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        updateActive(items);
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          var url = items[activeIndex].getAttribute('data-url');
          window.location.href = url;
        }
      } else if (e.key === 'Escape') {
        searchResults.classList.remove('active');
        activeIndex = -1;
      }
    });

    function updateActive(items) {
      items.forEach(function(item, i) {
        item.classList.toggle('active', i === activeIndex);
      });
    }

    // 点击外部关闭
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('active');
        activeIndex = -1;
      }
    });
  }

  initSearch();

  // ==================== 植物症状自查器 ====================
  function initSymptomChecker() {
    var widget = document.getElementById('symptomCheckerWidget');
    if (!widget) return;

    // 决策树数据
    var tree = {
      start: {
        question: '你的植物主要出现了什么问题？',
        options: [
          { text: '叶片发黄', emoji: '🟡', next: 'yellow' },
          { text: '叶片有斑点/斑块', emoji: '🔴', next: 'spots' },
          { text: '叶子上有虫子', emoji: '🐛', next: 'bugs' },
          { text: '叶片枯萎/下垂', emoji: '🥀', next: 'wilt' },
          { text: '植物停止生长', emoji: '😐', next: 'stunt' }
        ]
      },
      yellow: {
        question: '叶片发黄的具体情况是？',
        options: [
          { text: '老叶先黄，逐渐脱落', emoji: '🍂', result: 'old_yellow' },
          { text: '新叶发黄，叶脉绿色', emoji: '📄', result: 'iron_def' },
          { text: '整株叶片均匀发黄', emoji: '🟨', result: 'overwater' },
          { text: '叶尖和叶缘发黄干枯', emoji: '🏜️', result: 'underwater' }
        ]
      },
      spots: {
        question: '斑点是什么样子的？',
        options: [
          { text: '白色粉末状斑点', emoji: '⚪', result: 'powdery' },
          { text: '褐色/黑色圆形斑点', emoji: '🟤', result: 'leaf_spot' },
          { text: '黄白色小点（密集）', emoji: '🔸', result: 'spider_mite' },
          { text: '水渍状软烂斑点', emoji: '💧', result: 'bacteria' }
        ]
      },
      bugs: {
        question: '你看到的是什么虫子？',
        options: [
          { text: '绿色/黑色小虫聚集在嫩芽', emoji: '🦗', result: 'aphids' },
          { text: '褐色小壳状突起', emoji: '🐚', result: 'scale' },
          { text: '花盆周围飞的小黑虫', emoji: '🪰', result: 'fungus_gnat' },
          { text: '白色棉絮状物', emoji: '☁️', result: 'mealybug' }
        ]
      },
      wilt: {
        question: '叶片枯萎伴随什么情况？',
        options: [
          { text: '盆土很湿，但叶片发软下垂', emoji: '💦', result: 'root_rot' },
          { text: '盆土很干，叶片卷曲发脆', emoji: '🏜️', result: 'underwater' },
          { text: '叶片边缘焦枯卷曲', emoji: '🔥', result: 'sunburn' },
          { text: '突然大面积萎蔫', emoji: '💔', result: 'cold_damage' }
        ]
      },
      stunt: {
        question: '停止生长持续多久了？',
        options: [
          { text: '刚换盆/换环境不久', emoji: '📦', result: 'adapting' },
          { text: '冬季/低温期', emoji: '❄️', result: 'dormancy' },
          { text: '已经很久了，根系钻出盆底', emoji: '🪴', result: 'root_bound' },
          { text: '长期没施肥', emoji: '🍽️', result: 'nutrient_def' }
        ]
      }
    };

    // 诊断结果
    var diagnoses = {
      old_yellow: { icon: '🍂', title: '正常老化', desc: '老叶自然发黄脱落是正常现象，不必担心。植物会优先将养分供给新叶，老叶会逐渐被淘汰。只需剪掉黄叶即可。', link: 'fertilizer-guide.html', linkText: '了解施肥技巧 →' },
      iron_def: { icon: '📄', title: '缺铁性黄化', desc: '新叶发黄但叶脉仍绿，是典型的缺铁症状。可使用螯合铁或硫酸亚铁补充，同时检查土壤pH是否偏碱。', link: 'fertilizer-guide.html', linkText: '施肥指南 →' },
      overwater: { icon: '💧', title: '浇水过多', desc: '这是新手最常见的问题！盆土长期过湿导致根系缺氧。立即停止浇水，检查盆底排水孔，必要时换土修剪烂根。记住：宁干勿湿。', link: 'watering-guide.html', linkText: '浇水完全指南 →' },
      underwater: { icon: '🏜️', title: '缺水干旱', desc: '植物严重缺水。将花盆浸入水中10-15分钟让土壤充分吸水，之后恢复正常浇水频率。用手指插入土中2-3cm检测干湿度。', link: 'watering-guide.html', linkText: '浇水完全指南 →' },
      powdery: { icon: '⚪', title: '白粉病', desc: '真菌病害，通风不良时高发。用湿布擦除白粉，喷洒小苏打溶液（1L水+1茶匙小苏打），严重时使用三唑酮等杀菌剂。增加通风、降低湿度。', link: 'pest-article.html', linkText: '病虫害防治大全 →' },
      leaf_spot: { icon: '🟤', title: '叶斑病', desc: '真菌或细菌引起的叶部病害。立即剪除病叶并销毁，避免叶面浇水，喷洒多菌灵或波尔多液。增强通风，合理施肥提高抗性。', link: 'pest-article.html', linkText: '病虫害防治大全 →' },
      spider_mite: { icon: '🕷️', title: '红蜘蛛（叶螨）', desc: '干燥炎热环境高发。提高空气湿度，用清水冲洗叶片正反面，严重时使用阿维菌素等杀螨剂。白纸测试法可快速确认。', link: 'pest-article.html', linkText: '红蜘蛛防治详情 →' },
      bacteria: { icon: '🦠', title: '细菌性软腐病', desc: '细菌感染导致组织软烂，有恶臭。立即剪除所有病部，伤口涂抹多菌灵，减少浇水，增强通风。严重时整株可能无法挽救。', link: 'pest-article.html', linkText: '更多病害知识 →' },
      aphids: { icon: '🦗', title: '蚜虫', desc: '最常见的害虫之一。用强力水流冲洗，喷洒肥皂水（1L水+5ml洗洁精），投放瓢虫等天敌。黄色粘虫板可辅助诱捕。', link: 'pest-article.html', linkText: '蚜虫防治详情 →' },
      scale: { icon: '🐚', title: '介壳虫', desc: '体表有蜡质壳，普通农药难以渗透。用旧牙刷蘸肥皂水刷洗，75%酒精棉签涂抹溶解蜡壳，严重时使用噻嗪酮等专用药剂。', link: 'pest-article.html', linkText: '介壳虫防治详情 →' },
      fungus_gnat: { icon: '🪰', title: '小黑飞（蕈蚊）', desc: '因盆土长期潮湿引起。最根本的办法是控制浇水，表土覆盖粗砂或陶粒，使用黄色粘虫板。Bti菌剂浇灌可杀灭幼虫。', link: 'pest-article.html', linkText: '小黑飞防治详情 →' },
      mealybug: { icon: '☁️', title: '粉蚧', desc: '白色棉絮状害虫，藏在叶腋和茎节。用酒精棉签清除，喷洒矿物油窒息。每周检查一次，发现立即处理防止扩散。', link: 'pest-article.html', linkText: '病虫害防治大全 →' },
      root_rot: { icon: '💀', title: '烂根', desc: '浇水过多或排水不良导致根系腐烂。立即脱盆，剪除所有黑色软烂的根系，用新土重新上盆，暂时减少浇水。这是最严重的养护问题之一。', link: 'watering-guide.html', linkText: '浇水技巧 →' },
      sunburn: { icon: '🔥', title: '日灼/晒伤', desc: '突然暴晒或光照过强导致。将植物移至散射光处，剪除已焦枯的叶片（无法恢复），逐步增加光照让植物适应。', link: 'lighting-guide.html', linkText: '光照指南 →' },
      cold_damage: { icon: '❄️', title: '冻害/冷害', desc: '温度骤降导致。立即移至温暖处（15℃以上），剪除已冻伤变黑的叶片，暂停浇水施肥，等待恢复。多数热带植物不耐10℃以下低温。', link: 'encyclopedia.html', linkText: '查看植物耐寒性 →' },
      adapting: { icon: '📦', title: '正常适应期', desc: '植物换盆或换环境后有1-3周的适应期，期间生长缓慢甚至落叶都是正常的。保持原有养护习惯，给它时间适应新环境，不要频繁移动。', link: 'articles.html', linkText: '更多养护文章 →' },
      dormancy: { icon: '😴', title: '自然休眠', desc: '许多植物在冬季会进入休眠期，生长几乎停滞，部分叶片发黄脱落。这是正常现象，应减少浇水和施肥，待春季回暖后会重新生长。', link: 'articles.html', linkText: '了解植物习性 →' },
      root_bound: { icon: '🪴', title: '根系拥挤（需要换盆）', desc: '根系长满花盆导致生长受限。检查盆底是否有根钻出，换一个比原盆大2-3cm的新盆，修剪部分老根，添加新土。', link: 'repotting-guide.html', linkText: '换盆全攻略 →' },
      nutrient_def: { icon: '🍽️', title: '养分不足', desc: '长期未施肥导致生长缓慢、叶片变薄变淡。生长季节（春夏季）每月施一次稀释的液体肥，秋冬减少或停止施肥。薄肥勤施，切忌浓肥。', link: 'fertilizer-guide.html', linkText: '施肥完全攻略 →' }
    };

    var history = [];
    var totalSteps = 3;

    function renderStep(nodeId) {
      var node = tree[nodeId];
      if (!node) return;

      var html = '';
      // 进度条
      html += '<div class="sc-progress">';
      for (var i = 0; i < totalSteps; i++) {
        var cls = '';
        if (i < history.length) cls = 'done';
        if (i === history.length) cls = 'current';
        html += '<span class="' + cls + '"></span>';
      }
      html += '</div>';

      // 返回按钮
      if (history.length > 0) {
        html += '<button class="sc-back" onclick="window._scBack()">← 返回上一步</button>';
      }

      html += '<div class="sc-question">' + node.question + '</div>';
      html += '<div class="sc-options">';
      node.options.forEach(function(opt, i) {
        if (opt.result) {
          html += '<button class="sc-option" onclick="window._scShowResult(\'' + opt.result + '\')"><span class="sc-emoji">' + opt.emoji + '</span>' + opt.text + '</button>';
        } else if (opt.next) {
          html += '<button class="sc-option" onclick="window._scGoTo(\'' + opt.next + '\')"><span class="sc-emoji">' + opt.emoji + '</span>' + opt.text + '</button>';
        }
      });
      html += '</div>';

      widget.innerHTML = html;
    }

    function renderResult(resultId) {
      var d = diagnoses[resultId];
      if (!d) return;

      var html = '<div class="sc-result">';
      html += '<div class="sc-result-icon">' + d.icon + '</div>';
      html += '<h3>' + d.title + '</h3>';
      html += '<p>' + d.desc + '</p>';
      html += '<div class="sc-actions">';
      html += '<a href="' + d.link + '" class="btn btn-primary">' + d.linkText + '</a>';
      html += '<button class="btn btn-outline" onclick="window._scRestart()">重新检测</button>';
      html += '</div></div>';
      widget.innerHTML = html;
    }

    window._scGoTo = function(nodeId) {
      history.push(nodeId);
      renderStep(nodeId);
    };

    window._scBack = function() {
      history.pop();
      var nodeId = history.length > 0 ? history[history.length - 1] : 'start';
      renderStep(nodeId);
    };

    window._scShowResult = function(resultId) {
      renderResult(resultId);
    };

    window._scRestart = function() {
      history = [];
      renderStep('start');
    };

    // 初始渲染
    renderStep('start');
  }

  initSymptomChecker();

  // ==================== 每日小贴士 ====================
  function initDailyTip() {
    var tipEl = document.getElementById('dailyTipText');
    var refreshBtn = document.getElementById('dailyTipRefresh');
    if (!tipEl) return;

    var tips = [
      { icon: '💧', text: '浇水前用手指插入土壤2-3cm，如果感觉湿润就暂缓浇水。这是最简单的判断方法。' },
      { icon: '☀️', text: '每隔两周旋转花盆90度，让植物均匀受光，避免长歪。' },
      { icon: '🧹', text: '定期用湿布擦拭叶片，不仅能去除灰尘，还能预防红蜘蛛等害虫。' },
      { icon: '🪴', text: '春天是换盆的最佳季节。如果你看到根从盆底钻出来，说明该换大一号的盆了。' },
      { icon: '🌡️', text: '大多数室内植物喜欢15-25℃的环境，远离空调出风口和暖气片。' },
      { icon: '🍂', text: '植物下面几片老叶发黄是正常的自然老化，不要急着施肥或浇水。' },
      { icon: '🔍', text: '每周花两分钟检查叶片背面，这是发现早期病虫害的最佳方式。' },
      { icon: '💊', text: '施肥要"薄肥勤施"——浓度减半，频率加倍，比一次施浓肥安全得多。' },
      { icon: '🛁', text: '给植物"洗澡"——把花盆放进水盆里浸泡10分钟，让土壤均匀吸水，比从上面浇水更好。' },
      { icon: '🌙', text: '新买的植物先隔离一周观察，确认没有病虫害后再和其他植物放在一起。' },
      { icon: '🪨', text: '在盆底铺一层陶粒或碎石，能有效防止积水烂根。' },
      { icon: '✂️', text: '定期修剪枯叶和弱枝，让养分集中供给健康的部分，植物会长得更好。' },
      { icon: '🌿', text: '植物叶片下垂不一定是缺水——先摸一下土壤，如果很湿，可能是烂根了。' },
      { icon: '🏠', text: '每种植物都有自己的"舒适区"，了解它的原生环境能帮你更好地养护。' },
      { icon: '📅', text: '建立一个简单的养护日历，记录浇水、施肥的日期，避免遗忘或过度养护。' }
    ];

    // 基于日期选择每日固定贴士
    var today = new Date();
    var dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    var currentTip = tips[dayOfYear % tips.length];

    function showTip(tip) {
      tipEl.textContent = tip.text;
      var iconEl = document.getElementById('dailyTipIcon');
      if (iconEl) iconEl.textContent = tip.icon;
    }

    showTip(currentTip);

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        var randomTip = tips[Math.floor(Math.random() * tips.length)];
        showTip(randomTip);
      });
    }
  }

  initDailyTip();

  // ==================== 滚动渐入动画 ====================
  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
  });

  // ==================== 移动端菜单 ====================
  var menuToggle = document.querySelector('.menu-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
    });

    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==================== 联系表单 ====================
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      var message = document.getElementById('message').value.trim();
      if (!name || !email || !message) { showFormStatus('请填写所有必填字段', 'error'); return; }
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) { showFormStatus('请输入有效的邮箱地址', 'error'); return; }
      showFormStatus('感谢您的留言！我们会尽快回复您。', 'success');
      contactForm.reset();
    });
  }

  function showFormStatus(text, type) {
    var formStatus = document.getElementById('formStatus');
    if (!formStatus) return;
    formStatus.textContent = text;
    formStatus.className = 'form-status ' + type;
    formStatus.style.display = 'block';
    setTimeout(function() { formStatus.style.display = 'none'; }, 5000);
  }

})();