/**
 * 撤回广告同意入口（Google 官方 CMP / Funding Choices）。
 *
 * 为什么需要：Google AdSense 在欧洲经济区、英国和瑞士要求发布商使用经认证的
 * 意见征求管理平台，并且必须为用户提供**随时撤回同意**的入口。网站页脚的
 * 「隐私设置」按钮就是这个入口，隐私政策里也向用户承诺了它存在。
 *
 * 实现要点：
 *   · CMP 脚本是 async 加载的，window.googlefc 未必在 boot 时就绪，所以轮询等待，
 *     最长约 5 秒后放弃；
 *   · 没有 CMP（例如大陆网络下 fundingchoicesmessages.google.com 不可达）时，
 *     按钮保持 hidden，不会留下一个点了没反应的死按钮；
 *   · googlefc.showRevocationMessage 必须通过 callbackQueue.push 调用，
 *     直接执行会因为 CMP 尚未初始化完成而静默失败。
 */

const POLL_INTERVAL = 250;
const POLL_LIMIT = 20; // 250ms × 20 = 5s

export function initConsentControls() {
  const button = document.getElementById('privacySettings');
  if (!button) return;

  const reveal = () => {
    button.hidden = false;
  };

  const cfc = window.googlefc;

  if (cfc) {
    reveal();
  } else {
    let attempts = 0;
    const timer = setInterval(() => {
      if (window.googlefc) {
        clearInterval(timer);
        reveal();
      } else if (++attempts >= POLL_LIMIT) {
        clearInterval(timer);
      }
    }, POLL_INTERVAL);
  }

  button.addEventListener('click', () => {
    const api = window.googlefc;
    if (!api?.callbackQueue?.push) return;
    try {
      api.callbackQueue.push(api.showRevocationMessage);
    } catch {
      // CMP 存在但调用失败（例如同意状态尚未就绪）时静默降级
    }
  });
}
