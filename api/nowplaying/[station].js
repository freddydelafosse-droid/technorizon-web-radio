export default async function handler(req, res) {
  const station = req.query.station || "technorizon";

  try {
    const response = await fetch(
      `https://radio.technorizon.fr/api/nowplaying/${station}`
    );

    if (!response.ok) {
      throw new Error(`AzuraCast HTTP ${response.status}`);
    }

    const data = await response.json();

    // Le titre n'a pas besoin d'un appel serveur distinct pour chaque auditeur.
    // Le CDN peut partager la réponse pendant 10 s, puis servir une copie périmée
    // pendant la revalidation. Cela réduit fortement le Fluid Active CPU sans
    // rendre l'affichage "Now Playing" sensiblement moins réactif.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=10, stale-while-revalidate=30"
    );
    res.status(200).json(data);
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({
      error: "Impossible de joindre AzuraCast",
      details: error.message
    });
  }
}
