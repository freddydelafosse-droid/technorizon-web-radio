export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  return res.status(200).json({
    success: true,
    assistant: "Jaya",
    message: "Jaya Brain est opérationnel."
  });
}
