import french from "../lib/jaya-french.cjs";
const BATCH_SIZE = 10;
const SEED_BATCH_SIZE = 100;

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

const MUSICAL_GENRES = new Set([
  'techno', 'electronic', 'electronica', 'dance', 'dance-pop', 'eurodance',
  'euro house', 'house', 'deep house', 'acid house', 'progressive house',
  'electro house', 'vocal house', 'funky house', 'disco house', 'tech house',
  'hip house', 'italo house', 'french house', 'chicago house', 'garage house',
  'trance', 'euro-trance', 'progressive trance', 'vocal trance', 'hard trance',
  'acid trance', 'psytrance', 'goa trance', 'hardstyle', 'hardcore', 'gabber',
  'hard techno', 'minimal techno', 'detroit techno', 'acid techno',
  'edm', 'electropop', 'synth-pop', 'synthpop', 'europop', 'pop',
  'italo dance', 'italo disco', 'disco', 'nu disco', 'nu-disco', 'dancehall',
  'drum and bass', 'drum & bass', 'jungle', 'breakbeat', 'big beat',
  'dubstep', 'uk garage', 'ambient', 'downtempo', 'trip hop', 'trip-hop',
  'hip hop', 'hip-hop', 'rap', 'soul', 'funk', 'r&b', 'rhythm and blues',
  'rock', 'pop rock', 'alternative rock', 'indie rock', 'new wave',
  'electro', 'electroclash', 'happy hardcore', 'hands up', 'speed garage'
]);

const normalizeIdentity = (value) => String(value || '').normalize('NFKC').replace(/[’‘]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();

export function reviewDecision(row, artist) {
  const source = row.source_details || {};
  const name = normalizeIdentity(row.artist_name);
  if (!artist || artist.status !== 'active' || artist.visibility !== 'public' ||
      normalizeIdentity(artist.name) !== name) return {reason: 'Profil absent, privé ou identité modifiée'};
  if (source.provider !== 'MusicBrainz' || Number(row.confidence) !== 100 ||
      source.collaboration_detected !== false ||
      !['Person', 'Group', 'Orchestra', 'Choir'].includes(source.type) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.musicbrainz_id || '') ||
      normalizeIdentity(row.matched_name) !== name) return {reason: 'Correspondance insuffisante pour intégration automatique'};
  const candidates = Array.isArray(source.candidates) ? source.candidates : [];
  const exact = candidates.filter(candidate => normalizeIdentity(candidate.name) === name);
  if (exact.length !== 1 || exact[0].id !== row.musicbrainz_id || Number(exact[0].score) !== 100 ||
      /actor|actress|audiobook|comedian|politician|writer|author/i.test(source.disambiguation || '')) {
    return {reason: 'Homonyme ou correspondance ambiguë'};
  }
  const patch = {};
  if (!artist.country && /^[A-Z]{2}$/.test(row.proposed_country || '')) patch.country = row.proposed_country;
  const genres = [...new Set((Array.isArray(row.proposed_genres) ? row.proposed_genres : [])
    .map(value => String(value).trim().toLowerCase()).filter(value => MUSICAL_GENRES.has(value)))];
  if ((!Array.isArray(artist.genres) || !artist.genres.length) && genres.length) patch.genres = genres;
  // For a person, MusicBrainz life-span describes birth/death, not career years.
  if (!artist.active_years && source.type !== 'Person' &&
      /^\d{4}(?: - (?:\d{4}|aujourd’hui))?$/.test(row.proposed_active_years || '')) {
    patch.active_years = row.proposed_active_years;
  }
  return {patch};
}

