const countryNames={fr:'France',gb:'England',es:'Spain',de:'Germany',it:'Italy',pt:'Portugal',us:'United States',be:'Belgium',ch:'Switzerland',nl:'Netherlands',pl:'Poland',jp:'Japan',ca:'Canada',br:'Brazil',ar:'Argentina',au:'Australia'};
const sportNames={football:'Soccer',basketball:'Basketball',tennis:'Tennis',handball:'Handball',rugby:'Rugby'};
function eventOut(e){
 const hs=e.intHomeScore??e.intHomeScoreTotal,as=e.intAwayScore??e.intAwayScoreTotal;
 const played=hs!==null&&hs!==undefined&&hs!==''&&as!==null&&as!==undefined&&as!=='';
 const time=[e.dateEvent,e.strTime].filter(Boolean).join(' ');
 return {home:e.strHomeTeam||e.strEvent?.split(' vs ')[0]||'—',away:e.strAwayTeam||e.strEvent?.split(' vs ')[1]||'—',score:played?(hs+' - '+as):'VS',competition:e.strLeague||'',time,live:String(e.strStatus||'').toLowerCase().includes('live')};
}
const leagueMap={ligue1:'4334',ligue2:'4401',premierleague:'4328',laliga:'4335',bundesliga:'4331',seriea:'4332',primeiraliga:'4344',eredivisie:'4337',proleague:'4338',brasileirao:'4351',argentina:'4406',mls:'4346'};
const discoverMap={national:'French National', 'coupe-france':'Coupe de France','champions-league':'UEFA Champions League','europa-league':'UEFA Europa League','conference-league':'UEFA Conference League'};
const competitionCatalog={
 fr:{football:[{id:'ligue1',label:'Ligue 1',type:'league'},{id:'ligue2',label:'Ligue 2',type:'league'},{id:'national',label:'National',type:'discover'},{id:'coupe-france',label:'Coupe de France',type:'discover'},{id:'champions-league',label:'Ligue des champions',type:'discover'},{id:'europa-league',label:'Ligue Europa',type:'discover'},{id:'conference-league',label:'Ligue Conférence',type:'discover'},{id:'france-team',label:'Équipe de France',type:'team'}]},
 gb:{football:[{id:'premierleague',label:'Premier League',type:'league'}]},
 es:{football:[{id:'laliga',label:'LaLiga',type:'league'}]},
 de:{football:[{id:'bundesliga',label:'Bundesliga',type:'league'}]},
 it:{football:[{id:'seriea',label:'Serie A',type:'league'}]},
 pt:{football:[{id:'primeiraliga',label:'Primeira Liga',type:'league'}]},
 nl:{football:[{id:'eredivisie',label:'Eredivisie',type:'league'}]},
 be:{football:[{id:'proleague',label:'Pro League',type:'league'}]},
 br:{football:[{id:'brasileirao',label:'Brasileirão Série A',type:'league'}]},
 ar:{football:[{id:'argentina',label:'Liga Profesional',type:'league'}]},
 us:{football:[{id:'mls',label:'Major League Soccer',type:'league'}]}
};
function tableRow(t){return {rank:Number(t.intRank||0),team:t.strTeam||'—',badge:t.strBadge||'',played:Number(t.intPlayed||0),win:Number(t.intWin||0),draw:Number(t.intDraw||0),loss:Number(t.intLoss||0),gf:Number(t.intGoalsFor||0),ga:Number(t.intGoalsAgainst||0),gd:Number(t.intGoalDifference??((t.intGoalsFor||0)-(t.intGoalsAgainst||0))),points:Number(t.intPoints||0)}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=300');
 if(String(req.query.catalog||'')==='1'){const cc=String(req.query.country||'fr').toLowerCase(),ss=String(req.query.sport||'football').toLowerCase();return res.status(200).json({competitions:competitionCatalog[cc]?.[ss]||[]})}
 const leagueKey=String(req.query.league||'').toLowerCase();
 let tableLeague=leagueMap[leagueKey];
 if(!tableLeague&&discoverMap[leagueKey]){try{const base='https://www.thesportsdb.com/api/v1/json/123/';const r=await fetch(base+'search_all_leagues.php?c='+encodeURIComponent(leagueKey==='national'||leagueKey==='coupe-france'?'France':'')+'&s=Soccer');const d=await r.json();const wanted=discoverMap[leagueKey].toLowerCase();const hit=(d.countries||[]).find(x=>String(x.strLeague||'').toLowerCase().includes(wanted)||wanted.includes(String(x.strLeague||'').toLowerCase()));if(hit?.idLeague)tableLeague=String(hit.idLeague)}catch(e){}}

 const leagueView=String(req.query.view||'').toLowerCase();
 if(tableLeague){try{const base='https://www.thesportsdb.com/api/v1/json/123/';
  const meta=await fetch(base+'lookupleague.php?id='+encodeURIComponent(tableLeague)).then(r=>r.ok?r.json():({})).catch(()=>({}));const providerLeague=meta.leagues?.[0];if(providerLeague&&String(providerLeague.idLeague)!==String(tableLeague))throw Error('league_mismatch');
  if(leagueView==='results'||leagueView==='upcoming'){const endpoint=leagueView==='results'?'eventspastleague.php?id=':'eventsnextleague.php?id=';const r=await fetch(base+endpoint+encodeURIComponent(tableLeague));if(!r.ok)throw Error('provider');const d=await r.json();let events=(d.events||[]).map(eventOut);events.sort((a,b)=>leagueView==='results'?String(b.time).localeCompare(String(a.time)):String(a.time).localeCompare(String(b.time)));return res.status(200).json({league:req.query.league,view:leagueView,events:events.slice(0,12)})}
  const r=await fetch(base+'lookuptable.php?l='+encodeURIComponent(tableLeague));if(!r.ok)throw Error('provider');const d=await r.json();const table=(d.table||[]).map(tableRow).sort((a,b)=>a.rank-b.rank);return res.status(200).json({league:req.query.league,table})}catch(e){return res.status(502).json({table:[],events:[],error:'sports_provider_unavailable'})}}
 const c=countryNames[String(req.query.country||'fr').toLowerCase()]||'France';
 const s=sportNames[String(req.query.sport||'football').toLowerCase()]||'Soccer';
 try{
  const base='https://www.thesportsdb.com/api/v1/json/123/';
  const lr=await fetch(base+'search_all_leagues.php?c='+encodeURIComponent(c)+'&s='+encodeURIComponent(s));
  const ld=await lr.json(); const leagues=(ld.countries||[]).slice(0,3);
  const batches=await Promise.all(leagues.flatMap(l=>[
   fetch(base+'eventspastleague.php?id='+encodeURIComponent(l.idLeague)).then(r=>r.json()).catch(()=>({})),
   fetch(base+'eventsnextleague.php?id='+encodeURIComponent(l.idLeague)).then(r=>r.json()).catch(()=>({}))
  ]));
  let events=batches.flatMap(x=>x.events||[]).map(eventOut);
  const seen=new Set(); events=events.filter(x=>{const k=x.competition+'|'+x.home+'|'+x.away+'|'+x.time;if(seen.has(k))return false;seen.add(k);return true});
  events.sort((a,b)=>String(b.time).localeCompare(String(a.time)));
  res.status(200).json({country:c,sport:s,events:events.slice(0,12)});
 }catch(e){res.status(502).json({events:[],error:'sports_provider_unavailable'})}
}