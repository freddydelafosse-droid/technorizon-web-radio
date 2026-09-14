export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
  return res.status(405).json({
    error: "Méthode non autorisée"
  });
}

  const question =
  req.method === "POST" && typeof req.body?.question === "string"
    ? req.body.question.trim()
    : "";

if (req.method === "POST" && !question) {
  return res.status(400).json({
    error: "Question manquante"
  });
}

  try {
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
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_rules?select=assistant_name,rule_type,title,instruction,priority,status&assistant_name=eq.Jaya&status=eq.active&order=priority.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Jaya ai_rules error:", errorText);

      return res.status(500).json({
        error: "Impossible de charger les règles de Jaya"
      });
    }

    const rules = await response.json();

    const jayaRules = rules
  .filter((rule) => rule?.instruction)
  .map((rule) => ({
    type: rule.rule_type || "general",
    title: rule.title || null,
    instruction: String(rule.instruction).trim(),
    priority: rule.priority ?? 999
  }))
  .sort((a, b) => a.priority - b.priority);

const jayaBehaviorContext = jayaRules
  .map((rule) => rule.instruction)
  .join("\n");

    const faqResponse = await fetch(
  `${supabaseUrl}/rest/v1/faq?select=question,answer,alternative_questions,category&status=eq.active&visibility=eq.public`,
  {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  }
);

if (!faqResponse.ok) {
  const errorText = await faqResponse.text();

  console.error("Jaya faq error:", errorText);

  return res.status(500).json({
    error: "Impossible de charger la FAQ Technorizon"
  });
}

const faq = await faqResponse.json();

    const knowledgeResponse = await fetch(
  `${supabaseUrl}/rest/v1/knowledge?select=*&status=eq.active&visibility=eq.public`,
  {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  }
);

if (!knowledgeResponse.ok) {
  const errorText = await knowledgeResponse.text();

  console.error("Jaya knowledge error:", errorText);

  return res.status(500).json({
    error: "Impossible de charger le cerveau commun Technorizon"
  });
}

const knowledge = await knowledgeResponse.json();

    const entitiesResponse = await fetch(
  `${supabaseUrl}/rest/v1/entities?select=name,entity_type,aliases,description,visibility,status&status=eq.active&visibility=eq.public`,
  {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  }
);

if (!entitiesResponse.ok) {
  const errorText = await entitiesResponse.text();

  console.error("Jaya entities error:", errorText);

  return res.status(500).json({
    error: "Impossible de charger les entités Technorizon"
  });
}

const entities = await entitiesResponse.json();

    const artistsResponse = await fetch(
  `${supabaseUrl}/rest/v1/artists?select=name,aliases,country,genres,active_years,biography,known_for,technorizon_notes,in_technorizon_rotation,visibility,status&status=eq.active&visibility=eq.public`,
  {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  }
);

if (!artistsResponse.ok) {
  const errorText = await artistsResponse.text();

  console.error("Jaya artists error:", errorText);

  return res.status(500).json({
    error: "Impossible de charger les artistes Technorizon"
  });
}

const artists = await artistsResponse.json();

    const tracksResponse = await fetch(
  `${supabaseUrl}/rest/v1/tracks?select=title,aliases,primary_artist,featured_artists,album,release_year,genres,description,facts,in_technorizon_library,in_rotation,rotation_group,technorizon_notes,visibility,status&status=eq.active&visibility=eq.public`,
  {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  }
);

if (!tracksResponse.ok) {
  const errorText = await tracksResponse.text();

  console.error("Jaya tracks error:", errorText);

  return res.status(500).json({
    error: "Impossible de charger les titres Technorizon"
  });
}

const tracks = await tracksResponse.json();

    if (req.method === "POST") {
  const cleanQuestion = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'?!.,;:-]/g, " ");

  const words = cleanQuestion
    .split(/\s+/)
    .filter((word) => word.length >= 4);

const faqMatch = faq.find((item) => {
  const mainQuestion = String(item.question || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'?!.,;:-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    mainQuestion &&
    (
      cleanQuestion.includes(mainQuestion) ||
      mainQuestion.includes(cleanQuestion)
    )
  ) {
    return true;
  }

  if (Array.isArray(item.alternative_questions)) {
    return item.alternative_questions.some((alternative) => {
      const normalizedAlternative = String(alternative || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’'?!.,;:-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return (
        normalizedAlternative &&
        (
          cleanQuestion.includes(normalizedAlternative) ||
          normalizedAlternative.includes(cleanQuestion)
        )
      );
    });
  }

  return false;
});

if (faqMatch?.answer) {
  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    found: true,
    source: "faq",
    answer: faqMatch.answer
  });
}

