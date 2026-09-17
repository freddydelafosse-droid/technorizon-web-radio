(()=>{
  'use strict';

  const KEY='technorizon-radio-playing';
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');
  if(!audio||!playButton)return;

  const mark=playing=>{try{sessionStorage.setItem(KEY,playing?'1':'0')}catch(e){}};
  let audioContext=null;
  let analyser=null;
  let frequencyData=null;
  let animationFrame=0;
  let graphFailed=false;

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

  const drawSpectrum=()=>{
    if(audio.paused||!analyser||!frequencyData){animationFrame=0;return}
    analyser.getByteFrequencyData(frequencyData);
    const main=bars();
    const mini=miniBars();

    main.forEach((bar,index)=>{
      const value=spectrumValue(index,main.length);
      bar.style.animation='none';
      bar.style.transition='transform 70ms linear,opacity 90ms linear';
      bar.style.transform=`scaleY(${(.10+value*1.18).toFixed(3)})`;
      bar.style.opacity=String((.40+value*.60).toFixed(2));
    });

    const groups=[[2,5],[5,10],[10,18],[18,30],[30,50],[50,76]];
    mini.forEach((bar,index)=>{
      const [from,to]=groups[index]||groups[groups.length-1];
      let sum=0;
      for(let i=from;i<=to;i++)sum+=frequencyData[i]||0;
      const value=Math.max(.10,Math.pow((sum/((to-from+1)*255)),.72));
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
    if(await ensureAudioGraph())drawSpectrum();
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
    try{
      await ensureAudioGraph();
      await audio.play();
      mark(true);
      startVisualizer();
      return true;
    }catch(e){mark(false);return false}
  };
  const pause=()=>{audio.pause();mark(false);stopVisualizer()};

  audio.addEventListener('playing',()=>{mark(true);startVisualizer()});
  audio.addEventListener('pause',()=>{mark(false);stopVisualizer()});
  audio.addEventListener('ended',()=>{stopVisualizer();if(sessionStorage.getItem(KEY)==='1')setTimeout(play,500)});
  audio.addEventListener('error',()=>{stopVisualizer();if(sessionStorage.getItem(KEY)==='1')setTimeout(play,1500)});

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

  window.addEventListener('pageshow',()=>setTimeout(refreshVisualizer,80));
  window.addEventListener('focus',()=>{if(!audio.paused)setTimeout(startVisualizer,80)});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=0}
    else if(!audio.paused)setTimeout(startVisualizer,80);
  });
  document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshVisualizer,80),{once:true});
  setTimeout(refreshVisualizer,350);
})();
