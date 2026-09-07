const REDIS_URL = process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN;
const REDIS_KEY = "technorizon:dedicaces";

async function redis(command) {
  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error("Erreur Redis");
  }

  const data = await response.json();
  return data.result;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({
      error: "Stockage des dédicaces non configuré"
    });
  }

  if (req.method === "GET") {
    try {
      const items = await redis([
        "LRANGE",
        REDIS_KEY,
        "0",
        "19"
      ]);

      const dedicaces = (items || []).map(item => {
        try {
          const data = JSON.parse(item);

          let texte = `💌 ${data.prenom}`;

          if (data.ville) {
            texte += ` (${data.ville})`;
          }

          texte += ` : ${data.message}`;

          return texte;
        } catch {
          return item;
        }
      });

      return res.status(200).json({ dedicaces });
    } catch (error) {
      console.error("Lecture dédicaces :", error);

      return res.status(500).json({
        error: "Impossible de récupérer les dédicaces"
      });
    }
  }

  if (req.method === "POST") {
    try {
      const prenom = String(req.body?.prenom || "").trim();
      const ville = String(req.body?.ville || "").trim();
      const message = String(req.body?.message || "").trim();

      if (!prenom || !message) {
        return res.status(400).json({
          error: "Prénom et dédicace obligatoires"
        });
      }

      if (
        prenom.length > 30 ||
        ville.length > 40 ||
        message.length > 250
      ) {
        return res.status(400).json({
          error: "Dédicace trop longue"
        });
      }

      const dedicace = JSON.stringify({
        prenom,
        ville,
        message,
        date: new Date().toISOString()
      });

      await redis([
        "LPUSH",
        REDIS_KEY,
        dedicace
      ]);

      await redis([
        "LTRIM",
        REDIS_KEY,
        "0",
        "49"
      ]);

      return res.status(201).json({
        success: true
      });
    } catch (error) {
      console.error("Enregistrement dédicace :", error);

      return res.status(500).json({
        error: "Impossible d'enregistrer la dédicace"
      });
    }
  }

  return res.status(405).json({
    error: "Méthode non autorisée"
  });
}
