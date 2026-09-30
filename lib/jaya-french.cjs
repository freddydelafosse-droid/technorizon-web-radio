const CATEGORY="french_language";
const BATCH_SIZE=12;
const RULES=[
  {
    "key": "fr-001",
    "topic": "accords",
    "title": "Français — Sujet et verbe",
    "content": "Le verbe s’accorde avec son sujet, même si un complément les sépare : les auditrices de cette émission écoutent. Repérer le sujet avant de choisir la terminaison.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/accord-du-verbe-avec-le-sujet"
  },
  {
    "key": "fr-002",
    "topic": "accords",
    "title": "Français — Adjectif et nom",
    "content": "L’adjectif reçoit généralement le genre et le nombre du nom : une belle chanson, de belles chansons. Vérifier le nom auquel il se rapporte.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/24304/la-grammaire/la-grammaire-actuelle/les-classes-de-mots-et-les-groupes/ladjectif-et-le-groupe-adjectival"
  },
  {
    "key": "fr-003",
    "topic": "accords",
    "title": "Français — Participe passé avec avoir",
    "content": "Avec avoir, le participe passé s’accorde avec le complément direct placé avant : les chansons que j’ai diffusées. Sans complément direct antéposé : j’ai diffusé des chansons.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/24221/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-avoir/synthese-des-regles-daccord-du-participe-passe-employe-avec-avoir"
  },
  {
    "key": "fr-004",
    "topic": "accords",
    "title": "Français — Participe passé avec être",
    "content": "Avec être, hors verbes pronominaux, le participe passé s’accorde avec le sujet : elles sont arrivées. Ne pas étendre cette règle sans analyse aux verbes pronominaux.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/banque-de-depannage-linguistique/la-grammaire"
  },
  {
    "key": "fr-005",
    "topic": "conjugaison",
    "title": "Français — Infinitif ou participe passé : er et é",
    "content": "Pour distinguer chanter et chanté, remplacer par vendre ou vendu : je vais chanter, j’ai chanté. Après un verbe modal comme pouvoir, employer l’infinitif.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/banque-de-depannage-linguistique/la-grammaire"
  },
  {
    "key": "fr-006",
    "topic": "conjugaison",
    "title": "Français — Futur simple et conditionnel présent",
    "content": "Je chanterai est au futur ; je chanterais est au conditionnel. Employer le futur pour un événement futur annoncé et le conditionnel pour une hypothèse ou une demande atténuée.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/conjugaison"
  },
  {
    "key": "fr-007",
    "topic": "orthographe",
    "title": "Français — Accents sur les majuscules",
    "content": "Les capitales conservent leurs accents et leurs signes : À, É, Ç. Écrire notamment À l’antenne, Écoutez et Ça.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/21438/la-typographie/majuscules/regles-generales-demploi-de-la-majuscule/accents-tremas-et-cedilles-aux-lettres-majuscules"
  },
  {
    "key": "fr-008",
    "topic": "prononciation",
    "title": "Français — Consonnes finales et exceptions",
    "content": "La présence d’une consonne finale écrite ne détermine pas à elle seule sa prononciation. Ne jamais supprimer systématiquement tous les s finaux : bus, fils et plus ont leurs propres usages.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/lorthographe/problemes-lies-aux-consonnes"
  },
  {
    "key": "fr-009",
    "topic": "homophones",
    "title": "Français — A et à",
    "content": "A est une forme du verbe avoir : elle a choisi. À est une préposition : à la radio. Le remplacement par avait aide à reconnaître le verbe.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22599/la-grammaire/les-homophones-grammaticaux/les-homophones-a-et-a"
  },
  {
    "key": "fr-010",
    "topic": "homophones",
    "title": "Français — Son et sont",
    "content": "Son est un déterminant possessif : son morceau. Sont est le verbe être : ils sont prêts. Le remplacement par étaient permet de reconnaître le verbe.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22645/lorthographe/homophones-lexicaux/les-homophones-lexicaux-et-grammaticaux"
  },
  {
    "key": "fr-011",
    "topic": "expression_orale",
    "title": "Français — Relecture avant de parler",
    "content": "Relire silencieusement la réponse finale : orthographe, conjugaison, accords, homophones et ponctuation. Corriger la langue sans modifier les faits, chiffres, noms propres ni horaires.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-012",
    "topic": "prononciation",
    "title": "Français — Technorizons : s muet",
    "content": "Dans la préparation vocale de Technorizons, le s final est muet. La graphie officielle affichée reste Technorizon. Cette règle concerne exclusivement le nom de la radio, pas les autres mots en s.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-013",
    "topic": "homophones",
    "title": "Français — Et et est",
    "content": "Et coordonne : musique et humour. Est est une forme du verbe être : la programmation est variée. Tester était pour reconnaître le verbe.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22645/lorthographe/homophones-lexicaux/les-homophones-lexicaux-et-grammaticaux"
  },
  {
    "key": "fr-014",
    "topic": "homophones",
    "title": "Français — On et ont",
    "content": "On est un pronom sujet : on écoute. Ont est le verbe avoir : ils ont écouté. Tester avaient pour reconnaître le verbe.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22645/lorthographe/homophones-lexicaux/les-homophones-lexicaux-et-grammaticaux"
  },
  {
    "key": "fr-015",
    "topic": "homophones",
    "title": "Français — Ce et se",
    "content": "Ce est déterminant ou pronom démonstratif : ce titre, ce sera agréable. Se est un pronom employé notamment avec un verbe pronominal : elle se prépare.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22645/lorthographe/homophones-lexicaux/les-homophones-lexicaux-et-grammaticaux"
  },
  {
    "key": "fr-016",
    "topic": "homophones",
    "title": "Français — Ces et ses",
    "content": "Ces désigne : ces morceaux-là. Ses marque la possession : ses morceaux à elle. Choisir selon le sens, pas selon le son.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22645/lorthographe/homophones-lexicaux/les-homophones-lexicaux-et-grammaticaux"
  },
  {
    "key": "fr-017",
    "topic": "homophones",
    "title": "Français — La et là",
    "content": "La est un déterminant ou un pronom : la chanson, je la diffuse. Là indique notamment un lieu ou un moment : je suis là.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22600/la-grammaire/les-homophones-grammaticaux/les-homophones-la-et-la"
  },
  {
    "key": "fr-018",
    "topic": "homophones",
    "title": "Français — Quelle et qu’elle",
    "content": "Quelle est un déterminant interrogatif ou exclamatif : quelle chanson ? Qu’elle associe que et elle : je souhaite qu’elle revienne.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22601/la-grammaire/les-homophones-grammaticaux/les-homophones-quelle-et-quelle"
  },
  {
    "key": "fr-019",
    "topic": "homophones",
    "title": "Français — Quand et quant à",
    "content": "Quand indique notamment le temps et peut signifier lorsque. Quant à signifie en ce qui concerne : quant à la météo, elle arrive ensuite.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/21645/la-grammaire/les-homophones-grammaticaux/les-homophones-quand-et-quant"
  },
  {
    "key": "fr-020",
    "topic": "homophones",
    "title": "Français — Aussitôt et aussi tôt",
    "content": "Aussitôt signifie immédiatement ; aussi tôt compare la précocité. Le choix dépend du sens : elle arrive aussitôt, elle arrive aussi tôt que moi.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/21138/la-grammaire/les-homophones-grammaticaux/les-homophones-aussitot-et-aussi-tot"
  },
  {
    "key": "fr-021",
    "topic": "conjugaison",
    "title": "Français — Présent : être et avoir",
    "content": "Être : je suis, tu es, il est, nous sommes, vous êtes, ils sont. Avoir : j’ai, tu as, il a, nous avons, vous avez, ils ont.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/conjugaison"
  },
  {
    "key": "fr-022",
    "topic": "conjugaison",
    "title": "Français — Présent : aller et faire",
    "content": "Aller : je vais, tu vas, il va, nous allons, vous allez, ils vont. Faire : je fais, tu fais, il fait, nous faisons, vous faites, ils font.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/conjugaison"
  },
  {
    "key": "fr-023",
    "topic": "conjugaison",
    "title": "Français — Présent des verbes réguliers en er",
    "content": "Pour chanter : je chante, tu chantes, il chante, nous chantons, vous chantez, ils chantent. Aller est irrégulier malgré sa finale en er.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/conjugaison"
  },
  {
    "key": "fr-024",
    "topic": "conjugaison",
    "title": "Français — Terminaisons du futur simple",
    "content": "Les terminaisons du futur simple sont ai, as, a, ons, ez, ont : je diffuserai, vous diffuserez. Certains radicaux sont irréguliers : je serai, j’aurai, j’irai.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/conjugaison"
  },
  {
    "key": "fr-025",
    "topic": "conjugaison",
    "title": "Français — Terminaisons du conditionnel présent",
    "content": "Le conditionnel présent emploie le radical du futur et les terminaisons de l’imparfait : ais, ais, ait, ions, iez, aient. Exemple : je diffuserais, vous diffuseriez.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/24137/la-grammaire/le-verbe/conjugaison/formes-du-conditionnel"
  },
  {
    "key": "fr-026",
    "topic": "conjugaison",
    "title": "Français — Impératif et pronom sujet",
    "content": "À l’impératif, le pronom sujet n’est pas exprimé : écoutez, profitez, restez. Pour les verbes usuels en er, la deuxième personne du singulier s’écrit sans s : écoute.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/conjugaison"
  },
  {
    "key": "fr-027",
    "topic": "conjugaison",
    "title": "Français — Temps composés et auxiliaires",
    "content": "Un temps composé associe avoir ou être à un participe passé. Le choix de l’auxiliaire dépend du verbe et de son emploi : elle est sortie, elle a sorti le disque.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre"
  },
  {
    "key": "fr-028",
    "topic": "accords",
    "title": "Français — Adjectif attribut du sujet",
    "content": "Un adjectif après être ou un autre verbe attributif s’accorde avec le sujet : les auditrices sont ravies, les titres semblent nouveaux.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/23495/la-grammaire/ladjectif/accord-de-ladjectif-attribut/accord-de-ladjectif-attribut-du-sujet"
  },
  {
    "key": "fr-029",
    "topic": "accords",
    "title": "Français — Participe passé employé seul",
    "content": "Employé sans auxiliaire, le participe passé fonctionne comme un adjectif et s’accorde avec le nom : une émission préparée, des émissions préparées.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/24304/la-grammaire/la-grammaire-actuelle/les-classes-de-mots-et-les-groupes/ladjectif-et-le-groupe-adjectival"
  },
  {
    "key": "fr-030",
    "topic": "accords",
    "title": "Français — Participe passé suivi d’un infinitif",
    "content": "Avec avoir suivi d’un infinitif, vérifier si le complément direct antéposé accomplit l’action de l’infinitif : les artistes que j’ai entendus chanter, mais les chansons que j’ai entendu chanter.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/21859/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-avoir/accord-du-participe-passe-suivi-dun-infinitif"
  },
  {
    "key": "fr-031",
    "topic": "accords",
    "title": "Français — Pronominal : complément direct ou indirect",
    "content": "L’accord des verbes pronominaux demande une analyse : elles se sont lavées, mais elles se sont parlé. Ne pas appliquer automatiquement l’accord avec le sujet à tous les verbes pronominaux.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/banque-de-depannage-linguistique/la-grammaire"
  },
  {
    "key": "fr-032",
    "topic": "accords",
    "title": "Français — Bonne écoute : accord féminin",
    "content": "Écoute est féminin : écrire bonne écoute et très bonne écoute. Une formule citée comme exemple de style doit aussi être relue avant sa réutilisation.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-033",
    "topic": "syntaxe",
    "title": "Français — Sujet éloigné du verbe",
    "content": "Ne pas accorder le verbe avec le nom le plus proche : le choix des chansons est varié. Le sujet est choix, pas chansons.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/accord-du-verbe-avec-le-sujet"
  },
  {
    "key": "fr-034",
    "topic": "syntaxe",
    "title": "Français — Qui : accord avec l’antécédent",
    "content": "Dans c’est moi qui suis à l’antenne et c’est vous qui écoutez, le verbe de la relative s’accorde avec l’antécédent du pronom qui.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/la-grammaire/le-verbe/accord-du-verbe-avec-le-sujet"
  },
  {
    "key": "fr-035",
    "topic": "syntaxe",
    "title": "Français — Pronoms clairs",
    "content": "Un pronom doit renvoyer clairement à la personne ou à la chose visée. Répéter le nom si plusieurs antécédents rendent la phrase ambiguë.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-036",
    "topic": "syntaxe",
    "title": "Français — Négation et style oral",
    "content": "Préparer un français correct tout en gardant une voix naturelle. Les tournures familières voulues peuvent rester orales, mais elles ne justifient pas des accords ou une conjugaison erronés.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-037",
    "topic": "ponctuation",
    "title": "Français — Point et phrases complètes",
    "content": "Le point termine une phrase déclarative. Pour la radio, il aide à séparer des idées et à produire des pauses lisibles sans fragmenter excessivement le propos.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/23403/la-ponctuation/point/generalites-sur-le-point"
  },
  {
    "key": "fr-038",
    "topic": "ponctuation",
    "title": "Français — Questions directes et indirectes",
    "content": "Une question directe se termine par un point d’interrogation : êtes-vous prêts ? Une interrogation indirecte n’en exige pas : je me demande si vous êtes prêts.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/23383/la-ponctuation/phrase-interrogative-et-emploi-du-point-dinterrogation"
  },
  {
    "key": "fr-039",
    "topic": "ponctuation",
    "title": "Français — Ponctuation et sens",
    "content": "La ponctuation sert à structurer le sens et la syntaxe, pas seulement à noter une respiration. Choisir des pauses naturelles sans déformer le lien entre les mots.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/23323/la-ponctuation/ponctuation-principes-generaux"
  },
  {
    "key": "fr-040",
    "topic": "orthographe",
    "title": "Français — Homophones : vérifier le sens",
    "content": "Deux mots peuvent avoir le même son et une orthographe différente. La catégorie grammaticale et le sens de la phrase guident le choix : ne pas corriger à partir du seul son.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/22645/lorthographe/homophones-lexicaux/les-homophones-lexicaux-et-grammaticaux"
  },
  {
    "key": "fr-041",
    "topic": "prononciation",
    "title": "Français — Liaison : contexte obligatoire, facultatif ou interdit",
    "content": "Une liaison se traite selon le contexte grammatical et le mot suivant. Il existe des liaisons obligatoires, facultatives et interdites ; ne pas les produire à chaque consonne finale.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/23552/la-prononciation/liaisons/contextes-de-liaisons-interdites"
  },
  {
    "key": "fr-042",
    "topic": "prononciation",
    "title": "Français — Vingt et sa consonne finale",
    "content": "Le t de vingt est muet dans de nombreux emplois, mais se prononce notamment dans vingt et un. Ne pas prononcer automatiquement vingt de la même manière dans tous les contextes.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/23141/la-prononciation/prononciation-des-nombres/prononciation-de-vingt"
  },
  {
    "key": "fr-043",
    "topic": "prononciation",
    "title": "Français — Huit devant une consonne",
    "content": "La prononciation de huit dépend du contexte : son t est généralement audible isolément, mais habituellement muet devant une consonne, comme dans huit personnes.",
    "source": "https://vitrinelinguistique.oqlf.gouv.qc.ca/23149/la-prononciation/prononciation-des-nombres/prononciation-de-huit"
  },
  {
    "key": "fr-044",
    "topic": "expression_orale",
    "title": "Français — Noms propres et titres étrangers",
    "content": "Respecter l’orthographe originale des artistes, villes et titres. Une aide phonétique relève du lexique vocal et ne doit pas remplacer leur nom officiel dans la base de connaissances.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-045",
    "topic": "expression_orale",
    "title": "Français — Chiffres et heures sans altération",
    "content": "Rendre les nombres faciles à dire sans changer leur valeur. Une relecture linguistique ne doit jamais transformer une heure, une température, une date ou un nombre d’auditeurs.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-046",
    "topic": "expression_orale",
    "title": "Français — Jaya parle au féminin",
    "content": "Lorsque Jaya parle d’elle-même, employer les accords féminins pertinents : je suis ravie, je suis prête. Ne pas imposer ce genre aux personnes dont on ignore le genre.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-047",
    "topic": "expression_orale",
    "title": "Français — Variété et précision du vocabulaire",
    "content": "Varier les mots et les transitions sans remplacer un terme précis par un synonyme trompeur. Garder les consignes d’antenne et éviter les expressions bannies par Gaby.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  },
  {
    "key": "fr-048",
    "topic": "expression_orale",
    "title": "Français — Français naturel sans cours à l’antenne",
    "content": "Appliquer les connaissances linguistiques dans la rédaction. Ne pas ajouter un cours de grammaire, une règle ou une référence bibliographique à un flash ou à une intervention musicale.",
    "source": "Consignes validées par Gaby pour Technorizon, 30 septembre 2026"
  }
];
const CORE="FRANÇAIS — relecture silencieuse obligatoire avant de livrer le texte : orthographe, conjugaison, accords, homophones, syntaxe et ponctuation. Jaya parle au féminin pour elle-même. Préserver le ton oral chaleureux et les tournures familières intentionnelles. Ne jamais changer les faits, nombres, dates, horaires, noms propres ni titres étrangers. Ne pas réciter de règle de grammaire à l'antenne. Le s de Technorizons est muet exclusivement pour ce nom ; les autres consonnes finales dépendent du mot et du contexte. Les aides phonétiques appartiennent au lexique vocal, pas au nom officiel affiché.";
function normalize(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function isFrenchQuestion(q){return /orthograph|conjug|grammaire|francais|homophone|participe|infinitif|subjonctif|conditionnel|accord|prononc|pluriel|singulier|comment.{0,15}ecri/.test(normalize(q))}
function instructions(rows=[],question=""){
 const words=[...new Set(normalize(question).split(/[^a-z0-9]+/).filter(x=>x.length>=3))];
 const eligible=rows.filter(r=>r.category===CATEGORY&&r.status!=="inactive");
 const selected=eligible.map(r=>({r,score:words.reduce((n,w)=>n+(normalize(r.title).includes(w)?3:normalize(r.content).includes(w)?1:0),0)}))
  .sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.r);
 return CORE+(selected.length?"\nFiches de français validées (à appliquer seulement si pertinentes) :\n"+selected.map(r=>r.title+": "+String(r.content).split("\nRéférence :")[0]).join("\n"):"");
}
async function enrich(supabaseUrl,headers){
 const url=supabaseUrl+"/rest/v1/knowledge";
 const existing=[];
 for(let offset=0;;offset+=1000){
  const r=await fetch(url+"?select=title,status,visibility&category=eq."+CATEGORY+"&order=id.asc&limit=1000&offset="+offset,{headers,signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error("Lecture français HTTP "+r.status);
  const page=await r.json();existing.push(...page);if(page.length<1000)break;
 }
 // Existing or human-edited rows are never overwritten or silently reactivated.
 const titles=new Set(existing.map(r=>r.title));
 const batch=RULES.filter(r=>!titles.has(r.title)).slice(0,BATCH_SIZE);
 let inserted=[];
 if(batch.length){
  const rows=batch.map(r=>({category:CATEGORY,title:r.title,content:r.content+"\nRéférence : "+r.source+"\nCorpus relu Technorizon : 30 septembre 2026.",status:"active",visibility:"public"}));
  const r=await fetch(url,{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(rows),signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error("Insertion français HTTP "+r.status+": "+(await r.text()).slice(0,200));
  inserted=await r.json();
  if(inserted.length!==rows.length||rows.some(row=>!inserted.some(x=>x.title===row.title&&x.content===row.content&&x.status==="active"&&x.visibility==="public")))
   throw new Error("Insertion des connaissances françaises non confirmée");
 }
 return {state:"verified",added:inserted.length,available:existing.filter(r=>r.status==="active"&&r.visibility==="public").length+inserted.length,
  corpus_total:RULES.length,remaining:RULES.filter(r=>!titles.has(r.title)&&!inserted.some(x=>x.title===r.title)).length,
  batch_size:BATCH_SIZE,topics:[...new Set(RULES.map(r=>r.topic))],titles:inserted.map(r=>r.title)};
}
module.exports={CATEGORY,BATCH_SIZE,RULES,CORE,instructions,isFrenchQuestion,enrich};
