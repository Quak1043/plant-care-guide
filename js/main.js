/**
 * 绿植养护指南 v3 - 交互脚本
 * 移动端菜单、导航阴影、滚动渐入、表单
 */
(function(){
  'use strict';

  // 移动端菜单
  var toggle=document.querySelector('.menu-toggle');
  var nav=document.querySelector('.nav-links');
  if(toggle&&nav){
    toggle.addEventListener('click',function(){
      nav.classList.toggle('active');
      toggle.setAttribute('aria-expanded',nav.classList.contains('active'));
    });
    nav.querySelectorAll('a').forEach(function(l){
      l.addEventListener('click',function(){
        nav.classList.remove('active');
        toggle.setAttribute('aria-expanded','false');
      });
    });
    document.addEventListener('click',function(e){
      if(!nav.contains(e.target)&&!toggle.contains(e.target)){
        nav.classList.remove('active');
        toggle.setAttribute('aria-expanded','false');
      }
    });
  }

  // 导航栏滚动阴影
  var navbar=document.querySelector('.navbar');
  if(navbar){
    var scrollTimer;
    window.addEventListener('scroll',function(){
      if(!scrollTimer){
        scrollTimer=setTimeout(function(){
          navbar.classList.toggle('scrolled',window.scrollY>10);
          scrollTimer=null;
        },50);
      }
    },{passive:true});
  }

  // 联系表单
  var form=document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var name=document.getElementById('name').value.trim();
      var email=document.getElementById('email').value.trim();
      var msg=document.getElementById('message').value.trim();
      if(!name||!email||!msg){showStatus('请填写所有必填字段','error');return;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showStatus('请输入有效的邮箱地址','error');return;}
      showStatus('感谢您的留言！我们会尽快回复您。','success');
      form.reset();
    });
  }
  function showStatus(text,type){
    var el=document.getElementById('formStatus');
    if(!el)return;
    el.textContent=text;el.className='form-status '+type;el.style.display='block';
    setTimeout(function(){el.style.display='none';},5000);
  }

  // 滚动渐入
  if('IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}
      });
    },{rootMargin:'0px 0px -40px 0px',threshold:0.1});
    document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
  }else{
    document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('visible');});
  }
})();