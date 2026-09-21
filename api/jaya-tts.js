const JAYA_VOICE_ID = "bkBb0X46TbX2PU8PC5vY";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"POST only" });
  if (!process.env.ELEVENLABS_API_KEY) return res.status(500).json({ ok:false, error:"ELEVENLABS_API_KEY is not configured" });

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) return res.status(400).json({ ok:false, error:"Missing text" });
  const allowed = new Set(["Bonjour, ici Jaya sur Technorizon.","Bonjour à toutes et à tous ! Ici Jaya sur Technorizon.fr. Je suis très heureuse de vous rejoindre pour cette toute première intervention à l’antenne. Et ce n’est que le début… Très bonne écoute à tous sur Technorizon !"]);\n  if (!allowed.has(text)) return res.status(403).json({ ok:false, error:"Approved test phrases only" });

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + JAYA_VOICE_ID, {
      method:"POST",
      headers:{"xi-api-key":process.env.ELEVENLABS_API_KEY,"Content-Type":"application/json","Accept":"audio/mpeg"},
      body:JSON.stringify({text,model_id:"eleven_multilingual_v2"})
    });
    if (!response.ok) {
      console.error("ElevenLabs", response.status, (await response.text()).slice(0,500));
      return res.status(response.status).json({ok:false,error:"ElevenLabs request failed"});
    }
    const audio=Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type","audio/mpeg");
    res.setHeader("Content-Disposition",'inline; filename="jaya-technorizon.mp3"');
    return res.status(200).send(audio);
  } catch(e) {
    console.error("Jaya TTS",e);
    return res.status(500).json({ok:false,error:"Jaya TTS unavailable"});
  }
}