const trackMatch = tracks.find((track) => {
  const titles = [
    track.title,
    ...(Array.isArray(track.aliases) ? track.aliases : [])
  ]
    .filter(Boolean)
    .map((value) =>
      String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    );

  return titles.some((title) => cleanQuestion.includes(title));
});

if (trackMatch) {

const asksYear =
  cleanQuestion.includes("quelle annee") ||
  cleanQuestion.includes("en quelle annee") ||
  cleanQuestion.includes("de quelle annee") ||
  cleanQuestion.includes("date de sortie") ||
  cleanQuestion.includes("quand est sorti") ||
  cleanQuestion.includes("quand est sortie");

const asksGenre =
  cleanQuestion.includes("quel style") ||
  cleanQuestion.includes("quelle style") ||
  cleanQuestion.includes("quel genre") ||
  cleanQuestion.includes("quelle genre");

const asksAlbum =
  cleanQuestion.includes("quel album") ||
  cleanQuestion.includes("dans quel album");

const asksTechnorizon =
  cleanQuestion.includes("passe sur technorizon") ||
  cleanQuestion.includes("diffuse sur technorizon") ||
  cleanQuestion.includes("diffusee sur technorizon") ||
  cleanQuestion.includes("bibliotheque technorizon") ||
  cleanQuestion.includes("rotation");
  
  const asksArtist =
    cleanQuestion.includes("qui chante") ||
    cleanQuestion.includes("qui interprete") ||
    cleanQuestion.includes("quel artiste");

  if (asksArtist) {
    return res.status(200).json({
      success: true,
      assistant: "Jaya",
      found: true,
      source: "tracks",
      answer: `${trackMatch.title} est interprété par ${trackMatch.primary_artist}.`
    });
  }

  if (asksYear && trackMatch.release_year) {
  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    found: true,
    source: "tracks",
    answer: `${trackMatch.title} de ${trackMatch.primary_artist} est sorti en ${trackMatch.release_year}.`
  });
}

if (asksGenre && Array.isArray(trackMatch.genres) && trackMatch.genres.length) {
  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    found: true,
    source: "tracks",
    answer: `${trackMatch.title} est classé dans les styles ${trackMatch.genres.join(", ")}.`
  });
}

if (asksAlbum && trackMatch.album) {
  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    found: true,
    source: "tracks",
    answer: `${trackMatch.title} figure sur l’album ${trackMatch.album}.`
  });
}

if (asksTechnorizon) {
  let answer;

  if (trackMatch.in_technorizon_library) {
    answer = `${trackMatch.title} de ${trackMatch.primary_artist} est bien référencé dans la bibliothèque Technorizon.`;

    if (trackMatch.in_rotation) {
      answer += " Il fait actuellement partie de la rotation.";

      if (trackMatch.rotation_group) {
        answer += ` Rotation : ${trackMatch.rotation_group}.`;
      }
    } else {
      answer += " Il n’est pas actuellement indiqué comme étant en rotation.";
    }
  } else {
    answer = `${trackMatch.title} de ${trackMatch.primary_artist} est connu de Jaya, mais il n’est pas actuellement référencé comme présent dans la bibliothèque Technorizon.`;
  }

  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    found: true,
    source: "tracks",
    answer
  });
}

  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    found: true,
    source: "tracks",
    answer: trackMatch.description || `${trackMatch.title} est un titre de ${trackMatch.primary_artist}.`
  });
}

      const artistMatch = artists.find((artist) => {
  const normalizedQuestion = ` ${cleanQuestion
    .replace(/\s+/g, " ")
    .trim()} `;

  const names = [
    artist.name,
    ...(Array.isArray(artist.aliases) ? artist.aliases : [])
  ]
    .filter(Boolean)
    .map((value) =>
      String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
    );

  return names.some((name) =>
    normalizedQuestion.includes(` ${name} `)
  );
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
    parts.push(
      "Cet artiste fait partie de l'univers musical de Technorizon."
    );
  }

  if (artistMatch.technorizon_notes) {
    parts.push(artistMatch.technorizon_notes);
  }

  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    found: true,
    source: "artists",
    answer:
      parts.join(" ") ||
      `${artistMatch.name} est référencé dans le cerveau musical Technorizon.`
  });
}

      const entityMatch = entities.find((entity) => {
  const names = [
    entity.name,
    ...(Array.isArray(entity.aliases) ? entity.aliases : [])
  ]
    .filter(Boolean)
    .map((value) =>
      String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    );

  return names.some((name) => cleanQuestion.includes(name));
});

