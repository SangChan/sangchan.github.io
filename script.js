(function(){
  var STORAGE_KEY = 'lang';
  var root = document.documentElement;
  var panels = document.querySelectorAll('.i18n');
  var langButtons = document.querySelectorAll('.lang-item');

  function setLang(code){
    panels.forEach(function(p){ p.hidden = p.dataset.lang !== code; });
    langButtons.forEach(function(b){ b.classList.toggle('active', b.dataset.lang === code); });
    root.setAttribute('lang', code);
    var btn = document.querySelector('.lang-item[data-lang="' + code + '"]');
    if (btn && btn.dataset.title) document.title = btn.dataset.title;
    try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
  }

  langButtons.forEach(function(b){
    b.addEventListener('click', function(){ setLang(b.dataset.lang); });
  });

  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  var initial = saved || (navigator.language && navigator.language.slice(0, 2) === 'en' ? 'en' : 'ko');
  setLang(initial);

  var links = document.querySelectorAll('.toc-item');
  var map = {};
  links.forEach(function(a){ map[a.getAttribute('href').slice(1)] = a; });
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var link = map[entry.target.id];
      if(!link) return;
      if(entry.isIntersecting){
        var group = entry.target.closest('.i18n');
        group.querySelectorAll('.toc-item').forEach(function(l){ l.classList.remove('active'); });
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
  document.querySelectorAll('.chapter[id], .contact[id]').forEach(function(sec){ observer.observe(sec); });
})();
