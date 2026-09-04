export default async function handler(req, res) {
  const station = req.query.station || "technorizon";

  try {
    const response = await fetch(
      `http://82.66.219.41/api/nowplaying/${station}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`AzuraCast HTTP ${response.status}`);
    }

    const data = await response.json();

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: "Impossible de joindre AzuraCast",
      details: error.message
    });
  }
}