if (entityMatch) {
  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    found: true,
    source: "entities",
    entity_type: entityMatch.entity_type,
    answer: entityMatch.description
  });
}

  let bestMatch = null;
  let bestScore = 0;

  for (const item of knowledge) {
    const searchable = [
      item.category,
      item.title,
      item.content
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let score = 0;

    for (const word of words) {
      if (searchable.includes(word)) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  const exactTopicMatch =
  words.length === 1 &&
  bestMatch &&
  [
    bestMatch.category,
    bestMatch.title,
    bestMatch.content
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .includes(words[0]);

if (bestMatch && (bestScore >= 2 || exactTopicMatch)) {
    return res.status(200).json({
      success: true,
      assistant: "Jaya",
      found: true,
      source: "knowledge",
      answer: bestMatch.content
    });
  }

const openaiApiKey = process.env.OPENAI_API_KEY;

if (openaiApiKey && jayaBehaviorContext) {
  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          instructions: `
Tu es Jaya, animatrice virtuelle officielle de Technorizon.

Respecte impérativement les règles suivantes :
${jayaBehaviorContext}

Tu réponds en français par défaut.
Tu gardes une personnalité naturelle, chaleureuse, moderne et radiophonique.
Tu ne prétends jamais connaître une information absente du contexte fourni.
Si tu ne connais pas la réponse avec suffisamment de certitude, réponds uniquement :
JE_NE_SAIS_PAS
          `.trim(),
          input: question,
          max_output_tokens: 250
        })
      }
    );

    if (openaiResponse.ok) {
      const openaiData = await openaiResponse.json();

      const aiAnswer = (openaiData.output || [])
        .flatMap((item) => item.content || [])
        .filter((item) => item.type === "output_text")
        .map((item) => item.text)
        .join("\n")
        .trim();

      if (
        aiAnswer &&
        aiAnswer !== "JE_NE_SAIS_PAS"
      ) {
        return res.status(200).json({
          success: true,
          assistant: "Jaya",
          found: true,
          source: "openai",
          answer: aiAnswer
        });
      }
    } else {
      console.error(
        "Jaya OpenAI:",
        openaiResponse.status,
        await openaiResponse.text()
      );
    }
  } catch (openaiError) {
    console.error("Jaya OpenAI:", openaiError);
  }
}
      
 try {
  const learningCategory =
    cleanQuestion.includes("artiste") ||
    cleanQuestion.includes("titre") ||
    cleanQuestion.includes("album") ||
    cleanQuestion.includes("musique")
      ? "music"
      : "unknown";

  const learningResponse = await fetch(
    `${supabaseUrl}/rest/v1/learning_queue`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        source_assistant: "Jaya",
        user_question: question.trim(),
        proposed_answer: null,
        category: learningCategory
      })
    }
  );

  if (!learningResponse.ok) {
    console.error(
      "Jaya learning_queue:",
      learningResponse.status,
      await learningResponse.text()
    );
  }
} catch (learningError) {
  console.error("Jaya learning_queue:", learningError);
}

return res.status(200).json({
  success: true,
  assistant: "Jaya",
  found: false,
  answer: null
});
}
    
return res.status(200).json({
  success: true,
  assistant: "Jaya",
  rules_count: jayaRules.length,
behavior_ready: jayaBehaviorContext.length > 0,
knowledge_count: knowledge.length,
entities_count: entities.length,
  artists_count: artists.length,
  tracks_count: tracks.length,
status: "Jaya Brain connecté au cerveau Technorizon"
});
  
  } catch (error) {
    console.error("Jaya Brain :", error);

    return res.status(500).json({
      error: "Erreur Jaya Brain"
    });
  }
}
