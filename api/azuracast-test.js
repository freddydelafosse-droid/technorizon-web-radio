export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ok:false,error:"GET only"});

  const hasBase=Boolean(process.env.AZURACAST_BASE_URL);
  const hasKey=Boolean(process.env.AZURACAST_API_KEY);
  if (!hasBase || !hasKey) {
    return res.status(500).json({
      ok:false,
      error:"AzuraCast configuration missing",
      environment:{AZURACAST_BASE_URL:hasBase,AZURACAST_API_KEY:hasKey}
    });
  }

  const base=process.env.AZURACAST_BASE_URL.replace(/\/$/,"");
  try {
    const r=await fetch(base + "/api/stations", {
      headers:{"X-API-Key":process.env.AZURACAST_API_KEY,"Accept":"application/json"}
    });
    const raw=await r.text();
    let data=null;
    try { data=JSON.parse(raw); } catch {}
    if (!r.ok) {
      console.error("AzuraCast connectivity",r.status,raw.slice(0,300));
      return res.status(r.status).json({ok:false,status:r.status,error:"AzuraCast request failed"});
    }
    const stations=Array.isArray(data)?data.map(s=>({id:s.id,name:s.name,shortcode:s.shortcode})):[];
    return res.status(200).json({ok:true,status:r.status,stations});
  } catch(e) {
    console.error("AzuraCast connectivity",e?.message || e);
    return res.status(502).json({ok:false,error:"AzuraCast unreachable"});
  }
}
