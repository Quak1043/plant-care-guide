/**
 * 绿植养护指南 - 全局 JavaScript v2
 * 移动端菜单、表单验证、滚动效果、渐入动画
 */

(function() {
  'use strict';

  // 移动端菜单切换
  var menuToggle = document.querySelector('.menu-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      var isOpen = navLinks.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // 点击外部关闭菜单
    document.addEventListener('click', function(e) {
      if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 联系表单验证与提交
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      var message = document.getElementById('message').value.trim();
      var formStatus = document.getElementById('formStatus');

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

  // 滚动时导航栏阴影效果
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    var scrollTimeout;
    window.addEventListener('scroll', function() {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(function() {
          if (window.scrollY > 10) {
            navbar.style.boxShadow = '0 2px 16px rgba(27, 67, 50, 0.08)';
          } else {
            navbar.style.boxShadow = 'none';
          }
          scrollTimeout = null;
        }, 50);
      }
    }, { passive: true });
  }

  // 滚动渐入动画 (IntersectionObserver)
  if ('IntersectionObserver' in window) {
    var observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    };

    var revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // 观察所有带 .reveal 类的元素
    document.querySelectorAll('.reveal').forEach(function(el) {
      revealObserver.observe(el);
    });
  } else {
    // 降级：直接显示所有元素
    document.querySelectorAll('.reveal').forEach(function(el) {
      el.classList.add('visible');
    });
  }

})();