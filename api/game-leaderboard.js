const GAME_RULES = {
  blind: { step: 100, max: 2500 },
  intox: { step: 75, max: 375 },
  quiz: { step: 75, max: 375 }
};

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

function cleanName(value) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18);
}

function send(res, status, payload) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(payload);
}

export default async function handler(req, res) {
  const { url, key } = config();
  if (!url || !key) return send(res, 503, { error: 'Classement momentanément indisponible.' });

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  try {
    if (req.method === 'GET') {
      const requested = Number.parseInt(req.query?.limit, 10);
      const limit = Number.isFinite(requested) ? Math.min(50, Math.max(1, requested)) : 10;
      const response = await fetch(`${url}/rest/v1/rpc/get_game_leaderboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_limit: limit })
      });
      if (!response.ok) throw new Error(`Supabase leaderboard GET ${response.status}`);
      const items = await response.json();
      return send(res, 200, { items: Array.isArray(items) ? items : [] });
    }

    if (req.method === 'POST') {
      const name = cleanName(req.body?.name);
      const game = String(req.body?.game || '').toLowerCase();
      const score = Number(req.body?.score);
      const rule = GAME_RULES[game];

      if (name.length < 2 || !/^[\p{L}\p{N} ._'-]+$/u.test(name)) {
        return send(res, 400, { error: 'Pseudo invalide.' });
      }
      if (!rule || !Number.isInteger(score) || score <= 0 || score > rule.max || score % rule.step !== 0) {
        return send(res, 400, { error: 'Score invalide.' });
      }

      const response = await fetch(`${url}/rest/v1/rpc/submit_game_score`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_player_name: name, p_game: game, p_score: score })
      });
      if (!response.ok) throw new Error(`Supabase leaderboard POST ${response.status}`);
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Méthode non autorisée.' });
  } catch (error) {
    console.error('Technorizon leaderboard:', error);
    return send(res, 503, { error: 'Classement momentanément indisponible.' });
  }
}
