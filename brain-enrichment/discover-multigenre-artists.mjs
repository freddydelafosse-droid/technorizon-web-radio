// Découverte multi-genres via MusicBrainz -> staging JSON uniquement.
// Aucun accès Supabase / aucune écriture production.
import fs from "node:fs/promises";
const genres=(await fs.readFile("brain-enrichment/catalog/genre-seeds.txt","utf8")).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const perGenre=Math.min(100,Math.max(5,Number(process.argv[2]||50)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const byId=new Map();
for(const genre of genres){
  const url="https://musicbrainz.org/ws/2/artist/?fmt=json&limit="+perGenre+"&query="+encodeURIComponent('tag:"'+genre+'"');
  const r=await fetch(url,{headers:{"User-Agent":"Technorizon/1.0 (https://technorizon.fr)"}});
  if(!r.ok){ console.error("skip",genre,r.status); await sleep(1100); continue; }
  const j=await r.json();
  for(const a of j.artists||[]){
    if(!a.id||!a.name) continue;
    byId.set(a.id,{
      domain:"music_artists",entity_type:"artist",canonical_name:a.name,
      aliases:(a.aliases||[]).map(x=>x.name).filter(Boolean),
      facts:{country:a.country||null,type:a.type||null,disambiguation:a.disambiguation||null,
        life_span:a["life-span"]||null,tags:(a.tags||[]).map(x=>x.name),seed_genre:genre},
      source_name:"MusicBrainz",source_url:"https://musicbrainz.org/artist/"+a.id,
      source_id:a.id,confidence:Math.min(.99,Math.max(.5,(a.score||50)/100))
    });
  }
  await sleep(1100);
}
await fs.mkdir("brain-enrichment/generated",{recursive:true});
const file="brain-enrichment/generated/multigenre-"+new Date().toISOString().slice(0,10)+".json";
await fs.writeFile(file,JSON.stringify([...byId.values()],null,2));
console.log(JSON.stringify({genres:genres.length,artists:byId.size,file,production_writes:false}));
