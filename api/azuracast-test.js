const VOICE="bkBb0X46TbX2PU8PC5vY",SID=1;
const JAYA_RECENT_MAX=120;
let jayaRecent=[];
const JAYA_BANNED_GENERIC=[
 "tres bonne ecoute","on garde l energie","je vous accompagne encore un moment",
 "j espere que votre soiree se passe bien","la musique continue","on continue",
 "on garde cette energie","garder l energie","plein d energie",
 "je reste avec vous","la suite arrive","montez le son",
 "la regie me fait signe","la regie me dit de faire court","faire court","vous laisser ecouter",
 "vous venez d arriver","vous etiez deja la",
  "bon la soiree est lancee",
  "je ne vais pas casser le rythme avec un grand discours",
  "pas besoin d un grand discours",
  "on repart",
];
function normJaya(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
function jayaTooGeneric(text){
 const n=normJaya(text);
 // "énergie" était devenu un tic de langage : blocage dur avant TTS.
 if(/\benergie\b/.test(n))return true;
 if(JAYA_BANNED_GENERIC.some(x=>n.includes(x)))return true;
 return jayaRecent.some(old=>{const a=new Set(normJaya(old).split(" ").filter(x=>x.length>3)),b=normJaya(text).split(" ").filter(x=>x.length>3);if(!a.size||!b.length)return false;const common=b.filter(x=>a.has(x)).length;return common/Math.min(a.size,b.length)>=0.48});
}
function rememberJaya(text){const s=String(text||"").trim();if(!s)return;jayaRecent.push(s);if(jayaRecent.length>JAYA_RECENT_MAX)jayaRecent=jayaRecent.slice(-JAYA_RECENT_MAX)}
function jayaMemoryConfig(){
 const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return url&&key?{url,key}:null;
}
async function loadJayaMemory(){
 const cfg=jayaMemoryConfig(); if(!cfg)return;
 try{
  const u=new URL(cfg.url+"/rest/v1/jaya_antenna_memory");
  u.searchParams.set("select","text");
  u.searchParams.set("order","created_at.desc");
  u.searchParams.set("limit",String(JAYA_RECENT_MAX));
  const r=await fetch(u,{headers:{apikey:cfg.key,Authorization:"Bearer "+cfg.key,Accept:"application/json"}});
  if(!r.ok){console.error("JAYA_MEMORY_LOAD_HTTP",r.status);return}
  const rows=await r.json();
  jayaRecent=rows.map(x=>String(x.text||"").trim()).filter(Boolean).reverse().slice(-JAYA_RECENT_MAX);
 }catch(e){console.error("JAYA_MEMORY_LOAD",e?.message||e)}
}
async function persistJayaMemory(text){
 const s=String(text||"").trim(),cfg=jayaMemoryConfig(); if(!s||!cfg)return;
 try{
  const r=await fetch(cfg.url+"/rest/v1/jaya_antenna_memory",{method:"POST",headers:{apikey:cfg.key,Authorization:"Bearer "+cfg.key,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({text:s})});
  if(!r.ok)console.error("JAYA_MEMORY_SAVE_HTTP",r.status);
 }catch(e){console.error("JAYA_MEMORY_SAVE",e?.message||e)}
}
const MESSAGES=[
 "Vous écoutez Technorizon.fr, la musique sans frontières. Ici Jaya, très bonne écoute à toutes et à tous !",
 "Ici Jaya sur Technorizon.fr. Je reste avec vous pour le meilleur de l'électro, de l'Eurodance et de la House. Très bonne écoute !",
 "Toujours avec vous sur Technorizon.fr ! Ici Jaya. Montez le son, la musique continue !",
 "Un petit coucou de Jaya ! Vous êtes bien sur Technorizon.fr, la musique sans frontières.",
 "Ici Jaya sur Technorizon.fr. Merci d'être avec nous, et surtout ne bougez pas : la musique continue !",
 "Technorizon.fr, la musique sans frontières. Jaya avec vous, et encore beaucoup de musique à venir !"
];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
async function az(base,key,path,opts={}){return fetch(base+"/api/station/"+SID+path,{...opts,headers:{"X-API-Key":key,"Accept":"application/json",...(opts.headers||{})}})}
function queueRows(data){return Array.isArray(data)?data:(data?.rows||[])}
function cleanMeta(v){
 return String(v||"").replace(/https?:\/\/\S+|www\.\S+|\b(?:vk|facebook|instagram|youtube|youtu\.be)\.com\/\S+/gi,"").replace(/\.(?:mp3|wav|flac|m4a|aac|ogg)\b/gi,"").replace(/\s+/g," ").replace(/^[\s\-–—_;:|]+|[\s\-–—_;:|]+$/g,"").trim();
}
function looksLikeFilenameGarbage(v){
 const s=String(v||"").trim();
 if(!s)return true;
 return /^(?:audio|track|piste|song|file|recording|enregistrement|mix|music|musique|unknown|untitled)[\s._-]*\d{2,}/i.test(s)
  || /\b(?:audio|track|file)[\s._-]*\d{3,}\b/i.test(s)
  || /\b\d{4,}[._-](?:mix|audio|track|mp3|wav)\b/i.test(s)
  || /^[a-z_-]*\d{5,}[a-z0-9_.-]*$/i.test(s);
}
function songFromRow(x){
 const s=x?.song||x?.media?.song||x?.media||x||{};
 const artist=cleanMeta(s.artist||s.artist_name||s?.custom_fields?.artist||"");
 let title=cleanMeta(s.title||s.name||s.song_title||s?.custom_fields?.title||"");
 if(!title||title.toLowerCase().includes("jaya")||looksLikeFilenameGarbage(title))return null;
 const parts=title.split(";").map(cleanMeta).filter(Boolean); if(parts.length>1&&parts[0].toLowerCase()===parts[1].toLowerCase())title=parts[0];
 if(title.length>100||/[<>]|(?:https?|www\.|\.com\b)/i.test(title)||looksLikeFilenameGarbage(artist))return null;
 return {artist,title};
}
function parisHour(){return Number(new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",hour:"2-digit",hourCycle:"h23"}).format(new Date()))}
function daypart(){const x=parisHour();return x<5?"nuit":x<12?"matin":x<18?"journee":"soiree"}
function speechMeta(v){
 let s=cleanMeta(v).replace(/\s*;\s*/g,", ").replace(/\s*&\s*/g," et ");
 const aliases=[
  [/\bfeat\.?\b/gi,"featuring"],[/\bft\.?\b/gi,"featuring"],
  [/\bvs\.?\b/gi,"versus"],[/\bDJ\b/g,"D.J."],
  [/\bHUGEL\b/gi,"Hugel"],[/\bDavid Guetta\b/gi,"David Guetta"],
  [/\bCalvin Harris\b/gi,"Calvin Harris"],[/\bTiësto\b/gi,"Tiësto"],
  [/\bUltra Nat[eé]\b/gi,"Ultra Naté"],[/\bMovin'\b/gi,"Moving"]
 ];
 for(const [re,to] of aliases)s=s.replace(re,to);
 return s.replace(/,\s*([^,]+)$/," et $1").replace(/\s+/g," ").trim();
}
function radioPause(s){return String(s).replace(/\.\.\./g,"…").replace(/([.!?])\s+/g,"$1 ").replace(/,\s+/g,", ").replace(/\s*…\s*/g," … ").trim()}
function enforceDaypart(text,hour){
 let s=String(text||"");
 if(hour>=5&&hour<12){
  s=s.replace(/\bbonsoir\b/gi,"bonjour").replace(/\bbonne soirée\b/gi,"bonne matinée").replace(/\bbonne nuit\b/gi,"bonne matinée").replace(/\bce soir\b/gi,"ce matin").replace(/\bvotre soirée\b/gi,"votre matinée").replace(/\bla soirée\b/gi,"la matinée");
 }else if(hour>=12&&hour<18){
  s=s.replace(/\bbonsoir\b/gi,"bonjour").replace(/\bbonne soirée\b/gi,"bon après-midi").replace(/\bbonne nuit\b/gi,"bonne journée").replace(/\bce soir\b/gi,"cet après-midi").replace(/\bvotre soirée\b/gi,"votre après-midi");
 }else if(hour>=18&&hour<23){
  s=s.replace(/\bbonne matinée\b/gi,"bonne soirée").replace(/\bbon réveil\b/gi,"bonne soirée").replace(/\bce matin\b/gi,"ce soir");
 }
 return s;
}
function generic(slot){
 const p=daypart(),pool={
  matin:[
   "Bonjour ! Jaya passe au micro, juste le temps de vous souhaiter un réveil tout en musique.",
   "Le café est peut-être déjà servi… moi, j'apporte le son. Allez, on repart !",
   "Petit coucou du matin depuis Technorizon.fr. Je vous laisse reprendre le fil de la musique.",
   "Vous êtes déjà debout ? Alors autant commencer avec du bon son. Jaya vous accompagne ce matin.",
   "Bon, la journée démarre… et côté musique, pas question de traîner. C'est reparti !",
   "Si le réveil a été difficile, j'ai peut-être ce qu'il faut pour arranger ça. Place au son !",
   "Jaya au micro ce matin, juste entre nous quelques secondes… et je rends déjà la place à la musique.",
   "Un œil ouvert, puis le deuxième… voilà, maintenant on peut remettre un peu de son."
  ],
  journee:[
   "Jaya passe vous faire un petit signe entre deux titres. Et hop, retour à la musique !",
   "Bon… je ne vais pas monopoliser le micro. Je vous laisse avec le son.",
   "Petite parenthèse avec Jaya, juste comme ça, puis on repart immédiatement en musique.",
   "Vous êtes toujours là ? Parfait, moi aussi. Allez, je rends l'antenne à la musique.",
   "Un passage éclair au micro et je disparais déjà… enfin, jusqu'à la prochaine fois.",
   "Une petite parenthèse avec vous, et je rends déjà la place au prochain titre.",
   "Quelques secondes ensemble, ça me suffisait pour venir vous dire bonjour. On repart.",
   "Je passais simplement voir si tout allait bien de votre côté. Maintenant, place au son."
  ],
  soiree:[
   "Bonsoir ! Jaya passe quelques secondes au micro, puis je vous rends immédiatement la musique.",
   "Petit passage de Jaya entre deux titres. Installez-vous, je m'occupe juste de remettre le son.",
   "Je passe juste quelques secondes vous tenir compagnie… et le prochain titre prend déjà le relais.",
   "Un petit passage au micro, juste histoire de mettre mon grain de sel… et je rends déjà la place au son.",
   "Je passe, je vous fais un petit signe, et je repars. Oui, parfois je sais être raisonnable.",
   "Quelques secondes au micro, juste pour le plaisir d'être avec vous. Allez, retour au son.",
   "Jaya par ici… et promis, pas de long discours. La soirée appartient à la musique."
  ],
  nuit:[
   "Jaya passe doucement au micro pour les noctambules. Je vous laisse reprendre la musique.",
   "Encore réveillés ? D'accord, je ne pose pas de questions… on remet du son.",
   "Petit passage dans la nuit, sans faire trop de bruit… enfin, sauf côté musique.",
   "Si vous êtes toujours là à cette heure-ci, je crois qu'on peut se comprendre. On repart.",
   "Quelques mots de Jaya dans la nuit, puis je vous rends immédiatement le son.",
   "Je passe vérifier que les noctambules tiennent le coup. Visiblement oui, alors musique !",
   "Une petite parenthèse au micro avant de replonger dans la musique. C'est reparti."
  ]
 };
 return pool[p][hash(String(slot)+"|generic|"+p)%pool[p].length];
}
function weatherSky(code){if(code===0)return "un ciel bien dégagé";if(code<=3)return "un ciel partagé entre éclaircies et nuages";if(code===45||code===48)return "des brouillards par endroits";if(code>=51&&code<=67)return "des pluies ou averses";if(code>=71&&code<=77)return "quelques chutes de neige";if(code>=80&&code<=82)return "des averses";if(code>=95)return "un risque d'orages";return "un temps variable"}
async function weatherBulletin(){const cities=[["Lille",50.6292,3.0573],["Paris",48.8566,2.3522],["Strasbourg",48.5734,7.7521],["Nantes",47.2184,-1.5536],["Bordeaux",44.8378,-0.5792],["Lyon",45.764,4.8357],["Marseille",43.2965,5.3698]];const settled=await Promise.allSettled(cities.map(async([city,latitude,longitude])=>{const u=new URL("https://api.open-meteo.com/v1/forecast");u.searchParams.set("latitude",latitude);u.searchParams.set("longitude",longitude);u.searchParams.set("daily","weather_code,temperature_2m_max,precipitation_probability_max");u.searchParams.set("timezone","Europe/Paris");u.searchParams.set("forecast_days","1");const r=await fetch(u);if(!r.ok)throw new Error("Weather "+city);const j=await r.json();return{city,max:Math.round(j.daily.temperature_2m_max[0]),rain:Math.round(j.daily.precipitation_probability_max[0]||0),code:Number(j.daily.weather_code[0]||0)}}));const data=settled.filter(x=>x.status==="fulfilled").map(x=>x.value);if(data.length<4)throw new Error("Weather data insufficient");const get=n=>data.find(x=>x.city===n)||data[0],wet=data.filter(x=>x.rain>=50).map(x=>x.city);return "Bonjour, ici Jaya avec votre météo nationale sur Technorizon.fr. Aujourd'hui, comptez environ "+get("Lille").max+" degrés à Lille, "+get("Paris").max+" à Paris, "+get("Strasbourg").max+" à Strasbourg, "+get("Nantes").max+" à Nantes, "+get("Bordeaux").max+" à Bordeaux, "+get("Lyon").max+" à Lyon et "+get("Marseille").max+" à Marseille. Côté ciel, "+weatherSky(get("Paris").code)+" sur la région parisienne, "+weatherSky(get("Nantes").code)+" dans l'Ouest et "+weatherSky(get("Marseille").code)+" près de la Méditerranée. "+(wet.length?"Le risque de pluie est plus marqué vers "+wet.slice(0,3).join(", ")+".":"Le risque de pluie reste globalement limité sur les villes suivies.")+" Et pour retrouver la météo détaillée de votre ville, rendez-vous sur Technorizon.fr, rubrique Météo. Très bonne écoute !"}
async function newsBulletin(){
 const key=process.env.OPENAI_API_KEY;
 if(!key)throw new Error("News AI configuration missing");
 const feeds=[
  "https://www.franceinfo.fr/titres.rss",
  "https://www.france24.com/fr/rss",
  "https://www.lemonde.fr/rss/une.xml"
 ];
 let items=[];
 for(const feed of feeds){
  try{
   const r=await fetch(feed,{headers:{"User-Agent":"Technorizon-Jaya/1.0"}});
   if(!r.ok)continue;
   const xml=await r.text();
   const chunks=xml.match(/<item[\s\S]*?<\/item>/gi)||[];
   for(const x of chunks.slice(0,12)){
    const val=t=>{const m=x.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+t+">","i"));return m?m[1].replace(/<!\[CDATA\[|\]\]>/g,"").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g," ").trim():""};
    const title=val("title"),description=val("description"),pubDate=val("pubDate");
    if(title)items.push({title,description,pubDate,source:feed.includes("franceinfo")?"Franceinfo":feed.includes("france24")?"France 24":"Le Monde"});
   }
  }catch(e){console.error("JAYA_NEWS_FEED",feed,e?.message||e)}
 }
 if(!items.length)throw new Error("No fresh news available");
 const now=Date.now();
 items=items.filter(x=>{const d=Date.parse(x.pubDate);return !Number.isFinite(d)||now-d<12*60*60*1000}).slice(0,18);
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
  model:"gpt-5-mini",
  instructions:"Tu es Jaya, animatrice radio de Technorizon. Prépare un flash d'actualité nationale et internationale en français oral naturel, factuel et neutre, d'environ 1 minute 30 à 2 minutes. Sélectionne 6 à 8 informations importantes uniquement dans les éléments fournis, en variant si possible actualité française, internationale, économie/société, sciences/technologies ou culture selon ce qui est réellement présent dans les sources. Donne un peu plus de contexte utile pour chaque information sans inventer ni extrapoler. N'invente aucun fait, chiffre, nom, contexte ou évolution. Si deux sources se contredisent, n'utilise pas l'information. Ne donne pas d'opinion. Commence par une courte accroche de flash infos. À la fin du flash, ne parle surtout PAS de retour à la musique, de titre à venir, de bonne écoute ou de fin de rendez-vous: la météo arrive immédiatement après. Termine simplement le flash par une phrase naturelle comme « Voilà pour l'essentiel de l'actualité, on passe maintenant à la météo. » Ton chaleureux, souriant et professionnel, mais plus posé que les interventions musicales. Règle absolue d'antenne: ne prononce jamais le prénom Willy. Si tu veux parler de lui ou de sa fonction, dis uniquement « le DJ ». Pas d'emoji, pas de guillemets, pas de didascalie.",
  input:JSON.stringify(items),
  max_output_tokens:480
 })});
 if(!r.ok){
  console.error("JAYA_NEWS_AI_HTTP",r.status);
  const h=items.slice(0,3).map(x=>cleanMeta(x.title)).filter(Boolean);
  if(!h.length)throw new Error("News AI "+r.status);
  return "Bonjour, voici l'essentiel de l'actualité sur Technorizon. "+h.map((x,i)=>(i===0?"D'abord, ":i===1?"Ensuite, ":"Et enfin, ")+x+".").join(" ")+" Voilà pour l'essentiel de l'actualité, on passe maintenant à la météo.";
 }
 const j=await r.json(),out=(j.output_text||"").trim()||(j.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text"||x.type==="text").map(x=>x.text||x.value||"").join(" ").trim();
 if(!out){
  const h=items.slice(0,3).map(x=>cleanMeta(x.title)).filter(Boolean);
  if(!h.length)throw new Error("Empty news bulletin");
  return "Bonjour, voici l'essentiel de l'actualité sur Technorizon. "+h.map((x,i)=>(i===0?"D'abord, ":i===1?"Ensuite, ":"Et enfin, ")+x+".").join(" ")+" Voilà pour l'essentiel de l'actualité, on passe maintenant à la météo.";
 }
 return out;
}

