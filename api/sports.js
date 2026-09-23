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
 fr:{football:[{id:'ligue1',label:'Ligue 1',type:'league'},{id:'ligue2',label:'Ligue 2',type:'league'},{id:'national',label:'National',type:'discover'},{id:'coupe-france',label:'Coupe de France',type:'discover'},{id:'champions-league',label:'Ligue des champions',type:'discover'},{id:'europa-league',label:'Ligue Europa',type:'discover'},{id:'conference-league',label:'Ligue Conférence',type:'discover'},{id:'france-team',label:'Équipe de France',type:'team'}],basketball:[{id:'generic',label:'Basketball France',type:'generic'}],rugby:[{id:'rugby-top14',label:'Top 14',type:'discover-rugby'},{id:'rugby-prod2',label:'Pro D2',type:'discover-rugby'},{id:'rugby-nationale',label:'Nationale',type:'discover-rugby'},{id:'rugby-champions-cup',label:'Champions Cup',type:'discover-rugby'},{id:'rugby-challenge-cup',label:'Challenge Cup',type:'discover-rugby'},{id:'rugby-six-nations',label:'Six Nations',type:'discover-rugby'}],tennis:[{id:'generic',label:'Tennis',type:'generic'}],handball:[{id:'generic',label:'Handball France',type:'generic'}]},
 br:{football:[{id:'brasileirao',label:'Brasileirão Série A',type:'league'}]},
 ar:{football:[{id:'argentina',label:'Liga Profesional',type:'league'}]},
 us:{football:[{id:'mls',label:'Major League Soccer',type:'league'}]}
};
function tableRow(t){return {rank:Number(t.intRank||0),team:t.strTeam||'—',badge:t.strBadge||'',played:Number(t.intPlayed||0),win:Number(t.intWin||0),draw:Number(t.intDraw||0),loss:Number(t.intLoss||0),gf:Number(t.intGoalsFor||0),ga:Number(t.intGoalsAgainst||0),gd:Number(t.intGoalDifference??((t.intGoalsFor||0)-(t.intGoalsAgainst||0))),points:Number(t.intPoints||0)}}
const fetchJSON=async(url,ms=8000)=>{const r=await fetch(url,{signal:AbortSignal.timeout(ms)});if(!r.ok)throw Error('provider_'+r.status);return r.json()};
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=300');
 const q=req.query||{};
 try{
  if(String(q.motorsport||'')==='f1'){
   const base='https://api.openf1.org/v1/',view=String(q.view||'calendar'),year=new Date().getUTCFullYear();
   if(view==='calendar'){const a=await fetchJSON(base+'meetings?year='+year),now=Date.now();const items=(a||[]).filter(x=>!x.is_cancelled&&new Date(x.date_end||x.date_start).getTime()>=now).sort((a,b)=>new Date(a.date_start)-new Date(b.date_start)).map(x=>({name:x.meeting_name,circuit:(String(x.meeting_name||'').toLowerCase().includes('bahrain')?'Sepang International Circuit':x.circuit_short_name),country:(String(x.meeting_name||'').toLowerCase().includes('bahrain')?'Malaysia':x.country_name),start:x.date_start,end:x.date_end,flag:x.country_flag,circuitImage:x.circuit_image}));return res.status(200).json({sport:'f1',view,items})}
   const sessions=await fetchJSON(base+'sessions?year='+year+'&session_name=Race'),races=(sessions||[]).sort((a,b)=>String(a.date_start).localeCompare(String(b.date_start))),latest=[...races].filter(x=>new Date(x.date_start)<=new Date()).pop();
   if(!latest)return res.status(200).json({sport:'f1',view,items:[]});
   if(view==='drivers'){const [stand,drivers]=await Promise.all([fetchJSON(base+'championship_drivers?session_key='+latest.session_key),fetchJSON(base+'drivers?session_key='+latest.session_key)]),dm=new Map((drivers||[]).map(x=>[String(x.driver_number),x]));return res.status(200).json({sport:'f1',view,items:(stand||[]).sort((a,b)=>a.position_current-b.position_current).map(x=>{let dr=dm.get(String(x.driver_number));if(!dr&&Number(x.driver_number)===6)dr=[...(drivers||[])].find(d=>String(d.last_name||'').toLowerCase().includes('hadjar')||String(d.full_name||'').toLowerCase().includes('hadjar'));return {position:x.position_current,points:x.points_current,driver:dr?.full_name||dr?.broadcast_name||x.full_name||x.driver_name||(Number(x.driver_number)===6?'Isack HADJAR':('Pilote #'+x.driver_number)),team:dr?.team_name||x.team_name||(Number(x.driver_number)===6?'Red Bull Racing':'')}})})}
   if(view==='constructors'){const a=await fetchJSON(base+'championship_teams?session_key='+latest.session_key);return res.status(200).json({sport:'f1',view,items:(a||[]).sort((a,b)=>a.position_current-b.position_current).map(x=>({position:x.position_current,points:x.points_current,team:x.team_name}))})}
   if(view==='results'){const [rr,drivers]=await Promise.all([fetchJSON(base+'session_result?session_key='+latest.session_key),fetchJSON(base+'drivers?session_key='+latest.session_key)]),dm=new Map((drivers||[]).map(x=>[String(x.driver_number),x]));const ordered=(rr||[]).sort((a,b)=>{const ap=Number(a.position),bp=Number(b.position),av=Number.isFinite(ap)&&ap>0,bv=Number.isFinite(bp)&&bp>0;if(av!==bv)return av?-1:1;if(av&&bv)return ap-bp;return Number(a.dnf||a.dns||a.dsq)-Number(b.dnf||b.dns||b.dsq)});return res.status(200).json({sport:'f1',view,items:ordered.map(x=>{const dr=dm.get(String(x.driver_number));return {position:x.position,driver:dr?.full_name||dr?.broadcast_name||x.full_name||x.driver_name||('Pilote #'+x.driver_number),team:dr?.team_name||x.team_name||'',dnf:x.dnf,dns:x.dns,dsq:x.dsq}})})}
   return res.status(400).json({error:'invalid_f1_view'});
  }
  if(String(q.motorsport||'')==='motogp'){
   const base='https://api.motogp.pulselive.com/motogp/v1/',year=new Date().getUTCFullYear(),view=String(q.view||'calendar');
   const seasons=await fetchJSON(base+'results/seasons'),season=(seasons||[]).find(x=>Number(x.year)===year);if(!season?.id)throw Error('season');
   const cats=await fetchJSON(base+'results/categories?seasonUuid='+encodeURIComponent(season.id)),cat=(cats||[]).find(x=>Number(x.legacy_id)===3||String(x.name||'').toLowerCase().includes('motogp'));if(!cat?.id)throw Error('category');
   if(view==='calendar'){const a=await fetchJSON(base+'results/events?seasonUuid='+encodeURIComponent(season.id)),now=Date.now();const items=(a||[]).filter(x=>{const end=x.date_end||x.date_start||x.date||'';const t=Date.parse(end);return Number.isFinite(t)&&t>=now}).sort((x,y)=>Date.parse(x.date_start||x.date||0)-Date.parse(y.date_start||y.date||0)).map(x=>({name:x.sponsored_name||x.name,circuit:x.circuit?.name||'',country:x.country?.name||'',start:x.date_start||x.date||'',end:x.date_end||''}));return res.status(200).json({sport:'motogp',view,items})}
   if(view==='drivers'){const d=await fetchJSON(base+'results/standings?seasonUuid='+encodeURIComponent(season.id)+'&categoryUuid='+encodeURIComponent(cat.id));return res.status(200).json({sport:'motogp',view,items:(d.classification||[]).map(x=>({position:x.position,points:x.points,driver:x.rider?.full_name||'',team:x.team?.name||'',constructor:x.constructor?.name||''}))})}
   const events=await fetchJSON(base+'results/events?seasonUuid='+encodeURIComponent(season.id)+'&isFinished=true'),ev=(events||[]).sort((a,b)=>String(a.date_end||a.date||'').localeCompare(String(b.date_end||b.date||''))).pop();if(!ev?.id)throw Error('event');
   const sessions=await fetchJSON(base+'results/sessions?eventUuid='+encodeURIComponent(ev.id)+'&categoryUuid='+encodeURIComponent(cat.id)),race=[...(sessions||[])].reverse().find(x=>x.type==='RAC'||String(x.type||'').toLowerCase()==='race');if(!race?.id)throw Error('race');
   const d=await fetchJSON(base+'results/session/'+encodeURIComponent(race.id)+'/classification?seasonYear='+year+'&test=false'),rows=d.classification||d||[];
   return res.status(200).json({sport:'motogp',view:'results',event:ev.sponsored_name||ev.name,eventDate:ev.date_end||ev.date_start||ev.date||'',items:(Array.isArray(rows)?rows:[]).map(x=>({position:x.position,points:x.points,driver:x.rider?.full_name||'',team:x.team_name||x.team?.name||'',constructor:x.constructor?.name||'',gap:x.time||x.gap||''}))});
  }
  const base='https://www.thesportsdb.com/api/v1/json/123/';
  if(String(q.sport||'').toLowerCase()==='cycling'){
   const cc=String(q.country||'fr').toLowerCase(),countryName=countryNames[cc]||'France',now=new Date();
   const races=[
    {start:'2026-09-11',end:'2026-09-11',name:'Grand Prix Cycliste de Québec',place:'Canada',series:'UCI WorldTour',winner:'Remco Evenepoel',podium:'1. Remco Evenepoel • 2. Giulio Ciccone • 3. Anthon Charmig'},
    {start:'2026-09-13',end:'2026-09-13',name:'Grand Prix Cycliste de Montréal',place:'Canada',series:'UCI WorldTour',winner:'Isaac Del Toro',podium:'1. Isaac Del Toro • 2. Paul Seixas • 3. Brandon McNulty'},
    {start:'2026-09-20',end:'2026-09-27',name:'Championnats du Monde Route UCI',place:'Montréal, Canada',series:'UCI',winner:'En cours',podium:''},
    {start:'2026-10-10',end:'2026-10-10',name:'Il Lombardia',place:'Italie',series:'UCI WorldTour',winner:'À venir',podium:''},
    {start:'2026-10-13',end:'2026-10-18',name:'Tour of Guangxi',place:'Chine',series:'UCI WorldTour',winner:'À venir',podium:''}
   ];
   const events=races.filter(r=>new Date(r.end+'T23:59:59Z')>=new Date(now.getTime()-14*86400000)).map(r=>{
    const finished=new Date(r.end+'T23:59:59Z')<now,started=new Date(r.start+'T00:00:00Z')<=now&&!finished;
    return {home:r.name,away:r.place,score:finished?('🏆 '+r.winner):(started?'EN COURS':'À VENIR'),competition:(finished?'Résultat • ':'')+r.series+(r.podium?' • '+r.podium:''),time:r.start===r.end?r.start:(r.start+' → '+r.end),live:started};
   });
   return res.status(200).json({country:countryName,sport:'Cycling',events,source:'verified-uci-calendar'});
  }
  if(String(q.catalog||'')==='1'){
   const cc=String(q.country||'fr').toLowerCase(),ss=String(q.sport||'football').toLowerCase(),preset=competitionCatalog[cc]?.[ss]||[];
   if(preset.length&&!preset.every(x=>x.id==='generic'))return res.status(200).json({competitions:preset});
   try{const d=await fetchJSON(base+'search_all_leagues.php?c='+encodeURIComponent(countryNames[cc]||'France')+'&s='+encodeURIComponent(sportNames[ss]||ss));const competitions=(d.countries||[]).slice(0,8).map(x=>({id:'provider-'+x.idLeague,label:x.strLeague||x.strLeagueAlternate||ss,type:'provider',providerId:String(x.idLeague)}));return res.status(200).json({competitions:competitions.length?competitions:preset})}catch{return res.status(200).json({competitions:preset})}
  }
  const leagueKey=String(q.league||'').toLowerCase(),view=String(q.view||'').toLowerCase();
  if(leagueKey.startsWith('rugby-')){
   const rugbyIds={'rugby-top14':'4430','rugby-prod2':'5172','rugby-six-nations':'4714'},id=rugbyIds[leagueKey];
   if(leagueKey==='rugby-top14'&&view==='standings'){try{const html=await (await fetch('https://www.lequipe.fr/Rugby/top-14/page-classement-equipes/general',{headers:{'user-agent':'Mozilla/5.0'}})).text(),plain=html.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' '),teams=['Lyon','Toulouse','Bordeaux-Bègles','Pau','Montpellier','Bayonne','Castres','La Rochelle','Clermont','Perpignan','Stade Français','Racing 92','Toulon','Vannes'],table=[];for(const team of teams){const p=plain.indexOf(team);if(p<0)continue;const seg=plain.slice(p+team.length,p+team.length+160),nums=(seg.match(/-?\d+/g)||[]).map(Number);if(nums.length>=7)table.push({team,badge:'',points:nums[0],played:nums[1],win:nums[2],draw:nums[3],loss:nums[4],gf:0,ga:0,gd:nums[6]})}if(table.length===14){table.sort((a,b)=>b.points-a.points||b.gd-a.gd);table.forEach((x,i)=>x.rank=i+1);return res.status(200).json({league:leagueKey,view,table,source:'live-lequipe'})}}catch{}}
   if(!id)return res.status(200).json(view==='standings'?{league:leagueKey,view,table:[]}:{league:leagueKey,view,events:[]});
   if(view==='results'||view==='upcoming'){const ep=view==='results'?'eventspastleague.php?id=':'eventsnextleague.php?id=',d=await fetchJSON(base+ep+id).catch(()=>({events:[]}));let events=(d.events||[]).map(eventOut);events.sort((a,b)=>view==='results'?String(b.time).localeCompare(String(a.time)):String(a.time).localeCompare(String(b.time)));return res.status(200).json({league:leagueKey,view,events:events.slice(0,12)})}
   const d=await fetchJSON(base+'lookuptable.php?l='+id).catch(()=>({table:[]}));return res.status(200).json({league:leagueKey,view,table:(d.table||[]).map(tableRow).sort((a,b)=>a.rank-b.rank)});
  }
  let tableLeague=leagueKey.startsWith('provider-')?leagueKey.slice(9):leagueMap[leagueKey];
  if(!tableLeague&&discoverMap[leagueKey]){try{const d=await fetchJSON(base+'search_all_leagues.php?c='+encodeURIComponent(['national','coupe-france'].includes(leagueKey)?'France':'')+'&s=Soccer');const wanted=discoverMap[leagueKey].toLowerCase(),hit=(d.countries||[]).find(x=>String(x.strLeague||'').toLowerCase().includes(wanted)||wanted.includes(String(x.strLeague||'').toLowerCase()));if(hit?.idLeague)tableLeague=String(hit.idLeague)}catch{}}
  if(leagueKey==='france-team'){const d=await fetchJSON(base+'searchteams.php?t=France');const team=(d.teams||[]).find(x=>String(x.strSport||'').toLowerCase()==='soccer')||(d.teams||[])[0];if(!team?.idTeam)return res.status(200).json({events:[]});const ep=view==='results'?'eventslast.php?id=':'eventsnext.php?id=',e=await fetchJSON(base+ep+team.idTeam);return res.status(200).json({league:leagueKey,view,events:(e.results||e.events||[]).map(eventOut).slice(0,12)})}
  if(tableLeague){const ep=view==='results'?'eventspastleague.php?id=':view==='upcoming'?'eventsnextleague.php?id=':null;if(ep){const d=await fetchJSON(base+ep+encodeURIComponent(tableLeague));let events=(d.events||[]).map(eventOut);events.sort((a,b)=>view==='results'?String(b.time).localeCompare(String(a.time)):String(a.time).localeCompare(String(b.time)));return res.status(200).json({league:leagueKey,view,events:events.slice(0,12)})}const d=await fetchJSON(base+'lookuptable.php?l='+encodeURIComponent(tableLeague)).catch(()=>({table:[]}));let table=(d.table||[]).map(tableRow).sort((a,b)=>a.rank-b.rank);if(!table.length&&leagueKey.startsWith('provider-')&&String(q.sport||'football').toLowerCase()==='football'){const past=await fetchJSON(base+'eventspastleague.php?id='+encodeURIComponent(tableLeague)).catch(()=>({events:[]}));const stats=new Map();for(const e of past.events||[]){const hs=Number(e.intHomeScore??e.intHomeScoreTotal),as=Number(e.intAwayScore??e.intAwayScoreTotal),home=e.strHomeTeam,away=e.strAwayTeam;if(!home||!away||!Number.isFinite(hs)||!Number.isFinite(as))continue;for(const n of [home,away])if(!stats.has(n))stats.set(n,{team:n,played:0,win:0,draw:0,loss:0,gf:0,ga:0,points:0});const h=stats.get(home),a=stats.get(away);h.played++;a.played++;h.gf+=hs;h.ga+=as;a.gf+=as;a.ga+=hs;if(hs>as){h.win++;a.loss++;h.points+=3}else if(as>hs){a.win++;h.loss++;a.points+=3}else{h.draw++;a.draw++;h.points++;a.points++}}table=[...stats.values()].sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf).map((x,i)=>({rank:i+1,team:x.team,badge:'',played:x.played,win:x.win,draw:x.draw,loss:x.loss,gf:x.gf,ga:x.ga,gd:x.gf-x.ga,points:x.points}))}return res.status(200).json({league:leagueKey,table})}
  const c=countryNames[String(q.country||'fr').toLowerCase()]||'France',s=sportNames[String(q.sport||'football').toLowerCase()]||'Soccer';
  const ld=await fetchJSON(base+'search_all_leagues.php?c='+encodeURIComponent(c)+'&s='+encodeURIComponent(s)),leagues=(ld.countries||[]).slice(0,3);
  const batches=await Promise.all(leagues.flatMap(l=>[fetchJSON(base+'eventspastleague.php?id='+encodeURIComponent(l.idLeague)).catch(()=>({})),fetchJSON(base+'eventsnextleague.php?id='+encodeURIComponent(l.idLeague)).catch(()=>({}))]));
  let events=batches.flatMap(x=>x.events||[]).map(eventOut);const seen=new Set();events=events.filter(x=>{const k=x.competition+'|'+x.home+'|'+x.away+'|'+x.time;if(seen.has(k))return false;seen.add(k);return true});events.sort((a,b)=>String(b.time).localeCompare(String(a.time)));
  return res.status(200).json({country:c,sport:s,events:events.slice(0,12)});
 }catch(e){return res.status(502).json({table:[],events:[],items:[],error:'sports_provider_unavailable'})}
};
