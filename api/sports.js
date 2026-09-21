const countryNames={fr:'France',gb:'England',es:'Spain',de:'Germany',it:'Italy',pt:'Portugal',us:'United States',be:'Belgium',ch:'Switzerland'};
const sportNames={football:'Soccer',basketball:'Basketball',tennis:'Tennis',handball:'Handball',rugby:'Rugby'};
function eventOut(e){
 const hs=e.intHomeScore??e.intHomeScoreTotal,as=e.intAwayScore??e.intAwayScoreTotal;
 const played=hs!==null&&hs!==undefined&&hs!==''&&as!==null&&as!==undefined&&as!=='';
 const time=[e.dateEvent,e.strTime].filter(Boolean).join(' ');
 return {home:e.strHomeTeam||e.strEvent?.split(' vs ')[0]||'—',away:e.strAwayTeam||e.strEvent?.split(' vs ')[1]||'—',score:played?(hs+' - '+as):'VS',competition:e.strLeague||'',time,live:String(e.strStatus||'').toLowerCase().includes('live')};
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=300');
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