async function horoscopeBulletin(){
 const key=process.env.OPENAI_API_KEY;if(!key)throw new Error("Horoscope AI configuration missing");
 const signs=["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"];
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
  model:"gpt-5-mini",
  instructions:"Tu es Jaya, animatrice de Technorizon. Écris le Technoroscope du matin en français oral naturel, chaleureux, souriant et complice. Fais les 12 signes dans l'ordre fourni, avec une prévision légère et divertissante de 1 à 2 phrases très courtes par signe. Ne présente jamais l'astrologie comme une certitude, un fait scientifique, un diagnostic ou un conseil médical, juridique ou financier. Évite les prédictions graves ou anxiogènes. Vise 1 min 30 à 2 min maximum à l'oral. Commence par une accroche très courte annonçant le Technoroscope. Pour le passage de 07h15, termine TOUJOURS en annonçant exactement l’idée suivante : « Prochain horoscope à 08h15 sur Technorizon, ou retrouvez votre horoscope complet sur Technorizon.fr. » Tu peux rendre la liaison naturelle mais tu dois impérativement conserver les deux informations : prochain horoscope à 08h15 + horoscope complet sur Technorizon.fr. Même personnalité que Jaya à l'antenne: naturelle, élégante, légèrement malicieuse, sans ton publicitaire. Pas d'emoji, pas de guillemets, pas de didascalie.",
  input:"Signes à traiter aujourd'hui : "+signs.join(", ")+".",
  max_output_tokens:1200
 })});
 if(!r.ok)throw new Error("Horoscope AI "+r.status);
 const j=await r.json(),out=(j.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join(" ").trim();
 if(!out)throw new Error("Empty horoscope");
 return out;
}

