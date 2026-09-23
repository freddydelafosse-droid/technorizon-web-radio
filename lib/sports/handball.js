// StarLigue : classement reconstruit depuis les matches de saison du fournisseur.
// Aucune fonction Vercel supplémentaire et aucun accès runtime au site LNH.
const providerId='4536';
const season='2026-2027';
const num=v=>Number(v);
async function standings(fetchJSON,base){
 const d=await fetchJSON(base+'eventsseason.php?id='+providerId+'&s='+encodeURIComponent(season),10000).catch(()=>({events:[]}));
 const events=(d.events||[]).filter(e=>e.intHomeScore!==null&&e.intAwayScore!==null&&e.intHomeScore!==''&&e.intAwayScore!=='');
 const teams=new Map();
 const get=(name,badge='')=>{if(!teams.has(name))teams.set(name,{team:name,badge,played:0,win:0,draw:0,loss:0,gf:0,ga:0,points:0});return teams.get(name)};
 for(const e of events){
  const hs=num(e.intHomeScore),as=num(e.intAwayScore); if(!Number.isFinite(hs)||!Number.isFinite(as))continue;
  const h=get(e.strHomeTeam,e.strHomeTeamBadge||''),a=get(e.strAwayTeam,e.strAwayTeamBadge||'');
  h.played++;a.played++;h.gf+=hs;h.ga+=as;a.gf+=as;a.ga+=hs;
  if(hs>as){h.win++;a.loss++;h.points+=2}else if(hs<as){a.win++;h.loss++;a.points+=2}else{h.draw++;a.draw++;h.points++;a.points++}
 }
 const table=[...teams.values()].map(x=>({...x,gd:x.gf-x.ga})).sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||a.team.localeCompare(b.team,'fr'));
 table.forEach((x,i)=>x.rank=i+1);
 if(table.length<16)throw Error('starligue_incomplete_'+table.length);
 return table;
}
module.exports={league:'starligue',providerId,season,standings,source:'season-events'};
