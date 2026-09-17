(()=>{
  'use strict';

  const KEY='technorizon-radio-playing';
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');
  if(!audio||!playButton)return;

  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const MP3_STREAM='https://radio.technorizon.fr/listen/technorizon/radio.mp3';
  const IOS_STREAM='https://radio.technorizon.fr/hls/technorizon/live.m3u8';
  if(isIOS){
    // Native HLS is substantially more resilient than a never-ending MP3
    // connection when Safari changes network or suspends the page.
    audio.removeAttribute('crossorigin');
    if(audio.getAttribute('src')!==IOS_STREAM)audio.setAttribute('src',IOS_STREAM);
  }else if(!audio.getAttribute('src')){
    audio.setAttribute('src',MP3_STREAM);
  }
  const mark=playing=>{try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};
  let audioContext=null;
  let analyser=null;
  let frequencyData=null;
  let animationFrame=0;
  let graphFailed=false;
  let silentFrames=0;

  const bars=()=>[...document.querySelectorAll('.radio-wave i')];
  const miniBars=()=>[...document.querySelectorAll('.radio-vu-mini i')];

  const paintRest=()=>{
    bars().forEach((bar,index)=>{
      bar.style.animation='none';
      bar.style.transition='transform 220ms ease-out,opacity 220ms ease-out';
      bar.style.transform=`scaleY(${index%3===0?'.18':'.10'})`;
      bar.style.opacity='.28';
    });
    miniBars().forEach((bar,index)=>{
      bar.style.animation='none';
      bar.style.transition='transform 220ms ease-out,opacity 220ms ease-out';
      bar.style.transform=`scaleY(${index%2===0?'.22':'.14'})`;
      bar.style.opacity='.32';
    });
  };

  const colorBars=()=>{
    const main=bars();
    main.forEach((bar,index)=>{
      const ratio=main.length>1?index/(main.length-1):0;
      const hue=Math.round(188+(ratio*118));
      const color=`hsl(${hue} 100% 58%)`;
      bar.style.background=`repeating-linear-gradient(to top,${color} 0 3px,transparent 3px 5px)`;
      bar.style.filter=`drop-shadow(0 0 4px hsl(${hue} 100% 55% / .82))`;
      bar.style.transformOrigin='center bottom';
    });
  };

  const ensureAudioGraph=async()=>{
    // iOS suspend souvent Web Audio en arrière-plan. Le flux reste donc relié
    // directement à l'élément audio et l'égaliseur utilise son animation visuelle.
    if(isIOS){graphFailed=true;return false}
    if(graphFailed)return false;
    try{
      if(!audioContext){
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        if(!AudioContext)throw new Error('Web Audio indisponible');
        audioContext=new AudioContext();
        analyser=audioContext.createAnalyser();
        analyser.fftSize=256;
        analyser.smoothingTimeConstant=.82;
        analyser.minDecibels=-92;
        analyser.maxDecibels=-12;
        const source=audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        frequencyData=new Uint8Array(analyser.frequencyBinCount);
      }
      if(audioContext.state==='suspended')await audioContext.resume();
      return audioContext.state==='running';
    }catch(error){
      graphFailed=true;
      console.info('Analyseur Technorizon indisponible, animation de secours conservée.',error);
      return false;
    }
  };

  const spectrumValue=(index,total)=>{
    const center=(total-1)/2;
    const distance=Math.abs(index-center)/Math.max(1,center);
    const curved=Math.pow(distance,1.55);
    const bin=Math.min(frequencyData.length-1,Math.round(2+curved*72));
    const left=Math.max(1,bin-1);
    const right=Math.min(frequencyData.length-1,bin+2);
    let sum=0;
    for(let i=left;i<=right;i++)sum+=frequencyData[i];
    let value=(sum/(right-left+1))/255;
    const presence=.92+(distance*.24);
    value=Math.min(1,Math.pow(value,.78)*presence);
    return Math.max(.08,value);
  };

  // Safari/iOS peut laisser l'AnalyserNode à zéro alors que le son joue.
  // Ce mouvement de secours reste musical et évite un égaliseur figé.
  const fallbackValue=(index,total,time)=>{
    const center=(total-1)/2;
    const distance=Math.abs(index-center)/Math.max(1,center);
    const seconds=time/1000;
    const beat=Math.pow(Math.max(0,Math.sin(seconds*Math.PI*4.15)),5);
    const sway=(Math.sin(seconds*(5.4+index*.07)+index*1.43)+1)/2;
    const detail=(Math.sin(seconds*(9.2+index*.13)+index*.71)+1)/2;
    const centerWeight=1-(distance*.58);
    return Math.min(1,.12+sway*.20+detail*.10+beat*.52*centerWeight);
  };

  const drawSpectrum=()=>{
    if(audio.paused){animationFrame=0;return}
    const hasAnalysis=Boolean(analyser&&frequencyData&&!isIOS);
    if(hasAnalysis)analyser.getByteFrequencyData(frequencyData);
    const main=bars();
    const mini=miniBars();
    const peak=hasAnalysis?frequencyData.reduce((highest,value)=>Math.max(highest,value),0):0;
    silentFrames=hasAnalysis&&peak>=3?0:silentFrames+1;
    const useFallback=!hasAnalysis||silentFrames>8;
    const now=performance.now();

    main.forEach((bar,index)=>{
      const value=useFallback?fallbackValue(index,main.length,now):spectrumValue(index,main.length);
      bar.style.animation='none';
      bar.style.transition='transform 70ms linear,opacity 90ms linear';
      bar.style.transform=`scaleY(${(.10+value*1.18).toFixed(3)})`;
      bar.style.opacity=String((.40+value*.60).toFixed(2));
    });

    const groups=[[2,5],[5,10],[10,18],[18,30],[30,50],[50,76]];
    mini.forEach((bar,index)=>{
      const [from,to]=groups[index]||groups[groups.length-1];
      let measured=.10;
      if(hasAnalysis){
        let sum=0;
        for(let i=from;i<=to;i++)sum+=frequencyData[i]||0;
        measured=Math.max(.10,Math.pow((sum/((to-from+1)*255)),.72));
      }
      const value=useFallback?fallbackValue(index,mini.length,now+170):measured;
      bar.style.animation='none';
      bar.style.transition='transform 80ms linear,opacity 90ms linear';
      bar.style.transform=`scaleY(${(.16+value*1.10).toFixed(3)})`;
      bar.style.opacity=String((.42+value*.58).toFixed(2));
    });

    animationFrame=requestAnimationFrame(drawSpectrum);
  };

  const startVisualizer=async()=>{
    if(animationFrame)cancelAnimationFrame(animationFrame);
    animationFrame=0;
    colorBars();
    await ensureAudioGraph();
    drawSpectrum();
  };

  const stopVisualizer=()=>{
    if(animationFrame)cancelAnimationFrame(animationFrame);
    animationFrame=0;
    paintRest();
  };

  // Initialiser le graphe pendant le geste de l'auditeur évite le blocage audio d'iOS.
  playButton.addEventListener('click',()=>{
    if(audio.paused)ensureAudioGraph();
  },true);

  const play=async()=>{
    userWantsPlayback=true;
    connecting=true;
    renderButton();
    try{
      await ensureAudioGraph();
      await audio.play();
      mark(true);
      return true;
    }catch(e){
      connecting=false;
      renderButton();
      return false;
    }
  };
  const pause=()=>{userWantsPlayback=false;connecting=false;cancelReconnect();audio.pause();mark(false);stopVisualizer();renderButton()};

  let reconnectTimer=0;
  let userWantsPlayback=false;
  let connecting=false;
  const renderButton=()=>{
    const playing=!audio.paused&&!audio.ended&&audio.readyState>=2;
    const english=document.documentElement.lang==='en';
    playButton.textContent=connecting&&!playing
      ? (english?'… CONNECTING':'… CONNEXION')
      : playing
        ? (english?'❚❚ PAUSE':'❚❚ PAUSE')
        : (english?'▶ LISTEN LIVE':'▶ ÉCOUTER LE DIRECT');
    playButton.setAttribute('aria-label',connecting&&!playing
      ? (english?'Connecting to live radio':'Connexion au direct')
      : playing
        ? (english?'Pause radio':'Mettre la radio en pause')
        : (english?'Listen live':'Écouter le direct'));
    playButton.setAttribute('aria-pressed',String(playing));
  };
  const cancelReconnect=()=>{if(reconnectTimer)clearTimeout(reconnectTimer);reconnectTimer=0};
  const scheduleReconnect=(delay=1200)=>{
    if(reconnectTimer||!userWantsPlayback)return;
    reconnectTimer=setTimeout(async()=>{
      reconnectTimer=0;
      if(!userWantsPlayback)return;
      connecting=true;
      renderButton();
      try{await audio.play()}catch(e){connecting=false;renderButton()}
    },delay);
  };

  // One controller only: this replaces the small inline fallback handler.
  playButton.onclick=event=>{
    event.preventDefault();
    if(userWantsPlayback&&!audio.paused)pause();
    else play();
  };
  audio.addEventListener('loadstart',()=>{if(userWantsPlayback){connecting=true;renderButton()}});
  audio.addEventListener('playing',()=>{
    cancelReconnect();
    connecting=false;
    userWantsPlayback=true;
    mark(true);
    renderButton();
    startVisualizer();
  });
  audio.addEventListener('pause',()=>{
    cancelReconnect();
    connecting=false;
    stopVisualizer();
    renderButton();
    if(!userWantsPlayback)mark(false);
  });
  audio.addEventListener('waiting',()=>{if(userWantsPlayback){connecting=true;renderButton()}});
  audio.addEventListener('stalled',()=>{if(userWantsPlayback){connecting=true;renderButton()}});
  audio.addEventListener('canplay',()=>{cancelReconnect();if(!audio.paused){connecting=false;renderButton()}});
  audio.addEventListener('ended',()=>{stopVisualizer();scheduleReconnect(500)});
  audio.addEventListener('error',()=>{
    stopVisualizer();
    connecting=false;
    renderButton();
    if(isIOS&&userWantsPlayback){
      // A genuine HLS error is the one safe moment to refresh the playlist.
      audio.src=IOS_STREAM+'?t='+Date.now();
      audio.load();
    }
    scheduleReconnect(900);
  });

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

  const refreshVisualizer=()=>{
    colorBars();
    if(audio.paused)stopVisualizer();
    else startVisualizer();
  };

  window.addEventListener('pageshow',()=>{setTimeout(refreshVisualizer,80);if(userWantsPlayback&&audio.paused)scheduleReconnect(100)});
  window.addEventListener('focus',()=>{if(userWantsPlayback&&audio.paused)scheduleReconnect(100);else if(!audio.paused)setTimeout(startVisualizer,80)});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=0}
    else if(userWantsPlayback&&audio.paused)scheduleReconnect(100);
    else if(!audio.paused)setTimeout(startVisualizer,80);
  });
  document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshVisualizer,80),{once:true});
  renderButton();
  setTimeout(refreshVisualizer,350);
})();
