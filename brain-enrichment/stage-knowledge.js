// Jaya Brain V1 — import sécurisé en staging.
// Ce module ne publie RIEN vers les tables actives de Jaya.

import crypto from "node:crypto";

export function normalizeText(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function fingerprintFact({ domain, entity_type, canonical_name, facts }) {
  const stable = JSON.stringify({
    domain: normalizeText(domain),
    entity_type: normalizeText(entity_type),
    canonical_name: normalizeText(canonical_name),
    facts: facts || {}
  });
  return crypto.createHash("sha256").update(stable).digest("hex");
}

export function buildStagingRow(item, batchId) {
  if (!item?.domain || !item?.canonical_name || !item?.source_name || !batchId) {
    throw new Error("Donnée d'enrichissement incomplète");
  }
  const row = {
    domain: item.domain,
    entity_type: item.entity_type || null,
    canonical_name: String(item.canonical_name).trim(),
    aliases: Array.isArray(item.aliases) ? item.aliases : [],
    facts: item.facts && typeof item.facts === "object" ? item.facts : {},
    source_name: item.source_name,
    source_url: item.source_url || null,
    source_id: item.source_id || null,
    source_date: item.source_date || null,
    confidence: Math.max(0, Math.min(1, Number(item.confidence ?? 0.5))),
    batch_id: batchId,
    review_status: "pending",
    active: false
  };
  row.fingerprint = fingerprintFact(row);
  return row;
}

export async function stageKnowledge({ supabaseUrl, serviceKey, items, batchId }) {
  if (!supabaseUrl || !serviceKey) throw new Error("Configuration Supabase manquante");
  if (!Array.isArray(items) || !items.length) return { staged: 0 };

  const rows = items.map((item) => buildStagingRow(item, batchId));
  const response = await fetch(
    `${supabaseUrl}/rest/v1/jaya_knowledge_staging?on_conflict=fingerprint`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation"
      },
      body: JSON.stringify(rows)
    }
  );
  if (!response.ok) throw new Error(`Staging HTTP ${response.status}: ${await response.text()}`);
  const inserted = await response.json();
  return { staged: inserted.length, received: rows.length, batchId };
}
