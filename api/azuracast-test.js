const JAYA_VOICE_ID="bkBb0X46TbX2PU8PC5vY";
const TEXT="Bonjour à toutes et à tous ! Ici Jaya sur Technorizon.fr. Je suis très heureuse de vous rejoindre pour cette toute première intervention à l’antenne. Et ce n’est que le début… Très bonne écoute à tous sur Technorizon !";
const FILE="jaya-premiere-intervention.mp3";

export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST") return res.status(405).json({ok:false,error:"POST only"});
 const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,""), key=process.env.AZURACAST_API_KEY, el=process.env.ELEVENLABS_API_KEY;
 if(!base||!key||!el) return res.status(500).json({ok:false,error:"Configuration missing"});
 try{
  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+JAYA_VOICE_ID,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text:TEXT,model_id:"eleven_multilingual_v2"})});
  if(!t.ok) return res.status(502).json({ok:false,error:"TTS failed",status:t.status});
  const audio=await t.arrayBuffer();
  const form=new FormData();
  form.append("file",new Blob([audio],{type:"audio/mpeg"}),FILE);
  const up=await fetch(base+"/api/station/1/files/upload?currentDirectory=Jaya",{method:"POST",headers:{"X-API-Key":key},body:form});
  const raw=await up.text();
  if(!up.ok) return res.status(up.status).json({ok:false,error:"Upload failed",status:up.status,detail:raw.slice(0,200)});
  return res.status(200).json({ok:true,uploaded:"Jaya/"+FILE,queued:false,onAir:false});
 }catch(e){console.error("Jaya upload",e?.message||e);return res.status(502).json({ok:false,error:"Jaya upload unavailable"});}
}
