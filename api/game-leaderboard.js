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
      const full = String(req.query?.full || '') === '1';
      const limit = Number.isFinite(requested) ? Math.min(full ? 50 : 10, Math.max(1, requested)) : 10;
      const requestedOffset = Number.parseInt(req.query?.offset, 10);
      const offset = full && Number.isFinite(requestedOffset) ? Math.max(0, requestedOffset) : 0;
      const search = cleanName(req.query?.search);
      const game = String(req.query?.game || '').toLowerCase();
      if (!GAME_RULES[game]) return send(res, 400, { error: 'Jeu invalide.' });
      const base = new URLSearchParams({ game: `eq.${game}` });
      if (search) base.set('player_name', `ilike.*${search.replace(/[%*,]/g, '')}*`);
      const params = new URLSearchParams(base);
      params.set('select', 'player_name,score,updated_at');
      params.set('order', 'score.desc,updated_at.asc');
      params.set('limit', String(limit));
      if (full) params.set('offset', String(offset));
      const response = await fetch(`${url}/rest/v1/game_scores?${params}`, { headers });
      if (!response.ok) throw new Error(`Supabase leaderboard GET ${response.status}`);
      const raw = await response.json();
      const items = (Array.isArray(raw) ? raw : []).map((item, index) => ({ ...item, rank: offset + index + 1 }));

      if (!full) return send(res, 200, { items });

      const countParams = new URLSearchParams({ game: `eq.${game}`, select: 'player_key' });
      const countResponse = await fetch(`${url}/rest/v1/game_scores?${countParams}`, { headers: { ...headers, Prefer: 'count=exact' } });
      const range = countResponse.headers.get('content-range') || '';
      const total = Number(range.split('/')[1]) || 0;

      let me = null;
      const meName = cleanName(req.query?.me);
      if (meName) {
        const meParams = new URLSearchParams({ game: `eq.${game}`, player_name: `ilike.${meName.replace(/[%*,]/g, '')}`, select: 'player_name,score,updated_at', limit: '1' });
        const meResponse = await fetch(`${url}/rest/v1/game_scores?${meParams}`, { headers });
        if (meResponse.ok) {
          const meRows = await meResponse.json();
          if (meRows[0]) {
            const betterParams = new URLSearchParams({ game: `eq.${game}`, score: `gt.${meRows[0].score}`, select: 'player_key' });
            const betterResponse = await fetch(`${url}/rest/v1/game_scores?${betterParams}`, { headers: { ...headers, Prefer: 'count=exact' } });
            const betterRange = betterResponse.headers.get('content-range') || '';
            const better = Number(betterRange.split('/')[1]) || 0;
            me = { ...meRows[0], rank: better + 1 };
          }
        }
      }
      return send(res, 200, { items, total, me });
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
