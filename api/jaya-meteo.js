const VOICE="bkBb0X46TbX2PU8PC5vY",SID=1;
const CITIES=[
 ["Paris",48.8566,2.3522],["Lille",50.6292,3.0573],["Strasbourg",48.5734,7.7521],
 ["Nantes",47.2184,-1.5536],["Bordeaux",44.8378,-0.5792],["Lyon",45.764,4.8357],
 ["Marseille",43.2965,5.3698]
];
async function az(base,key,path,opts={}){return fetch(base+"/api/station/"+SID+path,{...opts,headers:{"X-API-Key":key,"Accept":"application/json",...(opts.headers||{})}})}
function parisNow(){
 const parts=new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
 return Object.fromEntries(parts.map(p=>[p.type,p.value]));
}
function sky(code){
 if(code===0)return "un ciel bien dégagé";
 if(code<=3)return "un ciel partagé entre éclaircies et nuages";
 if(code===45||code===48)return "des brouillards par endroits";
 if(code>=51&&code<=67)return "des pluies ou averses";
 if(code>=71&&code<=77)return "quelques chutes de neige";
 if(code>=80&&code<=82)return "des averses";
 if(code>=95)return "un risque d'orages";
 return "un temps variable";
}
async function forecast(city,lat,lon,date){
 const u=new URL("https://api.open-meteo.com/v1/forecast");
 u.searchParams.set("latitude",lat);u.searchParams.set("longitude",lon);
 u.searchParams.set("daily","weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
 u.searchParams.set("timezone","Europe/Paris");u.searchParams.set("forecast_days","1");
 const r=await fetch(u);if(!r.ok)throw new Error("Weather "+city+" "+r.status);
 const j=await r.json(),d=j.daily||{};
 return {city,min:Math.round(d.temperature_2m_min?.[0]),max:Math.round(d.temperature_2m_max?.[0]),rain:Math.round(d.precipitation_probability_max?.[0]||0),code:Number(d.weather_code?.[0]||0)};
}
function bulletin(data,hour){
 const north=data.find(x=>x.city==="Lille"),paris=data.find(x=>x.city==="Paris"),east=data.find(x=>x.city==="Strasbourg"),west=data.find(x=>x.city==="Nantes"),sw=data.find(x=>x.city==="Bordeaux"),se=data.find(x=>x.city==="Marseille"),lyon=data.find(x=>x.city==="Lyon");
 const intro=hour<9?"Bonjour ! Ici Jaya avec votre point météo sur Technorizon.fr.":hour<12?"Ici Jaya sur Technorizon.fr, on fait le point sur la météo en France.":"Il est bientôt l'heure du déjeuner, voici votre météo avec Jaya sur Technorizon.fr.";
 const wet=data.filter(x=>x.rain>=50).map(x=>x.city);
 const rain=wet.length?("Le risque de pluie est plus marqué vers "+wet.slice(0,3).join(", ")+"."):"Le risque de pluie reste globalement limité sur les villes suivies.";
 return intro+" Aujourd'hui, comptez environ "+north.max+" degrés à Lille, "+paris.max+" à Paris, "+east.max+" à Strasbourg, "+west.max+" à Nantes, "+sw.max+" à Bordeaux, "+lyon.max+" à Lyon et "+se.max+" à Marseille. Côté ciel, "+sky(paris.code)+" sur la région parisienne, "+sky(west.code)+" dans l'Ouest et "+sky(se.code)+" près de la Méditerranée. "+rain+" Et pour retrouver la météo détaillée de votre ville, rendez-vous sur Technorizon.fr, rubrique Météo. Très bonne écoute !";
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({ok:false,error:"GET only"});
 const secret=process.env.CRON_SECRET;if(!secret||req.headers.authorization!=="Bearer "+secret)return res.status(401).json({ok:false,error:"Unauthorized"});
 const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,""),key=process.env.AZURACAST_API_KEY,el=process.env.ELEVENLABS_API_KEY;
 if(!base||!key||!el)return res.status(500).json({ok:false,error:"Configuration missing"});
 try{
  const n=parisNow(),hour=Number(n.hour),minute=Number(n.minute);
  if(hour<6||hour>12)return res.status(200).json({ok:true,action:"skip",reason:"outside-weather-hours",local:hour+":"+String(minute).padStart(2,"0")});
  const date=n.year+"-"+n.month+"-"+n.day,slot=date+"-"+hour;
  const data=await Promise.all(CITIES.map(c=>forecast(...c,date))),text=bulletin(data,hour),file="jaya-meteo-"+slot+".mp3";
  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+VOICE,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2",voice_settings:{speed:0.9,stability:0.42,similarity_boost:0.78,style:0.22,use_speaker_boost:true}})});
  if(!t.ok)return res.status(502).json({ok:false,error:"TTS failed",status:t.status});
  const form=new FormData();form.append("file",new Blob([await t.arrayBuffer()],{type:"audio/mpeg"}),file);
  const up=await az(base,key,"/files/upload?currentDirectory=Jaya/Meteo",{method:"POST",body:form});
  if(!up.ok)return res.status(502).json({ok:false,error:"Upload failed",status:up.status});
  const path="Jaya/Meteo/"+file,q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[]})});
  if(!q.ok)return res.status(502).json({ok:false,error:"Queue failed",status:q.status});
  console.log("JAYA_METEO_QUEUED",path);return res.status(200).json({ok:true,action:"queued",file:path,hour,text});
 }catch(e){console.error("Jaya meteo",e?.message||e);return res.status(502).json({ok:false,error:"Jaya meteo unavailable"})}
}