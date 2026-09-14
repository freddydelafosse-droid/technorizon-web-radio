export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  try {
    const {
      source_assistant,
      user_question,
      proposed_answer = null,
      category = "unknown"
    } = req.body || {};

    if (
      !source_assistant ||
      typeof source_assistant !== "string" ||
      !user_question ||
      typeof user_question !== "string"
    ) {
      return res.status(400).json({
        error: "Données manquantes"
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

    const cleanQuestion = user_question.trim();

    const duplicateUrl =
      `${supabaseUrl}/rest/v1/learning_queue` +
      `?select=id` +
      `&source_assistant=eq.${encodeURIComponent(source_assistant)}` +
      `&user_question=eq.${encodeURIComponent(cleanQuestion)}` +
      `&limit=1`;

    const duplicateResponse = await fetch(duplicateUrl, {
      headers
    });

    if (!duplicateResponse.ok) {
      const errorText = await duplicateResponse.text();

      console.error(
        "Learning queue duplicate check:",
        duplicateResponse.status,
        errorText
      );

      return res.status(500).json({
        error: "Impossible de vérifier la file d'apprentissage"
      });
    }

    const duplicates = await duplicateResponse.json();

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      return res.status(200).json({
        success: true,
        inserted: false,
        duplicate: true
      });
    }

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/learning_queue`,
      {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          source_assistant: source_assistant.trim(),
          user_question: cleanQuestion,
          proposed_answer:
            typeof proposed_answer === "string" && proposed_answer.trim()
              ? proposed_answer.trim()
              : null,
          category:
            typeof category === "string" && category.trim()
              ? category.trim()
              : "unknown"
        })
      }
    );

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();

      console.error(
        "Learning queue insert:",
        insertResponse.status,
        errorText
      );

      return res.status(500).json({
        error: "Impossible d'enregistrer la question"
      });
    }

    const insertedRows = await insertResponse.json();

    return res.status(200).json({
      success: true,
      inserted: true,
      duplicate: false,
      row: Array.isArray(insertedRows)
        ? insertedRows[0] || null
        : null
    });
  } catch (error) {
    console.error("Learning Queue API:", error);

    return res.status(500).json({
      error: "Erreur Learning Queue"
    });
  }
}
