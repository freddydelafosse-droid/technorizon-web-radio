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

    // 6. Aucune réponse fiable trouvée
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
