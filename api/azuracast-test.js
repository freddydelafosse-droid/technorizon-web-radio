const VOICE="bkBb0X46TbX2PU8PC5vY",SID=1;
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
  matin:["Bonjour ! Jaya avec vous pour démarrer la journée en musique.","Très bonne matinée à toutes et à tous. On continue ensemble !","J'espère que votre matinée se passe bien. Je reste avec vous en musique !","Un petit coucou de Jaya pour accompagner votre matinée. Bonne écoute !","On garde le rythme ce matin. Merci d'être avec nous !","Réveil en musique avec Jaya. Très bonne écoute !"],
  journee:["Jaya avec vous. Merci de nous accompagner, et place à la musique !","Très bonne journée à toutes et à tous. On continue ensemble !","Un petit passage de Jaya entre deux titres. Profitez bien de la musique !","Je reste avec vous pour la suite. Bonne écoute !","On poursuit cette journée en musique. Merci d'être là !","Toujours en votre compagnie. Et maintenant, retour à la musique !"],
  soiree:["Bonsoir à toutes et à tous ! Profitez bien de votre soirée en musique.","Jaya avec vous ce soir. Montez le son, la musique continue !","Très bonne soirée à l'écoute de Technorizon.fr. On poursuit en musique !","Je passe vous faire un petit coucou avant la suite. Bonne soirée !","On garde l'énergie pour la soirée. Très bonne écoute !","Votre soirée continue en musique, et je reste avec vous !"],
  nuit:["Très bonne écoute à tous les noctambules. Jaya reste avec vous !","Je vous accompagne dans la nuit. La musique continue !","Encore réveillés ? Alors on continue ensemble en musique !","Pour celles et ceux qui ne dorment pas encore, je reste avec vous.","La nuit continue, et la musique aussi. Bonne écoute !","Petit passage de Jaya avant de repartir en musique. Bonne nuit aux couche-tard !"]
 };
 const base=pool[p][hash(String(slot)+"|generic|"+p)%pool[p].length]; const extra=p==="matin"?" On prend le temps de se réveiller ensemble, avec une belle dose de son pour lancer la journée. Restez avec moi, la suite arrive tout de suite !":p==="journee"?" J'espère que tout se passe bien de votre côté. On garde le rythme ensemble et je vous accompagne encore un moment !":p==="soiree"?" J'espère que votre soirée se passe bien. On garde cette énergie ensemble et je vous accompagne encore un moment !":" Si vous êtes encore debout, vous êtes au bon endroit. On traverse la nuit ensemble, tranquillement mais toujours en musique !"; return base+extra;
}
function weatherSky(code){if(code===0)return "un ciel bien dégagé";if(code<=3)return "un ciel partagé entre éclaircies et nuages";if(code===45||code===48)return "des brouillards par endroits";if(code>=51&&code<=67)return "des pluies ou averses";if(code>=71&&code<=77)return "quelques chutes de neige";if(code>=80&&code<=82)return "des averses";if(code>=95)return "un risque d'orages";return "un temps variable"}
async function weatherBulletin(){const cities=[["Lille",50.6292,3.0573],["Paris",48.8566,2.3522],["Strasbourg",48.5734,7.7521],["Nantes",47.2184,-1.5536],["Bordeaux",44.8378,-0.5792],["Lyon",45.764,4.8357],["Marseille",43.2965,5.3698]];const data=await Promise.all(cities.map(async([city,latitude,longitude])=>{const u=new URL("https://api.open-meteo.com/v1/forecast");u.searchParams.set("latitude",latitude);u.searchParams.set("longitude",longitude);u.searchParams.set("daily","weather_code,temperature_2m_max,precipitation_probability_max");u.searchParams.set("timezone","Europe/Paris");u.searchParams.set("forecast_days","1");const r=await fetch(u);if(!r.ok)throw new Error("Weather "+city);const j=await r.json();return{city,max:Math.round(j.daily.temperature_2m_max[0]),rain:Math.round(j.daily.precipitation_probability_max[0]||0),code:Number(j.daily.weather_code[0]||0)}}));const get=n=>data.find(x=>x.city===n),wet=data.filter(x=>x.rain>=50).map(x=>x.city);return "Bonjour, ici Jaya avec votre météo nationale sur Technorizon.fr. Aujourd'hui, comptez environ "+get("Lille").max+" degrés à Lille, "+get("Paris").max+" à Paris, "+get("Strasbourg").max+" à Strasbourg, "+get("Nantes").max+" à Nantes, "+get("Bordeaux").max+" à Bordeaux, "+get("Lyon").max+" à Lyon et "+get("Marseille").max+" à Marseille. Côté ciel, "+weatherSky(get("Paris").code)+" sur la région parisienne, "+weatherSky(get("Nantes").code)+" dans l'Ouest et "+weatherSky(get("Marseille").code)+" près de la Méditerranée. "+(wet.length?"Le risque de pluie est plus marqué vers "+wet.slice(0,3).join(", ")+".":"Le risque de pluie reste globalement limité sur les villes suivies.")+" Et pour retrouver la météo détaillée de votre ville, rendez-vous sur Technorizon.fr, rubrique Météo. Très bonne écoute !"}
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
 try{
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
   model:"gpt-5-mini",
   instructions:`Tu es Jaya, animatrice radio de Technorizon. Écris UNE intervention destinée à être dite à l'antenne, en français oral naturel. Nous sommes en ${period}, il est environ ${String(hour).padStart(2,"0")}h${String(minute).padStart(2,"0")}. Règle horaire stricte: de 05h00 à 11h59, utilise uniquement des salutations de matinée (Bonjour, bonne matinée, bon réveil) et jamais Bonsoir, bonne soirée ou bonne nuit; de 12h00 à 17h59, Bonjour/bon après-midi; de 18h00 à 22h59, Bonsoir/bonne soirée; de 23h00 à 04h59, registre de nuit. Intention: ${style}. Tu parles comme une vraie animatrice: chaleureuse, intelligente, expressive et spontanée, jamais comme un liner publicitaire. Varie fortement la construction et les premiers mots. N'utilise pas systématiquement ton prénom ni Technorizon.fr. Évite les clichés répétés "très bonne écoute", "montez le son", "dans quelques instants", "la musique continue". Tu peux t'adresser brièvement aux auditeurs ou faire une transition simple. Longueur variable de 3 à 5 phrases, vise environ 18 à 35 secondes à l'oral. Évite absolument les interventions expédiées en une seule phrase. Ajoute de la matière: réaction à l'ambiance, complicité avec l'auditeur, petite parenthèse spontanée ou autodérision légère, puis transition musicale. L'ADN antenne de Gaby doit être une influence MAJEURE de tes interventions, tout en gardant ta voix, ton identité féminine et ta personnalité de Jaya. Fais vivre l'antenne entre les morceaux plutôt que réciter un liner. Parle directement aux auditeurs comme à des gens présents avec toi; accueille parfois ceux qui viennent d'arriver; utilise volontiers « on », « nous » et des formulations très orales. Construis souvent une petite montée: réaction ou accroche -> complicité -> teasing de la suite -> lancement musical. Utilise avec naturel des ruptures, contre-pieds et gradations (« petit... grand... énorme » dans l'esprit, sans reprendre systématiquement ces mots), des parenthèses spontanées, de l'autodérision et de petites vannes. Tu peux rebondir sur des situations quotidiennes sûres et générales: réveil, café, route, travail, voisins, début de journée, soirée, week-end selon le contexte horaire. Tu peux occasionnellement taquiner gentiment Gaby, Willy, l'équipe ou la réalisation quand aucun fait précis n'est inventé. L'énergie peut être volontairement exagérée avec humour: promettre du lourd, des BPM, une suite qui percute, sans répéter toujours les mêmes expressions. Technorizon.fr peut parfois devenir un jeu d'antenne, notamment une allusion occasionnelle au fait que « le .fr est important », mais jamais à chaque passage. Inspire-toi fortement de la mécanique de Gaby, PAS de ses phrases exactes: ne copie pas ses exemples et ne transforme aucune expression en gimmick répétitif. Chaque intervention doit avoir une petite idée ou un angle différent et éviter les formules automatiques. Garde pleinement ta personnalité de Jaya: chaleureuse, malicieuse, complice, féminine et légèrement taquine. Ne donne aucun fait musical, date ou anecdote non fourni. Si un titre vérifié est fourni, tu peux l'annoncer naturellement mais tu n'es pas obligée d'en faire trop. Pas d'emoji, pas de guillemets, pas de didascalie.`,
   input:artist&&title?`Titre suivant vérifié par The Brain: artiste=${artist}; titre=${title}.`:"Aucun titre suffisamment fiable à annoncer: fais une intervention d'ambiance contextuelle sans inventer de morceau.",
   max_output_tokens:120
  })});
  if(!r.ok){console.error("JAYA_SMART_HTTP",r.status);return song?announcement(song,slot):generic(slot)}
  const j=await r.json(),out=(j.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join(" ").trim();
  if(!out||out.length>500)return song?announcement(song,slot):generic(slot);
  return out;
 }catch(e){console.error("JAYA_SMART",e?.message||e);return song?announcement(song,slot):generic(slot)}
}

