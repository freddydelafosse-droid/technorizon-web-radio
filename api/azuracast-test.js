export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST") return res.status(405).json({ok:false,error:"POST only"});
 if(req.body?.action!=="inspect") return res.status(403).json({ok:false,error:"Test mutations disabled"});
 const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,"");
 const key=process.env.AZURACAST_API_KEY;
 if(!base||!key) return res.status(500).json({ok:false,error:"Configuration missing"});
 try{
  const q=await fetch(base+"/api/station/1/queue",{headers:{"X-API-Key":key,"Accept":"application/json"}});
  const raw=await q.text(); let data=null; try{data=JSON.parse(raw)}catch{}
  if(!q.ok) return res.status(q.status).json({ok:false,error:"Queue inspect failed",status:q.status});
  const rows=Array.isArray(data)?data:(data?.rows||[]);
  const jaya=rows.filter(x=>JSON.stringify(x).toLowerCase().includes("jaya")).slice(0,10);
  return res.status(200).json({ok:true,count:rows.length,jaya});
 }catch(e){
  console.error("AzuraCast inspect",e?.message||e);
  return res.status(502).json({ok:false,error:"AzuraCast inspect unavailable"});
 }
}
