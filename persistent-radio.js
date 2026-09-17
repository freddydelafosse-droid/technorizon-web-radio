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
    try{window.focus()}catch(e){}
  };

  const openOverlay=url=>{
    if(overlay)overlay.remove();
    overlay=document.createElement('div');
    overlay.id='tz-internal-view';
    overlay.innerHTML='<div class="tz-view-bar"><button type="button" class="tz-view-back">← Accueil</button><span>TECHNORIZON.FR</span></div><iframe class="tz-view-frame" title="Technorizon" src="'+url+'"></iframe>';
    document.body.appendChild(overlay);
    document.documentElement.style.overflow='hidden';
    history.replaceState(null,'','#'+url.replace('.html',''));
    overlay.querySelector('.tz-view-back').onclick=closeOverlay;
  };

  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(link.target==='_blank'||link.hasAttribute('download'))return;
    let u;try{u=new URL(link.href,location.href)}catch(e){return}
    if(u.origin!==location.origin)return;
    const file=u.pathname.split('/').pop()||'index.html';
    if(!INTERNAL.has(file))return;
    event.preventDefault();
    openOverlay(file+u.search+u.hash);
  },true);

  // A child page's own “Retour à l'accueil” must close the internal view instead of reloading index.html.
  window.addEventListener('message',event=>{
    if(event.origin===location.origin&&event.data==='technorizon-home')closeOverlay();
  });

  if('mediaSession' in navigator){
    try{
      navigator.mediaSession.metadata=new MediaMetadata({title:'Technorizon.fr',artist:'La musique sans frontières',album:'Technorizon.fr',artwork:[{src:'/ImageLogoFinal.png',sizes:'512x512',type:'image/png'}]});
      navigator.mediaSession.setActionHandler('play',()=>audio.play());
      navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
    }catch(e){}
  }
})();
