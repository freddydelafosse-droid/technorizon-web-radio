const BATCH_SIZE = 10;
const SEED_BATCH_SIZE = 250;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function buildActiveYears(lifeSpan) {
  if (!lifeSpan || !lifeSpan.begin) return null;

  const begin = String(lifeSpan.begin).slice(0, 4);
  const end = lifeSpan.end
    ? String(lifeSpan.end).slice(0, 4)
    : "aujourd’hui";

  return `${begin} - ${end}`;
}

async function musicBrainzSearch(artistName, maxRetries = 3) {
  const query = encodeURIComponent(`artist:"${artistName}"`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json&limit=5`,
      {
        headers: {
          "User-Agent":
            "Technorizon/1.0 (https://technorizon.fr)",
          Accept: "application/json"
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }

    if ([429, 500, 502, 503, 504].includes(response.status)) {
      if (attempt < maxRetries) {
        await sleep(2500 * attempt);
        continue;
      }
    }

    throw new Error(`MusicBrainz HTTP ${response.status}`);
  }
}

async function supabaseFetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    if ([429, 500, 502, 503, 504].includes(response.status)) {
      if (attempt < maxRetries) {
        await sleep(2000 * attempt);
        continue;
      }
    }

    return response;
  }
}

function getSearchArtistName(originalArtistName) {
  if (!originalArtistName) return "";

  const parts = String(originalArtistName)
    .split(";")
    .map((name) => name.trim())
    .filter(Boolean);

  return parts[0] || String(originalArtistName).trim();
}

export default async function handler(req, res) {
  const enrichmentSecret = process.env.ARTIST_ENRICHMENT_SECRET;
  const providedSecret = req.headers["x-enrichment-secret"];

 if (!enrichmentSecret || providedSecret !== enrichmentSecret) {
  return res.status(401).json({
    error: "Accès non autorisé"
  });
}

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Configuration Supabase manquante"
    });
  }

  const dbHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };

  // Si la file pending est vide, l'alimenter automatiquement depuis la table artists.
  // On ne modifie jamais artists ici : on crée uniquement des éléments de travail à valider.
  async function seedQueueFromArtists() {
    const artistsResponse = await supabaseFetchWithRetry(
      `${supabaseUrl}/rest/v1/artists?select=id,name&status=eq.active&order=name.asc&limit=${SEED_BATCH_SIZE}`,
      { headers: dbHeaders }
    );
    if (!artistsResponse.ok) {
      const details = await artistsResponse.text();
      throw new Error(`Lecture artists impossible : ${details}`);
    }
    const artists = (await artistsResponse.json())
      .map((row) => ({ id: row?.id, name: String(row?.name || "").trim() }))
      .filter((row) => row.id != null && row.name);
    if (!artists.length) return { scanned: 0, inserted: 0, already_present: 0 };

    // Méthode la plus robuste : vérifier chaque artist_id directement auprès de
    // PostgREST avant insertion. Aucun UPSERT ambigu, aucune lecture paginée globale.
    let insertedCount = 0;
    let alreadyPresent = 0;
    for (const artist of artists) {
      const existsResponse = await supabaseFetchWithRetry(
        `${supabaseUrl}/rest/v1/artist_enrichment_queue?select=artist_id&artist_id=eq.${encodeURIComponent(artist.id)}&limit=1`,
        { headers: dbHeaders }
      );
      if (!existsResponse.ok) {
        const details = await existsResponse.text();
        throw new Error(`Vérification artist_id impossible : ${details}`);
      }
      const exists = await existsResponse.json();
      if (Array.isArray(exists) && exists.length) {
        alreadyPresent++;
        continue;
      }

      const seedResponse = await supabaseFetchWithRetry(
        `${supabaseUrl}/rest/v1/artist_enrichment_queue`,
        {
          method: "POST",
          headers: dbHeaders,
          body: JSON.stringify({
            artist_id: artist.id,
            artist_name: artist.name,
            status: "pending",
            updated_at: new Date().toISOString()
          })
        }
      );
      if (!seedResponse.ok) {
        const details = await seedResponse.text();
        // Une course concurrente peut avoir inséré l'artiste entre SELECT et POST.
        if (seedResponse.status === 409 && details.includes("23505")) {
          alreadyPresent++;
          continue;
        }
        throw new Error(`Alimentation queue impossible : ${details}`);
      }
      insertedCount++;
    }
    return { scanned: artists.length, inserted: insertedCount, already_present: alreadyPresent };
  }

 const pendingResponse = await supabaseFetchWithRetry(
  `${supabaseUrl}/rest/v1/artist_enrichment_queue` +
  `?select=artist_name` +
  `&status=eq.pending` +
  `&order=artist_name.asc` +
  `&limit=${BATCH_SIZE}`,
  { headers: dbHeaders }
);

if (!pendingResponse.ok) {
  const errorText = await pendingResponse.text();
  
  console.error("Supabase pending queue:", pendingResponse.status, errorText);

  return res.status(500).json({
    error: "Impossible de récupérer les artistes en attente",
    details: errorText
  });
}

let pendingArtists = await pendingResponse.json();
let seeded = { scanned: 0, inserted: 0 };

if (!pendingArtists.length) {
  try {
    seeded = await seedQueueFromArtists();
    if (seeded.inserted > 0) {
      const retryPendingResponse = await supabaseFetchWithRetry(
        `${supabaseUrl}/rest/v1/artist_enrichment_queue?select=artist_name&status=eq.pending&order=artist_name.asc&limit=${BATCH_SIZE}`,
        { headers: dbHeaders }
      );
      if (!retryPendingResponse.ok) {
        const details = await retryPendingResponse.text();
        throw new Error(`Relecture pending impossible : ${details}`);
      }
      pendingArtists = await retryPendingResponse.json();
    }
  } catch (error) {
    console.error("Artist enrichment seed:", error);
    return res.status(500).json({ error: "Impossible d'alimenter la file d'enrichissement", details: error.message });
  }
}

const TEST_ARTISTS = pendingArtists.map(
  (row) => row.artist_name
);

  try {
    const results = [];

    for (const artistName of TEST_ARTISTS) {
      try {
        const searchArtistName = getSearchArtistName(artistName);
const data = await musicBrainzSearch(searchArtistName);
        const candidates = (data.artists || []).slice(0, 3);

       if (!candidates.length) {
  const notFoundUrl =
    `${supabaseUrl}/rest/v1/artist_enrichment_queue` +
    `?artist_name=ilike.${encodeURIComponent(artistName)}` +
    `&status=eq.pending`;

  const notFoundResponse = await supabaseFetchWithRetry(notFoundUrl, {
    method: "PATCH",
    headers: dbHeaders,
    body: JSON.stringify({
      status: "not_found",
      error_message: "Aucun artiste correspondant trouvé dans MusicBrainz.",
      updated_at: new Date().toISOString()
    })
  });

  if (!notFoundResponse.ok) {
    const errorText = await notFoundResponse.text();

    throw new Error(
      `Impossible de marquer ${artistName} en not_found : ${errorText}`
    );
  }

  const updatedRows = await notFoundResponse.json();

  results.push({
    artist: artistName,
    status: "NOT_FOUND",
    updated_rows: updatedRows.length
  });

  await sleep(1300);
  continue;
}

        // Pour ce premier test, on conserve le meilleur candidat
        // mais uniquement dans la file de validation.
       const normalizeArtistName = (name) =>
  String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizedSearchName = normalizeArtistName(searchArtistName);

const nonMusicKeywords = [
  "actor",
  "actress",
  "voice actor",
  "audiobook",
  "comedian",
  "politician",
  "writer",
  "author"
];

const safeCandidates = candidates.filter((candidate) => {
  const normalizedCandidateName = normalizeArtistName(candidate.name);

  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.map((tag) => String(tag.name || "").toLowerCase())
    : [];

  const disambiguation = String(
    candidate.disambiguation || ""
  ).toLowerCase();

  const textToCheck = [...tags, disambiguation].join(" ");

  const obviouslyNonMusical = nonMusicKeywords.some((keyword) =>
    textToCheck.includes(keyword)
  );

  return (
    normalizedCandidateName === normalizedSearchName &&
    !obviouslyNonMusical
  );
});

const best = safeCandidates[0] || candidates[0];

        const genres = Array.isArray(best.tags)
          ? [...best.tags]
              .sort(
                (a, b) =>
                  (b.count || 0) - (a.count || 0)
              )
              .slice(0, 8)
              .map((tag) => tag.name)
          : [];

        const bestIsValidated =
  safeCandidates.length > 0 &&
  safeCandidates[0].id === best.id;

const confidence =
  typeof best.score === "number"
    ? bestIsValidated
      ? best.score
      : Math.min(best.score, 50)
    : null;

        const sourceDetails = {
          provider: "MusicBrainz",
          mode: "FIRST_BATCH_REVIEW",
            original_artist: artistName,
  searched_artist: searchArtistName,
  collaboration_detected: searchArtistName !== artistName,
          musicbrainz_score: best.score ?? null,
          type: best.type || null,
          area: best.area?.name || null,
          begin_area: best["begin-area"]?.name || null,
          disambiguation: best.disambiguation || null,
          candidates: candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            score: candidate.score ?? null,
            country: candidate.country || null,
            area: candidate.area?.name || null,
            disambiguation:
              candidate.disambiguation || null
          }))
        };

        const patchBody = {
          status: "review",
          musicbrainz_id: best.id,
          matched_name: best.name,
          confidence,
          proposed_country: best.country || null,
          proposed_genres: genres,
          proposed_active_years:
            buildActiveYears(best["life-span"]),
          source_details: sourceDetails,
          error_message: null,
          updated_at: new Date().toISOString()
        };

        const updateUrl =
  `${supabaseUrl}/rest/v1/artist_enrichment_queue` +
  `?artist_name=ilike.${encodeURIComponent(artistName)}` +
  `&status=eq.pending`;

        const updateResponse = await supabaseFetchWithRetry(updateUrl, {
          method: "PATCH",
          headers: dbHeaders,
          body: JSON.stringify(patchBody)
        });

        if (!updateResponse.ok) {
          const errorText =
            await updateResponse.text();

          throw new Error(
            `Supabase HTTP ${updateResponse.status} : ${errorText}`
          );
        }

        const updatedRows =
          await updateResponse.json();

        results.push({
          artist: artistName,
          status: "WRITTEN_TO_REVIEW_QUEUE",
          matched_name: best.name,
          confidence,
          musicbrainz_id: best.id,
          country: best.country || null,
          genres,
          updated_rows: updatedRows.length
        });

      } catch (error) {
        results.push({
          artist: artistName,
          status: "ERROR",
          error: error.message
        });
      }

      // Cadence prudente pour MusicBrainz
      await sleep(1300);
    }

    return res.status(200).json({
      mode: "FIRST_BATCH_WRITE_TO_QUEUE",
      artists_table_modified: false,
      queue_modified: true,
      seeded,
      tested: results.length,
      results
    });

  } catch (error) {
    console.error("Artist enrichment:", error);

    return res.status(500).json({
      error: "Erreur enrichissement artistes",
      details: error.message
    });
  }
}
