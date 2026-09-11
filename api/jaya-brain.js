export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
  return res.status(405).json({
    error: "Méthode non autorisée"
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

   return res.status(200).json({
  success: true,
  assistant: "Jaya",
  rules_count: rules.length,
  status: "Jaya Brain connecté à Supabase"
});
  } catch (error) {
    console.error("Jaya Brain :", error);

    return res.status(500).json({
      error: "Erreur Jaya Brain"
    });
  }
}
