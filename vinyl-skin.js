/* Independent vinyl platter: never rotate the chassis or tonearm. */
(()=>{const host=document.querySelector('.tz-skin-host'),audio=document.getElementById('v2-audio'),play=document.getElementById('v2-play');if(!host||!audio||!play)return;
const deck=document.createElement('div');deck.className='tz-vinyl';deck.innerHTML='<div class="tz-vinyl-title"><b>TECHNORIZON</b><small>VINYL EDITION · 33⅓ RPM</small></div><div class="tz-vinyl-body"><div class="tz-vinyl-platter"><div class="tz-vinyl-label">TECHNORIZON<small>LA MUSIQUE SANS FRONTIÈRES</small></div></div><div class="tz-vinyl-arm"><div class="tz-vinyl-bearing"></div><div class="tz-vinyl-arm-tube"></div><div class="tz-vinyl-headshell"></div></div><div class="tz-vinyl-pitch"></div><div class="tz-vinyl-strobe"></div><div class="tz-vinyl-power"></div><button type="button" class="tz-vinyl-start" aria-label="Lecture ou pause">START / STOP</button></div><div class="tz-vinyl-meta"><strong id="tz-vinyl-track">Technorizon.fr</strong><span id="tz-vinyl-artist">La musique sans frontières</span></div>';host.appendChild(deck);
const btn=deck.querySelector('.tz-vinyl-start');btn.addEventListener('click',()=>play.click());
const track=document.getElementById('v2-track'),artist=document.getElementById('v2-artist');
const sync=()=>{host.classList.toggle('is-playing',!audio.paused&&!audio.ended);const t=document.getElementById('tz-vinyl-track'),a=document.getElementById('tz-vinyl-artist');if(t&&track)t.textContent=track.textContent;if(a&&artist)a.textContent=artist.textContent;};
['play','playing','pause','ended','emptied','error'].forEach(event=>audio.addEventListener(event,sync));
if(track)new MutationObserver(sync).observe(track,{childList:true,subtree:true,characterData:true});
if(artist)new MutationObserver(sync).observe(artist,{childList:true,subtree:true,characterData:true});
sync();
})();
