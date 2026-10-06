// QStash -> Jaya scheduler bridge.
// Runs every few minutes from QStash and delegates scheduling/deduplication
// to the existing Jaya API. This is intentionally parallel to GitHub Actions
// during migration: the API remains the single source of truth for locks.

function parisParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const dowMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return { hour: Number(get('hour')), minute: Number(get('minute')), dow: dowMap[get('weekday')] };
}

function plan(now = new Date()) {
  const { hour: h, minute: m, dow } = parisParts(now);
  let action = '';
  let period = '';

  // Editorial priority. Repeated scheduler calls are safe because the existing
  // Jaya endpoint owns persistent queue/history/lock deduplication.
  if ((h === 6 && m >= 45) || (h === 7 && m <= 15)) action = 'weather-now';
  else if ((h === 8 && m >= 45) || (h === 9 && m <= 15)) { action = 'flash-replay'; period = '07'; }
  else if ((h === 10 && m >= 45) || (h === 11 && m <= 15)) action = 'weather-now';
  else if (h === 12 && m >= 15 && m <= 45) { action = 'flash-replay'; period = '11'; }
  else if (h === 13 && m >= 15 && m <= 45) action = 'weather-now';
  else if (h === 15 && m >= 15 && m <= 45) { action = 'flash-replay'; period = '13'; }
  else if (h === 17 && m >= 15 && m <= 45) action = 'weather-now';
  else if (h === 18 && m >= 15 && m <= 45) { action = 'flash-replay'; period = '17'; }

  // Technoroscope is independent in the legacy workflow; when it is due we
  // give it priority here only outside an Infos/Meteo window.
  if (!action && h === 7 && m >= 13 && m <= 28) action = 'horoscope-generate';
  if (!action && ((h === 7 && m >= 55) || (h === 8 && m <= 28))) action = 'horoscope-replay';

  if (action) return { kind: 'editorial', action, period };

  // H24: preserve the validated antenna windows. We call the existing default
  // action; its persistent locks absorb QStash/GitHub overlap during migration.
  let h24 = false;
  if (dow >= 1 && dow <= 5) h24 = h >= 7 && h < 23;
  else if (dow === 6) h24 = (h === 5 && m >= 10) || (h >= 6 && h < 13) || (h >= 13 && h < 17 && m < 20) || (h >= 17 && h < 23);
  else if (dow === 7) h24 = h >= 9 && h < 21;

  return h24 ? { kind: 'h24', action: '', period: '' } : { kind: 'idle', action: '', period: '' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  // QStash carries this token in the Authorization header configured on the schedule.
  const expected = process.env.QSTASH_SCHEDULER_SECRET || process.env.CRON_SECRET;
  const auth = String(req.headers.authorization || '');
  if (!expected || auth !== `Bearer ${expected}`) return res.status(401).json({ ok: false, error: 'unauthorized' });

  const p = plan(new Date());
  if (p.kind === 'idle') return res.status(200).json({ ok: true, scheduler: 'qstash', result: 'idle', paris: parisParts() });

  const origin = `https://${req.headers.host || 'www.technorizon.fr'}`;
  const body = p.action ? { action: p.action, ...(p.period ? { period: p.period } : {}) } : null;
  const response = await fetch(`${origin}/api/azuracast-test`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  res.status(response.ok ? 200 : 502).json({
    ok: response.ok,
    scheduler: 'qstash',
    plan: p,
    upstreamStatus: response.status,
    upstream: text.slice(0, 1500),
    paris: parisParts(),
  });
}
