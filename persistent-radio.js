(()=>{
  'use strict';
  const KEY='technorizon-radio-playing';
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');
  if(!audio||!playButton)return;

  const mark=playing=>{try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};

  // Recreate the animated visualizers when necessary. Some mobile/PWA browsers keep a CSS
  // animation frozen after the page has spent time in the background; replacing the nodes
  // gives the browser brand-new animation timelines instead of trying to resume a frozen one.
  const rebuildVisualizer=()=>{
    const playing=!audio.paused;
    ['.radio-wave','.radio-vu-mini'].forEach(selector=>{
      const old=document.querySelector(selector);
      if(!old)return;
      const fresh=old.cloneNode(true);
      fresh.classList.toggle('paused',!playing);
      old.replaceWith(fresh);
    });
  };
  const refreshVisualizer=()=>{
    const playing=!audio.paused;
    const wave=document.querySelector('.radio-wave');
    const vu=document.querySelector('.radio-vu-mini');
    if(wave)wave.classList.toggle('paused',!playing);
    if(vu)vu.classList.toggle('paused',!playing);
  };

  const play=async()=>{try{await audio.play();mark(true);requestAnimationFrame(rebuildVisualizer);return true}catch(e){mark(false);return false}};
  const pause=()=>{audio.pause();mark(false);refreshVisualizer()};

  audio.addEventListener('playing',()=>{mark(true);requestAnimationFrame(rebuildVisualizer)});
  audio.addEventListener('pause',()=>{mark(false);refreshVisualizer()});
  audio.addEventListener('ended',()=>{if(sessionStorage.getItem(KEY)==='1')setTimeout(play,500)});
  audio.addEventListener('error',()=>{if(sessionStorage.getItem(KEY)==='1')setTimeout(play,1500)});

  if('mediaSession' in navigator){
    try{
      navigator.mediaSession.metadata=new MediaMetadata({
        title:'Technorizon.fr',
        artist:'La musique sans frontières',
        album:'Technorizon.fr',
        artwork:[{src:'/ImageLogoFinal.png',sizes:'512x512',type:'image/png'}]
      });
      navigator.mediaSession.setActionHandler('play',play);
      navigator.mediaSession.setActionHandler('pause',pause);
    }catch(e){}
  }

  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(link.hasAttribute('download'))return;
    const raw=link.getAttribute('href')||'';
    if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('javascript:'))return;
    if(audio.paused&&sessionStorage.getItem(KEY)!=='1')return;
    let url;
    try{url=new URL(link.href,location.href)}catch(e){return}
    if(!/^https?:$/.test(url.protocol)||url.href===location.href)return;
    if(link.target==='_blank')return;
    event.preventDefault();
    mark(true);
    const opened=window.open(url.href,'_blank','noopener,noreferrer');
    if(!opened){
      const lang=localStorage.getItem('technorizon-lang')||'fr';
      console.info(lang==='fr'?'Technorizon : navigation bloquée pour préserver le direct.':'Technorizon: navigation blocked to preserve live playback.');
    }
  },true);

  const restoreHomepage=()=>{
    if(sessionStorage.getItem(KEY)==='1'&&audio.paused){play();return}
    if(!audio.paused){
      // Two frames ensure the page is actually painted again before new animation timelines start.
      requestAnimationFrame(()=>requestAnimationFrame(rebuildVisualizer));
    }else refreshVisualizer();
  };
  window.addEventListener('pageshow',()=>setTimeout(restoreHomepage,60));
  window.addEventListener('focus',()=>setTimeout(restoreHomepage,60));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(restoreHomepage,60)});
  setTimeout(refreshVisualizer,250);
})();
