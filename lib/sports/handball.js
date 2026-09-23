// Daikin StarLigue 2026-27 — source FFHandball officielle.
const SOURCE='https://www.ffhandball.fr/competitions/saison-2026-2027-22/national/daikin-starligue-2026-27-32372/poule-190529/classements/';
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();
const num=s=>Number(String(s||'').replace(/[^0-9+-]/g,''))||0;
function parse(html){
 const out=[];
 // Le tableau FFHandball peut être rendu dans le HTML ou dans les données JSON hydratées.
 for(const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
  const c=[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>clean(x[1])).filter(Boolean);
  if(c.length<9)continue;
  const rank=num(c[0]),team=c[1]; if(!rank||!team||!/\p{L}/u.test(team))continue;
  out.push({rank,team,badge:'',points:num(c[2]),played:num(c[3]),win:num(c[4]),draw:num(c[5]),loss:num(c[6]),gf:num(c[7]),ga:num(c[8]),gd:num(c[9])});
 }
 if(out.length>=16)return out.slice(0,16).sort((a,b)=>a.rank-b.rank);
 // Fallback JSON embarqué: objets de classement avec libellés usuels FFHB.
 const text=html.replace(/\\u00e9/g,'é').replace(/\\u00e8/g,'è');
 const re=/"(?:position|rank|classement)"\s*:\s*"?([0-9]+)"?[\s\S]{0,500}?"(?:clubName|teamName|nom|name)"\s*:\s*"([^"]+)"[\s\S]{0,800}?"(?:points|pts)"\s*:\s*"?([0-9]+)"?/gi;
 for(const m of text.matchAll(re)){const rank=num(m[1]);if(!out.some(x=>x.rank===rank))out.push({rank,team:clean(m[2]),badge:'',points:num(m[3]),played:0,win:0,draw:0,loss:0,gf:0,ga:0,gd:0})}
 return out.sort((a,b)=>a.rank-b.rank);
}
async function standings(){
 const r=await fetch(SOURCE,{headers:{'user-agent':'Mozilla/5.0 (compatible; Technorizon/1.0)','accept':'text/html,application/xhtml+xml','accept-language':'fr-FR,fr;q=0.9'},signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('ffhb_'+r.status);
 const table=parse(await r.text());
 if(table.length<16)throw Error('ffhb_incomplete_'+table.length);
 return table;
}
module.exports={league:'starligue',standings,source:'ffhandball'};
