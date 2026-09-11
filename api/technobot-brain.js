export default async function handler(req, res) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  try {
    const { question } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "Question manquante"
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

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    };

    // Normalisation simple pour faciliter la recherche
    const cleanQuestion = question
      .trim()
      .toLowerCase()
      .replace(/[?!.,;:]/g, "");

    // 1. Chercher d'abord dans la FAQ
    const faqResponse = await fetch(
      `${supabaseUrl}/rest/v1/faq?select=question,answer,alternative_questions,category&status=eq.active&visibility=eq.public`,
      { headers }
    );

    if (!faqResponse.ok) {
      throw new Error("Impossible de consulter la FAQ");
    }

    const faq = await faqResponse.json();

    const faqMatch = faq.find((item) => {
      const mainQuestion = (item.question || "")
        .toLowerCase()
        .replace(/[?!.,;:]/g, "");

      if (
        cleanQuestion.includes(mainQuestion) ||
        mainQuestion.includes(cleanQuestion)
      ) {
        return true;
      }

      if (Array.isArray(item.alternative_questions)) {
        return item.alternative_questions.some((alternative) => {
          const normalized = String(alternative)
            .toLowerCase()
            .replace(/[?!.,;:]/g, "");

          return (
            cleanQuestion.includes(normalized) ||
            normalized.includes(cleanQuestion)
          );
        });
      }

      return false;
    });

    if (faqMatch?.answer) {
      return res.status(200).json({
        found: true,
        source: "faq",
        answer: faqMatch.answer
      });
    }

    const musicIntent =
  cleanQuestion.includes("qui chante") ||
  cleanQuestion.includes("titre") ||
  cleanQuestion.includes("morceau") ||
  cleanQuestion.includes("chanson") ||
  cleanQuestion.includes("album") ||
  cleanQuestion.includes("artiste") ||
  cleanQuestion.includes("interprète") ||
  cleanQuestion.includes("interprete") ||
  cleanQuestion.includes("quelle année") ||
  cleanQuestion.includes("en quelle année") ||
  cleanQuestion.includes("date de") ||
  cleanQuestion.includes("sorti") ||
  cleanQuestion.includes("sortie") ||
  cleanQuestion.includes("passe sur technorizon") ||
  cleanQuestion.includes("passe à la radio") ||
  cleanQuestion.includes("diffusé sur technorizon") ||
  cleanQuestion.includes("diffuse sur technorizon");

    // 2. Chercher ensuite dans la base de connaissances
    const knowledgeResponse = await fetch(
      `${supabaseUrl}/rest/v1/knowledge?select=category,title,content,priority,visibility,status&status=eq.active&visibility=eq.public&order=priority.asc`,
      { headers }
    );

    if (!knowledgeResponse.ok) {
      throw new Error("Impossible de consulter la base de connaissances");
    }

    const knowledge = await knowledgeResponse.json();

    const words = cleanQuestion
      .split(/\s+/)
      .filter((word) => word.length >= 4);

    let bestMatch = null;
    let bestScore = 0;

    for (const item of knowledge) {
      const searchable =
        `${item.category || ""} ${item.title || ""} ${item.content || ""}`
          .toLowerCase();

      const score = words.reduce(
        (total, word) => total + (searchable.includes(word) ? 1 : 0),
        0
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && bestScore >= 2 && !musicIntent) {
      return res.status(200).json({
        found: true,
        source: "knowledge",
        answer: bestMatch.content
      });
    }

    // 3. Chercher dans les entités Technorizon
const entitiesResponse = await fetch(
  `${supabaseUrl}/rest/v1/entities?select=entity_type,name,description,aliases,visibility,status&status=eq.active&visibility=eq.public`,
  { headers }
);

if (!entitiesResponse.ok) {
  throw new Error("Impossible de consulter les entités");
}

const entities = await entitiesResponse.json();

    console.log("TECHNORIZON ENTITIES DEBUG:", entities);

const entityMatch = entities.find((item) => {
  const name = String(item.name || "").toLowerCase();

  if (name && cleanQuestion.includes(name)) {
    return true;
  }

  if (Array.isArray(item.aliases)) {
    return item.aliases.some((alias) => {
      const normalizedAlias = String(alias || "").toLowerCase();
      return normalizedAlias && cleanQuestion.includes(normalizedAlias);
    });
  }

  return false;
});

if (entityMatch?.description && !musicIntent) {
  return res.status(200).json({
    found: true,
    source: "entities",
    answer: entityMatch.description
  });
}

    // 4. Chercher dans les artistes
const artistsResponse = await fetch(
  `${supabaseUrl}/rest/v1/artists?select=name,aliases,country,genres,active_years,biography,known_for,technorizon_notes,in_technorizon_rotation,visibility,status&status=eq.active&visibility=eq.public`,
  { headers }
);

if (!artistsResponse.ok) {
  throw new Error("Impossible de consulter les artistes");
}

const artists = await artistsResponse.json();

const artistMatch = artists.find((item) => {
  const artistName = String(item.name || "").toLowerCase();

  if (artistName && cleanQuestion.includes(artistName)) {
    return true;
  }

  if (Array.isArray(item.aliases)) {
    return item.aliases.some((alias) => {
      const normalizedAlias = String(alias || "").toLowerCase();
      return normalizedAlias && cleanQuestion.includes(normalizedAlias);
    });
  }

  return false;
});

if (artistMatch) {
  const parts = [];

  if (artistMatch.biography) {
    parts.push(artistMatch.biography);
  }

  if (artistMatch.country) {
    parts.push(`Origine : ${artistMatch.country}.`);
  }

  if (Array.isArray(artistMatch.genres) && artistMatch.genres.length) {
    parts.push(`Styles : ${artistMatch.genres.join(", ")}.`);
  }

  if (artistMatch.active_years) {
    parts.push(`Période d'activité : ${artistMatch.active_years}.`);
  }

  if (artistMatch.known_for) {
    parts.push(`Connu notamment pour : ${artistMatch.known_for}.`);
  }

  if (artistMatch.in_technorizon_rotation) {
    parts.push("Cet artiste fait partie de l'univers musical de Technorizon.");
  }

  if (artistMatch.technorizon_notes) {
    parts.push(artistMatch.technorizon_notes);
  }

  return res.status(200).json({
    found: true,
    source: "artists",
    answer: parts.join(" ")
  });
}


// 5. Chercher dans les titres
const tracksResponse = await fetch(
  `${supabaseUrl}/rest/v1/tracks?select=title,aliases,primary_artist,featured_artists,album,release_year,genres,description,facts,in_technorizon_library,in_rotation,rotation_group,technorizon_notes,visibility,status&status=eq.active&visibility=eq.public`,
  { headers }
);

if (!tracksResponse.ok) {
  throw new Error("Impossible de consulter les titres");
}

const tracks = await tracksResponse.json();

const trackMatch = tracks.find((item) => {
  const title = String(item.title || "").toLowerCase();
  const artist = String(item.primary_artist || "").toLowerCase();

  const directTitleMatch =
    title && cleanQuestion.includes(title);

  const artistAndTitleMatch =
    title &&
    artist &&
    cleanQuestion.includes(title) &&
    cleanQuestion.includes(artist);

  if (artistAndTitleMatch || directTitleMatch) {
    return true;
  }

  if (Array.isArray(item.aliases)) {
    return item.aliases.some((alias) => {
      const normalizedAlias = String(alias || "").toLowerCase();
      return normalizedAlias && cleanQuestion.includes(normalizedAlias);
    });
  }

  return false;
});

if (trackMatch) {
  const q = cleanQuestion;

  const asksYear =
    q.includes("quelle année") ||
    q.includes("quel année") ||
    q.includes("en quelle année") ||
    q.includes("date de") ||
    q.includes("date") ||
    q.includes("sorti quand") ||
    q.includes("sortie quand") ||
    q.includes("quand est sorti") ||
    q.includes("quand est sortie");

  const asksArtist =
    q.includes("qui chante") ||
    q.includes("qui est l'artiste") ||
    q.includes("quel artiste") ||
    q.includes("quelle artiste") ||
    q.includes("de qui est") ||
    q.includes("interprète") ||
    q.includes("interprete");

  const asksGenre =
    q.includes("quel style") ||
    q.includes("quelle style") ||
    q.includes("quel genre") ||
    q.includes("quelle genre") ||
    q.includes("style musical") ||
    q.includes("genre musical");

  const asksAlbum =
    q.includes("quel album") ||
    q.includes("quelle album") ||
    q.includes("sur quel album") ||
    q.includes("album");

  const asksTechnorizon =
    q.includes("technorizon") ||
    q.includes("passe sur la radio") ||
    q.includes("passe à la radio") ||
    q.includes("passe sur technorizon") ||
    q.includes("diffusé") ||
    q.includes("diffuse") ||
    q.includes("rotation") ||
    q.includes("bibliothèque");

  // Réponse ciblée : année de sortie
  if (asksYear && trackMatch.release_year) {
    return res.status(200).json({
      found: true,
      source: "tracks",
      answer: `${trackMatch.title} de ${trackMatch.primary_artist} est sorti en ${trackMatch.release_year}.`
    });
  }

  // Réponse ciblée : artiste / interprète
  if (asksArtist) {
    let answer = `${trackMatch.title} est interprété par ${trackMatch.primary_artist}.`;

    if (
      Array.isArray(trackMatch.featured_artists) &&
      trackMatch.featured_artists.length
    ) {
      answer += ` Avec ${trackMatch.featured_artists.join(", ")}.`;
    }

    return res.status(200).json({
      found: true,
      source: "tracks",
      answer
    });
  }

  // Réponse ciblée : style musical
  if (
    asksGenre &&
    Array.isArray(trackMatch.genres) &&
    trackMatch.genres.length
  ) {
    return res.status(200).json({
      found: true,
      source: "tracks",
      answer: `${trackMatch.title} de ${trackMatch.primary_artist} est classé dans les styles ${trackMatch.genres.join(", ")}.`
    });
  }

  // Réponse ciblée : album
  if (asksAlbum) {
    if (trackMatch.album) {
      return res.status(200).json({
        found: true,
        source: "tracks",
        answer: `${trackMatch.title} de ${trackMatch.primary_artist} figure sur l’album ${trackMatch.album}.`
      });
    }

    return res.status(200).json({
      found: true,
      source: "tracks",
      answer: `Je connais ${trackMatch.title} de ${trackMatch.primary_artist}, mais l’album n’est pas encore renseigné dans ma base.`
    });
  }

  // Réponse ciblée : présence sur Technorizon
  if (asksTechnorizon) {
    if (trackMatch.in_technorizon_library) {
      let answer = `${trackMatch.title} de ${trackMatch.primary_artist} est bien référencé dans la bibliothèque Technorizon.`;

      if (trackMatch.in_rotation) {
        answer += " Il fait actuellement partie de la rotation.";
      }

      if (trackMatch.rotation_group) {
        answer += ` Rotation : ${trackMatch.rotation_group}.`;
      }

      return res.status(200).json({
        found: true,
        source: "tracks",
        answer
      });
    }

    return res.status(200).json({
      found: true,
      source: "tracks",
      answer: `${trackMatch.title} de ${trackMatch.primary_artist} est connu de TechnoBot, mais il n’est pas actuellement référencé comme présent dans la bibliothèque Technorizon.`
    });
  }

  // Réponse générale détaillée
  const parts = [];

  parts.push(
    `${trackMatch.title} est un titre de ${trackMatch.primary_artist}.`
  );

  if (
    Array.isArray(trackMatch.featured_artists) &&
    trackMatch.featured_artists.length
  ) {
    parts.push(`Avec ${trackMatch.featured_artists.join(", ")}.`);
  }

  if (trackMatch.release_year) {
    parts.push(`Sorti en ${trackMatch.release_year}.`);
  }

  if (trackMatch.album) {
    parts.push(`Album : ${trackMatch.album}.`);
  }

  if (Array.isArray(trackMatch.genres) && trackMatch.genres.length) {
    parts.push(`Styles : ${trackMatch.genres.join(", ")}.`);
  }

  if (trackMatch.description) {
    parts.push(trackMatch.description);
  }

  if (trackMatch.in_technorizon_library) {
    parts.push("Ce titre est référencé dans la bibliothèque Technorizon.");
  }

  if (trackMatch.in_rotation) {
    parts.push("Il peut actuellement être diffusé dans la rotation Technorizon.");
  }

  if (trackMatch.rotation_group) {
    parts.push(`Rotation : ${trackMatch.rotation_group}.`);
  }

  if (trackMatch.technorizon_notes) {
    parts.push(trackMatch.technorizon_notes);
  }

  return res.status(200).json({
    found: true,
    source: "tracks",
    answer: parts.join(" ")
  });
}

    // 6. Recherche musicale externe MusicBrainz
// Utilisée uniquement si Supabase n'a rien trouvé.

const musicbrainzHeaders = {
  "Accept": "application/json",
  "User-Agent": "Technorizon-TechnoBot/1.0 (https://technorizon.fr)"
};

// Nettoyer la question pour isoler autant que possible
// le nom de l'artiste ou le titre recherché.
const externalMusicQuery = question
  .replace(/[?!.,;:]/g, " ")
  .replace(/\bqui chante\b/gi, " ")
  .replace(/\bqui interprète\b/gi, " ")
  .replace(/\bqui interprete\b/gi, " ")
  .replace(/\bde quelle année date\b/gi, " ")
  .replace(/\ben quelle année est sorti\b/gi, " ")
  .replace(/\ben quelle année est sortie\b/gi, " ")
  .replace(/\bquand est sorti\b/gi, " ")
  .replace(/\bquand est sortie\b/gi, " ")
  .replace(/\bquel style est\b/gi, " ")
  .replace(/\bquel genre est\b/gi, " ")
  .replace(/\bdonne-moi des infos sur\b/gi, " ")
  .replace(/\bdonne moi des infos sur\b/gi, " ")
  .replace(/\btu connais\b/gi, " ")
  .replace(/\bconnais-tu\b/gi, " ")
  .replace(/\best-ce que\b/gi, " ")
  .replace(/\bpasse sur technorizon\b/gi, " ")
  .replace(/\bqui est\b/gi, " ")
  .replace(/\bc'est qui\b/gi, " ")
  .replace(/\s+/g, " ")
  .trim();

const asksExternalArtist =
  cleanQuestion.startsWith("qui est ") ||
  cleanQuestion.startsWith("c'est qui ") ||
  cleanQuestion.includes("artiste ") ||
  cleanQuestion.includes("chanteur ") ||
  cleanQuestion.includes("chanteuse ") ||
  cleanQuestion.includes("groupe ");

// Un seul appel MusicBrainz maximum par question
if (externalMusicQuery.length >= 2) {
  try {

    // --------------------------------------------------------
    // RECHERCHE ARTISTE
    // --------------------------------------------------------
    if (asksExternalArtist) {
      const mbArtistUrl =
        `https://musicbrainz.org/ws/2/artist/?query=` +
        encodeURIComponent(`artist:"${externalMusicQuery}"`) +
        `&limit=3&fmt=json`;

      const mbResponse = await fetch(mbArtistUrl, {
        headers: musicbrainzHeaders
      });

      if (mbResponse.ok) {
        const mbData = await mbResponse.json();
        const artist = mbData.artists?.[0];

        if (artist && Number(artist.score || 0) >= 80) {
          const parts = [];

          parts.push(`${artist.name} est un artiste référencé par MusicBrainz.`);

          if (artist.type) {
            const typeLabels = {
              Person: "Artiste solo",
              Group: "Groupe",
              Orchestra: "Orchestre",
              Choir: "Chœur",
              Character: "Personnage artistique",
              Other: "Projet musical"
            };

            parts.push(typeLabels[artist.type] || `Type : ${artist.type}.`);
          }

          if (artist.country) {
            parts.push(`Pays : ${artist.country}.`);
          }

          if (artist.disambiguation) {
            parts.push(artist.disambiguation + ".");
          }

          return res.status(200).json({
            found: true,
            source: "musicbrainz_artist",
            answer: parts.join(" ")
          });
        }
      }
    }

    // --------------------------------------------------------
    // RECHERCHE TITRE
    // --------------------------------------------------------
    else {
      const mbRecordingUrl =
        `https://musicbrainz.org/ws/2/recording/?query=` +
        encodeURIComponent(`recording:"${externalMusicQuery}"`) +
        `&limit=3&fmt=json`;

      const mbResponse = await fetch(mbRecordingUrl, {
        headers: musicbrainzHeaders
      });

      if (mbResponse.ok) {
        const mbData = await mbResponse.json();
        const recordings = Array.isArray(mbData.recordings)
  ? mbData.recordings
  : [];

// On privilégie d'abord les titres exactement identiques
const normalizedSearchTitle = externalMusicQuery
  .toLowerCase()
  .trim();

const exactMatches = recordings.filter((item) =>
  String(item.title || "")
    .toLowerCase()
    .trim() === normalizedSearchTitle
);

// Si aucune correspondance exacte, on garde les résultats MusicBrainz
const candidates = (exactMatches.length ? exactMatches : recordings)
  .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

// Construire les principaux candidats pour détecter les homonymes
const candidateInfos = candidates.slice(0, 5).map((item) => {
  const artists = Array.isArray(item["artist-credit"])
    ? item["artist-credit"]
        .map((credit) => credit?.name)
        .filter(Boolean)
    : [];

  return {
    recording: item,
    artist: artists.join(", ") || "artiste inconnu",
    year: item["first-release-date"]
      ? String(item["first-release-date"]).slice(0, 4)
      : null,
    score: Number(item.score || 0)
  };
});

// Éviter de donner une mauvaise réponse si plusieurs morceaux
// portent exactement le même titre mais sont de différents artistes.
const uniqueArtists = [
  ...new Set(
    candidateInfos
      .map((item) => item.artist)
      .filter(Boolean)
  )
];

if (
  exactMatches.length > 1 &&
  uniqueArtists.length > 1
) {
  const choices = candidateInfos
    .slice(0, 3)
    .map((item) =>
      `${item.artist}${item.year ? ` (${item.year})` : ""}`
    )
    .join(", ");

  return res.status(200).json({
    found: true,
    source: "musicbrainz_ambiguous",
    answer:
      `Plusieurs morceaux portent le titre ${externalMusicQuery}. ` +
      `J’ai notamment trouvé : ${choices}. ` +
      `Peux-tu me préciser l’artiste pour que je te donne la bonne réponse ?`
  });
}

const recording = candidates[0];

        if (recording && Number(recording.score || 0) >= 80) {
          const artistNames =
            Array.isArray(recording["artist-credit"])
              ? recording["artist-credit"]
                  .map((credit) => credit?.name)
                  .filter(Boolean)
              : [];

          let answer = `${recording.title}`;

          if (artistNames.length) {
            answer += ` est interprété par ${artistNames.join(", ")}`;
          }

          answer += ".";

          const selectedArtistNames = Array.isArray(recording["artist-credit"])
  ? recording["artist-credit"]
      .map((credit) => credit?.name)
      .filter(Boolean)
      .map((name) => name.toLowerCase())
  : [];

const matchingYears = recordings
  .filter((item) => {
    const sameTitle =
      String(item.title || "").toLowerCase().trim() ===
      String(recording.title || "").toLowerCase().trim();

    const itemArtists = Array.isArray(item["artist-credit"])
      ? item["artist-credit"]
          .map((credit) => credit?.name)
          .filter(Boolean)
          .map((name) => name.toLowerCase())
      : [];

    const sameArtist = selectedArtistNames.some((name) =>
      itemArtists.includes(name)
    );

    return sameTitle && sameArtist && item["first-release-date"];
  })
  .map((item) =>
    parseInt(String(item["first-release-date"]).slice(0, 4), 10)
  )
  .filter((year) => Number.isInteger(year) && year > 1900);

const releaseYear = matchingYears.length
  ? Math.min(...matchingYears)
  : null;

            if (releaseYear) {
  answer += ` Première sortie référencée : ${releaseYear}.`;
}

          answer +=
            " Ce titre est connu de TechnoBot via sa culture musicale externe. " +
            "Cela ne signifie pas automatiquement qu'il est présent dans la bibliothèque Technorizon.";

          return res.status(200).json({
            found: true,
            source: "musicbrainz_recording",
            answer
          });
        }
      }
    }

  } catch (musicbrainzError) {
    console.error("MusicBrainz :", musicbrainzError);
  }
}

    // 7. Aucune réponse fiable trouvée
    return res.status(200).json({
      found: false,
      source: null,
      answer: null
    });

  } catch (error) {
    console.error("Technorizon Brain :", error);

    return res.status(500).json({
      error: "Erreur Technorizon Brain"
    });
  }
}
