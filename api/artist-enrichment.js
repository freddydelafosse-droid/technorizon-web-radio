const TEST_ARTISTS = [
  "Basshunter",
  "David Guetta",
  "2 Unlimited",
  "Alok",
  "Amelie Lens"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function musicBrainzSearch(artistName, maxRetries = 3) {
  const query = encodeURIComponent(`artist:"${artistName}"`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json&limit=5`,
      {
        headers: {
          "User-Agent": "Technorizon/1.0 (https://technorizon.fr)",
          "Accept": "application/json"
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }

    // MusicBrainz temporairement indisponible ou limitation.
    if ([429, 500, 502, 503, 504].includes(response.status)) {
      if (attempt < maxRetries) {
        await sleep(2500 * attempt);
        continue;
      }
    }

    throw new Error(`MusicBrainz HTTP ${response.status}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const results = [];

    for (const artistName of TEST_ARTISTS) {
      try {
        const data = await musicBrainzSearch(artistName);

        const candidates = (data.artists || [])
          .slice(0, 3)
          .map(artist => ({
            id: artist.id,
            name: artist.name,
            sort_name: artist["sort-name"] || null,
            type: artist.type || null,
            country: artist.country || null,
            area: artist.area?.name || null,
            begin_area: artist["begin-area"]?.name || null,
            life_span: artist["life-span"] || null,
            score: artist.score ?? null,
            disambiguation: artist.disambiguation || null,
            tags: Array.isArray(artist.tags)
              ? [...artist.tags]
                  .sort((a, b) => (b.count || 0) - (a.count || 0))
                  .slice(0, 8)
                  .map(tag => tag.name)
              : []
          }));

        results.push({
          artist: artistName,
          status: candidates.length ? "FOUND" : "NOT_FOUND",
          candidates
        });

      } catch (error) {
        results.push({
          artist: artistName,
          status: "RETRY_FAILED",
          error: error.message
        });
      }

      // Cadence prudente entre deux artistes.
      await sleep(1300);
    }

    return res.status(200).json({
      mode: "TEST_RETRY_READ_ONLY",
      database_modified: false,
      tested: results.length,
      results
    });

  } catch (error) {
    console.error("Artist enrichment test:", error);

    return res.status(500).json({
      error: "Erreur pendant le test",
      details: error.message
    });
  }
}
