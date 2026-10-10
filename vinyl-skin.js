/* Independent vinyl platter: never rotate the chassis or tonearm. */
(()=>{const boot=()=>{const host=document.querySelector('.tz-skin-host'),audio=document.getElementById('v2-audio'),play=document.getElementById('v2-play');if(!host||!audio||!play||host.querySelector('.tz-vinyl'))return;
const deck=document.createElement('div');deck.className='tz-vinyl';deck.innerHTML='<div class="tz-vinyl-title"><b>TECHNORIZON</b><small>VINYL EDITION · 33⅓ RPM</small></div><div class="tz-vinyl-body"><div class="tz-vinyl-platter"><div class="tz-vinyl-label">TECHNORIZON<small>LA MUSIQUE SANS FRONTIÈRES</small></div></div><div class="tz-vinyl-arm"><svg class="tz-vinyl-arm-svg" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="tz-vinyl-gold-tube" x1="0" x2="1"><stop stop-color="#856326"/><stop offset=".36" stop-color="#ffe6a2"/><stop offset=".68" stop-color="#d3a64d"/><stop offset="1" stop-color="#6e5428"/></linearGradient><radialGradient id="tz-vinyl-bearing-metal"><stop stop-color="#151a19"/><stop offset=".45" stop-color="#9c7734"/><stop offset=".72" stop-color="#e7c875"/><stop offset="1" stop-color="#42351d"/></radialGradient></defs><g class="tz-vinyl-arm-moving"><path d="M483 90 L475 151 Q473 165 460 173 L399 205" fill="none" stroke="#182626" stroke-width="13" stroke-linejoin="round"/><path d="M483 90 L475 151 Q473 165 460 173 L399 205" fill="none" stroke="url(#tz-vinyl-gold-tube)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M399 205 L376 217" stroke="#f0d188" stroke-width="9" stroke-linecap="round"/><rect x="366" y="212" width="24" height="15" rx="3" fill="#c9a251" stroke="#5c4628" stroke-width="2" transform="rotate(-25 378 219)"/><path d="M374 225 l-2 10" stroke="#f6edc5" stroke-width="2"/></g><circle cx="483" cy="90" r="28" fill="url(#tz-vinyl-bearing-metal)" stroke="#f2d48a" stroke-width="4"/><circle cx="483" cy="90" r="10" fill="#1c2421" stroke="#d7b15c" stroke-width="4"/></svg></div><div class="tz-vinyl-pitch"></div><div class="tz-vinyl-strobe"></div><div class="tz-vinyl-power"></div><button type="button" class="tz-vinyl-start" aria-label="Lecture ou pause">START / STOP</button></div><div class="tz-vinyl-meta"><strong id="tz-vinyl-track">Technorizon.fr</strong><span id="tz-vinyl-artist">La musique sans frontières</span></div>';host.appendChild(deck);
const btn=deck.querySelector('.tz-vinyl-start');btn.addEventListener('click',()=>play.click());
const track=document.getElementById('v2-track'),artist=document.getElementById('v2-artist');
const sync=()=>{host.classList.toggle('is-playing',!audio.paused&&!audio.ended);const t=document.getElementById('tz-vinyl-track'),a=document.getElementById('tz-vinyl-artist');if(t&&track)t.textContent=track.textContent;if(a&&artist)a.textContent=artist.textContent;};
['play','playing','pause','ended','emptied','error'].forEach(event=>audio.addEventListener(event,sync));
if(track)new MutationObserver(sync).observe(track,{childList:true,subtree:true,characterData:true});
if(artist)new MutationObserver(sync).observe(artist,{childList:true,subtree:true,characterData:true});
sync();

/* Synchronise la pointe avec le temps réel du morceau diffusé par AzuraCast.
   La progression ne dépend pas du temps d'écoute local de l'auditeur. */
const arm=deck.querySelector('.tz-vinyl-arm-moving');
let playback={songId:'',elapsed:0,duration:0,updatedAt:0};
let lastTitle='';
const setArm=()=>{
  if(!arm)return;
  const playing=!audio.paused&&!audio.ended;
  let fraction=0;
  if(playing&&playback.duration>0){
    fraction=Math.min(1,Math.max(0,(playback.elapsed+(Date.now()-playback.updatedAt)/1000)/playback.duration));
  }
  arm.style.setProperty('--tz-vinyl-arm-angle',playing?(fraction*22).toFixed(2)+'deg':'-42deg');
};
const refreshProgress=async()=>{
  try{
    const response=await fetch('/api/nowplaying/technorizon',{cache:'no-store'});
    if(!response.ok)return;
    const data=await response.json();
    const now=data?.now_playing||{};
    const songId=String(now.song?.id||[now.song?.artist,now.song?.title].join('|'));
    const duration=Number(now.duration)||0;
    const elapsed=Number(now.elapsed)||0;
    if(songId!==playback.songId){playback.songId=songId;playback.elapsed=0;}
    playback={songId,elapsed:Math.max(0,elapsed),duration:Math.max(0,duration),updatedAt:Date.now()};
    setArm();
  }catch(_error){/* Keep the previous known position if the API is temporarily unavailable. */}
};
const progressTimer=setInterval(()=>{if(host.dataset.skin==='vinyl')setArm();},1000);
const pollTimer=setInterval(()=>{if(host.dataset.skin==='vinyl')refreshProgress();},15000);
audio.addEventListener('play',()=>{setArm();refreshProgress();});
audio.addEventListener('pause',setArm);
audio.addEventListener('ended',setArm);
if(track)new MutationObserver(()=>{const title=track.textContent.trim();if(title!==lastTitle){lastTitle=title;playback.elapsed=0;playback.updatedAt=Date.now();refreshProgress();}}).observe(track,{childList:true,subtree:true,characterData:true});
refreshProgress();

};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
