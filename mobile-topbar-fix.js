(()=>{
'use strict';
const css=`
@media(max-width:760px){
 html,body,.v2-page{width:100%;max-width:100%;overflow-x:hidden!important}
 .v2-topbar{width:100%!important;min-height:auto!important;overflow:hidden!important}
 .v2-topbar-inner{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-height:auto!important;margin:0!important;padding:8px 10px!important;display:grid!important;grid-template-columns:auto 1fr auto!important;gap:7px!important;align-items:center!important}
 .v2-language{grid-column:1!important;display:flex!important;gap:4px!important;min-width:0!important}
 .v2-language button{width:34px!important;max-width:34px!important;height:32px!important;padding:0!important;overflow:hidden!important;white-space:nowrap!important;font-size:0!important;border-radius:9px!important}
 .v2-language button::first-letter{font-size:17px!important}
 .v2-nav{grid-column:2!important;display:flex!important;justify-content:center!important;gap:1px!important;min-width:0!important;overflow:hidden!important}
 .v2-nav a{display:flex!important;align-items:center!important;justify-content:center!important;width:34px!important;height:32px!important;padding:0!important;font-size:0!important;border-radius:8px!important}
 .v2-nav .nav-icon{font-size:16px!important;line-height:1!important}
 .v2-nav a span:not(.nav-icon){display:none!important}
 .v2-top-signature{display:none!important}
 .v2-top-socials{grid-column:3!important;display:flex!important;gap:3px!important;justify-content:flex-end!important;min-width:0!important}
 .v2-top-social{width:29px!important;height:29px!important;min-width:29px!important;font-size:11px!important}
}
@media(max-width:390px){
 .v2-topbar-inner{padding:7px 6px!important;gap:4px!important}
 .v2-language button{width:30px!important;max-width:30px!important;height:30px!important}
 .v2-nav a{width:29px!important;height:30px!important}
 .v2-top-social{width:26px!important;height:26px!important;min-width:26px!important;font-size:10px!important}
}
`;
const style=document.createElement('style');style.id='technorizon-mobile-topbar-fix';style.textContent=css;document.head.appendChild(style);
})();
