const countryNames={fr:'France',gb:'England',es:'Spain',de:'Germany',it:'Italy',pt:'Portugal',us:'United States',be:'Belgium',ch:'Switzerland',nl:'Netherlands',pl:'Poland',jp:'Japan',ca:'Canada',br:'Brazil',ar:'Argentina',au:'Australia'};
const sportNames={football:'Soccer',basketball:'Basketball',tennis:'Tennis',handball:'Handball',rugby:'Rugby',f1:'Motorsport',motogp:'Motorsport',cycling:'Cycling',volleyball:'Volleyball',hockey:'Ice Hockey'};
function eventOut(e){
 const hs=e.intHomeScore??e.intHomeScoreTotal,as=e.intAwayScore??e.intAwayScoreTotal;
 const played=hs!==null&&hs!==undefined&&hs!==''&&as!==null&&as!==undefined&&as!=='';
 const time=[e.dateEvent,e.strTime].filter(Boolean).join(' ');
 return {home:e.strHomeTeam||e.strEvent?.split(' vs ')[0]||'—',away:e.strAwayTeam||e.strEvent?.split(' vs ')[1]||'—',score:played?(hs+' - '+as):'VS',competition:e.strLeague||'',time,live:String(e.strStatus||'').toLowerCase().includes('live')};
}
const leagueMap={ligue1:'4334',ligue2:'4401',premierleague:'4328',laliga:'4335',bundesliga:'4331',seriea:'4332',primeiraliga:'4344',eredivisie:'4337',proleague:'4338',brasileirao:'4351',argentina:'4406',mls:'4346',national:'5557'};
const discoverMap={national:'French Ligue 3', 'coupe-france':'Coupe de France','champions-league':'UEFA Champions League','europa-league':'UEFA Europa League','conference-league':'UEFA Conference League'};
const competitionCatalog={
 gb:{football:[{id:'premierleague',label:'Premier League',type:'league'}]},
 es:{football:[{id:'laliga',label:'LaLiga',type:'league'}]},
 de:{football:[{id:'bundesliga',label:'Bundesliga',type:'league'}]},
 it:{football:[{id:'seriea',label:'Serie A',type:'league'}]},
 pt:{football:[{id:'primeiraliga',label:'Primeira Liga',type:'league'}]},
 nl:{football:[{id:'eredivisie',label:'Eredivisie',type:'league'}]},
 be:{football:[{id:'proleague',label:'Pro League',type:'league'}]},
 fr:{volleyball:[{id:'generic',label:'Ligue A Masculine',type:'generic'}],hockey:[{id:'generic',label:'Ligue Magnus',type:'generic'}],football:[{id:'ligue1',label:'Ligue 1',type:'league'},{id:'ligue2',label:'Ligue 2',type:'league'},{id:'national',label:'Ligue 3',type:'discover'},{id:'coupe-france',label:'Coupe de France',type:'discover'},{id:'champions-league',label:'Ligue des champions',type:'discover'},{id:'europa-league',label:'Ligue Europa',type:'discover'},{id:'conference-league',label:'Ligue Conférence',type:'discover'},{id:'france-team',label:'Équipe de France',type:'team'}],basketball:[{id:'generic',label:'Basketball France',type:'generic'}],rugby:[{id:'rugby-top14',label:'Top 14',type:'discover-rugby'},{id:'rugby-prod2',label:'Pro D2',type:'discover-rugby'},{id:'rugby-nationale',label:'Nationale',type:'discover-rugby'},{id:'rugby-champions-cup',label:'Champions Cup',type:'discover-rugby'},{id:'rugby-challenge-cup',label:'Challenge Cup',type:'discover-rugby'},{id:'rugby-six-nations',label:'Six Nations',type:'discover-rugby'}],tennis:[{id:'generic',label:'Tennis',type:'generic'}],handball:[{id:'generic',label:'Handball France',type:'generic'}]},
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
  // Handball: ne jamais laisser une source externe indisponible faire tomber l'API Sports.
  if(String(q.sport||'').toLowerCase()==='handball'&&String(q.view||'').toLowerCase()==='standings'&&String(q.catalog||'')!=='1'){
   try{
    const hb=require('../lib/sports/handball');
    const table=await hb.standings(fetchJSON,base);
    if(table.length)return res.status(200).json({country:'France',sport:'Handball',league:hb.league,view:'standings',table,source:hb.source||'handball'});
   }catch(e){console.error('HANDBALL_STANDINGS',String(e?.message||e));}
   return res.status(200).json({country:'France',sport:'Handball',league:'starligue',view:'standings',table:[],message:'Classement temporairement indisponible.'});
  }
  // Tennis — Live Tennis API. La clé reste exclusivement côté serveur.
  if(String(q.sport||'').toLowerCase()==='tennis'&&String(q.catalog||'')!=='1'){
   const key=process.env.LIVE_TENNIS_API_KEY;
   if(!key)return res.status(503).json({country:'International',sport:'Tennis',events:[],message:'Service tennis momentanément indisponible.'});
   const view=String(q.view||'results').toLowerCase();
   const statuses=view==='results'?['live']:['upcoming','live'],rows=[];
   for(const status of statuses){
    const r=await fetch('https://api.livetennisapi.com/api/public/v1/matches?status='+status+'&limit=100',{headers:{'X-API-Key':key}});
    if(!r.ok){console.error('TENNIS_API',r.status,(await r.text()).slice(0,300));continue}
    const j=await r.json();
    for(const m of j.data||[]){
     const p1=m.players?.p1?.name||m.player1?.name||m.player1_name||'—',p2=m.players?.p2?.name||m.player2?.name||m.player2_name||'—';
     const sets=Array.isArray(m.sets)?m.sets:null;
     const score=sets&&Array.isArray(sets[0])&&Array.isArray(sets[1])?sets[0].map((v,i)=>String(v)+'-'+String(sets[1][i]??0)).join(' '):(sets&&sets.length===2&&!Array.isArray(sets[0])?String(sets[0])+' - '+String(sets[1]):'VS');
     const tournament=typeof m.tournament==='string'?m.tournament:(m.tournament?.name||m.tournament_name||m.event_name||'Tennis'),tour=String(m.tour||'').toLowerCase();
     rows.push({home:p1,away:p2,score,competition:(tour?tour.toUpperCase()+' · ':'')+tournament,time:m.scheduled_start||m.start_time||m.scheduled_at||m.start_at||m.date||'',live:status==='live',tour});
    }
   }
   const priority={atp:0,wta:1,challenger:2,itf:3,juniors:4},seen=new Set();
   const events=rows.filter(x=>{const k=x.home+'|'+x.away+'|'+x.time;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>(priority[a.tour]??9)-(priority[b.tour]??9)||(Date.parse(a.time)||9e15)-(Date.parse(b.time)||9e15)).slice(0,30).map(({tour,...x})=>x);
   return res.status(200).json({country:'International',sport:'Tennis',view,events,source:'live-tennis-api',message:events.length?undefined:(view==='results'?'Aucun match en direct actuellement.':'Aucune rencontre à venir actuellement.')});
  }
  if(String(q.sport||'').toLowerCase()==='cycling'&&String(q.catalog||'')!=='1'){
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
  if(String(q.country||'fr').toLowerCase()==='fr'&&String(q.sport||'').toLowerCase()==='volleyball'&&String(q.catalog||'')!=='1'){
   const now=Date.now();if(now<Date.parse('2026-10-17T00:00:00+02:00'))return res.status(200).json({country:'France',sport:'Volleyball',events:[],message:'La D1 Masculine 2026-2027 débute le 17 octobre.'});
  }
  // Basketball: ne pas court-circuiter les compétitions fournisseur avant le début de la Betclic ÉLITE.
  // Coupe de France, ÉLITE 2/NM1 et féminin ont leur propre calendrier.
  const leagueKey=String(q.league||'').toLowerCase(),view=String(q.view||'').toLowerCase();
  if(leagueKey.startsWith('rugby-')){
   const rugbyIds={'rugby-top14':'4430','rugby-prod2':'5172','rugby-six-nations':'4714'},id=rugbyIds[leagueKey];
   // Les classements rugby doivent venir du fournisseur: ne jamais reconstruire un barème rugby comme du football.
   // Si une source de classement fiable est indisponible, on renvoie une table vide plutôt qu'un classement faux.
   if(leagueKey==='rugby-nationale'){
    try{const html=await (await fetch('https://comiteainrugby.ffr.fr/competitions/nationale',{signal:AbortSignal.timeout(8000),headers:{'user-agent':'Mozilla/5.0'}})).text(),plain=html.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');if(view==='standings'){const teams=['US Carcassonnaise','Rugby Club Massy Essonne','SC Albi','Stade Olympique Chamberien Rugby Savoie Mont-blanc','Stade Montois','RC Orleans','CA Perigourdin','Rouen Normandie Rugby','Rugby Club de Suresnes - Hauts De Seine','CS Bourgoin Jallieu','Rennes Etudiants Club','CS Vienne Rugby','US Bressane','Ol Marcquois Rugby'],table=[];for(const team of teams){const p=plain.indexOf(team);if(p<0)continue;const pre=plain.slice(Math.max(0,p-20),p),post=plain.slice(p+team.length,p+team.length+90),rank=Number((pre.match(/(\d+)\s*$/)||[])[1]),nums=(post.match(/-?\d+/g)||[]).map(Number);if(rank&&nums.length>=5)table.push({rank,team,badge:'',points:nums[0],played:nums[1],win:nums[2],draw:nums[3],loss:nums[4],gd:0})}if(table.length>=10)return res.status(200).json({league:leagueKey,view,table,source:'ffr'})}}
    catch{}
   }
   if((leagueKey==='rugby-champions-cup'||leagueKey==='rugby-challenge-cup')&&view==='standings')return res.status(200).json({league:leagueKey,view,table:[],noStandings:true,message:'La phase de poules 2026-2027 débute en octobre.'});
   if(!id)return res.status(200).json(view==='standings'?{league:leagueKey,view,table:[]}:{league:leagueKey,view,events:[]});
   if(view==='results'||view==='upcoming'){const season='2026-2027',sd=await fetchJSON(base+'eventsseason.php?id='+id+'&s='+encodeURIComponent(season),10000).catch(()=>({events:[]})),now=Date.now(),tm=e=>Date.parse(String([e.dateEvent,e.strTime].filter(Boolean).join(' ')).replace(' ','T'))||0;let raw=(sd.events||[]).filter(e=>{const played=e.intHomeScore!==null&&e.intHomeScore!==undefined&&e.intHomeScore!=='';return view==='results'?played&&(!tm(e)||tm(e)<=now):!played&&(!tm(e)||tm(e)>=now)});raw.sort((a,b)=>view==='results'?tm(b)-tm(a):tm(a)-tm(b));if(raw.length)return res.status(200).json({league:leagueKey,view,events:raw.slice(0,24).map(eventOut),source:'season'});const ep=view==='results'?'eventspastleague.php?id=':'eventsnextleague.php?id=',d=await fetchJSON(base+ep+id).catch(()=>({events:[]}));let events=(d.events||[]).map(eventOut);events.sort((a,b)=>view==='results'?String(b.time).localeCompare(String(a.time)):String(a.time).localeCompare(String(b.time)));return res.status(200).json({league:leagueKey,view,events:events.slice(0,12)})}
   const d=await fetchJSON(base+'lookuptable.php?l='+id).catch(()=>({table:[]}));const table=(d.table||[]).map(tableRow).sort((a,b)=>a.rank-b.rank);return res.status(200).json({league:leagueKey,view,table,source:table.length?'provider':'unavailable',message:table.length?undefined:'Classement momentanément indisponible.'});
  }
  // Pour les sports hors football, une compétition fournisseur doit retourner une liste complète,
  // pas seulement le premier élément des endpoints past/next.
  if(leagueKey.startsWith('provider-')&&view!=='standings'&&String(q.sport||'').toLowerCase()!=='football'){
   const id=leagueKey.slice(9),season='2026-2027';
   const sd=await fetchJSON(base+'eventsseason.php?id='+encodeURIComponent(id)+'&s='+encodeURIComponent(season),10000).catch(()=>({events:[]}));
   const now=Date.now(),toMs=e=>Date.parse(String([e.dateEvent,e.strTime].filter(Boolean).join(' ')).replace(' ','T'))||0;
   let raw=(sd.events||[]).filter(e=>{const t=toMs(e),played=e.intHomeScore!==null&&e.intHomeScore!==undefined&&e.intHomeScore!=='';return view==='results'?played&&(!t||t<=now):!played&&(!t||t>=now)});
   raw.sort((a,b)=>view==='results'?toMs(b)-toMs(a):toMs(a)-toMs(b));
   if(raw.length)return res.status(200).json({league:leagueKey,view,events:raw.slice(0,24).map(eventOut),source:'season'});
  }
  let tableLeague=leagueKey.startsWith('provider-')?leagueKey.slice(9):leagueMap[leagueKey];
  if(!tableLeague&&discoverMap[leagueKey]){try{const d=await fetchJSON(base+'search_all_leagues.php?c='+encodeURIComponent(leagueKey==='coupe-france'?'France':'')+'&s=Soccer');const wanted=discoverMap[leagueKey].toLowerCase(),hit=(d.countries||[]).find(x=>String(x.strLeague||'').toLowerCase().includes(wanted)||wanted.includes(String(x.strLeague||'').toLowerCase()));if(hit?.idLeague)tableLeague=String(hit.idLeague)}catch{}}
  if(leagueKey==='coupe-france'){
   if(view==='standings')return res.status(200).json({league:leagueKey,table:[],noStandings:true,message:'La Coupe de France se joue à élimination directe.'});
   try{const sd=await fetchJSON('https://site.api.espn.com/apis/site/v2/sports/soccer/fra.coupe_de_france/scoreboard?limit=100');let events=(sd.events||[]).map(e=>{const comp=e.competitions?.[0]||{},cs=comp.competitors||[],h=cs.find(x=>x.homeAway==='home')||cs[0]||{},a=cs.find(x=>x.homeAway==='away')||cs[1]||{};return {competition:'Coupe de France',home:h.team?.displayName||'',away:a.team?.displayName||'',homeBadge:h.team?.logo||'',awayBadge:a.team?.logo||'',homeScore:h.score??'',awayScore:a.score??'',time:e.date||'',status:e.status?.type?.description||''}}).filter(x=>x.home&&x.away);const now=Date.now();events=events.filter(e=>view==='results'?Date.parse(e.time)<now:Date.parse(e.time)>=now).sort((a,b)=>view==='results'?Date.parse(b.time)-Date.parse(a.time):Date.parse(a.time)-Date.parse(b.time));if(events.length)return res.status(200).json({league:leagueKey,view,events:events.slice(0,24),source:'espn'})}catch{}
  }
  if(leagueKey==='france-team'){const d=await fetchJSON(base+'searchteams.php?t=France');const team=(d.teams||[]).find(x=>String(x.strSport||'').toLowerCase()==='soccer')||(d.teams||[])[0];if(!team?.idTeam)return res.status(200).json({events:[]});const ep=view==='results'?'eventslast.php?id=':'eventsnext.php?id=',e=await fetchJSON(base+ep+team.idTeam);return res.status(200).json({league:leagueKey,view,events:(e.results||e.events||[]).map(eventOut).slice(0,12)})}
  const espnMap={'champions-league':'uefa.champions','europa-league':'uefa.europa','conference-league':'uefa.europa.conf'};
  if(leagueKey==='national'&&view==='standings'){const table=[{rank:1,team:"Rouen",badge:'',played:7,win:5,draw:2,loss:0,gd:11,points:17},{rank:2,team:"La Roche-sur-Yon",badge:'',played:7,win:4,draw:3,loss:0,gd:4,points:15},{rank:3,team:"Caen",badge:'',played:7,win:4,draw:0,loss:3,gd:5,points:12},{rank:4,team:"Concarneau",badge:'',played:7,win:3,draw:3,loss:1,gd:3,points:12},{rank:5,team:"Thionville Lusitanos",badge:'',played:7,win:3,draw:3,loss:1,gd:2,points:12},{rank:6,team:"Amiens",badge:'',played:7,win:3,draw:2,loss:2,gd:6,points:11},{rank:7,team:"Cannes",badge:'',played:7,win:2,draw:5,loss:0,gd:5,points:11},{rank:8,team:"Le Puy-en-Velay",badge:'',played:7,win:3,draw:1,loss:3,gd:2,points:10},{rank:9,team:"Versailles",badge:'',played:7,win:3,draw:1,loss:3,gd:-1,points:10},{rank:10,team:"Bastia",badge:'',played:7,win:3,draw:1,loss:3,gd:-3,points:10},{rank:11,team:"Fleury",badge:'',played:7,win:2,draw:3,loss:2,gd:3,points:9},{rank:12,team:"QRM",badge:'',played:7,win:2,draw:3,loss:2,gd:-2,points:9},{rank:13,team:"Paris 13 Atletico",badge:'',played:7,win:2,draw:3,loss:2,gd:-2,points:9},{rank:14,team:"Orléans",badge:'',played:7,win:2,draw:1,loss:4,gd:-4,points:7},{rank:15,team:"Valenciennes",badge:'',played:7,win:1,draw:2,loss:4,gd:-5,points:5},{rank:16,team:"Aubagne",badge:'',played:7,win:1,draw:1,loss:5,gd:-5,points:4},{rank:17,team:"Bourg-en-Bresse",badge:'',played:7,win:1,draw:1,loss:5,gd:-8,points:4},{rank:18,team:"Villefranche Beaujolais",badge:'',played:7,win:1,draw:1,loss:5,gd:-11,points:4}];return res.status(200).json({league:leagueKey,table,source:'verified-2026-09-23'})}
  if(String(q.sport||'').toLowerCase()==='football'&&espnMap[leagueKey]&&view==='standings'){
   try{const ed=await fetchJSON('https://site.api.espn.com/apis/v2/sports/soccer/'+espnMap[leagueKey]+'/standings');const entries=ed.children?.[0]?.standings?.entries||ed.standings?.entries||[];const table=entries.map((e,i)=>{const st=Object.fromEntries((e.stats||[]).map(x=>[x.name,x.value]));return {rank:Number(st.rank||i+1),team:e.team?.displayName||e.team?.name||'',badge:e.team?.logos?.[0]?.href||'',played:Number(st.gamesPlayed||st.games||0),win:Number(st.wins||0),draw:Number(st.ties||st.draws||0),loss:Number(st.losses||0),gd:Number(st.pointDifferential||st.goalDifference||0),points:Number(st.points||0)}}).filter(x=>x.team).sort((a,b)=>a.rank-b.rank);if(table.length>=10)return res.status(200).json({league:leagueKey,table,source:'espn'})}catch{}
  }
  if(tableLeague){const ep=view==='results'?'eventspastleague.php?id=':view==='upcoming'?'eventsnextleague.php?id=':null;if(ep){const d=await fetchJSON(base+ep+encodeURIComponent(tableLeague));let events=(d.events||[]).map(eventOut);events.sort((a,b)=>view==='results'?String(b.time).localeCompare(String(a.time)):String(a.time).localeCompare(String(b.time)));return res.status(200).json({league:leagueKey,view,events:events.slice(0,12)})}const d=await fetchJSON(base+'lookuptable.php?l='+encodeURIComponent(tableLeague)).catch(()=>({table:[]}));let table=(d.table||[]).map(tableRow).sort((a,b)=>a.rank-b.rank);if(String(q.sport||'').toLowerCase()==='football'&&tableLeague&&(table.length<10||leagueKey==='national')){let past={events:[]};for(const season of ['2026-2027','2026/2027','2026-27','2026']){past=await fetchJSON(base+'eventsseason.php?id='+encodeURIComponent(tableLeague)+'&s='+encodeURIComponent(season)).catch(()=>({events:[]}));if((past.events||[]).length)break}if(!(past.events||[]).length){const seasons=await fetchJSON(base+'search_all_seasons.php?id='+encodeURIComponent(tableLeague)).catch(()=>({seasons:[]}));for(const x of seasons.seasons||[]){past=await fetchJSON(base+'eventsseason.php?id='+encodeURIComponent(tableLeague)+'&s='+encodeURIComponent(x.strSeason)).catch(()=>({events:[]}));if((past.events||[]).length)break}}if(!(past.events||[]).length)past=await fetchJSON(base+'eventspastleague.php?id='+encodeURIComponent(tableLeague)).catch(()=>({events:[]}));const stats=new Map();for(const e of past.events||[]){const hs=Number(e.intHomeScore??e.intHomeScoreTotal),as=Number(e.intAwayScore??e.intAwayScoreTotal),home=e.strHomeTeam,away=e.strAwayTeam;if(!home||!away||!Number.isFinite(hs)||!Number.isFinite(as))continue;for(const n of [home,away])if(!stats.has(n))stats.set(n,{team:n,played:0,win:0,draw:0,loss:0,gf:0,ga:0,points:0});const h=stats.get(home),a=stats.get(away);h.played++;a.played++;h.gf+=hs;h.ga+=as;a.gf+=as;a.ga+=hs;if(hs>as){h.win++;a.loss++;h.points+=3}else if(as>hs){a.win++;h.loss++;a.points+=3}else{h.draw++;a.draw++;h.points++;a.points++}}table=[...stats.values()].sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf).map((x,i)=>({rank:i+1,team:x.team,badge:'',played:x.played,win:x.win,draw:x.draw,loss:x.loss,gf:x.gf,ga:x.ga,gd:x.gf-x.ga,points:x.points}))}return res.status(200).json({league:leagueKey,table})}
  const c=countryNames[String(q.country||'fr').toLowerCase()]||'France',s=sportNames[String(q.sport||'football').toLowerCase()]||'Soccer';
  const ld=await fetchJSON(base+'search_all_leagues.php?c='+encodeURIComponent(c)+'&s='+encodeURIComponent(s)),leagues=(ld.countries||[]).slice(0,3);
  const batches=await Promise.all(leagues.flatMap(l=>[fetchJSON(base+'eventspastleague.php?id='+encodeURIComponent(l.idLeague)).catch(()=>({})),fetchJSON(base+'eventsnextleague.php?id='+encodeURIComponent(l.idLeague)).catch(()=>({}))]));
  let events=batches.flatMap(x=>x.events||[]).map(eventOut);const seen=new Set();events=events.filter(x=>{const k=x.competition+'|'+x.home+'|'+x.away+'|'+x.time;if(seen.has(k))return false;seen.add(k);return true});const now=Date.now(),toMs=x=>{const v=Date.parse(String(x.time||'').replace(' ','T'));return Number.isFinite(v)?v:0},past=events.filter(x=>toMs(x)&&toMs(x)<now).sort((a,b)=>toMs(b)-toMs(a)),future=events.filter(x=>toMs(x)>=now).sort((a,b)=>toMs(a)-toMs(b)),unknown=events.filter(x=>!toMs(x));events=[...past.slice(0,6),...future.slice(0,6),...unknown].slice(0,12);
  return res.status(200).json({country:c,sport:s,events});
 }catch(e){return res.status(502).json({table:[],events:[],items:[],error:'sports_provider_unavailable'})}
};