async function integrateReviewQueue(supabaseUrl, dbHeaders) {
  const response = await supabaseFetchWithRetry(
    `${supabaseUrl}/rest/v1/artist_enrichment_queue?select=artist_id,artist_name,musicbrainz_id,matched_name,confidence,proposed_country,proposed_genres,proposed_active_years,source_details&status=in.(review,approved)&source_details->>integration_status=is.null&order=updated_at.desc,artist_id.asc&limit=${BATCH_SIZE}`,
    {headers: dbHeaders}
  );
  if (!response.ok) throw new Error(`Lecture propositions impossible : ${await response.text()}`);
  const rows = await response.json();
  const results = [];
  for (const row of rows) {
    const id = encodeURIComponent(String(row.artist_id));
    const artistUrl = `${supabaseUrl}/rest/v1/artists?id=eq.${id}&status=eq.active&visibility=eq.public`;
    const currentResponse = await supabaseFetchWithRetry(`${artistUrl}&select=id,name,country,genres,active_years,status,visibility`, {headers: dbHeaders});
    if (!currentResponse.ok) throw new Error(`Lecture profil impossible : ${await currentResponse.text()}`);
    const current = await currentResponse.json();
    const decision = reviewDecision(row, current.length === 1 ? current[0] : null);
    let status = decision.reason ? 'manual_review' : 'unchanged';
    const fields = Object.keys(decision.patch || {});
    if (fields.length) {
      // Conditional writes preserve existing facts and protect concurrent human edits.
      const conditions = fields.map(field => {
        const value = current[0][field];
        if (value == null) return `${field}=is.null`;
        if (field === 'genres' && Array.isArray(value) && !value.length) return 'genres=eq.{}';
        return `${field}=eq.${encodeURIComponent(String(value))}`;
      });
      const updateResponse = await supabaseFetchWithRetry(`${artistUrl}&${conditions.join('&')}`, {
        method: 'PATCH', headers: dbHeaders, body: JSON.stringify(decision.patch)
      });
      if (!updateResponse.ok) throw new Error(`Intégration profil impossible : ${await updateResponse.text()}`);
      const updated = await updateResponse.json();
      if (updated.length !== 1) {
        results.push({artist: row.artist_name, status: 'retry', reason: 'Profil modifié pendant le traitement'});
        continue;
      }
      for (const field of fields) {
        if (JSON.stringify(updated[0][field]) !== JSON.stringify(decision.patch[field])) throw new Error(`Écriture non confirmée : ${field}`);
      }
      status = 'applied';
    }
    // Provenance and decisions stay in the private queue; no new table/status is required.
    const metadata = {...(row.source_details || {}), integration_status: status,
      integration_checked_at: new Date().toISOString(), integrated_fields: fields,
      integration_reason: decision.reason || null};
    const markResponse = await supabaseFetchWithRetry(
      `${supabaseUrl}/rest/v1/artist_enrichment_queue?artist_id=eq.${id}&status=in.(review,approved)&source_details->>integration_status=is.null`,
      {method: 'PATCH', headers: dbHeaders, body: JSON.stringify({source_details: metadata, updated_at: new Date().toISOString()})}
    );
    if (!markResponse.ok) throw new Error(`Traçabilité intégration impossible : ${await markResponse.text()}`);
    const marked = await markResponse.json();
    if (marked.length !== 1) throw new Error('Traçabilité intégration non confirmée');
    results.push({artist: row.artist_name, status, fields, reason: decision.reason || null,
      confidence: row.confidence, source_type: row.source_details?.type || null,
      provider: row.source_details?.provider || null, collaboration_detected: row.source_details?.collaboration_detected ?? null});
  }
  return results;
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

  // Protected server task: never use the public anon key for the private queue.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Configuration Supabase serveur manquante"
    });
  }

  const dbHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };

  let frenchResult;
  try { frenchResult=await french.enrich(supabaseUrl,dbHeaders); }
  catch(error){
    console.error("French enrichment:",error.message);
    frenchResult={state:"error",error:error.message,added:0};
  }

  // Si la file pending est vide, l'alimenter automatiquement depuis la table artists.
  // Les propositions fiables complètent les champs vides des profils publics.
  async function seedQueueFromArtists() {
    let scanned = 0;
    let alreadyPresent = 0;

    // Walk beyond the first page instead of repeatedly checking the same 100 artists.
    for (let offset = 0; ; offset += SEED_BATCH_SIZE) {
      const artistsResponse = await supabaseFetchWithRetry(
        `${supabaseUrl}/rest/v1/artists?select=id,name&status=eq.active&order=name.asc,id.asc&limit=${SEED_BATCH_SIZE}&offset=${offset}`,
        { headers: dbHeaders }
      );
      if (!artistsResponse.ok) {
        const details = await artistsResponse.text();
        throw new Error(`Lecture artists impossible : ${details}`);
      }

      const page = await artistsResponse.json();
      const artists = page
        .map((row) => ({ id: row?.id, name: String(row?.name || "").trim() }))
        .filter((row) => row.id != null && row.name);
      scanned += page.length;

      if (artists.length) {
        const inFilter = artists.map((artist) => JSON.stringify(String(artist.id))).join(",");
        const existingResponse = await supabaseFetchWithRetry(
          `${supabaseUrl}/rest/v1/artist_enrichment_queue?select=artist_id&artist_id=in.(${encodeURIComponent(inFilter)})`,
          { headers: dbHeaders }
        );
        if (!existingResponse.ok) {
          const details = await existingResponse.text();
          throw new Error(`Lecture queue impossible : ${details}`);
        }

        const existing = new Set((await existingResponse.json()).map((row) => String(row.artist_id)));
        const missing = artists.filter((artist) => !existing.has(String(artist.id)));
        alreadyPresent += artists.length - missing.length;

        if (missing.length) {
          const seedResponse = await supabaseFetchWithRetry(
            `${supabaseUrl}/rest/v1/artist_enrichment_queue?on_conflict=artist_id`,
            {
              method: "POST",
              headers: { ...dbHeaders, Prefer: "resolution=ignore-duplicates,return=representation" },
              body: JSON.stringify(missing.map((artist) => ({
                artist_id: artist.id,
                artist_name: artist.name,
                status: "pending",
                updated_at: new Date().toISOString()
              })))
            }
          );
          if (!seedResponse.ok) {
            const details = await seedResponse.text();
            throw new Error(`Alimentation queue impossible : ${details}`);
          }

          const inserted = await seedResponse.json();
          return {
            scanned,
            inserted: Array.isArray(inserted) ? inserted.length : 0,
            already_present: alreadyPresent,
            catalogue_exhausted: false
          };
        }
      }

      if (page.length < SEED_BATCH_SIZE) {
        return { scanned, inserted: 0, already_present: alreadyPresent, catalogue_exhausted: true };
      }
    }
  }

 let integrated;
 try {
   integrated = await integrateReviewQueue(supabaseUrl, dbHeaders);
 } catch (error) {
   console.error("Artist enrichment integration:", error);
   return res.status(500).json({error: "Erreur intégration des connaissances", details: error.message});
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
        const candidates = (data.artists || []).slice(0, 5);

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

    integrated.push(...await integrateReviewQueue(supabaseUrl, dbHeaders));
    return res.status(200).json({
      mode: "COLLECT_AND_INTEGRATE_VERIFIED_FACTS",
      french_enrichment: frenchResult,
      artists_table_modified: integrated.some(item => item.status === "applied"),
      integrated_count: integrated.filter(item => item.status === "applied").length,
      integrated_information_count: integrated.filter(item => item.status === "applied").reduce((count, item) => count + item.fields.length, 0),
      integration_results: integrated,
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
