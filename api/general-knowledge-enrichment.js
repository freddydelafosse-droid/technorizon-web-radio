const TOPICS = [
  { category:"physics", query:"physique science", label:"Physique" },
  { category:"chemistry", query:"chimie science", label:"Chimie" },
  { category:"computer_science", query:"informatique science", label:"Informatique" },
  { category:"artificial_intelligence", query:"intelligence artificielle", label:"Intelligence artificielle" },
  { category:"technology", query:"technologie innovation", label:"Technologie" },
  { category:"inventions", query:"invention inventeur", label:"Inventions" },
  { category:"meteorology", query:"météorologie atmosphère", label:"Météorologie" },
  { category:"climate", query:"climat climatologie", label:"Climat" },
  { category:"environment", query:"environnement écologie", label:"Environnement" },
  { category:"astronomy", query:"astronomie espace", label:"Astronomie" },
  { category:"biology", query:"biologie science", label:"Biologie" },
  { category:"geology", query:"géologie science", label:"Géologie" },
  { category:"medicine_general", query:"médecine histoire science", label:"Médecine générale" },
  { category:"geography_countries", query:"pays géographie", label:"Pays" },
  { category:"geography_cities", query:"ville géographie", label:"Villes" },
  { category:"history", query:"histoire mondiale", label:"Histoire" },
  { category:"historical_figures", query:"personnage historique", label:"Personnages historiques" },
  { category:"institutions", query:"institution publique", label:"Institutions" },
  { category:"politics_factual", query:"politique institution histoire", label:"Politique — connaissances factuelles" },
  { category:"international_relations", query:"relations internationales institution", label:"Relations internationales" },
  { category:"economics", query:"économie science", label:"Économie" },
  { category:"arts", query:"art histoire", label:"Arts" },
  { category:"cinema", query:"cinéma histoire film", label:"Cinéma" },
  { category:"literature", query:"littérature histoire écrivain", label:"Littérature" },
  { category:"music_culture", query:"musique histoire genre musical", label:"Culture musicale" },
  { category:"architecture", query:"architecture histoire", label:"Architecture" },
  { category:"philosophy", query:"philosophie histoire", label:"Philosophie" },
  { category:"languages", query:"langue linguistique", label:"Langues" },
  { category:"mathematics", query:"mathématiques science", label:"Mathématiques" },
  { category:"engineering", query:"ingénierie technologie", label:"Ingénierie" },
  { category:"transport", query:"transport histoire technologie", label:"Transports" },
  { category:"energy", query:"énergie science technologie", label:"Énergie" },
  { category:"agriculture", query:"agriculture science histoire", label:"Agriculture" },
  { category:"world_knowledge", query:"monde géographie histoire culture", label:"Connaissances mondiales" }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || "").replace(/\s+/g, " ").trim();
const slug = s => clean(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,120);

async function wikiSearch(topic, limit=8) {
  const u = "https://fr.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="+
    encodeURIComponent(topic)+"&gsrlimit="+limit+"&prop=extracts|info&exintro=1&explaintext=1&inprop=url&redirects=1&format=json&origin=*";
  const r = await fetch(u,{headers:{"User-Agent":"Technorizon-Jaya/3.0 (https://technorizon.fr)","Accept":"application/json"},signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw new Error("Wikipedia HTTP "+r.status);
  const j=await r.json();
  return Object.values(j?.query?.pages||{}).map(p=>({
    title:clean(p.title), content:clean(p.extract), source:p.fullurl||("https://fr.wikipedia.org/?curid="+p.pageid)
  })).filter(x=>x.title && x.content.length>=160);
}

export default async function handler(req,res){
  const secret=process.env.GENERAL_ENRICHMENT_SECRET || process.env.ARTIST_ENRICHMENT_SECRET;
  if(!secret || req.headers["x-enrichment-secret"]!==secret) return res.status(401).json({error:"Accès non autorisé"});
  if(req.method!=="GET") return res.status(405).json({error:"Méthode non autorisée"});
  const supabaseUrl=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabaseUrl||!key) return res.status(500).json({error:"Configuration Supabase serveur manquante"});
  const headers={apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"};
  const offset=Math.max(0,Number(req.query?.offset)||0);
  const count=Math.min(4,Math.max(1,Number(req.query?.topics)||2));
  const selected=Array.from({length:count},(_,i)=>TOPICS[(offset+i)%TOPICS.length]);
  const results=[];
  for(const topic of selected){
    try{
      const pages=await wikiSearch(topic.query,10);
      let added=0,skipped=0;
      for(const page of pages){
        const sourceKey="wiki-fr:"+slug(page.title);
        const q=await fetch(`${supabaseUrl}/rest/v1/knowledge?select=id&source=eq.${encodeURIComponent(page.source)}&limit=1`,{headers});
        if(q.ok && (await q.json()).length){skipped++;continue;}
        const body={
          category:topic.category,
          title:page.title,
          content:page.content.slice(0,3500),
          source:page.source,
          status:"active",
          visibility:"public"
        };
        const wr=await fetch(supabaseUrl+"/rest/v1/knowledge",{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(body)});
        if(!wr.ok){results.push({topic:topic.category,title:page.title,error:await wr.text()});continue;}
        added++;
      }
      results.push({topic:topic.category,added,skipped,source:"Wikipedia FR",quality:"encyclopedic"});
    }catch(e){results.push({topic:topic.category,error:e.message});}
    await sleep(400);
  }
  return res.status(200).json({mode:"GENERAL_KNOWLEDGE_ENRICHMENT",topics:selected.map(x=>x.category),results});
}
