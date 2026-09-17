(()=>{
  const STREAM='https://radio.technorizon.fr/listen/technorizon/radio.mp3';
  const KEY='technorizon-radio-playing';
  const INTERNAL_SELECTOR='a[href]';
  let audio=document.getElementById('v2-audio');
  if(!audio){
    audio=document.createElement('audio');
    audio.id='v2-audio';
    audio.preload='none';
    audio.src=STREAM;
    document.body.appendChild(audio);
  }
  if(!audio.src) audio.src=STREAM;
  const playButton=document.getElementById('v2-play');
  const state=playing=>{if(playButton)playButton.textContent=playing?'❚❚':'▶'};
  const mark=playing=>{try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};
  const play=async()=>{try{await audio.play();mark(true);state(true);return true}catch(e){state(false);return false}};
  const pause=()=>{audio.pause();mark(false);state(false)};
  if(playButton){
    playButton.onclick=async()=>{audio.paused?await play():pause()};
  }
  audio.addEventListener('playing',()=>{mark(true);state(true)});
  audio.addEventListener('pause',()=>state(false));
  audio.addEventListener('ended',()=>{if(sessionStorage.getItem(KEY)==='1')play()});
  audio.addEventListener('error',()=>{if(sessionStorage.getItem(KEY)==='1')setTimeout(play,1500)});

  // Media Session improves lock-screen/background controls where supported.
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

  // Restore playback after a normal page load when the listener was already listening.
  if(sessionStorage.getItem(KEY)==='1') play();

  // Internal pages are loaded into the current document so the same audio element survives.
  document.addEventListener('click',async event=>{
    const link=event.target.closest(INTERNAL_SELECTOR);
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(link.target==='_blank'||link.hasAttribute('download'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin)return;
    if(url.hash&&url.pathname===location.pathname)return;
    if(!/\.html$|\/$/.test(url.pathname))return;
    event.preventDefault();
    const wasPlaying=!audio.paused||sessionStorage.getItem(KEY)==='1';
    try{
      const response=await fetch(url.href,{cache:'no-store'});
      if(!response.ok)throw new Error('navigation');
      const html=await response.text();
      const doc=new DOMParser().parseFromString(html,'text/html');
      // Complex pages own their scripts; use normal navigation there. Playback will auto-resume.
      location.href=url.href;
      if(wasPlaying)mark(true);
    }catch(e){
      if(wasPlaying)mark(true);
      location.href=url.href;
    }
  });

  // Do not pause on visibilitychange/page hide: browsers may keep the live stream in background.
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&sessionStorage.getItem(KEY)==='1'&&audio.paused)play();
  });
})();
