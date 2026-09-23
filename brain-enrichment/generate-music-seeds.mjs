// Générateur de lots MusicBrainz -> fichiers JSON de staging uniquement.
// N'écrit ni dans Supabase ni dans les tables actives.
import fs from "node:fs/promises";

const names = process.argv.slice(2);
if (!names.length) {
  console.error("Usage: node generate-music-seeds.mjs <artist> [artist...]");
  process.exit(1);
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const out=[];
for (const name of names) {
  const url="https://musicbrainz.org/ws/2/artist/?fmt=json&limit=5&query="+encodeURIComponent('artist:"'+name+'"');
  const r=await fetch(url,{headers:{"User-Agent":"Technorizon/1.0 (https://technorizon.fr)"}});
  if(!r.ok) throw new Error("MusicBrainz HTTP "+r.status);
  const j=await r.json();
  const a=j.artists?.[0];
  if(a) out.push({
    domain:"music_artists", entity_type:"artist", canonical_name:a.name,
    aliases:(a.aliases||[]).map(x=>x.name).filter(Boolean),
    facts:{country:a.country||null,type:a.type||null,disambiguation:a.disambiguation||null,
      life_span:a["life-span"]||null,tags:(a.tags||[]).map(x=>x.name)},
    source_name:"MusicBrainz", source_url:"https://musicbrainz.org/artist/"+a.id,
    source_id:a.id, confidence:Math.min(0.99,Math.max(0.5,(a.score||50)/100))
  });
  await sleep(1100);
}
await fs.mkdir("brain-enrichment/generated",{recursive:true});
const batch="music-"+new Date().toISOString().slice(0,10)+".json";
await fs.writeFile("brain-enrichment/generated/"+batch,JSON.stringify(out,null,2));
console.log(JSON.stringify({generated:out.length,file:"brain-enrichment/generated/"+batch,writes_to_production:false}));
