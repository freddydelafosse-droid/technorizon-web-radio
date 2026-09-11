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
      `${supabaseUrl}/rest/v1/faq?select=question,answer,alternative_questions,category`,
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

    // 2. Chercher ensuite dans la base de connaissances
    const knowledgeResponse = await fetch(
      `${supabaseUrl}/rest/v1/knowledge?select=category,title,content,priority,visibility,status&status=eq.active&order=priority.asc`,
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

    if (bestMatch && bestScore > 0) {
      return res.status(200).json({
        found: true,
        source: "knowledge",
        answer: bestMatch.content
      });
    }

    // 3. Aucune réponse fiable trouvée
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
