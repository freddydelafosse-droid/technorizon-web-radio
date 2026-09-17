(()=>{
  'use strict';
  const KEY='technorizon-radio-playing';
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');

  // Secondary pages must never create another audio stream.
  if(!audio||!playButton)return;

  const mark=playing=>{try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};
  const play=async()=>{try{await audio.play();mark(true);return true}catch(e){mark(false);return false}};
  const pause=()=>{audio.pause();mark(false)};

  audio.addEventListener('playing',()=>mark(true));
  audio.addEventListener('pause',()=>mark(false));
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
})();
