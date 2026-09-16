// Keep listening intent through interruptions and a return from a site page.
(() => {
  const audio = document.getElementById('v2-audio');
  const button = document.getElementById('v2-play');
  if (!audio || !button) return;

  const key = 'technorizon-listening-return';
  const maxAge = 30 * 60 * 1000;
  let wanted = false;
  let pending = false;
  let operation = 0;
  const hint = document.createElement('p');
  hint.id = 'v2-play-status';
  hint.hidden = true;
  hint.setAttribute('role', 'status');
  hint.style.cssText = 'margin:12px 0 0;color:#a9bac9;font-size:13px;line-height:1.4';
  button.insertAdjacentElement('afterend', hint);
  button.setAttribute('aria-describedby', hint.id);
  audio.setAttribute('playsinline', '');

  function clearSaved() {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    wanted = saved?.playing === true && Date.now() >= saved.at && Date.now() - saved.at < maxAge;
  } catch (_) {}
  clearSaved();

  function render() {
    const playing = !audio.paused && !audio.ended;
    const en = document.documentElement.lang === 'en';
    button.textContent = pending ? '…' : playing ? '❚❚' : '▶';
    button.setAttribute('aria-label', pending ? (en ? 'Cancel connection' : 'Annuler la connexion') : playing ? (en ? 'Pause radio' : 'Mettre la radio en pause') : (en ? 'Play radio' : 'Écouter la radio'));
    button.setAttribute('aria-pressed', String(playing));
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch (_) {}
    }
  }

  async function start(automatic = false) {
    if (pending || (automatic && (!wanted || document.visibilityState === 'hidden'))) return;
    if (!audio.paused && !audio.ended) return;
    wanted = true;
    pending = true;
    const token = ++operation;
    hint.hidden = true;
    render();
    try {
      if (audio.error || audio.ended) audio.load();
      await audio.play();
      if (token !== operation) return;
    } catch (error) {
      if (token !== operation) return;
      if (!automatic) wanted = false;
      const en = document.documentElement.lang === 'en';
      hint.textContent = error?.name === 'NotAllowedError'
        ? (en ? 'Tap ▶ to resume listening.' : 'Touche ▶ pour reprendre l’écoute.')
        : (en ? 'Connection interrupted. Tap ▶ to try again.' : 'Connexion interrompue. Touche ▶ pour réessayer.');
      hint.hidden = false;
    } finally {
      if (token === operation) { pending = false; render(); }
    }
  }

  function stop() {
    wanted = false;
    pending = false;
    operation++;
    clearSaved();
    audio.pause();
    hint.hidden = true;
    render();
  }

  button.onclick = () => {
    if (pending || !audio.paused) stop();
    else start();
  };
  audio.addEventListener('playing', () => { hint.hidden = true; render(); });
  // A system interruption must not erase the user's listening intent.
  audio.addEventListener('pause', render);
  audio.addEventListener('ended', render);
  const resume = () => { if (wanted) start(true); };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('focus', resume);
  window.addEventListener('pageshow', () => { clearSaved(); resume(); });
  window.addEventListener('online', resume);
  window.addEventListener('pagehide', () => {
    try {
      if (wanted) sessionStorage.setItem(key, JSON.stringify({ playing: true, at: Date.now() }));
      else clearSaved();
    } catch (_) {}
  });

  if ('mediaSession' in navigator) {
    for (const [action, handler] of [['play', () => start()], ['pause', stop], ['stop', stop]]) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {}
    }
  }
  render();
  resume();
})();