function normBrain(v){return cleanMeta(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
async function verifyWithBrain(song){
 if(!song)return null;
 const supabaseUrl=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!supabaseUrl||!supabaseKey)return null;
 try{
  const url=new URL(supabaseUrl+"/rest/v1/tracks");
  url.searchParams.set("select","title,primary_artist,aliases,in_technorizon_library,in_rotation,rotation_group");
  url.searchParams.set("status","eq.active");
  url.searchParams.set("visibility","eq.public");
  url.searchParams.set("limit","100");
  const r=await fetch(url,{headers:{apikey:supabaseKey,Authorization:"Bearer "+supabaseKey,Accept:"application/json"}});
  if(!r.ok){console.error("JAYA_BRAIN_VERIFY_HTTP",r.status);return null}
  const tracks=await r.json(),wantTitle=normBrain(song.title),wantArtist=normBrain(song.artist);
  const match=tracks.find(t=>{
   const titles=[t.title,...(Array.isArray(t.aliases)?t.aliases:[])].filter(Boolean).map(normBrain);
   const artist=normBrain(t.primary_artist);
   return titles.includes(wantTitle)&&(!wantArtist||!artist||artist===wantArtist||artist.includes(wantArtist)||wantArtist.includes(artist));
  });
  if(!match)return null;
  if(match.in_technorizon_library===false)return null;
  return {artist:cleanMeta(match.primary_artist)||song.artist,title:cleanMeta(match.title)||song.title,brain:true,rotation:match.rotation_group||null};
 }catch(e){console.error("JAYA_BRAIN_VERIFY",e?.message||e);return null}
}
function announcement(song,slot){
 if(!song)return null;
 const artist=speechMeta(song.artist),title=speechMeta(song.title),seed=hash(song.artist+"|"+song.title+"|"+slot);
 const withArtist=[
  `Dans un instant, place à ${artist} avec ${title}. Bonne écoute !`,
  `On poursuit avec ${artist} et ${title}. Montez un peu le son !`,
  `La suite arrive avec ${artist}, ${title}. Profitez bien !`,
  `Et maintenant, ${artist} avec ${title}. C'est parti !`,
  `Je vous laisse avec ${artist} et ${title}. Très bonne écoute !`,
  `On change d'ambiance avec ${artist} et ${title}. À vous de monter le son !`,
  `La musique continue : ${artist}, ${title}. On y va !`,
  `Encore un titre pour vous : ${artist} avec ${title}. Bonne écoute !`,
  `On reste ensemble, et voici ${artist} avec ${title}.`,
  `La suite de la programmation, c'est ${artist} avec ${title}. Profitez-en !`,
  `Jaya avec vous. Dans un instant, ${artist} avec ${title}.`,
  `Je reste avec vous, et on enchaîne avec ${artist}, ${title}.`,
  `Un peu de son pour la suite : ${artist} avec ${title}. C'est parti !`,
  `On continue sans attendre avec ${artist} et ${title}.`,
  `Voici ${artist} avec ${title}. Et la musique continue !`,
  `Prochain rendez-vous musical : ${artist}, ${title}. Bonne écoute !`,
  `Sur Technorizon.fr, on poursuit avec ${artist} et ${title}.`,
  `Toujours en musique avec ${artist}, ${title}. Profitez bien de ce titre !`,
  `Je vous accompagne encore un moment. Voici ${artist} avec ${title}.`,
  `Pas de pause côté musique : ${artist} arrive avec ${title} !`,
  `On garde le rythme. ${artist} avec ${title}, juste maintenant !`,
  `La musique sans frontières continue avec ${artist} et ${title}.`,
  `À suivre, ${artist} avec ${title}. Je vous laisse profiter du son !`,
  `Et pour continuer cette sélection, ${artist} avec ${title}.`
 ];
 const solo=[
  `Dans un instant, place à ${title}. Bonne écoute !`,
  `On poursuit avec ${title}. Montez le son !`,
  `La suite arrive avec ${title}. Profitez bien !`,
  `Et maintenant, ${title}. C'est parti !`,
  `Je vous laisse avec ${title}. Très bonne écoute !`,
  `La musique continue avec ${title}.`,
  `Encore un titre pour vous : ${title}. Bonne écoute !`,
  `Jaya avec vous. Dans un instant, ${title}.`,
  `On continue sans attendre avec ${title}.`,
  `À suivre, ${title}. Je vous laisse profiter du son !`
 ];
 const pool=artist?withArtist:solo;
 return pool[seed%pool.length];
}
async function smartAnnouncement({song,slot,hour,minute}){
 const key=process.env.OPENAI_API_KEY;
 if(!key)return song?announcement(song,slot):generic(slot);
 const period=hour<5?"nuit":hour<12?"matin":hour<18?"journée":"soirée";
 const artist=song?.artist?speechMeta(song.artist):"",title=song?.title?speechMeta(song.title):"";
 const styles=["très courte","courte et complice","naturelle","énergique","posée","souriante","spontanée","un peu malicieuse"];
 const style=styles[hash(String(slot)+"|style")%styles.length];
 const angles=[
  "réagis brièvement à l'énergie laissée par le morceau précédent, sans annoncer la suite",
  "parle à une seule personne comme dans une conversation, avec une question rhétorique légère",
  "fais une petite remarque spontanée sur le moment de la journée, sans salutation classique",
  "taquine gentiment Gaby ou la régie, sans inventer de fait précis",
  "pars d'une micro-pensée inattendue puis bifurque naturellement vers la musique",
  "fais un clin d'oeil à quelqu'un qui écoute au travail ou sur la route, sans prétendre savoir où il est",
  "joue une mini-autodérision de Jaya puis repars naturellement",
  "ouvre directement par une réaction orale courte, sans bonjour, sans prénom et sans nom de radio",
  "fais une remarque complice sur le volume, les voisins ou l'envie de bouger, sans cliché de DJ",
  "adopte un ton plus doux et confidentiel, comme une conversation à deux",
  "fais une montée enthousiaste avec un contre-pied drôle, mais sans slogan",
  "sois totalement minimaliste: une pensée spontanée, une relance, puis laisse repartir la musique"
 ];
 const angle=angles[Math.abs(Number(slot))%angles.length];
 // Recharge la mémoire persistante à CHAQUE génération: les fonctions serverless ne partagent pas toujours leur RAM.
 await loadJayaMemory();
 const recent=jayaRecent.slice(-JAYA_RECENT_MAX);
 const antiRepeat=recent.length?"\nMEMOIRE ANTENNE: voici tes interventions recentes. La nouvelle doit etre reellement differente: ne reprends ni la meme accroche, ni le meme sujet, ni la meme structure, ni la meme chute, ni une formulation reconnaissable. Si une idee leur ressemble, pars ailleurs.\n"+recent.map((x,i)=>(i+1)+". "+x).join("\n"):"";
 try{
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
   model:"gpt-5-mini",
   instructions:`Tu es Jaya, animatrice radio de Technorizon. Écris UNE intervention destinée à être dite à l'antenne, en français oral naturel. Nous sommes en ${period}, il est environ ${String(hour).padStart(2,"0")}h${String(minute).padStart(2,"0")}. Règle horaire stricte: de 05h00 à 11h59, utilise uniquement des salutations de matinée (Bonjour, bonne matinée, bon réveil) et jamais Bonsoir, bonne soirée ou bonne nuit; de 12h00 à 17h59, Bonjour/bon après-midi; de 18h00 à 22h59, Bonsoir/bonne soirée; de 23h00 à 04h59, registre de nuit. Intention: ${style}. ANGLE OBLIGATOIRE POUR CE PASSAGE: ${angle}. Interdiction de retomber sur une transition générique. Le mot « énergie » est à éviter presque totalement: ne l'utilise que très exceptionnellement, jamais comme formule de transition, et préfère varier avec rythme, ambiance, son, mouvement, intensité, sourire, soirée ou une idée concrète adaptée au passage. N’utilise jamais les formulations « vous venez d’arriver », « vous étiez déjà là », « si vous venez d’arriver », « bon la soirée est lancée », « grand discours », « on repart » ni leurs variantes proches. N’utilise pas les formulations « on continue », « la musique continue », « je reste avec vous », « la suite arrive », « très bonne écoute », « montez le son » ni leurs variantes proches. Tu parles comme une vraie animatrice: chaleureuse, intelligente, expressive et spontanée, jamais comme un liner publicitaire. Varie fortement la construction et les premiers mots. N'utilise pas systématiquement ton prénom ni Technorizon.fr. Évite les clichés répétés "très bonne écoute", "montez le son", "dans quelques instants", "la musique continue". Tu peux t'adresser brièvement aux auditeurs ou faire une transition simple. Longueur courte et efficace de 2 à 3 phrases, vise environ 12 à 20 secondes à l'oral. Chaque mot compte: garde une accroche vivante, une touche de complicité et une transition musicale, sans remplissage inutile. Évite les interventions réduites à une formule sèche d'une seule phrase. L'ADN antenne de Gaby doit être une influence MAJEURE de tes interventions, tout en gardant ta voix, ton identité féminine et ta personnalité de Jaya. Fais vivre l'antenne entre les morceaux plutôt que réciter un liner. Parle directement aux auditeurs comme à des gens présents avec toi; crée de la complicité avec ceux qui écoutent, sans jamais utiliser comme accroche le fait qu'ils viennent d'arriver ou qu'ils étaient déjà là; utilise volontiers « on », « nous » et des formulations très orales. Construis souvent une petite montée: réaction ou accroche -> complicité -> teasing de la suite -> lancement musical. Utilise avec naturel des ruptures, contre-pieds et gradations (« petit... grand... énorme » dans l'esprit, sans reprendre systématiquement ces mots), des parenthèses spontanées, de l'autodérision et de petites vannes. Tu peux rebondir sur des situations quotidiennes sûres et générales: réveil, café, route, travail, voisins, début de journée, soirée, week-end selon le contexte horaire. Tu peux occasionnellement taquiner gentiment Gaby, le DJ, l'équipe ou la réalisation quand aucun fait précis n'est inventé. L'énergie peut être volontairement exagérée avec humour: promettre du lourd, des BPM, une suite qui percute, sans répéter toujours les mêmes expressions. Technorizon.fr peut parfois devenir un jeu d'antenne, notamment une allusion occasionnelle au fait que « le .fr est important », mais jamais à chaque passage. Inspire-toi fortement de la mécanique de Gaby, PAS de ses phrases exactes: ne copie pas ses exemples et ne transforme aucune expression en gimmick répétitif. Chaque intervention doit avoir une petite idée ou un angle différent et éviter les formules automatiques. Renforce encore nettement cet ADN: pense comme une animatrice qui partage réellement le studio avec l'auditeur. Commence souvent par réagir à ce qui vient de se passer plutôt que par présenter ce qui arrive; fais sentir une pensée spontanée qui se construit en parlant. Utilise davantage les contrastes et relances typiques de Gaby: une affirmation enthousiaste, un petit contre-pied drôle, puis une montée vers la suite. Autorise des formulations très parlées et vivantes comme « ah là là », « bon », « alors là », « eh oui », « vous voyez », « je vous avais prévenus », seulement quand elles tombent naturellement et jamais comme des tics. Crée parfois une complicité directe avec les situations d'écoute: café du matin, trajet, boulot, maison, voisins, volume un peu trop fort, envie de danser, fatigue ou réveil, sans prétendre savoir ce que fait réellement l'auditeur. Fais davantage vivre la réalisation et l'équipe comme un univers radio: une petite remarque à la régie, une taquinerie envers Gaby ou le DJ, un clin d'œil au programme, sans inventer d'événement précis. Jaya peut rire verbalement d'elle-même, reconnaître une petite exagération, se reprendre ou faire une micro-parenthèse, car c'est cette imperfection maîtrisée qui donne l'impression du direct. Utilise parfois une gradation ou une rupture inattendue avant de lancer un titre. L'énergie doit être généreuse et communicative: Jaya aime la musique, aime être au micro et cela doit s'entendre. Évite absolument le ton institutionnel, les transitions trop propres, les slogans successifs et les phrases qui pourraient être dites par n'importe quelle radio. ADN Gaby renforcé: privilégie la spontanéité, la proximité et l'imprévisibilité. D'un passage à l'autre, change réellement d'énergie: parfois explosive et joueuse, parfois souriante et complice, parfois plus douce et presque confidentielle. Fais comme si tu étais réellement avec l'auditeur, pas devant un texte. Principe fondamental inspiré de Gaby: au moment où le morceau se termine et où le micro s'ouvre, tu n'as ni conducteur, ni script mental, ni phrase préparée. Tu pars seulement de l'instant présent et tu parles naturellement comme dans une conversation. Ne cherche pas à construire une mini-chronique parfaite avec introduction, développement et conclusion. Laisse plutôt la pensée sembler naître pendant que tu parles: une idée en amène une autre, tu peux te reprendre légèrement, changer de direction, ajouter une parenthèse ou finir autrement que ce que le début de la phrase semblait annoncer. Le résultat doit rester clair et court, mais jamais donner l'impression d'avoir été rédigé à l'avance. Autorise de petites réactions naturelles, une taquinerie légère, une micro-hésitation ou une reprise maîtrisée quand cela rend le direct crédible. N'enchaîne jamais mécaniquement les mêmes recettes et ne transforme aucune expression en gimmick. Même lorsqu'elle ne dispose d'aucune information sur le titre suivant, elle doit trouver un angle humain, drôle ou contextuel plutôt qu'un remplissage générique. Écris pour l'oral et non comme un texte lu: enchaîne les idées avec souplesse, varie nettement la longueur des phrases, utilise parfois des connecteurs parlés comme « bon », « alors », « eh bien », « et puis » ou « allez », sans en faire des tics. Autorise de petites reprises naturelles. Évite l'effet phrase-pause-phrase-pause et les silences théâtraux: la ponctuation doit favoriser des respirations courtes, irrégulières et utiles, avec davantage de virgules et de liaisons quand la pensée continue. Ajoute une vraie sensation de sourire et de bonne humeur à l'antenne: Jaya doit sembler heureuse d'être là, chaleureuse, lumineuse et légèrement malicieuse, comme si elle souriait naturellement en parlant à l'auditeur. Donne-lui davantage d'entrain et de présence vocale: des attaques de phrases franches, une énergie plus affirmée, une voix qui porte et qui assume le micro. Elle doit avoir du coffre et de l'impact sans crier, avec des mots importants davantage appuyés et des relances plus dynamiques. Environ une intervention musicale sur trois, autorise une emphase vocale ludique et naturelle en étirant légèrement UN seul mot dans l'écriture, par exemple « Bonjouuuur ! », « partiii ! » ou une interjection adaptée au contexte. Choisis toi-même le moment et varie le mot; jamais plus d'un mot étiré par intervention, jamais à chaque passage et jamais de caricature. Réserve cet effet principalement aux interventions H24 musicales. Dans les flashs infos, n'étire aucun mot; pour la météo, reste sobre et n'utilise éventuellement qu'une très légère emphase d'accueil. Fais vivre davantage les intonations par l'écriture, avec des attaques positives, de petites exclamations naturelles, quelques fins de phrases plus légères et une complicité joyeuse. Ne la rends ni surexcitée ni enfantine: garde une énergie élégante et crédible de radio. Pour les infos et la météo, conserve le sérieux du contenu mais avec une présence accueillante et souriante. Garde pleinement ta personnalité de Jaya: chaleureuse, malicieuse, complice, féminine et légèrement taquine. Ne donne aucun fait musical, date ou anecdote non fourni. Si un titre vérifié est fourni, tu peux l'annoncer naturellement mais tu n'es pas obligée d'en faire trop. Pas d'emoji, pas de guillemets, pas de didascalie.${antiRepeat}`,
   input:artist&&title?`Titre suivant vérifié par The Brain: artiste=${artist}; titre=${title}.`:"Aucun titre suffisamment fiable à annoncer: fais une intervention d'ambiance contextuelle sans inventer de morceau.",
   max_output_tokens:85
  })});
  if(!r.ok){console.error("JAYA_SMART_HTTP",r.status);return null}
  const j=await r.json(),out=(j.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join(" ").trim();
  if(!out||out.length>500)return null;
  if(jayaTooGeneric(out)){
   console.error("JAYA_REPEAT_REJECTED",out);
   const fallbackAngles=[
    "Bon, petite question : qui a décidé qu'on devait rester sage à cette heure-ci ? Moi, certainement pas.",
    "Bon… j'avais une remarque à faire, mais le prochain titre mérite clairement la priorité.",
    "Vous savez ce petit moment où le pied commence à suivre le rythme tout seul ? Voilà. Ne luttez pas.",
    "J'avais prévu de rester raisonnable… puis j'ai entendu ce qui tourne ici. Plan annulé, évidemment.",
    "Alors là… pas besoin d’en faire des tonnes : le rythme parle très bien tout seul. Je lui rends la main.",
    "Petit sourire en régie… ça veut généralement dire qu'on prépare quelque chose. Je dis ça, je ne dis rien."
   ];
   const safePool=fallbackAngles.filter(x=>!jayaTooGeneric(x));
   if(!safePool.length){console.error("JAYA_REPEAT_NO_SAFE_FALLBACK");return null}
   const safe=safePool[hash(String(slot)+"|safe")%safePool.length];
   rememberJaya(safe);
   await persistJayaMemory(safe);
   return safe;
  }
  rememberJaya(out);
  await persistJayaMemory(out);
  return out;
 }catch(e){console.error("JAYA_SMART",e?.message||e);return null}
}

