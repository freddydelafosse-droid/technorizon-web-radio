export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,"");
  const key=process.env.AZURACAST_API_KEY;
  const sid=process.env.AZURACAST_STATION_ID||process.env.AZURACAST_STATION||"1";
  if(!base||!key)return res.status(500).json({ok:false,error:"Configuration missing"});
  try{
    const r=await fetch(base+"/api/station/"+encodeURIComponent(sid)+"/listeners",{
      headers:{"X-API-Key":key,"Accept":"application/json"}
    });
    const raw=await r.text();
    let data=null;try{data=JSON.parse(raw)}catch{}
    if(!r.ok)return res.status(502).json({ok:false,error:"AzuraCast listeners unavailable",status:r.status});
    const rows=Array.isArray(data)?data:(Array.isArray(data?.rows)?data.rows:[]);
    const listeners=rows.map(x=>({
      user_agent:x.user_agent||x.userAgent||null,
      location:x.location||x.location_description||null,
      connected_seconds:x.connected_seconds??x.connected_time??null,
      mount_name:x.mount_name||x.mount||null,
      device:x.device||null,
      is_local:x.is_local??null
    }));
    return res.status(200).json({ok:true,count:listeners.length,listeners});
  }catch(e){
    return res.status(502).json({ok:false,error:"AzuraCast listeners unavailable",detail:String(e?.message||e).slice(0,200)});
  }
}
