const { chromium } = require('playwright');
const fs = require('fs');
const signs = [['belier','♈'],['taureau','♉'],['gemeaux','♊'],['cancer','♋'],['lion','♌'],['vierge','♍'],['balance','♎'],['scorpion','♏'],['sagittaire','♐'],['capricorne','♑'],['verseau','♒'],['poissons','♓']];
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const context=await browser.newContext({timezoneId:'Europe/Paris',locale:'fr-FR',viewport:{width:1250,height:1650},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.goto('https://www.technorizon.fr/technoroscope.html',{waitUntil:'networkidle',timeout:60000});
  const rows=[];
  for (const [key,symbol] of signs) {
   await page.locator('[data-sign="'+key+'"]').click();
   const name=(await page.locator('.result-sign').innerText()).replace(symbol,'').trim();
   const text=(await page.locator('.result-summary').innerText()).trim();
   if (!name || text.length<40) throw new Error('Prévision manquante: '+key);
   rows.push({key,symbol,name,text});
  }
  const now=new Date();
  const iso=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const label=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now).toUpperCase();
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
   *{box-sizing:border-box}body{margin:0;background:#020817;color:white;font-family:Arial,sans-serif}
   .poster{width:1250px;height:1650px;padding:35px 30px;background:radial-gradient(ellipse at 80% 5%,#741258 0%,transparent 35%),radial-gradient(ellipse at 15% 70%,#053e7d 0%,transparent 48%),#020817;overflow:hidden}
   .brand{text-align:center;font-weight:900;font-size:78px;letter-spacing:1px;color:#e9faff;text-shadow:0 0 14px #00cafa}.brand span{color:#ff2ec2}.slogan{text-align:center;letter-spacing:9px;font-size:19px;margin-top:0;color:#c9deed}
   h1{text-align:center;font-size:68px;margin:24px 0 0;background:linear-gradient(90deg,#00f2ff,#fff,#ff36c7);background-clip:text;color:transparent;letter-spacing:2px}
   .sub{text-align:center;font-size:24px;letter-spacing:6px;font-weight:700;margin:0 0 18px}
   .date{margin:0 auto 22px;width:max-content;padding:14px 30px;border:3px solid #fc2dce;border-radius:15px;box-shadow:0 0 16px #ff2cc9;font-size:29px;font-weight:bold}
   .grid{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,1fr);gap:12px;height:1080px}
   .cell{border:2px solid #03e9ff;border-radius:17px;padding:15px 13px;box-shadow:0 0 12px #00dafa66,inset 0 0 14px #e221a933;background:#040c22bb;overflow:hidden}
   .cell:nth-child(2n){border-color:#fa29c9;box-shadow:0 0 12px #e51aab77,inset 0 0 12px #0cefff33}
   .name{color:#10edff;font-weight:900;font-size:27px}.cell:nth-child(2n) .name{color:#ff64d4}
   .symbol{font-size:35px;vertical-align:middle;color:#fff;margin-right:8px}
   .text{font-size:17px;line-height:1.35;margin-top:11px;overflow-wrap:break-word}
   footer{text-align:center;margin-top:23px;font-size:23px;font-weight:bold;color:#e4faff}footer b{color:#00eaff}
   </style></head><body><div class="poster"><div class="brand">TECHN<span>O</span>RIZON.FR</div><div class="slogan">LA MUSIQUE SANS FRONTIÈRES</div><h1>TECHNOROSCOPE</h1><div class="sub">VOTRE HOROSCOPE DU JOUR</div><div class="date">${esc(label)}</div><div class="grid">${rows.map(r=>`<div class="cell"><div class="name"><span class="symbol">${r.symbol}</span>${esc(r.name.toUpperCase())}</div><div class="text">${esc(r.text)}</div></div>`).join('')}</div><footer>VOTRE HOROSCOPE COMPLET SUR <b>TECHNORIZON.FR</b></footer></div></body></html>`;
  const preview=await context.newPage();await preview.setContent(html);
  const overflowing=await preview.locator('.cell').evaluateAll(els=>els.some(e=>e.scrollHeight>e.clientHeight+2));
  if(overflowing)throw new Error('Affiche tronquée : prévisions trop longues');
  await preview.locator('.poster').screenshot({path:'technoroscope-facebook.png'});
  fs.writeFileSync('technoroscope-facebook.json',JSON.stringify({date:iso,rows},null,2));
  console.log('Affiche générée pour '+iso+' avec '+rows.length+' signes');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
