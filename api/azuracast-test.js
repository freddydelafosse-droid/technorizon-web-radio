const VOICE="bkBb0X46TbX2PU8PC5vY",SID=1,GUARD=7;
const MESSAGES=[
 "Vous écoutez Technorizon.fr, la musique sans frontières. Ici Jaya, très bonne écoute à toutes et à tous !",
 "Ici Jaya sur Technorizon.fr. Je reste avec vous pour le meilleur de l'électro, de l'Eurodance et de la House. Très bonne écoute !",
 "Toujours avec vous sur Technorizon.fr ! Ici Jaya. Montez le son, la musique continue !",
 "Un petit coucou de Jaya ! Vous êtes bien sur Technorizon.fr, la musique sans frontières.",
 "Ici Jaya sur Technorizon.fr. Merci d'être avec nous, et surtout ne bougez pas : la musique continue !",
 "Technorizon.fr, la musique sans frontières. Jaya avec vous, et encore beaucoup de musique à venir !",
 "Vous êtes toujours avec Jaya sur Technorizon.fr. Merci pour votre fidélité et profitez bien de la musique !",
 "Ici Jaya ! Où que vous soyez, merci d'avoir choisi Technorizon.fr. On continue ensemble !",
 "Technorizon.fr vous accompagne partout. Ici Jaya, et la musique continue sans frontières !",
 "Petit passage de Jaya pour vous souhaiter une excellente écoute sur Technorizon.fr !",
 "Vous venez de nous rejoindre ? Bienvenue sur Technorizon.fr ! Moi c'est Jaya, et je reste avec vous.",
 "Toujours plus de musique sur Technorizon.fr ! Ici Jaya, et on poursuit sans interruption.",
 "Jaya avec vous sur Technorizon.fr. Installez-vous, montez le son et profitez de la musique !",
 "Merci d'être de plus en plus nombreux à écouter Technorizon.fr. Ici Jaya, très bonne écoute !",
 "Un peu d'électro, beaucoup d'énergie et surtout de la musique sans frontières. Vous êtes sur Technorizon.fr !",
 "Ici Jaya. Vous écoutez Technorizon.fr, votre radio électro, Eurodance et House. La suite arrive tout de suite !",
 "Où que vous nous écoutiez dans le monde, bienvenue sur Technorizon.fr. Ici Jaya, heureuse de vous accompagner !",
 "Technorizon.fr continue avec vous. Moi c'est Jaya, et je vous réserve encore beaucoup de musique !",
 "Pas de frontières pour la musique ! Ici Jaya, vous êtes bien sur Technorizon.fr.",
 "Jaya au micro de Technorizon.fr pour un petit coucou. Merci d'être avec nous et très bonne écoute !",
 "La musique continue sur Technorizon.fr. Ici Jaya, je vous accompagne encore un moment !",
 "Vous êtes sur Technorizon.fr et moi c'est Jaya. Merci de partager ce moment avec nous !",
 "Encore de très bons titres à venir sur Technorizon.fr. Ici Jaya, restez avec nous !",
 "Technorizon.fr, c'est votre musique sans frontières. Jaya avec vous, et on continue !",
 "Ici Jaya sur Technorizon.fr. Une pensée à tous ceux qui nous écoutent en France et partout ailleurs dans le monde !",
 "Vous travaillez, vous roulez ou vous vous détendez ? Jaya est avec vous sur Technorizon.fr !",
 "Merci de faire partie de l'aventure Technorizon.fr. Ici Jaya, et maintenant place à la musique !",
 "Jaya avec vous ! Technorizon.fr ne s'arrête pas, alors profitez de la suite !",
 "Vous écoutez Technorizon.fr. Ici Jaya, votre petite voix entre deux bonnes doses de musique !",
 "Toujours connectés à Technorizon.fr ? Parfait ! Ici Jaya, et on repart pour la suite !"
];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
async function az(base,key,path,opts={}){return fetch(base+"/api/station/"+SID+path,{...opts,headers:{"X-API-Key":key,"Accept":"application/json",...(opts.headers||{})}})}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,""),key=process.env.AZURACAST_API_KEY;
 if(!base||!key)return res.status(500).json({ok:false,error:"Configuration missing"});
 try{
  if(req.method==="POST"){
   if(req.body?.action!=="inspect")return res.status(403).json({ok:false,error:"Test mutations disabled"});
   const q=await az(base,key,"/queue"),raw=await q.text();let data=null;try{data=JSON.parse(raw)}catch{}
   if(!q.ok)return res.status(q.status).json({ok:false,error:"Queue inspect failed"});
   const rows=Array.isArray(data)?data:(data?.rows||[]);
   return res.status(200).json({ok:true,count:rows.length,jaya:rows.filter(x=>JSON.stringify(x).toLowerCase().includes("jaya")).slice(0,10)});
  }
  if(req.method!=="GET")return res.status(405).json({ok:false,error:"GET or POST only"});
  const secret=process.env.CRON_SECRET;
  if(!secret||req.headers.authorization!=="Bearer "+secret)return res.status(401).json({ok:false,error:"Unauthorized"});
  const el=process.env.ELEVENLABS_API_KEY;if(!el)return res.status(500).json({ok:false,error:"TTS configuration missing"});
  const now=new Date(),m=now.getUTCMinutes();
  if(m>=60-GUARD||m<GUARD)return res.status(200).json({ok:true,action:"skip",reason:"hourly-top-guard"});
  const qr=await az(base,key,"/queue"),qraw=await qr.text();let qdata=null;try{qdata=JSON.parse(qraw)}catch{}
  if(!qr.ok)return res.status(502).json({ok:false,error:"Queue check failed"});
  const rows=Array.isArray(qdata)?qdata:(qdata?.rows||[]);
  if(rows.some(x=>JSON.stringify(x).toLowerCase().includes("jaya")))return res.status(200).json({ok:true,action:"skip",reason:"jaya-already-queued"});
  const slot=Math.floor(now.getTime()/(20*60*1000)),text=MESSAGES[hash(String(slot)+"jaya")%MESSAGES.length],file="jaya-auto-"+slot+".mp3";
  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+VOICE,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2"})});
  if(!t.ok)return res.status(502).json({ok:false,error:"TTS failed",status:t.status});
  const form=new FormData();form.append("file",new Blob([await t.arrayBuffer()],{type:"audio/mpeg"}),file);
  const up=await az(base,key,"/files/upload?currentDirectory=Jaya/Auto",{method:"POST",body:form});
  if(!up.ok)return res.status(502).json({ok:false,error:"Upload failed",status:up.status});
  const path="Jaya/Auto/"+file,q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[]})});
  if(!q.ok)return res.status(502).json({ok:false,error:"Queue failed",status:q.status});
  console.log("JAYA_AUTO_QUEUED",path);return res.status(200).json({ok:true,action:"queued",file:path});
 }catch(e){console.error("AzuraCast/Jaya",e?.message||e);return res.status(502).json({ok:false,error:"AzuraCast/Jaya unavailable"})}
}
