(()=>{
  'use strict';
  const KEY='technorizon-radio-playing';
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');

  // Only the homepage owns the live audio stream. Never create a second player on child pages.
  if(!audio||!playButton)return;

  const mark=playing=>{try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};
  const refreshVisualizer=()=>{
    const playing=!audio.paused;
    const wave=document.querySelector('.radio-wave');
    const vu=document.querySelector('.radio-vu-mini');
    if(wave)wave.classList.toggle('paused',!playing);
    if(vu)vu.classList.toggle('paused',!playing);
    if(playing){
      document.querySelectorAll('.radio-wave i,.radio-vu-mini i').forEach(bar=>{
        bar.style.animation='none';
        void bar.offsetHeight;
        bar.style.animation='';
      });
    }
  };
  const play=async()=>{try{await audio.play();mark(true);requestAnimationFrame(refreshVisualizer);return true}catch(e){mark(false);return false}};
  const pause=()=>{audio.pause();mark(false);refreshVisualizer()};

  audio.addEventListener('playing',()=>{mark(true);requestAnimationFrame(refreshVisualizer)});
  audio.addEventListener('pause',()=>{mark(false);refreshVisualizer()});
  audio.addEventListener('ended',()=>{if(sessionStorage.getItem(KEY)==='1')setTimeout(play,500)});
  audio.addEventListener('error',()=>{if(sessionStorage.getItem(KEY)==='1')setTimeout(play,1500)});

  // Keep lock-screen / background controls available where the browser supports Media Session.
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

  // While listening, open destinations separately so the homepage and its single live stream survive.
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

  // Browsers can freeze CSS animations while the homepage is hidden. Force the equalizer to restart on return.
  const restoreHomepage=()=>{
    if(sessionStorage.getItem(KEY)==='1'&&audio.paused)play();
    else requestAnimationFrame(refreshVisualizer);
  };
  window.addEventListener('pageshow',()=>setTimeout(restoreHomepage,30));
  window.addEventListener('focus',()=>setTimeout(restoreHomepage,30));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(restoreHomepage,30)});
  setTimeout(refreshVisualizer,250);
})();
