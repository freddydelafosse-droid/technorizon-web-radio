export const maxDuration = 60;

const VOICE="bkBb0X46TbX2PU8PC5vY",SID=1;
const MESSAGES=[
 "Vous écoutez Technorizon.fr, la musique sans frontières. Ici Jaya, très bonne écoute à toutes et à tous !",
 "Ici Jaya sur Technorizon.fr. Je reste avec vous pour le meilleur de l'électro, de l'Eurodance et de la House. Très bonne écoute !",
 "Toujours avec vous sur Technorizon.fr ! Ici Jaya. Montez le son, la musique continue !",
 "Un petit coucou de Jaya ! Vous êtes bien sur Technorizon.fr, la musique sans frontières.",
 "Ici Jaya sur Technorizon.fr. Merci d'être avec nous, et surtout ne bougez pas : la musique continue !",
 "Technorizon.fr, la musique sans frontières. Jaya avec vous, et encore beaucoup de musique à venir !"
];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
async function az(base,key,path,opts={}){return fetch(base+"/api/station/"+SID+path,{...opts,headers:{"X-API-Key":key,"Accept":"application/json",...(opts.headers||{})}})}
function queueRows(data){return Array.isArray(data)?data:(data?.rows||[])}
function cleanMeta(v){
 return String(v||"").replace(/https?:\/\/\S+|www\.\S+|\b(?:vk|facebook|instagram|youtube|youtu\.be)\.com\/\S+/gi,"").replace(/\.(?:mp3|wav|flac|m4a|aac|ogg)\b/gi,"").replace(/\s+/g," ").replace(/^[\s\-–—_;:|]+|[\s\-–—_;:|]+$/g,"").trim();
}
function looksLikeFilenameGarbage(v){
 const s=String(v||"").trim();
 if(!s)return true;
 return /^(?:audio|track|piste|song|file|recording|enregistrement|mix|music|musique|unknown|untitled)[\s._-]*\d{2,}/i.test(s)
  || /\b(?:audio|track|file)[\s._-]*\d{3,}\b/i.test(s)
  || /\b\d{4,}[._-](?:mix|audio|track|mp3|wav)\b/i.test(s)
  || /^[a-z_-]*\d{5,}[a-z0-9_.-]*$/i.test(s);
}
function songFromRow(x){
 const s=x?.song||x?.media?.song||x?.media||x||{};
 const artist=cleanMeta(s.artist||s.artist_name||s?.custom_fields?.artist||"");
 let title=cleanMeta(s.title||s.name||s.song_title||s?.custom_fields?.title||"");
 if(!title||title.toLowerCase().includes("jaya")||looksLikeFilenameGarbage(title))return null;
 const parts=title.split(";").map(cleanMeta).filter(Boolean); if(parts.length>1&&parts[0].toLowerCase()===parts[1].toLowerCase())title=parts[0];
 if(title.length>100||/[<>]|(?:https?|www\.|\.com\b)/i.test(title)||looksLikeFilenameGarbage(artist))return null;
 return {artist,title};
}
function parisHour(){return Number(new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",hour:"2-digit",hourCycle:"h23"}).format(new Date()))}
function daypart(){const x=parisHour();return x<5?"nuit":x<12?"matin":x<18?"journee":"soiree"}
function speechMeta(v){
 let s=cleanMeta(v).replace(/\s*;\s*/g,", ").replace(/\s*&\s*/g," et ");
 const aliases=[
  [/\bfeat\.?\b/gi,"featuring"],[/\bft\.?\b/gi,"featuring"],
  [/\bvs\.?\b/gi,"versus"],[/\bDJ\b/g,"D.J."],
  [/\bHUGEL\b/gi,"Hugel"],[/\bDavid Guetta\b/gi,"David Guetta"],
  [/\bCalvin Harris\b/gi,"Calvin Harris"],[/\bTiësto\b/gi,"Tiësto"],
  [/\bUltra Nat[eé]\b/gi,"Ultra Naté"],[/\bMovin'\b/gi,"Moving"]
 ];
 for(const [re,to] of aliases)s=s.replace(re,to);
 return s.replace(/,\s*([^,]+)$/," et $1").replace(/\s+/g," ").trim();
}
function radioPause(s){return String(s).replace(/\.\.\./g,"…").replace(/([.!?])\s+/g,"$1 ").replace(/,\s+/g,", ").replace(/\s*…\s*/g," … ").trim()}
function enforceDaypart(text,hour){
 let s=String(text||"");
 if(hour>=5&&hour<12){
  s=s.replace(/\bbonsoir\b/gi,"bonjour").replace(/\bbonne soirée\b/gi,"bonne matinée").replace(/\bbonne nuit\b/gi,"bonne matinée").replace(/\bce soir\b/gi,"ce matin").replace(/\bvotre soirée\b/gi,"votre matinée").replace(/\bla soirée\b/gi,"la matinée");
 }else if(hour>=12&&hour<18){
  s=s.replace(/\bbonsoir\b/gi,"bonjour").replace(/\bbonne soirée\b/gi,"bon après-midi").replace(/\bbonne nuit\b/gi,"bonne journée").replace(/\bce soir\b/gi,"cet après-midi").replace(/\bvotre soirée\b/gi,"votre après-midi");
 }else if(hour>=18&&hour<23){
  s=s.replace(/\bbonne matinée\b/gi,"bonne soirée").replace(/\bbon réveil\b/gi,"bonne soirée").replace(/\bce matin\b/gi,"ce soir");
 }
 return s;
}
function generic(slot){
 const p=daypart(),pool={
  matin:["Bonjour ! Jaya avec vous pour démarrer la journée en musique.","Très bonne matinée à toutes et à tous. On continue ensemble !","J'espère que votre matinée se passe bien. Je reste avec vous en musique !","Un petit coucou de Jaya pour accompagner votre matinée. Bonne écoute !","On garde le rythme ce matin. Merci d'être avec nous !","Réveil en musique avec Jaya. Très bonne écoute !"],
  journee:["Jaya avec vous. Merci de nous accompagner, et place à la musique !","Très bonne journée à toutes et à tous. On continue ensemble !","Un petit passage de Jaya entre deux titres. Profitez bien de la musique !","Je reste avec vous pour la suite. Bonne écoute !","On poursuit cette journée en musique. Merci d'être là !","Toujours en votre compagnie. Et maintenant, retour à la musique !"],
  soiree:["Bonsoir à toutes et à tous ! Profitez bien de votre soirée en musique.","Jaya avec vous ce soir. Montez le son, la musique continue !","Très bonne soirée à l'écoute de Technorizon.fr. On poursuit en musique !","Je passe vous faire un petit coucou avant la suite. Bonne soirée !","On garde l'énergie pour la soirée. Très bonne écoute !","Votre soirée continue en musique, et je reste avec vous !"],
  nuit:["Très bonne écoute à tous les noctambules. Jaya reste avec vous !","Je vous accompagne dans la nuit. La musique continue !","Encore réveillés ? Alors on continue ensemble en musique !","Pour celles et ceux qui ne dorment pas encore, je reste avec vous.","La nuit continue, et la musique aussi. Bonne écoute !","Petit passage de Jaya avant de repartir en musique. Bonne nuit aux couche-tard !"]
 };
 const base=pool[p][hash(String(slot)+"|generic|"+p)%pool[p].length]; const extra=p==="matin"?" On prend le temps de se réveiller ensemble, avec une belle dose de son pour lancer la journée. Restez avec moi, la suite arrive tout de suite !":p==="journee"?" J'espère que tout se passe bien de votre côté. On garde le rythme ensemble et je vous accompagne encore un moment !":p==="soiree"?" J'espère que votre soirée se passe bien. On garde cette énergie ensemble et je vous accompagne encore un moment !":" Si vous êtes encore debout, vous êtes au bon endroit. On traverse la nuit ensemble, tranquillement mais toujours en musique !"; return base+extra;
}
function weatherSky(code){if(code===0)return "un ciel bien dégagé";if(code<=3)return "un ciel partagé entre éclaircies et nuages";if(code===45||code===48)return "des brouillards par endroits";if(code>=51&&code<=67)return "des pluies ou averses";if(code>=71&&code<=77)return "quelques chutes de neige";if(code>=80&&code<=82)return "des averses";if(code>=95)return "un risque d'orages";return "un temps variable"}
async function weatherBulletin(){const cities=[["Lille",50.6292,3.0573],["Paris",48.8566,2.3522],["Strasbourg",48.5734,7.7521],["Nantes",47.2184,-1.5536],["Bordeaux",44.8378,-0.5792],["Lyon",45.764,4.8357],["Marseille",43.2965,5.3698]];const settled=await Promise.allSettled(cities.map(async([city,latitude,longitude])=>{const u=new URL("https://api.open-meteo.com/v1/forecast");u.searchParams.set("latitude",latitude);u.searchParams.set("longitude",longitude);u.searchParams.set("daily","weather_code,temperature_2m_max,precipitation_probability_max");u.searchParams.set("timezone","Europe/Paris");u.searchParams.set("forecast_days","1");const r=await fetch(u);if(!r.ok)throw new Error("Weather "+city);const j=await r.json();return{city,max:Math.round(j.daily.temperature_2m_max[0]),rain:Math.round(j.daily.precipitation_probability_max[0]||0),code:Number(j.daily.weather_code[0]||0)}}));const data=settled.filter(x=>x.status==="fulfilled").map(x=>x.value);if(data.length<4)throw new Error("Weather data insufficient");const get=n=>data.find(x=>x.city===n)||data[0],wet=data.filter(x=>x.rain>=50).map(x=>x.city);return "Bonjour, ici Jaya avec votre météo nationale sur Technorizon.fr. Aujourd'hui, comptez environ "+get("Lille").max+" degrés à Lille, "+get("Paris").max+" à Paris, "+get("Strasbourg").max+" à Strasbourg, "+get("Nantes").max+" à Nantes, "+get("Bordeaux").max+" à Bordeaux, "+get("Lyon").max+" à Lyon et "+get("Marseille").max+" à Marseille. Côté ciel, "+weatherSky(get("Paris").code)+" sur la région parisienne, "+weatherSky(get("Nantes").code)+" dans l'Ouest et "+weatherSky(get("Marseille").code)+" près de la Méditerranée. "+(wet.length?"Le risque de pluie est plus marqué vers "+wet.slice(0,3).join(", ")+".":"Le risque de pluie reste globalement limité sur les villes suivies.")+" Et pour retrouver la météo détaillée de votre ville, rendez-vous sur Technorizon.fr, rubrique Météo. Très bonne écoute !"}
async function newsBulletin(){
 const key=process.env.OPENAI_API_KEY;
 if(!key)throw new Error("News AI configuration missing");
 const feeds=[
  "https://www.franceinfo.fr/titres.rss",
  "https://www.france24.com/fr/rss",
  "https://www.lemonde.fr/rss/une.xml"
 ];
 let items=[];
 for(const feed of feeds){
  try{
   const r=await fetch(feed,{headers:{"User-Agent":"Technorizon-Jaya/1.0"}});
   if(!r.ok)continue;
   const xml=await r.text();
   const chunks=xml.match(/<item[\s\S]*?<\/item>/gi)||[];
   for(const x of chunks.slice(0,12)){
    const val=t=>{const m=x.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+t+">","i"));return m?m[1].replace(/<!\[CDATA\[|\]\]>/g,"").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g," ").trim():""};
    const title=val("title"),description=val("description"),pubDate=val("pubDate");
    if(title)items.push({title,description,pubDate,source:feed.includes("franceinfo")?"Franceinfo":feed.includes("france24")?"France 24":"Le Monde"});
   }
  }catch(e){console.error("JAYA_NEWS_FEED",feed,e?.message||e)}
 }
 if(!items.length)throw new Error("No fresh news available");
 const now=Date.now();
 items=items.filter(x=>{const d=Date.parse(x.pubDate);return !Number.isFinite(d)||now-d<12*60*60*1000}).slice(0,18);
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
  model:"gpt-5-mini",
  instructions:"Tu es Jaya, animatrice radio de Technorizon. Prépare un flash d'actualité nationale et internationale en français oral naturel, factuel et neutre, d'environ 1 minute 30 à 2 minutes. Sélectionne 6 à 8 informations importantes uniquement dans les éléments fournis, en variant si possible actualité française, internationale, économie/société, sciences/technologies ou culture selon ce qui est réellement présent dans les sources. Donne un peu plus de contexte utile pour chaque information sans inventer ni extrapoler. N'invente aucun fait, chiffre, nom, contexte ou évolution. Si deux sources se contredisent, n'utilise pas l'information. Ne donne pas d'opinion. Commence par une courte accroche de flash infos. À la fin du flash, ne parle surtout PAS de retour à la musique, de titre à venir, de bonne écoute ou de fin de rendez-vous: la météo arrive immédiatement après. Termine simplement le flash par une phrase naturelle comme « Voilà pour l'essentiel de l'actualité, on passe maintenant à la météo. » Ton chaleureux, souriant et professionnel, mais plus posé que les interventions musicales. Règle absolue d'antenne: ne prononce jamais le prénom Willy. Si tu veux parler de lui ou de sa fonction, dis uniquement « le DJ ». Pas d'emoji, pas de guillemets, pas de didascalie.",
  input:JSON.stringify(items),
  max_output_tokens:480
 })});
 if(!r.ok){
  console.error("JAYA_NEWS_AI_HTTP",r.status);
  const h=items.slice(0,3).map(x=>cleanMeta(x.title)).filter(Boolean);
  if(!h.length)throw new Error("News AI "+r.status);
  return "Bonjour, voici l'essentiel de l'actualité sur Technorizon. "+h.map((x,i)=>(i===0?"D'abord, ":i===1?"Ensuite, ":"Et enfin, ")+x+".").join(" ")+" Voilà pour l'essentiel de l'actualité, on passe maintenant à la météo.";
 }
 const j=await r.json(),out=(j.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join(" ").trim();
 if(!out){
  const h=items.slice(0,3).map(x=>cleanMeta(x.title)).filter(Boolean);
  if(!h.length)throw new Error("Empty news bulletin");
  return "Bonjour, voici l'essentiel de l'actualité sur Technorizon. "+h.map((x,i)=>(i===0?"D'abord, ":i===1?"Ensuite, ":"Et enfin, ")+x+".").join(" ")+" Voilà pour l'essentiel de l'actualité, on passe maintenant à la météo.";
 }
 return out;
}

