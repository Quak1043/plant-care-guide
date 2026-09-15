/**
 * 植物症状自查器的问答树与诊断库。
 * 只有页面存在 #checkerWidget 时才会被动态导入，其他页面不承担这部分体积。
 */

export const TREE = {
  start: {
    q: '你的植物主要出现了什么问题？',
    o: [
      { t: '叶片发黄', i: 'alert-circle', n: 'yellow' },
      { t: '叶片有斑点/斑块', i: 'alert-triangle', n: 'spots' },
      { t: '叶子上有虫子', i: 'bug', n: 'bugs' },
      { t: '叶片枯萎/下垂', i: 'droplet', n: 'wilt' },
      { t: '植物停止生长', i: 'clock', n: 'stunt' },
    ],
  },
  yellow: {
    q: '叶片发黄的具体情况是？',
    o: [
      { t: '老叶先黄，逐渐脱落', i: 'leaf', r: 'old_yellow' },
      { t: '新叶发黄，叶脉绿色', i: 'feather', r: 'iron_def' },
      { t: '整株叶片均匀发黄', i: 'water', r: 'overwater' },
      { t: '叶尖和叶缘发黄干枯', i: 'sun', r: 'underwater' },
    ],
  },
  spots: {
    q: '斑点是什么样子的？',
    o: [
      { t: '白色粉末状斑点', i: 'wind', r: 'powdery' },
      { t: '褐色/黑色圆形斑点', i: 'alert-circle', r: 'leaf_spot' },
      { t: '黄白色小点（密集）', i: 'grid', r: 'spider_mite' },
      { t: '水渍状软烂斑点', i: 'water', r: 'bacteria' },
    ],
  },
  bugs: {
    q: '你看到的是什么虫子？',
    o: [
      { t: '绿色/黑色小虫聚集在嫩芽', i: 'bug', r: 'aphids' },
      { t: '褐色小壳状突起', i: 'shield', r: 'scale' },
      { t: '花盆周围飞的小黑虫', i: 'wind', r: 'fungus_gnat' },
      { t: '白色棉絮状物', i: 'snowflake', r: 'mealybug' },
    ],
  },
  wilt: {
    q: '叶片枯萎伴随什么情况？',
    o: [
      { t: '盆土很湿，但叶片发软下垂', i: 'water', r: 'root_rot' },
      { t: '盆土很干，叶片卷曲发脆', i: 'sun', r: 'underwater' },
      { t: '叶片边缘焦枯卷曲', i: 'fire', r: 'sunburn' },
      { t: '突然大面积萎蔫', i: 'snowflake', r: 'cold_damage' },
    ],
  },
  stunt: {
    q: '停止生长持续多久了？',
    o: [
      { t: '刚换盆/换环境不久', i: 'box', r: 'adapting' },
      { t: '冬季/低温期', i: 'snowflake', r: 'dormancy' },
      { t: '已经很久了，根系钻出盆底', i: 'pot', r: 'root_bound' },
      { t: '长期没施肥', i: 'flask', r: 'nutrient_def' },
    ],
  },
};

