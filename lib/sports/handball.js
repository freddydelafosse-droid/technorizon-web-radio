// Module interne StarLigue — aucune fonction Vercel supplémentaire.
const providerId='4536';
async function standings(fetchJSON,base){
 const d=await fetchJSON(base+'lookuptable.php?l='+providerId).catch(()=>({table:[]}));
 return (d.table||[]).map(t=>({rank:Number(t.intRank||0),team:t.strTeam||'—',badge:t.strBadge||'',played:Number(t.intPlayed||0),win:Number(t.intWin||0),draw:Number(t.intDraw||0),loss:Number(t.intLoss||0),gf:Number(t.intGoalsFor||0),ga:Number(t.intGoalsAgainst||0),gd:Number(t.intGoalDifference??((t.intGoalsFor||0)-(t.intGoalsAgainst||0))),points:Number(t.intPoints||0)})).filter(x=>x.rank>0).sort((a,b)=>a.rank-b.rank);
}
module.exports={league:'starligue',providerId,standings};
