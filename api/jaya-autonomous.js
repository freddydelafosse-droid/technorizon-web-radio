const JAYA_VOICE_ID="bkBb0X46TbX2PU8PC5vY";
const STATION_ID=1;
const TOP_GUARD_MINUTES=7;
const MESSAGES=[
 "Vous écoutez Technorizon.fr, la musique sans frontières. Ici Jaya, très bonne écoute à toutes et à tous !",
 "Ici Jaya sur Technorizon.fr. Je reste avec vous pour le meilleur de l'électro, de l'Eurodance et de la House. Très bonne écoute !",
 "Toujours avec vous sur Technorizon.fr ! Ici Jaya. Montez le son, la musique continue !",
 "Un petit coucou de Jaya ! Vous êtes bien sur Technorizon.fr, la musique sans frontières.",
 "Ici Jaya sur Technorizon.fr. Merci d'être avec nous, et surtout ne bougez pas : la musique continue !",
 "Technorizon.fr, la musique sans frontières. Jaya avec vous, et encore beaucoup de musique à venir !"
];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function nearTop(now){const m=now.getUTCMinutes();return m>=60-TOP_GUARD_MINUTES||m<TOP_GUARD_MINUTES}
async function az(base,key,path,opts={}){return fetch(base+"/api/station/"+STATION_ID+path,{...opts,headers:{"X-API-Key":key,"Accept":"application/json",...(opts.headers||{})}})}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET") return res.status(405).json({ok:false,error:"GET only"});
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.authorization!=="Bearer "+secret) return res.status(401).json({ok:false,error:"Unauthorized"});
 const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,""),key=process.env.AZURACAST_API_KEY,el=process.env.ELEVENLABS_API_KEY;
 if(!base||!key||!el) return res.status(500).json({ok:false,error:"Configuration missing"});
 const now=new Date();
 if(nearTop(now)) return res.status(200).json({ok:true,action:"skip",reason:"hourly-top-guard"});
 try{
  const qr=await az(base,key,"/queue"); const qraw=await qr.text(); let qdata=null; try{qdata=JSON.parse(qraw)}catch{}
  if(!qr.ok) return res.status(502).json({ok:false,error:"Queue check failed"});
  const rows=Array.isArray(qdata)?qdata:(qdata?.rows||[]);
  if(rows.some(x=>JSON.stringify(x).toLowerCase().includes("jaya"))) return res.status(200).json({ok:true,action:"skip",reason:"jaya-already-queued"});
  const slot=Math.floor(now.getTime()/(15*60*1000));
  const text=MESSAGES[hash(String(slot)+"jaya")%MESSAGES.length],file="jaya-auto-"+slot+".mp3";
  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+JAYA_VOICE_ID,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2"})});
  if(!t.ok) return res.status(502).json({ok:false,error:"TTS failed",status:t.status});
  const audio=await t.arrayBuffer(),form=new FormData(); form.append("file",new Blob([audio],{type:"audio/mpeg"}),file);
  const up=await az(base,key,"/files/upload?currentDirectory=Jaya/Auto",{method:"POST",body:form});
  if(!up.ok) return res.status(502).json({ok:false,error:"Upload failed",status:up.status});
  const path="Jaya/Auto/"+file;
  const queued=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[]})});
  if(!queued.ok) return res.status(502).json({ok:false,error:"Queue failed",status:queued.status});
  console.log("JAYA_AUTO_QUEUED",path);
  return res.status(200).json({ok:true,action:"queued",file:path});
 }catch(e){console.error("Jaya autonomous",e?.message||e);return res.status(502).json({ok:false,error:"Jaya autonomous unavailable"})}
}
