// Module interne StarLigue — source officielle LNH, aucune fonction Vercel supplémentaire.
const SOURCE='https://www.lnh.fr/daikin-starligue/equipes/paris-saint-germain-handball';
const clean=s=>String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();
const n=s=>Number(String(s||'').replace(/[^0-9+-]/g,''))||0;
function parse(html){
 const rows=[];
 for(const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>clean(x[1])).filter(Boolean);
  // LNH: rang, équipe, pts, mj, vict., déf., nul, bp, bc, goal avg, ...
  if(cells.length<9)continue;
  const rank=n(cells[0]),team=cells[1];
  if(!rank||!team||!/[A-Za-zÀ-ÿ]/.test(team))continue;
  rows.push({rank,team,badge:'',points:n(cells[2]),played:n(cells[3]),win:n(cells[4]),loss:n(cells[5]),draw:n(cells[6]),gf:n(cells[7]),ga:n(cells[8]),gd:n(cells[9])});
 }
 return rows.filter((x,i,a)=>a.findIndex(y=>y.team===x.team)===i).sort((a,b)=>a.rank-b.rank);
}
async function standings(){
 const r=await fetch(SOURCE,{headers:{'user-agent':'Mozilla/5.0 (compatible; Technorizon/1.0)','accept-language':'fr-FR,fr;q=0.9'},signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('lnh_'+r.status);
 const table=parse(await r.text());
 if(table.length<14)throw Error('lnh_parse_'+table.length);
 return table;
}
module.exports={league:'starligue',standings,source:'lnh'};
