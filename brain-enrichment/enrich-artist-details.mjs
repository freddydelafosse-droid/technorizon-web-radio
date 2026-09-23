// Enrichit des artistes déjà découverts avec release-groups et relations MusicBrainz.
// Sortie JSON staging uniquement; aucune écriture Supabase/production.
import fs from "node:fs/promises";
const input=process.argv[2];
if(!input) throw new Error("Fichier multigenre requis");
const artists=JSON.parse(await fs.readFile(input,"utf8"));
const max=Math.min(50,Math.max(1,Number(process.argv[3]||25)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];
for(const a of artists.slice(0,max)){
 const id=a.source_id; if(!id) continue;
 const url=`https://musicbrainz.org/ws/2/artist/${id}?fmt=json&inc=aliases+tags+genres+release-groups+artist-rels`;
 const r=await fetch(url,{headers:{"User-Agent":"Technorizon/1.0 (https://technorizon.fr)"}});
 if(!r.ok){await sleep(1100);continue}
 const j=await r.json();
 out.push({...a,facts:{...a.facts,
   genres:(j.genres||[]).map(x=>x.name),
   tags:(j.tags||[]).map(x=>x.name),
   release_groups:(j["release-groups"]||[]).slice(0,100).map(x=>({id:x.id,title:x.title,type:x["primary-type"],first_release_date:x["first-release-date"]||null})),
   artist_relations:(j.relations||[]).filter(x=>x.artist).slice(0,100).map(x=>({type:x.type,name:x.artist.name,id:x.artist.id}))
 }});
 await sleep(1100);
}
await fs.mkdir("brain-enrichment/generated",{recursive:true});
const file="brain-enrichment/generated/artist-details-"+new Date().toISOString().replace(/[:.]/g,"-")+".json";
await fs.writeFile(file,JSON.stringify(out,null,2));
console.log(JSON.stringify({artists_enriched:out.length,file,production_writes:false}));