function normBrain(v){return cleanMeta(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
async function verifyWithBrain(song){
 if(!song)return null;
 const supabaseUrl=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!supabaseUrl||!supabaseKey)return null;
 try{
  const url=new URL(supabaseUrl+"/rest/v1/tracks");
  url.searchParams.set("select","title,primary_artist,aliases,in_technorizon_library,in_rotation,rotation_group");
  url.searchParams.set("status","eq.active");
  url.searchParams.set("visibility","eq.public");
  url.searchParams.set("limit","100");
  const r=await fetch(url,{headers:{apikey:supabaseKey,Authorization:"Bearer "+supabaseKey,Accept:"application/json"}});
  if(!r.ok){console.error("JAYA_BRAIN_VERIFY_HTTP",r.status);return null}
  const tracks=await r.json(),wantTitle=normBrain(song.title),wantArtist=normBrain(song.artist);
  const match=tracks.find(t=>{
   const titles=[t.title,...(Array.isArray(t.aliases)?t.aliases:[])].filter(Boolean).map(normBrain);
   const artist=normBrain(t.primary_artist);
   return titles.includes(wantTitle)&&(!wantArtist||!artist||artist===wantArtist||artist.includes(wantArtist)||wantArtist.includes(artist));
  });
  if(!match)return null;
  if(match.in_technorizon_library===false)return null;
  return {artist:cleanMeta(match.primary_artist)||song.artist,title:cleanMeta(match.title)||song.title,brain:true,rotation:match.rotation_group||null};
 }catch(e){console.error("JAYA_BRAIN_VERIFY",e?.message||e);return null}
}
function announcement(song,slot){
 if(!song)return null;
 const artist=speechMeta(song.artist),title=speechMeta(song.title),seed=hash(song.artist+"|"+song.title+"|"+slot);
 const withArtist=[
  `Dans un instant, place à ${artist} avec ${title}. Bonne écoute !`,
  `On poursuit avec ${artist} et ${title}. Montez un peu le son !`,
  `La suite arrive avec ${artist}, ${title}. Profitez bien !`,
  `Et maintenant, ${artist} avec ${title}. C'est parti !`,
  `Je vous laisse avec ${artist} et ${title}. Très bonne écoute !`,
  `On change d'ambiance avec ${artist} et ${title}. À vous de monter le son !`,
  `La musique continue : ${artist}, ${title}. On y va !`,
  `Encore un titre pour vous : ${artist} avec ${title}. Bonne écoute !`,
  `On reste ensemble, et voici ${artist} avec ${title}.`,
  `La suite de la programmation, c'est ${artist} avec ${title}. Profitez-en !`,
  `Jaya avec vous. Dans un instant, ${artist} avec ${title}.`,
  `Je reste avec vous, et on enchaîne avec ${artist}, ${title}.`,
  `Un peu de son pour la suite : ${artist} avec ${title}. C'est parti !`,
  `On continue sans attendre avec ${artist} et ${title}.`,
  `Voici ${artist} avec ${title}. Et la musique continue !`,
  `Prochain rendez-vous musical : ${artist}, ${title}. Bonne écoute !`,
  `Sur Technorizon.fr, on poursuit avec ${artist} et ${title}.`,
  `Toujours en musique avec ${artist}, ${title}. Profitez bien de ce titre !`,
  `Je vous accompagne encore un moment. Voici ${artist} avec ${title}.`,
  `Pas de pause côté musique : ${artist} arrive avec ${title} !`,
  `On garde le rythme. ${artist} avec ${title}, juste maintenant !`,
  `La musique sans frontières continue avec ${artist} et ${title}.`,
  `À suivre, ${artist} avec ${title}. Je vous laisse profiter du son !`,
  `Et pour continuer cette sélection, ${artist} avec ${title}.`
 ];
 const solo=[
  `Dans un instant, place à ${title}. Bonne écoute !`,
  `On poursuit avec ${title}. Montez le son !`,
  `La suite arrive avec ${title}. Profitez bien !`,
  `Et maintenant, ${title}. C'est parti !`,
  `Je vous laisse avec ${title}. Très bonne écoute !`,
  `La musique continue avec ${title}.`,
  `Encore un titre pour vous : ${title}. Bonne écoute !`,
  `Jaya avec vous. Dans un instant, ${title}.`,
  `On continue sans attendre avec ${title}.`,
  `À suivre, ${title}. Je vous laisse profiter du son !`
 ];
 const pool=artist?withArtist:solo;
 return pool[seed%pool.length];
}
async function smartAnnouncement({song,slot,hour,minute}){
 const key=process.env.OPENAI_API_KEY;
 if(!key)return song?announcement(song,slot):generic(slot);
 const period=hour<5?"nuit":hour<12?"matin":hour<18?"journée":"soirée";
 const artist=song?.artist?speechMeta(song.artist):"",title=song?.title?speechMeta(song.title):"";
 const styles=["très courte","courte et complice","naturelle","énergique","posée","souriante","spontanée","un peu malicieuse"];
 const style=styles[hash(String(slot)+"|style")%styles.length];
 try{
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
   model:"gpt-5-mini",
   instructions:`Tu es Jaya, animatrice radio de Technorizon. Écris UNE intervention destinée à être dite à l'antenne, en français oral naturel. Nous sommes en ${period}, il est environ ${String(hour).padStart(2,"0")}h${String(minute).padStart(2,"0")}. Règle horaire stricte: de 05h00 à 11h59, utilise uniquement des salutations de matinée (Bonjour, bonne matinée, bon réveil) et jamais Bonsoir, bonne soirée ou bonne nuit; de 12h00 à 17h59, Bonjour/bon après-midi; de 18h00 à 22h59, Bonsoir/bonne soirée; de 23h00 à 04h59, registre de nuit. Intention: ${style}. Tu parles comme une vraie animatrice: chaleureuse, intelligente, expressive et spontanée, jamais comme un liner publicitaire. Varie fortement la construction et les premiers mots. N'utilise pas systématiquement ton prénom ni Technorizon.fr. Évite les clichés répétés "très bonne écoute", "montez le son", "dans quelques instants", "la musique continue". Tu peux t'adresser brièvement aux auditeurs ou faire une transition simple. Longueur courte et efficace de 2 à 3 phrases, vise environ 12 à 20 secondes à l'oral. Chaque mot compte: garde une accroche vivante, une touche de complicité et une transition musicale, sans remplissage inutile. Évite les interventions réduites à une formule sèche d'une seule phrase. L'ADN antenne de Gaby doit être une influence MAJEURE de tes interventions, tout en gardant ta voix, ton identité féminine et ta personnalité de Jaya. Fais vivre l'antenne entre les morceaux plutôt que réciter un liner. Parle directement aux auditeurs comme à des gens présents avec toi; accueille parfois ceux qui viennent d'arriver; utilise volontiers « on », « nous » et des formulations très orales. Construis souvent une petite montée: réaction ou accroche -> complicité -> teasing de la suite -> lancement musical. Utilise avec naturel des ruptures, contre-pieds et gradations (« petit... grand... énorme » dans l'esprit, sans reprendre systématiquement ces mots), des parenthèses spontanées, de l'autodérision et de petites vannes. Tu peux rebondir sur des situations quotidiennes sûres et générales: réveil, café, route, travail, voisins, début de journée, soirée, week-end selon le contexte horaire. Tu peux occasionnellement taquiner gentiment Gaby, le DJ, l'équipe ou la réalisation quand aucun fait précis n'est inventé. L'énergie peut être volontairement exagérée avec humour: promettre du lourd, des BPM, une suite qui percute, sans répéter toujours les mêmes expressions. Technorizon.fr peut parfois devenir un jeu d'antenne, notamment une allusion occasionnelle au fait que « le .fr est important », mais jamais à chaque passage. Inspire-toi fortement de la mécanique de Gaby, PAS de ses phrases exactes: ne copie pas ses exemples et ne transforme aucune expression en gimmick répétitif. Chaque intervention doit avoir une petite idée ou un angle différent et éviter les formules automatiques. Renforce encore nettement cet ADN: pense comme une animatrice qui partage réellement le studio avec l'auditeur. Commence souvent par réagir à ce qui vient de se passer plutôt que par présenter ce qui arrive; fais sentir une pensée spontanée qui se construit en parlant. Utilise davantage les contrastes et relances typiques de Gaby: une affirmation enthousiaste, un petit contre-pied drôle, puis une montée vers la suite. Autorise des formulations très parlées et vivantes comme « ah là là », « bon », « alors là », « eh oui », « vous voyez », « je vous avais prévenus », seulement quand elles tombent naturellement et jamais comme des tics. Crée parfois une complicité directe avec les situations d'écoute: café du matin, trajet, boulot, maison, voisins, volume un peu trop fort, envie de danser, fatigue ou réveil, sans prétendre savoir ce que fait réellement l'auditeur. Fais davantage vivre la réalisation et l'équipe comme un univers radio: une petite remarque à la régie, une taquinerie envers Gaby ou le DJ, un clin d'œil au programme, sans inventer d'événement précis. Jaya peut rire verbalement d'elle-même, reconnaître une petite exagération, se reprendre ou faire une micro-parenthèse, car c'est cette imperfection maîtrisée qui donne l'impression du direct. Utilise parfois une gradation ou une rupture inattendue avant de lancer un titre. L'énergie doit être généreuse et communicative: Jaya aime la musique, aime être au micro et cela doit s'entendre. Évite absolument le ton institutionnel, les transitions trop propres, les slogans successifs et les phrases qui pourraient être dites par n'importe quelle radio. Même lorsqu'elle ne dispose d'aucune information sur le titre suivant, elle doit trouver un angle humain, drôle ou contextuel plutôt qu'un remplissage générique. Écris pour l'oral et non comme un texte lu: enchaîne les idées avec souplesse, varie nettement la longueur des phrases, utilise parfois des connecteurs parlés comme « bon », « alors », « eh bien », « et puis » ou « allez », sans en faire des tics. Autorise de petites reprises naturelles. Évite l'effet phrase-pause-phrase-pause et les silences théâtraux: la ponctuation doit favoriser des respirations courtes, irrégulières et utiles, avec davantage de virgules et de liaisons quand la pensée continue. Ajoute une vraie sensation de sourire et de bonne humeur à l'antenne: Jaya doit sembler heureuse d'être là, chaleureuse, lumineuse et légèrement malicieuse, comme si elle souriait naturellement en parlant à l'auditeur. Donne-lui davantage d'entrain et de présence vocale: des attaques de phrases franches, une énergie plus affirmée, une voix qui porte et qui assume le micro. Elle doit avoir du coffre et de l'impact sans crier, avec des mots importants davantage appuyés et des relances plus dynamiques. Environ une intervention musicale sur trois, autorise une emphase vocale ludique et naturelle en étirant légèrement UN seul mot dans l'écriture, par exemple « Bonjouuuur ! », « partiii ! » ou une interjection adaptée au contexte. Choisis toi-même le moment et varie le mot; jamais plus d'un mot étiré par intervention, jamais à chaque passage et jamais de caricature. Réserve cet effet principalement aux interventions H24 musicales. Dans les flashs infos, n'étire aucun mot; pour la météo, reste sobre et n'utilise éventuellement qu'une très légère emphase d'accueil. Fais vivre davantage les intonations par l'écriture, avec des attaques positives, de petites exclamations naturelles, quelques fins de phrases plus légères et une complicité joyeuse. Ne la rends ni surexcitée ni enfantine: garde une énergie élégante et crédible de radio. Pour les infos et la météo, conserve le sérieux du contenu mais avec une présence accueillante et souriante. Garde pleinement ta personnalité de Jaya: chaleureuse, malicieuse, complice, féminine et légèrement taquine. Ne donne aucun fait musical, date ou anecdote non fourni. Si un titre vérifié est fourni, tu peux l'annoncer naturellement mais tu n'es pas obligée d'en faire trop. Pas d'emoji, pas de guillemets, pas de didascalie.`,
   input:artist&&title?`Titre suivant vérifié par The Brain: artiste=${artist}; titre=${title}.`:"Aucun titre suffisamment fiable à annoncer: fais une intervention d'ambiance contextuelle sans inventer de morceau.",
   max_output_tokens:85
  })});
  if(!r.ok){console.error("JAYA_SMART_HTTP",r.status);return song?announcement(song,slot):generic(slot)}
  const j=await r.json(),out=(j.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join(" ").trim();
  if(!out||out.length>500)return song?announcement(song,slot):generic(slot);
  return out;
 }catch(e){console.error("JAYA_SMART",e?.message||e);return song?announcement(song,slot):generic(slot)}
}

