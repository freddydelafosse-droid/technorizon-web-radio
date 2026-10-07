(()=>{
  'use strict';
  const KEY='technorizon-radio-playing';
  let wanted=false,retryTimer=0,userPauseUntil=0;
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');

  // Secondary pages must never create another audio stream.
  if(!audio||!playButton)return;

  const mark=playing=>{wanted=playing;try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};
  try{wanted=sessionStorage.getItem(KEY)==='1'}catch(e){}
  const retry=delay=>{if(!wanted||retryTimer)return;retryTimer=setTimeout(async()=>{retryTimer=0;if(wanted&&audio.paused)await play()},delay)};
  const play=async()=>{wanted=true;try{await audio.play();mark(true);return true}catch(e){retry(1200);return false}};
  const pause=()=>{userPauseUntil=Date.now()+5000;wanted=false;if(retryTimer){clearTimeout(retryTimer);retryTimer=0}audio.pause();mark(false)};

  audio.addEventListener('playing',()=>mark(true));
  // A mobile browser/network interruption must not be mistaken for a user pause.
  audio.addEventListener('pause',()=>{if(Date.now()<userPauseUntil){wanted=false;mark(false);return}if(wanted)retry(700)});
  audio.addEventListener('ended',()=>retry(500));
  audio.addEventListener('error',()=>retry(1200));
  audio.addEventListener('stalled',()=>retry(900));
  audio.addEventListener('abort',()=>retry(900));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&wanted&&audio.paused)retry(150)});
  window.addEventListener('pageshow',()=>{if(wanted&&Date.now()>=userPauseUntil&&audio.paused)retry(150)});
  // Let every player skin explicitly record a user pause before audio.pause() fires.
  window.addEventListener('technorizon-user-pause',pause);

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
})();
