/**
 * 绿植养护指南 - 全局 JavaScript v4
 * 动画系统 + 移动端菜单 + 表单验证
 */

(function() {
  'use strict';

  // ==================== 滚动渐入动画 ====================
  var observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };

  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 观察所有 .reveal 元素
  document.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
  });

  // 卡片交错入场（支持动态添加）
  var cardObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var cards = entry.target.querySelectorAll('.card-stagger, .card:not(.no-stagger)');
        cards.forEach(function(card, idx) {
          setTimeout(function() {
            card.classList.add('visible');
          }, idx * 80);
        });
        var children = entry.target.children;
        for (var c = 0; c < children.length; c++) {
          if (children[c].classList.contains('card-stagger') || (children[c].classList.contains('card') && !children[c].classList.contains('no-stagger'))) {
            setTimeout(function(child) {
              return function() { child.classList.add('visible'); };
            }(children[c]), c * 80);
          }
        }
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.card-stagger-container, .card-grid').forEach(function(el) {
    cardObserver.observe(el);
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

  // ==================== 导航栏滚动阴影 ====================
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ==================== 点击涟漪效果 ====================
  document.addEventListener('click', function(e) {
    var rippleEl = e.target.closest('.ripple');
    if (!rippleEl) return;

    var ripple = document.createElement('span');
    ripple.className = 'ripple-effect';

    var rect = rippleEl.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

    rippleEl.appendChild(ripple);
    ripple.addEventListener('animationend', function() {
      ripple.remove();
    });
  });

  // ==================== 联系表单验证 ====================
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      var message = document.getElementById('message').value.trim();

      if (!name || !email || !message) {
        showFormStatus('请填写所有必填字段', 'error');
        return;
      }

      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showFormStatus('请输入有效的邮箱地址', 'error');
        return;
      }

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
    setTimeout(function() {
      formStatus.style.display = 'none';
    }, 5000);
  }

})();