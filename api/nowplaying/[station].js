function rows(data){return Array.isArray(data)?data:(data?.rows||[])}
function ident(row){
  const s=row?.song||row?.media?.song||row?.media||{};
  return String(s.title||s.text||row?.path||row?.media?.path||"");
}
function clean(row,index){
  const s=row?.song||row?.media?.song||row?.media||{};
  return {
    index,
    title:String(s.title||s.text||""),
    artist:String(s.artist||""),
    path:String(row?.path||row?.media?.path||""),
    played_at:row?.played_at||row?.timestamp||row?.date||null,
    is_played:row?.is_played===true||row?.is_played===1||row?.is_played==="1"
  };
}
async function az(base,key,path){
  return fetch(base+"/api/station/1"+path,{headers:{"X-API-Key":key,Accept:"application/json"}});
}
export default async function handler(req,res){
  const station=req.query.station||"technorizon";
  try{
    if(station==="control-jaya"){
      const base=(process.env.AZURACAST_BASE_URL||"https://radio.technorizon.fr").replace(/\/$/,"");
      const key=process.env.AZURACAST_API_KEY;
      if(!key)throw new Error("AzuraCast API key unavailable");
      const now=new Date(),start=new Date(now.getTime()-3*60*60*1000);
      const [q,h,np]=await Promise.all([
        az(base,key,"/queue"),
        az(base,key,"/history?start="+encodeURIComponent(start.toISOString())+"&end="+encodeURIComponent(now.toISOString())+"&rowCount=250"),
        fetch(base+"/api/nowplaying/technorizon")
      ]);
      if(!q.ok)throw new Error("AzuraCast queue HTTP "+q.status);
      const qr=rows(await q.json()),hr=h.ok?rows(await h.json()):[];
      const jayaQueue=qr.map(clean).filter(x=>(x.title+" "+x.path).toLowerCase().includes("jaya")).slice(0,20);
      const jayaHistory=hr.map(clean).filter(x=>(x.title+" "+x.path).toLowerCase().includes("jaya")).slice(0,20);
      const nowData=np.ok?await np.json():null;
      res.setHeader("Cache-Control","no-store");
      return res.status(200).json({
        ok:true,generated_at:now.toISOString(),
        queue_count:qr.length,jaya_queue:jayaQueue,
        recent_jaya_history:jayaHistory,
        now_playing:nowData?.now_playing||null
      });
    }
    const response=await fetch("https://radio.technorizon.fr/api/nowplaying/"+encodeURIComponent(station));
    if(!response.ok)throw new Error("AzuraCast HTTP "+response.status);
    const data=await response.json();
    res.setHeader("Cache-Control","public, s-maxage=10, stale-while-revalidate=30");
    return res.status(200).json(data);
  }catch(error){
    res.setHeader("Cache-Control","no-store");
    return res.status(500).json({error:"Impossible de joindre AzuraCast",details:error.message});
  }
}
