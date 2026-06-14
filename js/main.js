/**
 * 绿植养护指南 - 全局 JavaScript
 */

(function() {
  'use strict';

  // 移动端菜单切换
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      const isOpen = navLinks.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // 点击导航链接后关闭菜单
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 联系表单验证与提交
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      const formStatus = document.getElementById('formStatus');

      // 简单验证
      if (!name || !email || !message) {
        showFormStatus('请填写所有必填字段', 'error');
        return;
      }

      // 邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showFormStatus('请输入有效的邮箱地址', 'error');
        return;
      }

      // 模拟提交成功
      showFormStatus('感谢您的留言！我们会尽快回复您。', 'success');
      contactForm.reset();
    });
  }

  function showFormStatus(text, type) {
    const formStatus = document.getElementById('formStatus');
    if (!formStatus) return;

    formStatus.textContent = text;
    formStatus.className = 'form-status ' + type;
    formStatus.style.display = 'block';

    setTimeout(function() {
      formStatus.style.display = 'none';
    }, 5000);
  }

  // 滚动时导航栏阴影效果
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      } else {
        navbar.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      }
    });
  }

})();
