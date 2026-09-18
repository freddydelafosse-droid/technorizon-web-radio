(() => {
  'use strict';
  if (window.__TECHNORIZON_GAMES_NATIVE__) return;
  window.__TECHNORIZON_GAMES_NATIVE__ = true;

  const mainAudio = document.getElementById('v2-audio');
  let layer = null;
  let opening = false;
  let radioWasPlaying = false;
  let gameAudio = null;

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

  const closeGames = event => {
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
    layer = null;
    opening = false;
    document.body.style.overflow = '';
    resumeRadio();
  };

  const openGames = async () => {
    if (layer || opening) return;
    opening = true;
    radioWasPlaying = Boolean(mainAudio && !mainAudio.paused);

    const region = localStorage.getItem('technorizon-region') ||
      (localStorage.getItem('technorizon-lang') === 'en' ? 'gb' : 'fr');
    localStorage.setItem('technorizon-games-lang', region);

    layer = document.createElement('section');
    layer.className = 'tz-games-layer';
    layer.setAttribute('aria-label', 'Jeux Technorizon');
    layer.innerHTML = '<div class="tz-games-host"><p style="padding:70px 20px;text-align:center;color:#aebdcb;font-family:Arial,sans-serif">Chargement…</p></div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';

    try {
      const [response] = await Promise.all([
        fetch('/jeux.html', { cache: 'no-store' }),
        ensureStyle('/jeux.css?v=6'),
      ]);
      if (!response.ok) throw new Error('Games unavailable');
      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      parsed.querySelectorAll('script').forEach(script => script.remove());
      const host = layer.querySelector('.tz-games-host');
      host.innerHTML = parsed.body.innerHTML;

      host.querySelector('.games-home')?.addEventListener('click', closeGames, { capture: true });

      await runScript('/jeux-data.js?v=1');
      await runScript('/jeux.js?v=9');

      gameAudio = host.querySelector('#blind-audio');
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
    if (url.origin !== location.origin || !url.pathname.endsWith('/jeux.html')) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openGames();
  }, true);
})();
