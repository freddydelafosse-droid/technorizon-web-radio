(()=>{
  'use strict';
  const KEY='technorizon-radio-playing';
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');
  if(!audio||!playButton)return;

  const mark=playing=>{try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};
  let visualizerTimer=0;

  // JS-driven visualizer: unlike CSS animation timelines, this reliably resumes after a tab/PWA
  // has been backgrounded. We update transforms directly while the live audio is playing.
  const stopVisualizer=()=>{
    if(visualizerTimer){clearInterval(visualizerTimer);visualizerTimer=0}
  };
  const paintVisualizer=()=>{
    const playing=!audio.paused;
    const bars=[...document.querySelectorAll('.radio-wave i,.radio-vu-mini i')];
    document.querySelector('.radio-wave')?.classList.toggle('paused',!playing);
    document.querySelector('.radio-vu-mini')?.classList.toggle('paused',!playing);
    bars.forEach((bar,index)=>{
      bar.style.animation='none';
      bar.style.transition='transform 110ms linear,opacity 110ms linear';
      if(playing){
        const min=index<24?.16:.28;
        const scale=min+Math.random()*(1.18-min);
        bar.style.transform=`scaleY(${scale.toFixed(2)})`;
        bar.style.opacity=String(.48+Math.random()*.52);
      }else{
        bar.style.transform=index<24?'scaleY(.12)':'scaleY(.28)';
        bar.style.opacity=index<24?'.28':'.35';
      }
    });
  };
  const startVisualizer=()=>{
    stopVisualizer();
    paintVisualizer();
    if(!audio.paused)visualizerTimer=setInterval(paintVisualizer,130);
  };

  const play=async()=>{try{await audio.play();mark(true);startVisualizer();return true}catch(e){mark(false);return false}};
  const pause=()=>{audio.pause();mark(false);stopVisualizer();paintVisualizer()};

  audio.addEventListener('playing',()=>{mark(true);startVisualizer()});
  audio.addEventListener('pause',()=>{mark(false);stopVisualizer();paintVisualizer()});
  audio.addEventListener('ended',()=>{stopVisualizer();if(sessionStorage.getItem(KEY)==='1')setTimeout(play,500)});
  audio.addEventListener('error',()=>{stopVisualizer();if(sessionStorage.getItem(KEY)==='1')setTimeout(play,1500)});

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
    window.open(url.href,'_blank','noopener,noreferrer');
  },true);

  const restoreHomepage=()=>{
    if(sessionStorage.getItem(KEY)==='1'&&audio.paused){play();return}
    if(!audio.paused)startVisualizer();else paintVisualizer();
  };
  window.addEventListener('pageshow',()=>setTimeout(restoreHomepage,80));
  window.addEventListener('focus',()=>setTimeout(restoreHomepage,80));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVisualizer();else setTimeout(restoreHomepage,80)});
  setTimeout(startVisualizer,300);
})();