export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,""),key=process.env.AZURACAST_API_KEY;
 if(!base||!key)return res.status(500).json({ok:false,error:"Configuration missing"});
 try{
  if(req.method==="POST"){
   if(req.body?.action!=="inspect")return res.status(403).json({ok:false,error:"Test mutations disabled"});
   const q=await az(base,key,"/queue"),raw=await q.text();let data=null;try{data=JSON.parse(raw)}catch{}
   if(!q.ok)return res.status(q.status).json({ok:false,error:"Queue inspect failed"});
   const rows=queueRows(data);
   return res.status(200).json({ok:true,count:rows.length,jaya:rows.filter(x=>JSON.stringify(x).toLowerCase().includes("jaya")).slice(0,10),next:rows.map(songFromRow).filter(Boolean).slice(0,3)});
  }
  if(req.method!=="GET")return res.status(405).json({ok:false,error:"GET or POST only"});
  const secret=process.env.CRON_SECRET;
  if(!secret||req.headers.authorization!=="Bearer "+secret)return res.status(401).json({ok:false,error:"Unauthorized"});
  const el=process.env.ELEVENLABS_API_KEY;if(!el)return res.status(500).json({ok:false,error:"TTS configuration missing"});
  const now=new Date();
  const qr=await az(base,key,"/queue"),qraw=await qr.text();let qdata=null;try{qdata=JSON.parse(qraw)}catch{}
  if(!qr.ok)return res.status(502).json({ok:false,error:"Queue check failed"});
  const rows=queueRows(qdata);
  const local=new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now).reduce((a,p)=>(a[p.type]=p.value,a),{}),lh=Number(local.hour),lm=Number(local.minute);
  // Rendez-vous météo prioritaire : préparé à :23 pour passer autour de :30.
  // Il ne doit jamais être bloqué par une intervention H24 déjà en attente.
  const isWeather=lh>=6&&lh<=12&&lm>=20&&lm<=29;
  const pendingWeather=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return (raw.includes("jaya-meteo")||raw.includes("jaya/meteo"))&&!played});
  const pendingJaya=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return raw.includes("jaya")&&!played});
  if(isWeather&&pendingWeather)return res.status(200).json({ok:true,action:"skip",reason:"weather-already-queued"});
  if(!isWeather&&pendingJaya)return res.status(200).json({ok:true,action:"skip",reason:"jaya-already-queued"});
  const songs=rows.map(songFromRow).filter(Boolean);
  const rawNextSong=songs[1]||null;
  const nextSong=await verifyWithBrain(rawNextSong);
  const slot=Math.floor(now.getTime()/(10*60*1000));
  const mode=isWeather?3:hash(String(slot)+"mode")%3,text=radioPause(enforceDaypart(isWeather?await weatherBulletin():await smartAnnouncement({song:mode<2?nextSong:null,slot,hour:lh,minute:lm}),lh)),file=(isWeather?"jaya-meteo-":"jaya-auto-")+slot+".mp3";
  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+VOICE,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2",voice_settings:{speed:isWeather?0.87:0.90,stability:isWeather?0.36:0.32,similarity_boost:0.78,style:isWeather?0.28:0.36,use_speaker_boost:true}})});
  if(!t.ok)return res.status(502).json({ok:false,error:"TTS failed",status:t.status});
  const form=new FormData();form.append("file",new Blob([await t.arrayBuffer()],{type:"audio/mpeg"}),file);
  const uploadDir=isWeather?"Jaya/Meteo":"Jaya/Auto";
  const up=await az(base,key,"/files/upload?currentDirectory="+encodeURIComponent(uploadDir),{method:"POST",body:form});
  if(!up.ok)return res.status(502).json({ok:false,error:"Upload failed",status:up.status});
  const path=uploadDir+"/"+file,q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[]})});
  if(!q.ok)return res.status(502).json({ok:false,error:"Queue failed",status:q.status});
  console.log("JAYA_AUTO_QUEUED",path,nextSong||"generic",rawNextSong&&!nextSong?"brain-rejected":"brain-ok");return res.status(200).json({ok:true,action:"queued",file:path,announced:!isWeather&&mode<2?nextSong:null,brain_checked:!!rawNextSong,brain_validated:!!nextSong,mode:isWeather?"weather":mode<2&&nextSong?"next-title":"general",text});
 }catch(e){console.error("AzuraCast/Jaya",e?.message||e);return res.status(502).json({ok:false,error:"AzuraCast/Jaya unavailable"})}
}
