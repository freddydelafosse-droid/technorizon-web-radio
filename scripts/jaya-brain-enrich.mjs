const SUPABASE_URL=process.env.SUPABASE_URL;
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT=Math.max(1,Math.min(Number(process.env.LIMIT||50),250));
if(!SUPABASE_URL||!KEY) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
const H={apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json"};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const get=async path=>{const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{headers:H});if(!r.ok)throw new Error(path+" "+r.status+" "+await r.text());return r.json()};
const patch=async(name,data)=>{const q=encodeURIComponent(name);const r=await fetch(SUPABASE_URL+"/rest/v1/artists?name=eq."+q,{method:"PATCH",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(data)});if(!r.ok)throw new Error("PATCH "+name+" "+r.status+" "+await r.text());return r.json()};
const norm=s=>String(s||"").trim();
const artists=await get("artists?select=name,aliases,country,genres,active_years,biography,known_for,status,visibility&status=eq.active&visibility=eq.public&order=name.asc&limit="+LIMIT);
let ok=0,ambiguous=0,skipped=0,failed=0;
for(const a of artists){
 const name=norm(a.name); if(!name){skipped++;continue}
 try{
  const u="https://musicbrainz.org/ws/2/artist/?query="+encodeURIComponent('artist:"'+name+'"')+"&fmt=json&limit=5";
  const r=await fetch(u,{headers:{"User-Agent":"Technorizon-JayaBrain/2.0 (https://technorizon.fr)","Accept":"application/json"}});
  if(!r.ok) throw new Error("MusicBrainz "+r.status);
  const j=await r.json(); const hits=(j.artists||[]).filter(x=>norm(x.name).toLowerCase()===name.toLowerCase());
  if(hits.length!==1){console.log("REVIEW",name,"matches",hits.length);ambiguous++;await sleep(1100);continue}
  const m=hits[0], genres=(m.genres||[]).sort((x,y)=>(y.count||0)-(x.count||0)).slice(0,5).map(x=>x.name);
  const country=m.country||m.area?.name||null;
  const begin=m["life-span"]?.begin||null,end=m["life-span"]?.end||null;
  const active=begin?(begin+(end?"–"+end:"–")):null;
  const aliases=[...new Set([...(Array.isArray(a.aliases)?a.aliases:[]),...(m.aliases||[]).map(x=>x.name).filter(Boolean)])].slice(0,20);
  const data={aliases};
  if(!a.country&&country)data.country=country;
  if((!Array.isArray(a.genres)||!a.genres.length)&&genres.length)data.genres=genres;
  if(!a.active_years&&active)data.active_years=active;
  // Ne jamais inventer de biographie/known_for : seules les donnees structurees fiables sont completees automatiquement.
  await patch(name,data); ok++; console.log("OK",name,m.id);
 }catch(e){failed++;console.error("FAIL",name,e.message)}
 await sleep(1100);
}
console.log(JSON.stringify({requested:LIMIT,processed:artists.length,updated:ok,review:ambiguous,skipped,failed}));
if(failed) process.exitCode=1;