export const DIAGNOSES = {
  old_yellow: {
    i: 'leaf',
    title: '正常老化',
    text: '老叶自然发黄脱落是正常现象，不必担心。植物会优先将养分供给新叶，老叶会逐渐被淘汰。只需剪掉黄叶即可。',
    href: 'articles.html',
    linkText: '了解更多养护常识',
  },
  iron_def: {
    i: 'feather',
    title: '缺铁性黄化',
    text: '新叶发黄但叶脉仍绿，是典型的缺铁症状。可使用螯合铁或硫酸亚铁补充，同时检查土壤pH是否偏碱。',
    href: 'fertilizer-guide.html',
    linkText: '施肥指南',
  },
  overwater: {
    i: 'water',
    title: '浇水过多',
    text: '这是新手最常见的问题！盆土长期过湿导致根系缺氧。立即停止浇水，检查盆底排水孔，必要时换土修剪烂根。记住：宁干勿湿。',
    href: 'watering-guide.html',
    linkText: '浇水完全指南',
  },
  underwater: {
    i: 'sun',
    title: '缺水干旱',
    text: '植物严重缺水。将花盆浸入水中10-15分钟让土壤充分吸水，之后恢复正常浇水频率。用手指插入土中2-3cm检测干湿度。',
    href: 'watering-guide.html',
    linkText: '浇水完全指南',
  },
  powdery: {
    i: 'wind',
    title: '白粉病',
    text: '真菌病害，通风不良时高发。用湿布擦除白粉，喷洒小苏打溶液（1L水+1茶匙小苏打），严重时使用三唑酮等杀菌剂。增加通风、降低湿度。',
    href: 'pest-article.html',
    linkText: '病虫害防治大全',
  },
  leaf_spot: {
    i: 'alert-circle',
    title: '叶斑病',
    text: '真菌或细菌引起的叶部病害。立即剪除病叶并销毁，避免叶面浇水，喷洒多菌灵或波尔多液。增强通风，合理施肥提高抗性。',
    href: 'pest-article.html',
    linkText: '病虫害防治大全',
  },
  spider_mite: {
    i: 'bug',
    title: '红蜘蛛（叶螨）',
    text: '干燥炎热环境高发。提高空气湿度，用清水冲洗叶片正反面，严重时使用阿维菌素等杀螨剂。白纸测试法可快速确认。',
    href: 'pest-article.html#red-spider-mite',
    linkText: '红蜘蛛防治详情',
  },
  bacteria: {
    i: 'alert-triangle',
    title: '细菌性软腐病',
    text: '细菌感染导致组织软烂，有恶臭。立即剪除所有病部，伤口涂抹多菌灵，减少浇水，增强通风。严重时整株可能无法挽救。',
    href: 'pest-article.html',
    linkText: '更多病害知识',
  },
  aphids: {
    i: 'bug',
    title: '蚜虫',
    text: '最常见的害虫之一。用强力水流冲洗，喷洒肥皂水（1L水+5ml洗洁精），投放瓢虫等天敌。黄色粘虫板可辅助诱捕。',
    href: 'pest-article.html#aphids',
    linkText: '蚜虫防治详情',
  },
  scale: {
    i: 'shield',
    title: '介壳虫',
    text: '体表有蜡质壳，普通农药难以渗透。用旧牙刷蘸肥皂水刷洗，75%酒精棉签涂抹溶解蜡壳，严重时使用噻嗪酮等专用药剂。',
    href: 'pest-article.html#scale',
    linkText: '介壳虫防治详情',
  },
  fungus_gnat: {
    i: 'wind',
    title: '小黑飞（蕈蚊）',
    text: '因盆土长期潮湿引起。最根本的办法是控制浇水，表土覆盖粗砂或陶粒，使用黄色粘虫板。Bti菌剂浇灌可杀灭幼虫。',
    href: 'pest-article.html#fungus-gnat',
    linkText: '小黑飞防治详情',
  },
  mealybug: {
    i: 'snowflake',
    title: '粉蚧',
    text: '白色棉絮状害虫，藏在叶腋和茎节。用酒精棉签清除，喷洒矿物油窒息。每周检查一次，发现立即处理防止扩散。',
    href: 'pest-article.html',
    linkText: '病虫害防治大全',
  },
  root_rot: {
    i: 'alert-triangle',
    title: '烂根',
    text: '浇水过多或排水不良导致根系腐烂。立即脱盆，剪除所有黑色软烂的根系，用新土重新上盆，暂时减少浇水。这是最严重的养护问题之一。',
    href: 'watering-guide.html',
    linkText: '浇水技巧',
  },
  sunburn: {
    i: 'fire',
    title: '日灼/晒伤',
    text: '突然暴晒或光照过强导致。将植物移至散射光处，剪除已焦枯的叶片（无法恢复），逐步增加光照让植物适应。',
    href: 'lighting-guide.html',
    linkText: '光照指南',
  },
  cold_damage: {
    i: 'snowflake',
    title: '冻害/冷害',
    text: '温度骤降导致。立即移至温暖处（15℃以上），剪除已冻伤变黑的叶片，暂停浇水施肥，等待恢复。多数热带植物不耐10℃以下低温。',
    href: 'encyclopedia.html',
    linkText: '查看植物耐寒性',
  },
  adapting: {
    i: 'box',
    title: '正常适应期',
    text: '植物换盆或换环境后有1-3周的适应期，期间生长缓慢甚至落叶都是正常的。保持原有养护习惯，给它时间适应新环境，不要频繁移动。',
    href: 'repotting-guide.html',
    linkText: '换盆后怎么养',
  },
  dormancy: {
    i: 'clock',
    title: '自然休眠',
    text: '许多植物在冬季会进入休眠期，生长几乎停滞，部分叶片发黄脱落。这是正常现象，应减少浇水和施肥，待春季回暖后会重新生长。',
    href: 'articles.html',
    linkText: '了解植物习性',
  },
  root_bound: {
    i: 'pot',
    title: '根系拥挤（需要换盆）',
    text: '根系长满花盆导致生长受限。检查盆底是否有根钻出，换一个比原盆大2-3cm的新盆，修剪部分老根，添加新土。',
    href: 'repotting-guide.html',
    linkText: '换盆全攻略',
  },
  nutrient_def: {
    i: 'flask',
    title: '养分不足',
    text: '长期未施肥导致生长缓慢、叶片变薄变淡。生长季节（春夏季）每月施一次稀释的液体肥，秋冬减少或停止施肥。薄肥勤施，切忌浓肥。',
    href: 'fertilizer-guide.html',
    linkText: '施肥完全攻略',
  },
};
