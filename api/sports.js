const countryNames={fr:'France',gb:'England',es:'Spain',de:'Germany',it:'Italy',pt:'Portugal',us:'United States',be:'Belgium',ch:'Switzerland',nl:'Netherlands',pl:'Poland',jp:'Japan',ca:'Canada',br:'Brazil',ar:'Argentina',au:'Australia'};
const sportNames={football:'Soccer',basketball:'Basketball',tennis:'Tennis',handball:'Handball',rugby:'Rugby',f1:'Motorsport',motogp:'Motorsport',cycling:'Cycling',volleyball:'Volleyball',hockey:'Ice Hockey'};
function eventOut(e){
 const hs=e.intHomeScore??e.intHomeScoreTotal,as=e.intAwayScore??e.intAwayScoreTotal;
 const played=hs!==null&&hs!==undefined&&hs!==''&&as!==null&&as!==undefined&&as!=='';
 const time=[e.dateEvent,e.strTime].filter(Boolean).join(' ');
 return {home:e.strHomeTeam||e.strEvent?.split(' vs ')[0]||'—',away:e.strAwayTeam||e.strEvent?.split(' vs ')[1]||'—',score:played?(hs+' - '+as):'VS',competition:e.strLeague||'',time,live:String(e.strStatus||'').toLowerCase().includes('live')};
}
const leagueMap={ligue1:'4334',ligue2:'4401',premierleague:'4328',laliga:'4335',bundesliga:'4331',seriea:'4332',primeiraliga:'4344',eredivisie:'4337',proleague:'4338',brasileirao:'4351',argentina:'4406',mls:'4346'};
const discoverMap={national:'French National', 'coupe-france':'Coupe de France','champions-league':'UEFA Champions League','europa-league':'UEFA Europa League','conference-league':'UEFA Conference League'};
const competitionCatalog={
 gb:{football:[{id:'premierleague',label:'Premier League',type:'league'}]},
 es:{football:[{id:'laliga',label:'LaLiga',type:'league'}]},
 de:{football:[{id:'bundesliga',label:'Bundesliga',type:'league'}]},
 it:{football:[{id:'seriea',label:'Serie A',type:'league'}]},
 pt:{football:[{id:'primeiraliga',label:'Primeira Liga',type:'league'}]},
 nl:{football:[{id:'eredivisie',label:'Eredivisie',type:'league'}]},
 be:{football:[{id:'proleague',label:'Pro League',type:'league'}]},
 fr:{football:[{id:'ligue1',label:'Ligue 1',type:'league'},{id:'ligue2',label:'Ligue 2',type:'league'},{id:'national',label:'National',type:'discover'},{id:'coupe-france',label:'Coupe de France',type:'discover'},{id:'champions-league',label:'Ligue des champions',type:'discover'},{id:'europa-league',label:'Ligue Europa',type:'discover'},{id:'conference-league',label:'Ligue Conférence',type:'discover'},{id:'france-team',label:'Équipe de France',type:'team'}],basketball:[{id:'generic',label:'Basketball France',type:'generic'}],rugby:[{id:'generic',label:'Rugby France',type:'generic'}],tennis:[{id:'generic',label:'Tennis',type:'generic'}],handball:[{id:'generic',label:'Handball France',type:'generic'}]},
 br:{football:[{id:'brasileirao',label:'Brasileirão Série A',type:'league'}]},
 ar:{football:[{id:'argentina',label:'Liga Profesional',type:'league'}]},
 us:{football:[{id:'mls',label:'Major League Soccer',type:'league'}]}
};
function tableRow(t){return {rank:Number(t.intRank||0),team:t.strTeam||'—',badge:t.strBadge||'',played:Number(t.intPlayed||0),win:Number(t.intWin||0),draw:Number(t.intDraw||0),loss:Number(t.intLoss||0),gf:Number(t.intGoalsFor||0),ga:Number(t.intGoalsAgainst||0),gd:Number(t.intGoalDifference??((t.intGoalsFor||0)-(t.intGoalsAgainst||0))),points:Number(t.intPoints||0)}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=300');
 if(String(req.query.motorsport||'')==='f1'){try{const base='https://api.openf1.org/v1/';const view=String(req.query.view||'calendar');const year=new Date().getUTCFullYear();
  if(view==='calendar'){const meetings=await fetch(base+'meetings?year='+year).then(r=>r.json());return res.status(200).json({sport:'f1',view,items:(meetings||[]).filter(x=>!x.is_cancelled).map(x=>({name:x.meeting_name,circuit:x.circuit_short_name,country:x.country_name,start:x.date_start,end:x.date_end,flag:x.country_flag,circuitImage:x.circuit_image}))})}
  const sessions=await fetch(base+'sessions?year='+year+'&session_name=Race').then(r=>r.json());const races=(sessions||[]).sort((a,b)=>String(a.date_start).localeCompare(String(b.date_start)));const latest=[...races].filter(x=>new Date(x.date_start)<=new Date()).pop();
  if(!latest)return res.status(200).json({sport:'f1',view,items:[]});
  if(view==='drivers'){const [stand,drivers]=await Promise.all([fetch(base+'championship_drivers?session_key='+latest.session_key).then(r=>r.json()),fetch(base+'drivers?session_key='+latest.session_key).then(r=>r.json())]);const dm=new Map((drivers||[]).map(x=>[x.driver_number,x]));return res.status(200).json({sport:'f1',view,items:(stand||[]).sort((a,b)=>a.position_current-b.position_current).map(x=>({position:x.position_current,points:x.points_current,driver:dm.get(x.driver_number)?.full_name||String(x.driver_number),team:dm.get(x.driver_number)?.team_name||''}))})}
  if(view==='constructors'){const teams=await fetch(base+'championship_teams?session_key='+latest.session_key).then(r=>r.json());return res.status(200).json({sport:'f1',view,items:(teams||[]).sort((a,b)=>a.position_current-b.position_current).map(x=>({position:x.position_current,points:x.points_current,team:x.team_name}))})}
  if(view==='results'){const [rr,drivers]=await Promise.all([fetch(base+'session_result?session_key='+latest.session_key).then(r=>r.json()),fetch(base+'drivers?session_key='+latest.session_key).then(r=>r.json())]);const dm=new Map((drivers||[]).map(x=>[x.driver_number,x]));return res.status(200).json({sport:'f1',view,items:(rr||[]).sort((a,b)=>a.position-b.position).map(x=>({position:x.position,driver:dm.get(x.driver_number)?.full_name||String(x.driver_number),team:dm.get(x.driver_number)?.team_name||'',dnf:x.dnf,dns:x.dns,dsq:x.dsq}))})}
  return res.status(400).json({error:'invalid_f1_view'});
 }catch(e){return res.status(502).json({items:[],error:'f1_provider_unavailable'})}
 if(String(req.query.motorsport||'')==='motogp'){try{const base='https://api.motogp.pulselive.com/motogp/v1/';const year=new Date().getUTCFullYear(),view=String(req.query.view||'calendar');const seasons=await fetch(base+'results/seasons').then(r=>r.json());const season=(seasons||[]).find(x=>Number(x.year)===year);if(!season?.id)throw Error('season');const cats=await fetch(base+'results/categories?seasonUuid='+encodeURIComponent(season.id)).then(r=>r.json());const cat=(cats||[]).find(x=>Number(x.legacy_id)===3||String(x.name||'').toLowerCase().includes('motogp'));if(!cat?.id)throw Error('category');
 if(view==='calendar'){const events=await fetch(base+'results/events?seasonUuid='+encodeURIComponent(season.id)).then(r=>r.json());return res.status(200).json({sport:'motogp',view,items:(events||[]).map(x=>({name:x.sponsored_name||x.name,circuit:x.circuit?.name||'',country:x.country?.name||'',start:x.date_start||x.date||'',end:x.date_end||''}))})}
 if(view==='drivers'){const d=await fetch(base+'results/standings?seasonUuid='+encodeURIComponent(season.id)+'&categoryUuid='+encodeURIComponent(cat.id)).then(r=>r.json());return res.status(200).json({sport:'motogp',view,items:(d.classification||[]).map(x=>({position:x.position,points:x.points,driver:x.rider?.full_name||'',team:x.team?.name||'',constructor:x.constructor?.name||''}))})}
 const events=await fetch(base+'results/events?seasonUuid='+encodeURIComponent(season.id)+'&isFinished=true').then(r=>r.json());const ev=(events||[]).sort((a,b)=>String(a.date_end||a.date||'').localeCompare(String(b.date_end||b.date||''))).pop();if(!ev?.id)throw Error('event');const sessions=await fetch(base+'results/sessions?eventUuid='+encodeURIComponent(ev.id)+'&categoryUuid='+encodeURIComponent(cat.id)).then(r=>r.json());const race=[...(sessions||[])].reverse().find(x=>x.type==='RAC'||String(x.type||'').toLowerCase()==='race');if(!race?.id)throw Error('race');const d=await fetch(base+'results/session/'+encodeURIComponent(race.id)+'/classification?seasonYear='+year+'&test=false').then(r=>r.json());const rows=d.classification||d||[];return res.status(200).json({sport:'motogp',view:'results',event:ev.sponsored_name||ev.name,items:(Array.isArray(rows)?rows:[]).map(x=>({position:x.position,points:x.points,driver:x.rider?.full_name||'',team:x.team_name||x.team?.name||'',constructor:x.constructor?.name||'',gap:x.time||x.gap||''}))})
 }catch(e){return res.status(502).json({items:[],error:'motogp_provider_unavailable'})}
 if(String(req.query.catalog||'')==='1'){const cc=String(req.query.country||'fr').toLowerCase(),ss=String(req.query.sport||'football').toLowerCase();const preset=competitionCatalog[cc]?.[ss]||[];if(preset.length&&!preset.every(x=>x.id==='generic'))return res.status(200).json({competitions:preset});try{const c=countryNames[cc]||'France',sp=sportNames[ss]||ss;const base='https://www.thesportsdb.com/api/v1/json/'+(process.env.THESPORTSDB_API_KEY||'3')+'/';const r=await fetch(base+'search_all_leagues.php?c='+encodeURIComponent(c)+'&s='+encodeURIComponent(sp));const d=await r.json();const competitions=(d.countries||[]).slice(0,8).map(x=>({id:'provider-'+x.idLeague,label:x.strLeague||x.strLeagueAlternate||sp,type:'provider',providerId:String(x.idLeague)}));return res.status(200).json({competitions:competitions.length?competitions:preset})}catch(e){return res.status(200).json({competitions:preset})}}
 const providerLeagueKey=String(req.query.league||'').toLowerCase();
 if(providerLeagueKey.startsWith('provider-')){const pid=providerLeagueKey.slice(9),view=String(req.query.view||'').toLowerCase();try{const base='https://www.thesportsdb.com/api/v1/json/'+(process.env.THESPORTSDB_API_KEY||'3')+'/';if(view==='results'||view==='upcoming'){const ep=view==='results'?'eventspastleague.php?id=':'eventsnextleague.php?id=';const d=await fetch(base+ep+encodeURIComponent(pid)).then(r=>r.json());return res.status(200).json({league:req.query.league,view,events:(d.events||[]).map(eventOut).slice(0,12)})}const d=await fetch(base+'lookuptable.php?l='+encodeURIComponent(pid)).then(r=>r.json());return res.status(200).json({league:req.query.league,table:(d.table||[]).map(tableRow).sort((a,b)=>a.rank-b.rank)})}catch(e){return res.status(502).json({table:[],events:[],error:'sports_provider_unavailable'})}}

 const leagueKey=String(req.query.league||'').toLowerCase();
 let tableLeague=leagueMap[leagueKey];
 if(!tableLeague&&discoverMap[leagueKey]){try{const base='https://www.thesportsdb.com/api/v1/json/'+(process.env.THESPORTSDB_API_KEY||'3')+'/';const r=await fetch(base+'search_all_leagues.php?c='+encodeURIComponent(leagueKey==='national'||leagueKey==='coupe-france'?'France':'')+'&s=Soccer');const d=await r.json();const wanted=discoverMap[leagueKey].toLowerCase();const hit=(d.countries||[]).find(x=>String(x.strLeague||'').toLowerCase().includes(wanted)||wanted.includes(String(x.strLeague||'').toLowerCase()));if(hit?.idLeague)tableLeague=String(hit.idLeague)}catch(e){}}

 const leagueView=String(req.query.view||'').toLowerCase();
 if(tableLeague){try{const base='https://www.thesportsdb.com/api/v1/json/'+(process.env.THESPORTSDB_API_KEY||'3')+'/';
  const meta=await fetch(base+'lookupleague.php?id='+encodeURIComponent(tableLeague)).then(r=>r.ok?r.json():({})).catch(()=>({}));const providerLeague=meta.leagues?.[0];if(providerLeague&&String(providerLeague.idLeague)!==String(tableLeague))throw Error('league_mismatch');
  if(leagueView==='results'||leagueView==='upcoming'){const endpoint=leagueView==='results'?'eventspastleague.php?id=':'eventsnextleague.php?id=';const r=await fetch(base+endpoint+encodeURIComponent(tableLeague));if(!r.ok)throw Error('provider');const d=await r.json();let events=(d.events||[]).map(eventOut);events.sort((a,b)=>leagueView==='results'?String(b.time).localeCompare(String(a.time)):String(a.time).localeCompare(String(b.time)));return res.status(200).json({league:req.query.league,view:leagueView,events:events.slice(0,12)})}
  const r=await fetch(base+'lookuptable.php?l='+encodeURIComponent(tableLeague));if(!r.ok)throw Error('provider');const d=await r.json();const table=(d.table||[]).map(tableRow).sort((a,b)=>a.rank-b.rank);return res.status(200).json({league:req.query.league,table})}catch(e){return res.status(502).json({table:[],events:[],error:'sports_provider_unavailable'})}}
 const c=countryNames[String(req.query.country||'fr').toLowerCase()]||'France';
 const s=sportNames[String(req.query.sport||'football').toLowerCase()]||'Soccer';
 try{
  const base='https://www.thesportsdb.com/api/v1/json/'+(process.env.THESPORTSDB_API_KEY||'3')+'/';
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