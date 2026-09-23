// Test de non-régression conceptuel : vérifie qu'aucun fichier de production
// n'est modifié par le dossier brain-enrichment.
import { execSync } from "node:child_process";
const changed=execSync("git diff --name-only main...HEAD",{encoding:"utf8"}).trim().split(/\r?\n/).filter(Boolean);
const prod=changed.filter(p=>p==="api/jaya-brain.js"||p==="api/jaya-tts.js"||p==="api/technobot-brain.js");
console.log(JSON.stringify({changed_files:changed.length,production_brain_files_changed:prod,safe:prod.length===0},null,2));
if(prod.length) process.exit(1);
