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

    if (req.method === "POST") {
  const cleanQuestion = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'?!.,;:-]/g, " ");

  const words = cleanQuestion
    .split(/\s+/)
    .filter((word) => word.length >= 4);

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
  rules_count: rules.length,
  knowledge_count: knowledge.length,
  status: "Jaya Brain connecté au cerveau Technorizon"
});
  
  } catch (error) {
    console.error("Jaya Brain :", error);

    return res.status(500).json({
      error: "Erreur Jaya Brain"
    });
  }
}
