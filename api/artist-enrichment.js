const TEST_ARTISTS = [
  "Basshunter",
  "David Guetta",
  "2 Unlimited",
  "Alok",
  "Amelie Lens"
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  try {
    const results = [];

    for (const artistName of TEST_ARTISTS) {
      const query = encodeURIComponent(`artist:"${artistName}"`);

      const response = await fetch(
        `https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json&limit=5`,
        {
          headers: {
            "User-Agent": "Technorizon/1.0 (https://technorizon.fr)",
            "Accept": "application/json"
          }
        }
      );

      if (!response.ok) {
        results.push({
          artist: artistName,
          error: `MusicBrainz HTTP ${response.status}`
        });

        await sleep(1100);
        continue;
      }

      const data = await response.json();

      const candidates = (data.artists || [])
        .slice(0, 3)
        .map((artist) => ({
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
            ? artist.tags
                .sort((a, b) => (b.count || 0) - (a.count || 0))
                .slice(0, 8)
                .map((tag) => tag.name)
            : []
        }));

      results.push({
        artist: artistName,
        candidates
      });

      // Respect du rythme de requêtes MusicBrainz
      await sleep(1100);
    }

    return res.status(200).json({
      mode: "TEST_READ_ONLY",
      database_modified: false,
      tested: results.length,
      results
    });

  } catch (error) {
    console.error("Artist enrichment test error:", error);

    return res.status(500).json({
      error: "Erreur pendant le test MusicBrainz",
      details: error.message
    });
  }
}
