(()=>{
  'use strict';
  const audio=document.getElementById('v2-audio');
  const playButton=document.getElementById('v2-play');
  if(!audio||!playButton)return;

  const INTERNAL=new Set(['infos.html','meteo.html','technoroscope.html','dedicaces.html','a-propos.html','contact.html','jeux.html']);
  let overlay=null;

  const closeOverlay=()=>{
    if(!overlay)return;
    overlay.remove();overlay=null;
    document.documentElement.style.overflow='';
    history.replaceState(null,'',location.pathname+location.search);
  };

  const openOverlay=url=>{
    if(overlay)overlay.remove();
    overlay=document.createElement('div');
    overlay.id='tz-internal-view';
    const bar=document.createElement('div');bar.className='tz-view-bar';
    const back=document.createElement('button');back.type='button';back.className='tz-view-back';back.textContent='← Accueil';back.onclick=closeOverlay;
    const brand=document.createElement('span');brand.textContent='TECHNORIZON.FR';
    const frame=document.createElement('iframe');frame.className='tz-view-frame';frame.title='Technorizon';frame.src=url;
    bar.append(back,brand);overlay.append(bar,frame);document.body.appendChild(overlay);
    document.documentElement.style.overflow='hidden';
  };

  // Capture before any other site script. composedPath() also catches clicks on nested icons/spans.
  window.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const path=typeof event.composedPath==='function'?event.composedPath():[];
    const link=path.find(node=>node&&node.tagName==='A')||(event.target&&event.target.closest?event.target.closest('a[href]'):null);
    if(!link||!link.href||link.target==='_blank'||link.hasAttribute('download'))return;
    let u;try{u=new URL(link.href,location.href)}catch(e){return}
    if(u.origin!==location.origin)return;
    const file=u.pathname.split('/').pop()||'index.html';
    if(!INTERNAL.has(file))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openOverlay(u.pathname+u.search+u.hash);
  },true);

  if('mediaSession' in navigator){
    try{
      navigator.mediaSession.metadata=new MediaMetadata({title:'Technorizon.fr',artist:'La musique sans frontières',album:'Technorizon.fr',artwork:[{src:'/ImageLogoFinal.png',sizes:'512x512',type:'image/png'}]});
      navigator.mediaSession.setActionHandler('play',()=>audio.play());
      navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
    }catch(e){}
  }
})();
