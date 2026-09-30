// Only expose facts whose integration and provenance were recorded by enrichment.
function verifiedFacts(artist, row) {
  const source = row?.source_details || {};
  if (!artist || artist.status !== 'active' || artist.visibility !== 'public' ||
      String(row?.artist_id) !== String(artist.id) || row?.artist_name !== artist.name ||
      row?.matched_name !== artist.name || Number(row?.confidence) !== 100 ||
      source.provider !== 'MusicBrainz' || source.integration_status !== 'applied' ||
      source.collaboration_detected !== false) return null;
  const fields = Array.isArray(source.integrated_fields) ? source.integrated_fields : [];
  const facts = {};
  if (fields.includes('country') && /^[A-Z]{2}$/.test(artist.country || '') &&
      artist.country === row.proposed_country) facts.country_code = artist.country;
  if (fields.includes('genres') && Array.isArray(artist.genres) && artist.genres.length &&
      artist.genres.every(x => typeof x === 'string' && (row.proposed_genres || []).some(v => String(v).trim().toLowerCase() === x)))
    facts.genres = artist.genres.slice(0, 8);
  if (fields.includes('active_years') && source.type !== 'Person' &&
      /^\d{4} - (?:\d{4}|aujourd’hui)$/.test(artist.active_years || '') &&
      artist.active_years === row.proposed_active_years) facts.active_years = artist.active_years;
  return Object.keys(facts).length ? {artist: artist.name, provider: 'MusicBrainz', facts} : null;
}

async function loadVerifiedArtistContext(song, config, fetcher = fetch) {
  if (!song?.brain || !song.artist || !config?.url || !config?.key) return null;
  // One shared deadline: enrichment must not delay a priority antenna passage.
  const signal = AbortSignal.timeout(1500);
  const headers = {apikey: config.key, Authorization: `Bearer ${config.key}`, Accept: 'application/json'};
  try {
    const url = new URL(config.url + '/rest/v1/artists');
    url.search = new URLSearchParams({select: 'id,name,country,genres,active_years,status,visibility',
      name: 'eq.' + song.artist, status: 'eq.active', visibility: 'eq.public', limit: '2'}).toString();
    const response = await fetcher(url, {headers, signal});
    if (!response.ok) return null;
    const artists = await response.json();
    if (artists.length !== 1) return null;
    const reviewUrl = new URL(config.url + '/rest/v1/artist_enrichment_queue');
    reviewUrl.search = new URLSearchParams({select: 'artist_id,artist_name,matched_name,confidence,proposed_country,proposed_genres,proposed_active_years,source_details',
      artist_id: 'eq.' + artists[0].id, 'source_details->>integration_status': 'eq.applied', limit: '2'}).toString();
    const reviewResponse = await fetcher(reviewUrl, {headers, signal});
    if (!reviewResponse.ok) return null;
    const rows = await reviewResponse.json();
    return rows.length === 1 ? verifiedFacts(artists[0], rows[0]) : null;
  } catch { return null; }
}
module.exports = {verifiedFacts, loadVerifiedArtistContext};
