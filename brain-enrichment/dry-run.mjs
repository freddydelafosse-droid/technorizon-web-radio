// Dry-run du lot pilote : aucune connexion Supabase, aucune écriture.
import fs from "node:fs";
import crypto from "node:crypto";

const file = process.argv[2] || "brain-enrichment/batches/pilot-001.json";
const rows = JSON.parse(fs.readFileSync(file, "utf8"));
const norm = (s="") => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const seen = new Set();
let errors = [];

for (const [i,x] of rows.entries()) {
  if (!x.domain || !x.canonical_name || !x.source_name) errors.push(`row ${i+1}: required field missing`);
  if (!(Number(x.confidence)>=0 && Number(x.confidence)<=1)) errors.push(`row ${i+1}: invalid confidence`);
  const stable=JSON.stringify({domain:norm(x.domain),entity_type:norm(x.entity_type),canonical_name:norm(x.canonical_name),facts:x.facts||{}});
  const fp=crypto.createHash("sha256").update(stable).digest("hex");
  if(seen.has(fp)) errors.push(`row ${i+1}: duplicate fingerprint`);
  seen.add(fp);
}
console.log(JSON.stringify({mode:"DRY_RUN",writes:false,rows:rows.length,unique_fingerprints:seen.size,errors},null,2));
if(errors.length) process.exit(1);
