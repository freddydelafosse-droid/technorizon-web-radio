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
function daypart(){const x=parisHour();return x<6?"nuit":x<12?"matin":x<18?"journee":"soiree"}
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
function radioPause(s){return String(s).replace(/\.\.\./g,"…").replace(/([.!?])\s+/g,"$1 … ").replace(/,\s+/g,", … ").replace(/\s+…\s+/g," … ").trim()}
function generic(slot){const p=daypart(),pool={matin:["Bonjour à toutes et à tous ! Jaya avec vous sur Technorizon.fr. Très bonne matinée en musique !","Technorizon.fr vous accompagne ce matin. Ici Jaya, et on continue en musique !"],journee:["Jaya avec vous sur Technorizon.fr. Merci de nous accompagner, et place à la musique !","Vous êtes bien sur Technorizon.fr. Ici Jaya, très bonne écoute à toutes et à tous !"],soiree:["Bonsoir à toutes et à tous ! Ici Jaya sur Technorizon.fr. Profitez bien de votre soirée en musique !","Jaya avec vous ce soir sur Technorizon.fr. Montez le son, la musique continue !"],nuit:["Vous êtes toujours avec Technorizon.fr. Ici Jaya, très bonne écoute à tous les noctambules !","Jaya vous accompagne dans la nuit sur Technorizon.fr. La musique continue !"]};return pool[p][hash(String(slot)+p)%pool[p].length]}
function weatherSky(code){if(code===0)return "un ciel bien dégagé";if(code<=3)return "un ciel partagé entre éclaircies et nuages";if(code===45||code===48)return "des brouillards par endroits";if(code>=51&&code<=67)return "des pluies ou averses";if(code>=71&&code<=77)return "quelques chutes de neige";if(code>=80&&code<=82)return "des averses";if(code>=95)return "un risque d'orages";return "un temps variable"}
async function weatherBulletin(){const cities=[["Lille",50.6292,3.0573],["Paris",48.8566,2.3522],["Strasbourg",48.5734,7.7521],["Nantes",47.2184,-1.5536],["Bordeaux",44.8378,-0.5792],["Lyon",45.764,4.8357],["Marseille",43.2965,5.3698]];const data=await Promise.all(cities.map(async([city,latitude,longitude])=>{const u=new URL("https://api.open-meteo.com/v1/forecast");u.searchParams.set("latitude",latitude);u.searchParams.set("longitude",longitude);u.searchParams.set("daily","weather_code,temperature_2m_max,precipitation_probability_max");u.searchParams.set("timezone","Europe/Paris");u.searchParams.set("forecast_days","1");const r=await fetch(u);if(!r.ok)throw new Error("Weather "+city);const j=await r.json();return{city,max:Math.round(j.daily.temperature_2m_max[0]),rain:Math.round(j.daily.precipitation_probability_max[0]||0),code:Number(j.daily.weather_code[0]||0)}}));const get=n=>data.find(x=>x.city===n),wet=data.filter(x=>x.rain>=50).map(x=>x.city);return "Bonjour, ici Jaya avec votre météo nationale sur Technorizon.fr. Aujourd'hui, comptez environ "+get("Lille").max+" degrés à Lille, "+get("Paris").max+" à Paris, "+get("Strasbourg").max+" à Strasbourg, "+get("Nantes").max+" à Nantes, "+get("Bordeaux").max+" à Bordeaux, "+get("Lyon").max+" à Lyon et "+get("Marseille").max+" à Marseille. Côté ciel, "+weatherSky(get("Paris").code)+" sur la région parisienne, "+weatherSky(get("Nantes").code)+" dans l'Ouest et "+weatherSky(get("Marseille").code)+" près de la Méditerranée. "+(wet.length?"Le risque de pluie est plus marqué vers "+wet.slice(0,3).join(", ")+".":"Le risque de pluie reste globalement limité sur les villes suivies.")+" Et pour retrouver la météo détaillée de votre ville, rendez-vous sur Technorizon.fr, rubrique Météo. Très bonne écoute !"}
function announcement(song){
 if(!song)return null;
 const artist=speechMeta(song.artist),title=speechMeta(song.title);
 const choices=artist?[
  `Dans quelques instants sur Technorizon.fr … ${artist} … avec ${title}. … Très bonne écoute !`,
  `La musique continue sur Technorizon.fr. … Et maintenant … ${artist}, avec ${title} !`,
  `Ici Jaya sur Technorizon.fr. … On enchaîne avec ${artist} … et ${title}. … Montez le son !`
 ]:[
  `Dans quelques instants sur Technorizon.fr … ${title}. … Très bonne écoute !`,
  `Ici Jaya sur Technorizon.fr. … Et maintenant … place à ${title} !`
 ];
 return choices[hash(song.artist+"|"+song.title)%choices.length];
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
  const pendingJaya=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return raw.includes("jaya")&&!played});
  if(pendingJaya)return res.status(200).json({ok:true,action:"skip",reason:"jaya-already-queued"});
  const songs=rows.map(songFromRow).filter(Boolean);
  const nextSong=songs[1]||null;
  const slot=Math.floor(now.getTime()/(10*60*1000));
  const local=new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now).reduce((a,p)=>(a[p.type]=p.value,a),{}),lh=Number(local.hour),lm=Number(local.minute),isWeather=lh>=6&&lh<=12&&lm>=23&&lm<=33;
  const mode=isWeather?3:hash(String(slot)+"mode")%3,text=radioPause(isWeather?await weatherBulletin():((mode<2&&nextSong?announcement(nextSong):generic(slot))||MESSAGES[hash(String(slot)+"jaya")%MESSAGES.length])),file=(isWeather?"jaya-meteo-":"jaya-auto-")+slot+".mp3";
  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+VOICE,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2",voice_settings:{speed:isWeather?0.87:0.90,stability:isWeather?0.36:0.32,similarity_boost:0.78,style:isWeather?0.28:0.36,use_speaker_boost:true}})});
  if(!t.ok)return res.status(502).json({ok:false,error:"TTS failed",status:t.status});
  const form=new FormData();form.append("file",new Blob([await t.arrayBuffer()],{type:"audio/mpeg"}),file);
  const up=await az(base,key,"/files/upload?currentDirectory=Jaya/Auto",{method:"POST",body:form});
  if(!up.ok)return res.status(502).json({ok:false,error:"Upload failed",status:up.status});
  const path=(isWeather?"Jaya/Meteo/":"Jaya/Auto/")+file,q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[]})});
  if(!q.ok)return res.status(502).json({ok:false,error:"Queue failed",status:q.status});
  console.log("JAYA_AUTO_QUEUED",path,nextSong||"generic");return res.status(200).json({ok:true,action:"queued",file:path,announced:!isWeather&&mode<2?nextSong:null,mode:isWeather?"weather":mode<2?"next-title":"general",text});
 }catch(e){console.error("AzuraCast/Jaya",e?.message||e);return res.status(502).json({ok:false,error:"AzuraCast/Jaya unavailable"})}
}