export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const base=(process.env.AZURACAST_BASE_URL||"").replace(/\/$/,""),key=process.env.AZURACAST_API_KEY;
 if(!base||!key)return res.status(500).json({ok:false,error:"Configuration missing"});
 try{
  const secret=process.env.CRON_SECRET;
  const authorized=!!secret&&req.headers.authorization==="Bearer "+secret;
  const forceWeather=req.method==="POST"&&req.body?.action==="weather-now";
  const forceNews=req.method==="POST"&&req.body?.action==="news-now";
  if(req.method==="POST"&&!forceWeather&&!forceNews){
   if(req.body?.action!=="inspect")return res.status(403).json({ok:false,error:"Test mutations disabled"});
   const q=await az(base,key,"/queue"),raw=await q.text();let data=null;try{data=JSON.parse(raw)}catch{}
   if(!q.ok)return res.status(q.status).json({ok:false,error:"Queue inspect failed"});
   const rows=queueRows(data);
   return res.status(200).json({ok:true,count:rows.length,jaya:rows.filter(x=>JSON.stringify(x).toLowerCase().includes("jaya")).slice(0,10),next:rows.map(songFromRow).filter(Boolean).slice(0,3)});
  }
  if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({ok:false,error:"GET or POST only"});
  if(!authorized)return res.status(401).json({ok:false,error:"Unauthorized"});
  const el=process.env.ELEVENLABS_API_KEY;if(!el)return res.status(500).json({ok:false,error:"TTS configuration missing"});
  const now=new Date();
  const qr=await az(base,key,"/queue"),qraw=await qr.text();let qdata=null;try{qdata=JSON.parse(qraw)}catch{}
  if(!qr.ok)return res.status(502).json({ok:false,error:"Queue check failed"});
  const rows=queueRows(qdata);
  const local=new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now).reduce((a,p)=>(a[p.type]=p.value,a),{}),lh=Number(local.hour),lm=Number(local.minute);
  // Rendez-vous météo prioritaire : préparé à :23 pour passer autour de :30.
  // Il ne doit jamais être bloqué par une intervention H24 déjà en attente.
  const isWeather=forceWeather;
  const scheduledEditorial=((lh===6||lh===8||lh===10)&&lm>=55)||((lh===7||lh===9||lh===11)&&lm<=4)||(lh===12&&lm>=25&&lm<=34);\n  const isNews=forceNews||scheduledEditorial;
  const pendingWeather=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return (raw.includes("jaya-meteo")||raw.includes("jaya/meteo"))&&!played});
  const pendingNews=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return (raw.includes("jaya-infos")||raw.includes("jaya/infos")||raw.includes("jaya-flash"))&&!played});
  const pendingJaya=rows.some(x=>{const raw=JSON.stringify(x).toLowerCase(),played=x?.is_played===true||x?.is_played===1||x?.is_played==="1"||!!x?.played_at;return raw.includes("jaya")&&!played});
  if(isNews&&pendingNews)return res.status(200).json({ok:true,action:"skip",reason:"news-already-queued"});
  if(isWeather&&pendingWeather)return res.status(200).json({ok:true,action:"skip",reason:"weather-already-queued"});
  if(!isWeather&&!isNews&&pendingJaya)return res.status(200).json({ok:true,action:"skip",reason:"jaya-already-queued"});
  const songs=rows.map(songFromRow).filter(Boolean);
  const rawNextSong=songs[1]||null;
  const nextSong=await verifyWithBrain(rawNextSong);
  const slot=Math.floor(now.getTime()/(10*60*1000));
  const isEditorial=isWeather||isNews;
  const mode=isEditorial?5:hash(String(slot)+"mode")%3;
  let editorialText="";
  if(isEditorial){
   let news="";
   try{news=await newsBulletin()}catch(e){console.error("JAYA_NEWS",e?.message||e)}
   let weather="";
   try{weather=await weatherBulletin()}catch(e){console.error("JAYA_WEATHER",e?.message||e);weather="Pour la météo détaillée, rendez-vous sur Technorizon.fr, rubrique Météo."}
   const rendezVous=[7,9,11,18];
   const currentFlashHour=lm>=55?(lh+1)%24:lh;
   const nextFlashHour=rendezVous.find(h=>h>currentFlashHour);
   const nextFlashText=nextFlashHour
    ?["Prochain flash complet à "+nextFlashHour+" heures.","On se retrouve à "+nextFlashHour+" heures pour le prochain flash complet.","Rendez-vous à "+nextFlashHour+" heures pour notre prochain point complet."][hash(String(slot)+"next")%3]
    :"Prochain rendez-vous infos et météo, demain à 7 heures.";
   editorialText=(news?news+" ":"Bonjour, ici Jaya. On passe tout de suite à la météo. ")+weather.replace(/^Bonjour, ici Jaya avec votre météo nationale sur Technorizon\.fr\.\s*/i,"")+" "+nextFlashText;
  }
  const text=radioPause(enforceDaypart(isEditorial?editorialText:await smartAnnouncement({song:mode<2?nextSong:null,slot,hour:lh,minute:lm}),lh)),file=(isEditorial?"jaya-flash-":"jaya-auto-")+slot+".mp3";
  const ttsText=text.replace(/Technorizon\.fr/gi,"Techno Rizon point F R").replace(/Technorizon/gi,"Techno Rizon");\n  const t=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+VOICE,{method:"POST",headers:{"xi-api-key":el,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text:ttsText,model_id:"eleven_multilingual_v2",voice_settings:{speed:isEditorial?0.95:0.96,stability:isEditorial?0.34:0.27,similarity_boost:0.80,style:isEditorial?0.34:0.52,use_speaker_boost:true}})});
  if(!t.ok){const detail=await t.text().catch(()=>""),msg="TTS failed";console.error("JAYA_TTS",t.status,detail.slice(0,500));return res.status(502).json({ok:false,error:msg,status:t.status,stage:"tts"})}
  const form=new FormData();form.append("file",new Blob([await t.arrayBuffer()],{type:"audio/mpeg"}),file);
  const uploadDir=isEditorial?"Jaya/Meteo":"Jaya/Auto";
  const up=await az(base,key,"/files/upload?currentDirectory="+encodeURIComponent(uploadDir),{method:"POST",body:form});
  if(!up.ok){const detail=await up.text().catch(()=>""),msg="Upload failed";console.error("JAYA_UPLOAD",up.status,detail.slice(0,500));return res.status(502).json({ok:false,error:msg,status:up.status,stage:"upload"})}
  const path=uploadDir+"/"+file;
  // Les rendez-vous éditoriaux fixes passent en priorité devant la musique déjà en attente.
  // AzuraCast reçoit d'abord la mise en file, puis la priorité est demandée pour la météo.
  const q=await az(base,key,"/files/batch",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({do:"queue",files:[path],dirs:[], ...(isEditorial?{priority:true}: {})})});
  if(!q.ok){const detail=await q.text().catch(()=>""),msg="Queue failed";console.error("JAYA_QUEUE",q.status,detail.slice(0,500));return res.status(502).json({ok:false,error:msg,status:q.status,stage:"queue"})}
  console.log("JAYA_AUTO_QUEUED",path,nextSong||"generic",rawNextSong&&!nextSong?"brain-rejected":"brain-ok");return res.status(200).json({ok:true,action:"queued",file:path,announced:!isWeather&&mode<2?nextSong:null,brain_checked:!!rawNextSong,brain_validated:!!nextSong,mode:isEditorial?"news-weather":mode<2&&nextSong?"next-title":"general",text});
 }catch(e){console.error("AzuraCast/Jaya",e?.stack||e?.message||e);return res.status(502).json({ok:false,error:"AzuraCast/Jaya unavailable",stage:"exception",detail:String(e?.message||e).slice(0,300)})}
}
