const GAME_RULES = {
  blind: { step: 100, max: 2500 },
  intox: { step: 75, max: 375 },
  quiz: { step: 75, max: 375 },
  brick: { step: 1, max: 10000000 },
  blast: { step: 1, max: 10000000 }
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

async function handleProgress(req,res,url,key,headers){
  const clean=v=>cleanName(v), playerKey=v=>clean(v).toLowerCase();
  if(req.method==='GET'){const name=clean(req.query?.name);if(name.length<2)return send(res,400,{error:'Pseudo invalide.'});const q=new URLSearchParams({player_key:'eq.'+playerKey(name),game:'eq.blast',select:'player_name,level,stock,coins,updated_at',limit:'1'});const r=await fetch(url+'/rest/v1/game_progress?'+q,{headers});if(!r.ok)throw new Error('Progress GET '+r.status);const rows=await r.json();return send(res,200,{progress:rows[0]||null})}
  if(req.method==='POST'){const name=clean(req.body?.name),level=Number(req.body?.level),s=req.body?.stock||{};if(name.length<2||!Number.isInteger(level)||level<1||level>1000000)return send(res,400,{error:'Progression invalide.'});const stock={rocket:Math.max(0,Math.min(999,Number(s.rocket)||0)),bomb:Math.max(0,Math.min(999,Number(s.bomb)||0)),disco:Math.max(0,Math.min(999,Number(s.disco)||0))};const coins=Math.max(0,Math.min(999999,Number(req.body?.coins)||0));const r=await fetch(url+'/rest/v1/rpc/save_game_progress',{method:'POST',headers,body:JSON.stringify({p_player_name:name,p_game:'blast',p_level:level,p_stock:stock,p_coins:coins})});if(!r.ok)throw new Error('Progress POST '+r.status);return send(res,200,{ok:true})}
  return send(res,405,{error:'Méthode non autorisée.'});
}

async function handleGroups(req,res,url,headers){const clean=v=>cleanName(v).slice(0,30),sb=async(path,opt={})=>{const r=await fetch(url+'/rest/v1/'+path,{...opt,headers:{...headers,...(opt.headers||{})}}),t=await r.text(),d=t?JSON.parse(t):null;if(!r.ok)throw new Error(d?.message||('DB '+r.status));return d};const name=clean(req.method==='GET'?req.query?.name:req.body?.name);if(name.length<2)return send(res,400,{error:'Choisis d’abord un pseudo.'});const mine=async()=>{const x=await sb('blast_group_members?player_name=eq.'+encodeURIComponent(name)+'&select=group_id,role');return x[0]};if(req.method==='GET'){const me=await mine();if(!me)return send(res,200,{group:null});const [gs,members,messages]=await Promise.all([sb('blast_groups?id=eq.'+me.group_id+'&select=id,name,leader_name,coleader_name,created_at'),sb('blast_group_members?group_id=eq.'+me.group_id+'&select=player_name,role,joined_at&order=role.asc,joined_at.asc'),sb('blast_group_messages?group_id=eq.'+me.group_id+'&select=id,player_name,message,created_at&order=created_at.desc&limit=50')]);return send(res,200,{group:gs[0]||null,me,members,messages:messages.reverse()})}if(req.method!=='POST')return send(res,405,{error:'Méthode non autorisée.'});const action=String(req.body?.action||''),me=await mine();if(action==='create'){if(me)return send(res,409,{error:'Tu appartiens déjà à un groupe.'});const gn=clean(req.body?.groupName);if(gn.length<3)return send(res,400,{error:'Nom du groupe trop court.'});const g=await sb('blast_groups',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:gn,leader_name:name})});await sb('blast_group_members',{method:'POST',body:JSON.stringify({group_id:g[0].id,player_name:name,role:'leader'})});return send(res,200,{ok:true})}if(action==='join'){if(me)return send(res,409,{error:'Tu appartiens déjà à un groupe.'});const gn=clean(req.body?.groupName),g=await sb('blast_groups?name=ilike.'+encodeURIComponent(gn)+'&select=id,name&limit=1');if(!g[0])return send(res,404,{error:'Groupe introuvable.'});await sb('blast_group_members',{method:'POST',body:JSON.stringify({group_id:g[0].id,player_name:name,role:'member'})});return send(res,200,{ok:true})}if(!me)return send(res,400,{error:'Aucun groupe.'});if(action==='message'){const m=clean(req.body?.message).slice(0,300);if(!m)return send(res,400,{error:'Message vide.'});await sb('blast_group_messages',{method:'POST',body:JSON.stringify({group_id:me.group_id,player_name:name,message:m})});return send(res,200,{ok:true})}if(action==='coleader'){if(me.role!=='leader')return send(res,403,{error:'Réservé au Leader.'});const target=clean(req.body?.target);await sb('blast_group_members?group_id=eq.'+me.group_id+'&role=eq.coleader',{method:'PATCH',body:JSON.stringify({role:'member'})});const changed=await sb('blast_group_members?group_id=eq.'+me.group_id+'&player_name=eq.'+encodeURIComponent(target),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({role:'coleader'})});if(!changed[0])return send(res,404,{error:'Membre introuvable.'});await sb('blast_groups?id=eq.'+me.group_id,{method:'PATCH',body:JSON.stringify({coleader_name:target})});return send(res,200,{ok:true})}return send(res,400,{error:'Action invalide.'})}

export default async function handler(req, res) {
  const { url, key } = config();
  if (!url || !key) return send(res, 503, { error: 'Classement momentanément indisponible.' });

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  try {
    if (String(req.query?.mode||'') === 'progress') return await handleProgress(req,res,url,key,headers);
    if (String(req.query?.mode||'') === 'groups') return await handleGroups(req,res,url,headers);
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
