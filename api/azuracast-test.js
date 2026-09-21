export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ok:false,error:"GET only"});

  const base=(process.env.AZURACAST_BASE_URL || "").replace(/\/$/,"");
  const key=process.env.AZURACAST_API_KEY;
  if (!base || !key) return res.status(500).json({ok:false,error:"AzuraCast configuration missing"});

  try {
    const r=await fetch(base + "/api/station/1/files/list", {
      headers:{"X-API-Key":key,"Accept":"application/json"}
    });
    const raw=await r.text();
    let data=null;
    try { data=JSON.parse(raw); } catch {}
    if (!r.ok) return res.status(r.status).json({ok:false,status:r.status,error:"AzuraCast media read failed"});
    const items=Array.isArray(data)?data:[];
    const jaya=items.filter(x=>String(x?.path||x?.text||"").toLowerCase().includes("jaya")).map(x=>({path:x.path,text:x.text,type:x.type}));
    return res.status(200).json({ok:true,status:r.status,total:items.length,jaya});
  } catch(e) {
    console.error("AzuraCast media read",e?.message || e);
    return res.status(502).json({ok:false,error:"AzuraCast unreachable"});
  }
}
