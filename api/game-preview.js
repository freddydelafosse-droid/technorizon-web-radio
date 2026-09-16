const clean = value => String(value || '').replace(/[^\p{L}\p{N}\s&'!().,-]/gu, '').trim().slice(0, 80);
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });
  const artist = clean(req.query?.artist);
  const title = clean(req.query?.title);
  if (!artist || !title) return res.status(400).json({ error: 'Artiste et titre requis' });

  try {
    const term = encodeURIComponent(`${artist} ${title}`);
    const url = `https://itunes.apple.com/search?term=${term}&country=FR&media=music&entity=song&limit=10`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Technorizon-Games/1.0' } });
    if (!response.ok) throw new Error(`Apple Search ${response.status}`);
    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results.filter(item => item.previewUrl) : [];
    const wantedArtist = normalize(artist);
    const wantedTitle = normalize(title);
    const ranked = results.map(item => {
      const itemArtist = normalize(item.artistName);
      const itemTitle = normalize(item.trackName);
      let score = 0;
      if (itemArtist === wantedArtist) score += 5;
      else if (itemArtist.includes(wantedArtist) || wantedArtist.includes(itemArtist)) score += 3;
      if (itemTitle === wantedTitle) score += 6;
      else if (itemTitle.includes(wantedTitle) || wantedTitle.includes(itemTitle)) score += 4;
      return { item, score };
    }).sort((a, b) => b.score - a.score);
    const match = ranked[0]?.item;
    if (!match || ranked[0].score < 4) return res.status(404).json({ error: 'Extrait indisponible' });

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', 'https://technorizon.fr');
    return res.status(200).json({
      previewUrl: match.previewUrl,
      artist: match.artistName,
      title: match.trackName,
      artwork: match.artworkUrl100 || ''
    });
  } catch (error) {
    console.error('API GAME PREVIEW:', error);
    return res.status(502).json({ error: 'Extrait temporairement indisponible' });
  }
}
