export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const dedicaces = [
  "💌 TEST — Gaby : Bienvenue sur Technorizon.fr !"
];

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    dedicaces
  });
}
