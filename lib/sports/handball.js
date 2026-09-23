// Daikin StarLigue — snapshot vérifié après J03 (23/09/2026).
// Fallback local volontaire: aucune dépendance externe au runtime.
const raw=[[1,"Nantes",6,3,3,0,0,112,87,25],[2,"Paris",6,3,3,0,0,97,79,18],[3,"Limoges",4,3,2,0,1,102,84,18],[4,"Montpellier",4,3,2,0,1,110,91,19],[5,"Saran",4,3,2,0,1,88,85,3],[6,"Nîmes",4,3,2,0,1,99,101,-2],[7,"Sélestat",4,3,2,0,1,90,90,0],[8,"Caen",4,3,2,0,1,81,93,-12],[9,"Chartres",2,3,1,0,2,83,106,-23],[10,"Tremblay",2,3,1,0,2,94,103,-9],[11,"Cesson-Rennes",2,3,1,0,2,85,92,-7],[12,"Chambéry",2,3,1,0,2,99,94,5],[13,"Aix",2,3,1,0,2,90,99,-9],[14,"Saint-Raphaël",2,3,1,0,2,87,97,-10],[15,"Toulouse",0,3,0,0,3,80,84,-4],[16,"Dunkerque",0,3,0,0,3,78,90,-12]];
async function standings(){
 return raw.map(([rank,team,points,played,win,draw,loss,gf,ga,gd])=>({rank,team,badge:'',played,win,draw,loss,gf,ga,gd,points}));
}
module.exports={league:'starligue',standings,source:'verified-snapshot-2026-09-23'};
