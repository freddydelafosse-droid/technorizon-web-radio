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
function songFromRow(x){
 const s=x?.song||x?.media?.song||x?.media||x||{};
 const artist=s.artist||s.artist_name||s?.custom_fields?.artist||"";
 const title=s.title||s.name||s.song_title||s?.custom_fields?.title||"";
 if(!title)return null;
 if(String(title).toLowerCase().includes("jaya"))return null;
 return {artist:String(artist).trim(),title:String(title).trim()};
}
function daypart(){const h=new Date().getUTCHours()+2;const x=h%24;return x<6?"nuit":x<12?"matin":x<18?"journee":"soiree"}
function generic(slot){const p=daypart(),pool={matin:["Bonjour à toutes et à tous ! Jaya avec vous sur Technorizon.fr. Très bonne matinée en musique !","Technorizon.fr vous accompagne ce matin. Ici Jaya, et on continue en musique !"],journee:["Jaya avec vous sur Technorizon.fr. Merci de nous accompagner, et place à la musique !","Vous êtes bien sur Technorizon.fr. Ici Jaya, très bonne écoute à toutes et à tous !"],soiree:["Bonsoir à toutes et à tous ! Ici Jaya sur Technorizon.fr. Profitez bien de votre soirée en musique !","Jaya avec vous ce soir sur Technorizon.fr. Montez le son, la musique continue !"],nuit:["Vous êtes toujours avec Technorizon.fr. Ici Jaya, très bonne écoute à tous les noctambules !","Jaya vous accompagne dans la nuit sur Technorizon.fr. La musique continue !"]};return pool[p][hash(String(slot)+p)%pool[p].length]}
function announcement(song){
 if(!song)return null;
 const choices=song.artist?[
  `Dans quelques instants sur Technorizon.fr, ${song.artist} avec ${song.title}. Très bonne écoute !`,
  `La musique continue sur Technorizon.fr. Et maintenant, ${song.artist} avec ${song.title} !`,
  `Ici Jaya sur Technorizon.fr. On enchaîne avec ${song.artist} et ${song.title}. Montez le son !`
 ]:[
  `Dans quelques instants sur Technorizon.fr : ${song.title}. Très bonne écoute !`,
  `Ici Jaya sur Technorizon.fr. Et maintenant, place à ${song.title} !`
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
  if(rows.some(x=>JSON.stringify(x).toLowerCase().includes("jaya")))return res.status(200).json({ok:true,action:"skip",reason:"jaya-already-queued"});
  const nextSong=rows.map(songFromRow).filter(Boolean)[0]||null;
  const slot=Math.floor(now.getTime()/(12*60*1000));
  const mode=hash(String(slot)+"mode")%3,text=(mode<2&&nextSong?announcement(nextSong):generic(slot))||MESSAGES[hash(String(slot)+"jaya")%MESSAGES.length],file="jaya-auto-"+slot+".mp3";
  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+VOICE,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2",voice_settings:{speed:0.92}})});
  if(!t.ok)return res.status(502).json({ok:false,error:"TTS failed",status:t.status});
  const form=new FormData();form.append("file",new Blob([await t.arrayBuffer()],{type:"audio/mpeg"}),file);
  const up=await az(base,key,"/files/upload?currentDirectory=Jaya/Auto",{method:"POST",body:form});
  if(!up.ok)return res.status(502).json({ok:false,error:"Upload failed",status:up.status});
  const path="Jaya/Auto/"+file,q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[]})});
  if(!q.ok)return res.status(502).json({ok:false,error:"Queue failed",status:q.status});
  console.log("JAYA_AUTO_QUEUED",path,nextSong||"generic");return res.status(200).json({ok:true,action:"queued",file:path,announced:mode<2?nextSong:null,mode:mode<2?"next-title":"general",text});
 }catch(e){console.error("AzuraCast/Jaya",e?.message||e);return res.status(502).json({ok:false,error:"AzuraCast/Jaya unavailable"})}
}