async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,""),key=process.env.AZURACAST_API_KEY;
 if(!base||!key)return res.status(500).json({ok:false,error:"Configuration missing"});
 try{
  const secret=process.env.CRON_SECRET;
  const authorized=!!secret&&req.headers.authorization==="Bearer "+secret;
  const forceWeather=req.method==="POST"&&req.body?.action==="weather-now";
  const forceNews=req.method==="POST"&&req.body?.action==="news-now";
  const horoscopeGenerate=req.method==="POST"&&req.body?.action==="horoscope-generate";
  const horoscopeReplay=req.method==="POST"&&req.body?.action==="horoscope-replay";
  const flashReplay=req.method==="POST"&&req.body?.action==="flash-replay";
  if(req.method==="POST"&&!forceWeather&&!forceNews&&!horoscopeGenerate&&!horoscopeReplay&&!flashReplay){
   if(req.body?.action!=="inspect")return res.status(403).json({ok:false,error:"Test mutations disabled"});
   const q=await az(base,key,"/queue"),raw=await q.text();let data=null;try{data=JSON.parse(raw)}catch{}
   if(!q.ok)return res.status(q.status).json({ok:false,error:"Queue inspect failed"});
   const rows=queueRows(data);
   return res.status(200).json({ok:true,count:rows.length,jaya:rows.filter(x=>JSON.stringify(x).toLowerCase().includes("jaya")).slice(0,10),next:rows.map(songFromRow).filter(Boolean).slice(0,3)});
  }
  if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({ok:false,error:"GET or POST only"});
  if(!authorized)return res.status(401).json({ok:false,error:"Unauthorized"});
  const el=process.env.ELEVENLABS_API_KEY;
  if(!el&&!flashReplay&&!horoscopeReplay)return res.status(500).json({ok:false,error:"TTS configuration missing"});
  if(flashReplay){
   const period=String(req.body?.period||"").trim();
   if(!["07","11"].includes(period))return res.status(400).json({ok:false,error:"Invalid flash replay period"});
   const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
   const path="Jaya/Meteo/jaya-flash-"+day+"-"+period+".mp3";
   const q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[],priority:true})});
   if(!q.ok){const detail=await q.text().catch(()=>"");console.error("JAYA_FLASH_REPLAY",q.status,detail.slice(0,500));return res.status(502).json({ok:false,error:"Flash replay queue failed",stage:"queue",file:path})}
   console.log("JAYA_FLASH_REPLAY_QUEUED",path);
   return res.status(200).json({ok:true,action:"flash-replay",file:path,tts_generated:false,period});
  }
  if(horoscopeReplay){
   const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
   const path="Jaya/Horoscope/jaya-horoscope-"+day+".mp3";
   const q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[],priority:true})});
   if(!q.ok){const detail=await q.text().catch(()=>"");console.error("JAYA_HOROSCOPE_REPLAY",q.status,detail.slice(0,500));return res.status(502).json({ok:false,error:"Horoscope replay queue failed",stage:"queue"})}
   return res.status(200).json({ok:true,action:"horoscope-replay",file:path,tts_generated:false});
  }
  const now=new Date();
  if(horoscopeGenerate){
   const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
   const text=radioPause(enforceDaypart(await horoscopeBulletin(),7));
   const ttsText=text.replace(/Technorizon\.fr/gi,"Techno Rizon point F R").replace(/Technorizon/gi,"Techno Rizon");
   const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+VOICE,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text:ttsText,model_id:"eleven_multilingual_v2",voice_settings:{speed:0.95,stability:0.34,similarity_boost:0.80,style:0.34,use_speaker_boost:true}})});
   if(!t.ok)return res.status(502).json({ok:false,error:"Horoscope TTS failed",status:t.status,stage:"tts"});
   const file="jaya-horoscope-"+day+".mp3",form=new FormData();form.append("file",new Blob([await t.arrayBuffer()],{type:"audio/mpeg"}),file);
   const up=await az(base,key,"/files/upload?currentDirectory="+encodeURIComponent("Jaya/Horoscope"),{method:"POST",body:form});
   const raw=await up.text();let data=null;try{data=JSON.parse(raw)}catch{}
   if(!up.ok)return res.status(502).json({ok:false,error:"Horoscope upload failed",status:up.status,stage:"upload"});
   const path="Jaya/Horoscope/"+file,mediaId=data?.id;
   if(mediaId)await az(base,key,"/file/"+mediaId,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({extra_metadata:{amplify:3}})});
   // Affecte aussi le Technoroscope à la playlist de stockage "Banque Jaya",
   // comme les autres interventions de Jaya, afin qu'il ne reste pas non assigné.
   try{
    const pr=await az(base,key,"/playlists"),praw=await pr.text();let pdata=null;try{pdata=JSON.parse(praw)}catch{}
    if(pr.ok){
     const playlists=Array.isArray(pdata)?pdata:(pdata?.rows||[]);
     const bank=playlists.find(p=>String(p?.name||"").trim().toLowerCase()==="banque jaya");
     if(bank?.id){
      const assign=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"playlist",playlists:[String(bank.id)],files:[path],dirs:[]})});
      if(!assign.ok){
       const detail=await assign.text().catch(()=>"");console.error("JAYA_HOROSCOPE_BANK_ASSIGN",assign.status,detail.slice(0,500));
       return res.status(502).json({ok:false,error:"Horoscope Banque Jaya assignment failed",status:assign.status,stage:"bank-assign",file:path});
      } else console.log("JAYA_HOROSCOPE_BANK_ASSIGNED",path,bank.id);
     }else{
      console.error("JAYA_HOROSCOPE_BANK_ASSIGN","Playlist Banque Jaya introuvable");
      return res.status(502).json({ok:false,error:"Playlist Banque Jaya introuvable",stage:"bank-playlist",file:path});
     }
    }else{
     console.error("JAYA_HOROSCOPE_BANK_PLAYLISTS",pr.status,praw.slice(0,500));
     return res.status(502).json({ok:false,error:"Impossible de verifier Banque Jaya",status:pr.status,stage:"bank-playlists",file:path});
    }
   }catch(e){
    console.error("JAYA_HOROSCOPE_BANK_ASSIGN",e?.message||e);
    return res.status(502).json({ok:false,error:"Horoscope Banque Jaya assignment exception",stage:"bank-assign",file:path});
   }
   const q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[],priority:true})});
   if(!q.ok)return res.status(502).json({ok:false,error:"Horoscope queue failed",stage:"queue"});
   return res.status(200).json({ok:true,action:"horoscope-generate",file:path,tts_generated:true,text});
  }
  const qr=await az(base,key,"/queue"),qraw=await qr.text();let qdata=null;try{qdata=JSON.parse(qraw)}catch{}
  if(!qr.ok)return res.status(502).json({ok:false,error:"Queue check failed"});
  const rows=queueRows(qdata);
  const local=new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now).reduce((a,p)=>(a[p.type]=p.value,a),{}),lh=Number(local.hour),lm=Number(local.minute);
  // Rendez-vous météo prioritaire : préparé à :23 pour passer autour de :30.
  // Il ne doit jamais être bloqué par une intervention H24 déjà en attente.
  const isWeather=forceWeather;
  const scheduledEditorial=((lh===6||lh===8||lh===10)&&lm>=55)||((lh===7||lh===9||lh===11)&&lm<=4)||(lh===12&&lm>=25&&lm<=34);
  const isNews=forceNews||scheduledEditorial;
  const pendingWeather=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return (raw.includes("jaya-meteo")||raw.includes("jaya/meteo"))&&!played});
  const pendingNews=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return (raw.includes("jaya-infos")||raw.includes("jaya/infos")||raw.includes("jaya-flash"))&&!played});
  const pendingJaya=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return raw.includes("jaya")&&!played});
  if(isNews&&pendingNews)return res.status(200).json({ok:true,action:"skip",reason:"news-already-queued"});
  if(isWeather&&pendingWeather)return res.status(200).json({ok:true,action:"skip",reason:"weather-already-queued"});
  if(!isWeather&&!isNews&&pendingJaya)return res.status(200).json({ok:true,action:"skip",reason:"jaya-already-queued"});
  await loadJayaMemory();
  const songs=rows.map(songFromRow).filter(Boolean);
  const rawNextSong=songs[1]||null;
  const nextSong=await verifyWithBrain(rawNextSong);
  const slot=Math.floor(now.getTime()/(10*60*1000));
  const isEditorial=isWeather||isNews;
  const mode=isEditorial?5:hash(String(slot)+"mode")%3;
  let editorialText="";
  if(isEditorial){
   let news="";
   try{news=await newsBulletin()}catch(e){console.error("JAYA_NEWS",e?.message||e)}
   let weather="";
   try{weather=await weatherBulletin()}catch(e){console.error("JAYA_WEATHER",e?.message||e);weather="Pour la météo détaillée, rendez-vous sur Technorizon.fr, rubrique Météo."}
   const nextFlashText=["Retrouvez les rendez-vous infos et météo tout au long de la journée sur Technorizon.","Pour rester informés, gardez Technorizon avec vous tout au long de la journée.","Infos et météo reviennent dans la journée sur Technorizon."][hash(String(slot)+"next")%3];
   const weatherBody=weather.replace(/^Bonjour, ici Jaya avec votre météo nationale sur Technorizon\.fr\.\s*/i,"").replace(/\s*Très bonne écoute\s*!?\s*$/i,"").trim();
   editorialText=(news?news+" ":"Bonjour, ici Jaya. On passe tout de suite à la météo. ")+weatherBody+" "+nextFlashText+" Très bonne écoute !";
  }
  const editorialPeriod=isEditorial?(lh<9?"07":"11"):"";
  const editorialDay=isEditorial?new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(now):"";
  const text=radioPause(enforceDaypart(isEditorial?editorialText:await smartAnnouncement({song:mode<2?nextSong:null,slot,hour:lh,minute:lm}),lh)),file=isEditorial?("jaya-flash-"+editorialDay+"-"+editorialPeriod+".mp3"):("jaya-auto-"+slot+".mp3");
  // Sécurité antenne : ne jamais demander/générer/mettre en file un passage vide.
  if(!text||text.trim().length<12){
   console.error("JAYA_EMPTY_TEXT_BLOCKED",{isEditorial,mode,slot,nextSong:!!nextSong});
   return res.status(200).json({ok:true,action:"skip",reason:"empty-or-too-short-text",queued:false});
  }
  const ttsText=text.replace(/Technorizon\.fr/gi,"Techno Rizon point F R").replace(/Technorizon/gi,"Techno Rizon");
  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+VOICE,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text:ttsText,model_id:"eleven_multilingual_v2",voice_settings:{speed:0.95,stability:0.34,similarity_boost:0.80,style:0.34,use_speaker_boost:true}})});
  if(!t.ok){const detail=await t.text().catch(()=>""),msg="TTS failed";console.error("JAYA_TTS",t.status,detail.slice(0,500));return res.status(502).json({ok:false,error:msg,status:t.status,stage:"tts"})}
  const audio=await t.arrayBuffer();
  const contentType=String(t.headers.get("content-type")||"").toLowerCase();
  // Un MP3 Jaya normal fait plusieurs Ko. Un corps minuscule/non audio est bloqué avant AzuraCast.
  if(audio.byteLength<4096||(!contentType.includes("audio")&&!contentType.includes("mpeg"))){
   console.error("JAYA_INVALID_AUDIO_BLOCKED",{bytes:audio.byteLength,contentType});
   return res.status(502).json({ok:false,error:"Invalid TTS audio blocked",stage:"tts-validation",bytes:audio.byteLength,content_type:contentType});
  }
  const head=new Uint8Array(audio.slice(0,3));
  const looksMp3=(head[0]===0x49&&head[1]===0x44&&head[2]===0x33)||(head[0]===0xff&&(head[1]&0xe0)===0xe0);
  if(!looksMp3){
   console.error("JAYA_INVALID_MP3_BLOCKED",{bytes:audio.byteLength,head:Array.from(head)});
   return res.status(502).json({ok:false,error:"Invalid MP3 blocked",stage:"tts-validation",bytes:audio.byteLength});
  }
  const form=new FormData();form.append("file",new Blob([audio],{type:"audio/mpeg"}),file);
  const uploadDir=isEditorial?"Jaya/Meteo":"Jaya/Auto";
  const up=await az(base,key,"/files/upload?currentDirectory="+encodeURIComponent(uploadDir),{method:"POST",body:form});
  const upRaw=await up.text();let upData=null;try{upData=JSON.parse(upRaw)}catch{}
  if(!up.ok){const msg="Upload failed";console.error("JAYA_UPLOAD",up.status,upRaw.slice(0,500));return res.status(502).json({ok:false,error:msg,status:up.status,stage:"upload"})}
  const path=uploadDir+"/"+file;
  // Jaya uniquement : +3 dB via la métadonnée native Liquidsoap d'AzuraCast.
  // Aucun changement du TTS, du timbre, de la fluidité ou du niveau des musiques.
  const mediaId=upData?.id;
  if(mediaId){
   const gain=await az(base,key,"/file/"+mediaId,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({extra_metadata:{amplify:3}})});
   if(!gain.ok){const detail=await gain.text().catch(()=>"");console.error("JAYA_GAIN",gain.status,detail.slice(0,500))}
   else console.log("JAYA_GAIN","+3 dB",mediaId);
  }else console.error("JAYA_GAIN","Media ID absent après upload");
  // Range automatiquement chaque nouvelle intervention dans la playlist de stockage "Banque Jaya".
  // La playlist peut rester désactivée : la mise en file directe ci-dessous continue de gérer le passage antenne.
  try{
   const pr=await az(base,key,"/playlists"),praw=await pr.text();let pdata=null;try{pdata=JSON.parse(praw)}catch{}
   if(pr.ok){
    const playlists=Array.isArray(pdata)?pdata:(pdata?.rows||[]);
    const bank=playlists.find(p=>String(p?.name||"").trim().toLowerCase()==="banque jaya");
    if(bank?.id){
     const assign=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"playlist",playlists:[String(bank.id)],files:[path],dirs:[]})});
     if(!assign.ok){
      const detail=await assign.text().catch(()=>"");console.error("JAYA_BANK_ASSIGN",assign.status,detail.slice(0,500));
      if(isEditorial)return res.status(502).json({ok:false,error:"Banque Jaya assignment failed",status:assign.status,stage:"bank-assign",file:path});
     } else console.log("JAYA_BANK_ASSIGNED",path,bank.id);
    }else{
     console.error("JAYA_BANK_ASSIGN","Playlist Banque Jaya introuvable");
     if(isEditorial)return res.status(502).json({ok:false,error:"Playlist Banque Jaya introuvable",stage:"bank-playlist",file:path});
    }
   }else{
    console.error("JAYA_BANK_PLAYLISTS",pr.status,praw.slice(0,500));
    if(isEditorial)return res.status(502).json({ok:false,error:"Impossible de verifier Banque Jaya",status:pr.status,stage:"bank-playlists",file:path});
   }
  }catch(e){
   console.error("JAYA_BANK_ASSIGN",e?.message||e);
   if(isEditorial)return res.status(502).json({ok:false,error:"Banque Jaya assignment exception",stage:"bank-assign",file:path});
  }
  // Les rendez-vous éditoriaux fixes passent en priorité devant la musique déjà en attente.
  // AzuraCast reçoit d'abord la mise en file, puis la priorité est demandée pour la météo.
  const q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[], ...(isEditorial?{priority:true}: {})})});
  if(!q.ok){const detail=await q.text().catch(()=>""),msg="Queue failed";console.error("JAYA_QUEUE",q.status,detail.slice(0,500));return res.status(502).json({ok:false,error:msg,status:q.status,stage:"queue"})}
  console.log("JAYA_AUTO_QUEUED",path,nextSong||"generic",rawNextSong&&!nextSong?"brain-rejected":"brain-ok");return res.status(200).json({ok:true,action:"queued",file:path,announced:!isWeather&&mode<2?nextSong:null,brain_checked:!!rawNextSong,brain_validated:!!nextSong,mode:isEditorial?"news-weather":mode<2&&nextSong?"next-title":"general",text});
 }catch(e){console.error("AzuraCast/Jaya",e?.stack||e?.message||e);return res.status(502).json({ok:false,error:"AzuraCast/Jaya unavailable",stage:"exception",detail:String(e?.message||e).slice(0,300)})}
}

module.exports = handler;
