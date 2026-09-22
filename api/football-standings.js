const leagueMap={ligue1:'4334',ligue2:'4401'};
function row(t){return {rank:Number(t.intRank||0),team:t.strTeam||'—',badge:t.strBadge||'',played:Number(t.intPlayed||0),win:Number(t.intWin||0),draw:Number(t.intDraw||0),loss:Number(t.intLoss||0),gf:Number(t.intGoalsFor||0),ga:Number(t.intGoalsAgainst||0),gd:Number(t.intGoalDifference??((t.intGoalsFor||0)-(t.intGoalsAgainst||0))),points:Number(t.intPoints||0)}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=1800');
 const league=String(req.query.league||'ligue1').toLowerCase();
 const id=leagueMap[league];
 if(!id)return res.status(400).json({table:[],error:'unknown_league'});
 try{
  const base='https://www.thesportsdb.com/api/v1/json/123/';
  const r=await fetch(base+'lookuptable.php?l='+encodeURIComponent(id));
  if(!r.ok)throw Error('provider');
  const d=await r.json();
  const table=(d.table||[]).map(row).sort((a,b)=>a.rank-b.rank);
  res.status(200).json({league,table});
 }catch(e){res.status(502).json({table:[],error:'sports_provider_unavailable'})}
}