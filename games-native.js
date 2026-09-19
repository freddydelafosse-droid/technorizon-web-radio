(() => {
  'use strict';
  if (window.__TECHNORIZON_GAMES_NATIVE__) return;
  window.__TECHNORIZON_GAMES_NATIVE__ = true;

  const mainAudio = document.getElementById('v2-audio');
  const originalTitle = document.title;
  const pages = {
    'infos.html': { page: 'infos', inlineScripts: true },
    'jeux.html': { page: 'games', style: '/jeux.css?v=13', scripts: ['/jeux-data.js?v=3', '/jeux.js?v=19'] },
    'a-propos.html': { page: 'about', scripts: ['/content-pages-i18n.js?v=1'] },
    'contact.html': { page: 'contact', scripts: ['/content-pages-i18n.js?v=1'] },
    'technoroscope.html': { page: 'technoroscope', scripts: ['/technoroscope-i18n.js?v=9'] },
    'dedicaces.html': { page: 'dedicaces', inlineScripts: true },
  };
  let layer = null;
  let opening = false;
  let radioWasPlaying = false;
  let gameAudio = null;
  let temporaryStyles = [];

  const ensureStyle = href => new Promise(resolve => {
    const absolute = new URL(href, location.href).href;
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .find(link => link.href === absolute);
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
    setTimeout(resolve, 2500);
  });

  const runScript = async path => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    const source = await response.text();
    new Function(`${source}\n//# sourceURL=${path}`)();
  };

  const resumeRadio = () => {
    if (!radioWasPlaying || !mainAudio || !mainAudio.paused) return;
    mainAudio.play().catch(() => {});
  };

  const closePage = event => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
    if (gameAudio) {
      gameAudio.pause();
      gameAudio.removeAttribute('src');
      gameAudio.load();
    }
    gameAudio = null;
    if (layer) layer.remove();
    temporaryStyles.forEach(style => style.remove());
    temporaryStyles = [];
    layer = null;
    opening = false;
    document.body.style.overflow = '';
    delete document.body.dataset.contentPage;
    delete window.langSelect;
    delete window.intro;
    delete window.back;
    delete window.title;
    delete window.sub;
    document.title = originalTitle;
    resumeRadio();
  };

  const openPage = async path => {
    if (layer || opening) return;
    const config = pages[path];
    if (!config) return;
    opening = true;
    radioWasPlaying = Boolean(mainAudio && !mainAudio.paused);

    const region = localStorage.getItem('technorizon-region') ||
      (localStorage.getItem('technorizon-lang') === 'en' ? 'gb' : 'fr');
    localStorage.setItem('technorizon-content-region', region);
    if (config.page === 'games') localStorage.setItem('technorizon-games-lang', region);
    if (config.page === 'technoroscope') localStorage.setItem('technorizon-horoscope-lang', region);
    document.body.dataset.contentPage = config.page;

    layer = document.createElement('section');
    layer.className = 'tz-games-layer';
    layer.style.zIndex = '900';
    layer.setAttribute('aria-label', config.page === 'games' ? 'Jeux Technorizon' : 'Contenu Technorizon');
    layer.innerHTML = '<div class="tz-games-host"><p style="padding:70px 20px;text-align:center;color:#aebdcb;font-family:Arial,sans-serif">Chargement…</p></div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';
    const jayaFab = document.querySelector('.jaya-fab');
    const jayaPanel = document.querySelector('.jaya-panel');
    if (jayaFab) { jayaFab.style.setProperty('z-index','100001','important'); jayaFab.style.setProperty('display','block','important'); }
    if (jayaPanel) jayaPanel.style.setProperty('z-index','100001','important');

    try {
      const tasks = [fetch(`/${path}`, { cache: 'no-store' })];
      if (config.style) tasks.push(ensureStyle(config.style));
      const [response] = await Promise.all(tasks);
      if (!response.ok) throw new Error('Content unavailable');
      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const inlineScripts = [...parsed.scripts]
        .filter(script => !script.src)
        .map(script => script.textContent)
        .filter(Boolean);
      parsed.querySelectorAll('head style').forEach(sourceStyle => {
        const style = document.createElement('style');
        style.textContent = sourceStyle.textContent
          .replace(/html\s*,\s*body\s*\{/g, '.tz-games-host{')
          .replace(/(^|})\s*body\s*\{/g, '$1 .tz-games-host{');
        document.head.appendChild(style);
        temporaryStyles.push(style);
      });
      parsed.querySelectorAll('script').forEach(script => script.remove());
      const host = layer.querySelector('.tz-games-host');
      host.innerHTML = parsed.body.innerHTML;

      host.querySelectorAll('.games-home,.back,#back,a[href="/"],a[href="index.html"]').forEach(link => {
        link.addEventListener('click', closePage, { capture: true });
      });

      if (config.page === 'technoroscope') {
        window.langSelect = host.querySelector('#langSelect');
        window.intro = host.querySelector('#intro');
        window.back = host.querySelector('#back');
      }
      if (config.page === 'infos') {
        window.back = host.querySelector('#back');
        window.title = host.querySelector('#title');
        window.sub = host.querySelector('#sub');
      }
      for (const script of config.scripts || []) await runScript(script);
      if (config.inlineScripts) {
        for (const source of inlineScripts) new Function(source)();
      }

      gameAudio = config.page === 'games' ? host.querySelector('#blind-audio') : null;
      gameAudio?.addEventListener('play', () => {
        if (mainAudio && !mainAudio.paused) mainAudio.pause();
      });

      resumeRadio();
    } catch (error) {
      const host = layer?.querySelector('.tz-games-host');
      if (host) host.innerHTML = '<p style="padding:70px 20px;text-align:center;color:#aebdcb;font-family:Arial,sans-serif">Contenu momentanément indisponible.</p>';
    } finally {
      opening = false;
    }
  };

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    let url;
    try {
      url = new URL(link.href, location.href);
    } catch (_) {
      return;
    }
    if (url.origin !== location.origin) return;
    const path = url.pathname.split('/').pop();
    if (!pages[path]) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openPage(path);
  }, true);
})();
