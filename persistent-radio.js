(()=>{
  'use strict';
  const KEY='technorizon-radio-playing';
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');

  // Child page opened from the live homepage: Home must return to the ORIGINAL player tab,
  // not create a second paused homepage while the first one keeps playing.
  if(!audio||!playButton){
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[href]');
      if(!link||!window.opener||window.opener.closed)return;
      let url;
      try{url=new URL(link.href,location.href)}catch(e){return}
      const path=url.pathname.replace(/\/+$/,'/');
      const isHome=url.origin===location.origin&&(path==='/'||/\/index\.html$/i.test(path));
      if(!isHome)return;
      event.preventDefault();
      try{window.opener.focus();window.close()}catch(e){}
    },true);
    return;
  }

  const mark=playing=>{try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};
  const play=async()=>{try{await audio.play();mark(true);return true}catch(e){mark(false);return false}};
  const pause=()=>{audio.pause();mark(false)};

  audio.addEventListener('playing',()=>mark(true));
  audio.addEventListener('pause',()=>mark(false));
  audio.addEventListener('ended',()=>{if(sessionStorage.getItem(KEY)==='1')setTimeout(play,500)});
  audio.addEventListener('error',()=>{if(sessionStorage.getItem(KEY)==='1')setTimeout(play,1500)});

  if('mediaSession' in navigator){
    try{
      navigator.mediaSession.metadata=new MediaMetadata({title:'Technorizon.fr',artist:'La musique sans frontières',album:'Technorizon.fr',artwork:[{src:'/ImageLogoFinal.png',sizes:'512x512',type:'image/png'}]});
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
    if(!/^https?:$/.test(url.protocol)||url.href===location.href||link.target==='_blank')return;

    event.preventDefault();
    mark(true);
    // Same-origin pages keep an opener so their Home button can focus this exact live player.
    // External destinations stay isolated with noopener/noreferrer.
    if(url.origin===location.origin){
      const opened=window.open(url.href,'technorizon-content');
      if(opened)try{opened.focus()}catch(e){}
    }else{
      window.open(url.href,'_blank','noopener,noreferrer');
    }
  },true);

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&sessionStorage.getItem(KEY)==='1'&&audio.paused)play();
  });
})();
