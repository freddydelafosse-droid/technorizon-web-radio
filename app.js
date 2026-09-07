const clock = document.getElementById('clock');

function tick() {
  clock.textContent = new Date().toLocaleTimeString('fr-FR', {hour12:false});
}
tick();
setInterval(tick, 1000);

const listenButton = document.getElementById('listen');
listenButton?.addEventListener('click', async () => {
  const player = document.getElementById('radioPlayer');

  document.getElementById('liveArea').scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  try {
    await player.play();
  } catch (error) {
    console.error('Lecture audio impossible :', error);
  }
});

/* ===== METEO INTERACTIVE ===== */

async function loadWeather(city) {
    const cityEl = document.getElementById('weatherCity');
    const dateEl = document.getElementById('weatherDate');
    const tempEl = document.getElementById('weatherTemp');
    const detailsEl = document.getElementById('weatherDetails');
    const statusEl = document.getElementById('weatherStatus');

    if (!city || !city.trim()) {
        statusEl.textContent = "Veuillez saisir une ville.";
        return;
    }

    statusEl.textContent = "Recherche de la météo...";

    try {
        const geoResponse = await fetch(
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(city.trim()) +
            "&count=1&language=fr&format=json"
        );

        const geoData = await geoResponse.json();

        if (!geoData.results || !geoData.results.length) {
            statusEl.textContent = "Ville introuvable.";
            return;
        }

        const place = geoData.results[0];
        const latitude = place.latitude;
        const longitude = place.longitude;

        const weatherResponse = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=" +
            latitude +
            "&longitude=" +
            longitude +
            "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
            "&daily=temperature_2m_max,temperature_2m_min" +
            "&timezone=auto"
        );

        const weather = await weatherResponse.json();

        const currentTemp = Math.round(weather.current.temperature_2m);
        const humidity = weather.current.relative_humidity_2m;
        const wind = Math.round(weather.current.wind_speed_10m);
        const max = Math.round(weather.daily.temperature_2m_max[0]);
        const min = Math.round(weather.daily.temperature_2m_min[0]);

        const weatherCodes = {
            0: "☀️ Ciel dégagé",
            1: "🌤️ Peu nuageux",
            2: "⛅ Partiellement nuageux",
            3: "☁️ Couvert",
            45: "🌫️ Brouillard",
            48: "🌫️ Brouillard givrant",
            51: "🌦️ Bruine légère",
            53: "🌦️ Bruine",
            55: "🌧️ Bruine forte",
            61: "🌧️ Pluie légère",
            63: "🌧️ Pluie",
            65: "🌧️ Forte pluie",
            71: "🌨️ Neige légère",
            73: "🌨️ Neige",
            75: "❄️ Forte neige",
            80: "🌦️ Averses",
            81: "🌦️ Averses modérées",
            82: "🌧️ Fortes averses",
            95: "⛈️ Orage",
            96: "⛈️ Orage avec grêle",
            99: "⛈️ Orage avec forte grêle"
        };

        const condition =
            weatherCodes[weather.current.weather_code] || "🌡️ Conditions météo";

        cityEl.textContent = place.name;
        dateEl.textContent = "Aujourd'hui";
        tempEl.textContent = currentTemp + "°C  " + condition;
        detailsEl.textContent =
            "↑ " + max + "°C   ↓ " + min + "°C   💧 " +
            humidity + "%   ≈ " + wind + " km/h";
        statusEl.textContent = "Météo actualisée.";

    } catch (error) {
        console.error(error);
        statusEl.textContent = "Impossible de récupérer la météo.";
    }
}

document.getElementById('cityButton').addEventListener('click', function () {
    loadWeather(document.getElementById('cityInput').value);
});

document.getElementById('cityInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        loadWeather(this.value);
    }
});

loadWeather("Dieppe");

/* ===== INFO AUTOMATIQUE ===== */

let newsIndex = 0;
let newsItems = [];

async function loadNews() {
    const titleEl = document.getElementById("newsTitle");
    const descriptionEl = document.getElementById("newsDescription");
    const timeEl = document.getElementById("newsTime");
    const linkEl = document.getElementById("newsLink");
    const statusEl = document.getElementById("newsStatus");

    if (!titleEl || !descriptionEl || !timeEl || !linkEl || !statusEl) return;

    statusEl.textContent = "Actualisation des dernières infos...";

    try {
        const rssUrl = "https://www.franceinfo.fr/titres.rss";
        const response = await fetch(rssUrl, { cache: "no-store" });

        if (!response.ok) throw new Error("Source Franceinfo inaccessible");

        const xml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");
        const rssItems = Array.from(doc.querySelectorAll("item"));

        const items = rssItems.map(item => {
            const title = item.querySelector("title")?.textContent?.trim() || "";
            const link = item.querySelector("link")?.textContent?.trim() || "";
            const description = item.querySelector("description")?.textContent?.trim() ||
                "Dernière actualité publiée par Franceinfo.";
            const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";

            return {
                title,
                description,
                time: pubDate ? new Date(pubDate).toLocaleString("fr-FR") : "Franceinfo • aujourd'hui",
                link
            };
        }).filter(item => item.title && item.link);

        if (!items.length) throw new Error("Aucune actualité Franceinfo trouvée");

        newsItems = items.slice(0, 20);
        newsIndex = 0;
        showNews();
        statusEl.textContent = "Actualisé automatiquement • source Franceinfo";

    } catch (error) {
        console.error("INFO Franceinfo :", error);
        statusEl.textContent = "Actualisation momentanément indisponible.";
    }
}

function showNews() {
    if (!newsItems.length) return;

    const titleEl = document.getElementById("newsTitle");
    const descriptionEl = document.getElementById("newsDescription");
    const timeEl = document.getElementById("newsTime");
    const linkEl = document.getElementById("newsLink");
    const item = newsItems[newsIndex];

    titleEl.textContent = item.title;
    descriptionEl.textContent = item.description;
    timeEl.textContent = item.time;
    linkEl.href = item.link;
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";
}

function nextNews() {
    if (!newsItems.length) return;
    newsIndex = (newsIndex + 1) % newsItems.length;
    showNews();
}

loadNews();
setInterval(loadNews, 120000);
setInterval(nextNews, 30000);

/* ===== EN CE MOMENT — AZURACAST ===== */

(async function loadNowPlaying() {
    const titleEl = document.getElementById("now-playing-title");
    if (!titleEl) return;

    const apiUrl = "https://radio.technorizon.fr/api/nowplaying/technorizon";

    async function updateNowPlaying() {
        try {
            const response = await fetch(apiUrl, { cache: "no-store" });
            if (!response.ok) throw new Error("API AzuraCast inaccessible");

            const data = await response.json();
            const artist = data?.now_playing?.song?.artist || "";
            const title = data?.now_playing?.song?.title || "";

            if (artist && title) {
                titleEl.textContent = artist + " - " + title;
            } else if (title) {
                titleEl.textContent = title;
            }
        } catch (error) {
            console.error("EN CE MOMENT :", error);
        }
    }

    await updateNowPlaying();
    setInterval(updateNowPlaying, 10000);
})();
/* ===== AZURACAST - EN CE MOMENT ===== */
(async function loadNowPlaying() {
    const titleEl = document.getElementById("now-playing-title");
    if (!titleEl) return;

    const apiUrl = "https://radio.technorizon.fr/api/nowplaying/technorizon";

    async function updateNowPlaying() {
        try {
            const response = await fetch("/api/nowplaying/technorizon", { cache: "no-store" });

            if (!response.ok) {
                throw new Error("API AzuraCast inaccessible");
            }

            const data = await response.json();
            const title = data?.now_playing?.song?.text;

            if (title && title.trim()) {
                titleEl.textContent = title.trim();
            }
        } catch (error) {
            console.error("EN CE MOMENT :", error);
        }
    }

    await updateNowPlaying();
    setInterval(updateNowPlaying, 10000);
})();

/* ===== DÉDICACES - ENVOI SANS COUPER LA RADIO ===== */
const dedicaceForm = document.getElementById("dedicaceForm");

if (dedicaceForm) {
    dedicaceForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const button = dedicaceForm.querySelector('button[type="submit"]');
        const originalText = button.textContent;

        button.disabled = true;
        button.textContent = "💌 ENVOI EN COURS...";

        try {
            const response = await fetch(dedicaceForm.action, {
                method: "POST",
                body: new FormData(dedicaceForm),
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'envoi");
            }

            dedicaceForm.reset();
            button.textContent = "✅ DÉDICACE ENVOYÉE !";

            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 3000);

        } catch (error) {
            console.error("Dédicace :", error);
            button.textContent = "❌ ERREUR - RÉESSAYER";
            button.disabled = false;
        }
    });
}

/* --- TECHNOROSCOPE --- */

const horoscopeResult = document.getElementById("horoscopeResult");
const zodiacButtons = document.querySelectorAll(".zodiac-card");

const technoroscopeMessages = {

  belier: [
    "❤️ Amour : Une belle énergie t’accompagne aujourd’hui. En couple, une discussion sincère peut renforcer la complicité. Célibataire, une rencontre inattendue pourrait attirer ton attention.\n\n💼 Travail : Tu as envie d’avancer vite et de prendre les devants. Bonne journée pour lancer une idée ou débloquer une situation qui traîne.\n\n💰 Finances : Évite les achats impulsifs. Une petite dépense imprévue pourrait se présenter.\n\n💪 Forme : Ton énergie est bonne, mais pense à lever un peu le pied en fin de journée.\n\n✨ Conseil du jour : Fais confiance à ton instinct, mais ne confonds pas vitesse et précipitation.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Le climat est favorable aux rapprochements. Si quelque chose te pèse, c’est le bon moment pour mettre les choses au clair.\n\n💼 Travail : Ton dynamisme sera remarqué. Une proposition ou une nouvelle responsabilité pourrait arriver plus vite que prévu.\n\n💰 Finances : Reste prudent avec les dépenses plaisir aujourd’hui.\n\n💪 Forme : Belle vitalité générale. Profite-en pour bouger et te défouler.\n\n✨ Conseil du jour : Garde ton énergie pour ce qui compte vraiment.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une journée intense côté émotions. Ne laisse pas un petit malentendu prendre trop de place.\n\n💼 Travail : Tu pourrais avoir une idée particulièrement efficace aujourd’hui. Note-la et passe rapidement à l’action.\n\n💰 Finances : Situation stable, à condition de ne pas céder à toutes tes envies.\n\n💪 Forme : Ton moteur tourne à plein régime. Attention à la fatigue nerveuse.\n\n✨ Conseil du jour : Mets ton énergie au service d’un objectif précis.\n\n⭐ Note du jour : 4/5"
  ],

  taureau: [
    "❤️ Amour : La tendresse et la stabilité sont au rendez-vous. Privilégie les moments simples et sincères.\n\n💼 Travail : Ta patience sera ta meilleure alliée aujourd’hui. Avance sans te laisser presser par les autres.\n\n💰 Finances : Bonne journée pour faire le point sur ton budget et éviter les dépenses inutiles.\n\n💪 Forme : Ton énergie est régulière. Pense toutefois à t’accorder une vraie pause.\n\n✨ Conseil du jour : Ne cherche pas à tout contrôler, laisse aussi les choses venir à toi.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une atmosphère douce favorise les rapprochements. Célibataire, quelqu’un pourrait se montrer plus intéressé que tu ne le pensais.\n\n💼 Travail : Ton sérieux paie. Un dossier ou un projet peut enfin progresser.\n\n💰 Finances : Prudence raisonnable, sans tomber dans l’excès de contrôle.\n\n💪 Forme : Bonne résistance, mais attention aux tensions liées au stress.\n\n✨ Conseil du jour : La constance vaut mieux que la précipitation.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Tu recherches du concret et de la sincérité. Une conversation pourrait t’apporter exactement cela.\n\n💼 Travail : Une journée productive si tu restes concentré sur l’essentiel.\n\n💰 Finances : Une décision réfléchie peut être bénéfique à moyen terme.\n\n💪 Forme : Écoute ton corps et ne néglige pas le repos.\n\n✨ Conseil du jour : Avance à ton rythme, il est probablement le bon.\n\n⭐ Note du jour : 4/5"
  ],

  gemeaux: [
    "❤️ Amour : Les échanges seront nombreux et stimulants. En couple, évite cependant de parler sans vraiment écouter.\n\n💼 Travail : Ton esprit fuse dans tous les sens. Trie tes idées et concentre-toi sur les plus prometteuses.\n\n💰 Finances : Quelques tentations pourraient apparaître. Garde un minimum de discipline.\n\n💪 Forme : Bonne énergie mentale, mais risque de dispersion.\n\n✨ Conseil du jour : Une bonne idée n’a de valeur que si tu la transformes en action.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Un message ou une discussion inattendue pourrait changer l’ambiance de ta journée.\n\n💼 Travail : Ta capacité d’adaptation sera particulièrement utile.\n\n💰 Finances : Rien d’alarmant, mais évite les décisions prises sur un coup de tête.\n\n💪 Forme : Ton cerveau tourne à plein régime. Pense à déconnecter un peu.\n\n✨ Conseil du jour : Écoute autant que tu parles.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Le dialogue peut résoudre beaucoup de choses aujourd’hui. Profites-en.\n\n💼 Travail : Un contact ou une nouvelle information pourrait ouvrir une porte intéressante.\n\n💰 Finances : Journée correcte, mais garde un œil sur les petites dépenses répétées.\n\n💪 Forme : Besoin de mouvement et de changement d’air.\n\n✨ Conseil du jour : Ne t’éparpille pas : choisis ton morceau et joue-le jusqu’au bout.\n\n⭐ Note du jour : 4/5"
  ],

  cancer: [
    "❤️ Amour : Ton intuition est forte. Tu ressens facilement ce que les autres ne disent pas.\n\n💼 Travail : Une journée calme sera plus productive qu’une course permanente.\n\n💰 Finances : Évite de compenser une contrariété par une dépense impulsive.\n\n💪 Forme : Ton énergie dépendra beaucoup de ton état émotionnel.\n\n✨ Conseil du jour : Protège ton calme sans te fermer aux autres.\n\n⭐ Note du jour : 3/5",
    "❤️ Amour : Les liens familiaux et affectifs prennent une place importante aujourd’hui.\n\n💼 Travail : Une situation floue pourrait devenir plus claire au fil de la journée.\n\n💰 Finances : Stabilité générale, à condition de rester raisonnable.\n\n💪 Forme : Prends soin de ton sommeil et de ton rythme.\n\n✨ Conseil du jour : Ton intuition est un excellent radar aujourd’hui.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une belle complicité peut naître d’un moment simple.\n\n💼 Travail : Ne sous-estime pas une idée discrète : elle pourrait être plus utile que prévu.\n\n💰 Finances : Pas de risque majeur, mais reste prudent.\n\n💪 Forme : Besoin de douceur et de récupération.\n\n✨ Conseil du jour : Ne laisse pas une petite contrariété gâcher toute ta journée.\n\n⭐ Note du jour : 4/5"
  ],

  lion: [
    "❤️ Amour : Ton charme ne passe pas inaperçu aujourd’hui. En couple, attention à ne pas vouloir avoir toujours le dernier mot.\n\n💼 Travail : C’est une bonne journée pour montrer ce dont tu es capable et défendre tes idées.\n\n💰 Finances : Tu pourrais avoir envie de te faire plaisir. Fixe-toi une limite.\n\n💪 Forme : Belle énergie, surtout en première partie de journée.\n\n✨ Conseil du jour : Brille, mais laisse aussi un peu de lumière aux autres.\n\n⭐ Note du jour : 5/5",
    "❤️ Amour : Les émotions sont fortes et les échanges passionnés.\n\n💼 Travail : Ton assurance peut faire la différence dans une situation importante.\n\n💰 Finances : Journée plutôt stable, même si les tentations sont présentes.\n\n💪 Forme : Ton énergie est excellente. Profites-en sans dépasser tes limites.\n\n✨ Conseil du jour : La confiance attire les opportunités.\n\n⭐ Note du jour : 5/5",
    "❤️ Amour : Une attention sincère pourrait te toucher plus que prévu.\n\n💼 Travail : Une occasion de prendre les commandes pourrait se présenter.\n\n💰 Finances : Évite simplement les dépenses destinées à impressionner les autres.\n\n💪 Forme : Très bonne vitalité générale.\n\n✨ Conseil du jour : Fais entendre ta voix, mais écoute aussi celles des autres.\n\n⭐ Note du jour : 4/5"
  ],

  vierge: [
    "❤️ Amour : Tu recherches de la clarté et de la sincérité. Évite cependant d’analyser chaque mot.\n\n💼 Travail : Ton sens du détail est particulièrement efficace aujourd’hui.\n\n💰 Finances : Bonne journée pour remettre de l’ordre dans tes comptes.\n\n💪 Forme : Attention à la fatigue mentale et au besoin de tout contrôler.\n\n✨ Conseil du jour : Tout n’a pas besoin d’être parfait pour être réussi.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une discussion simple peut résoudre un problème que tu pensais compliqué.\n\n💼 Travail : Ta méthode et ton organisation seront récompensées.\n\n💰 Finances : Prudence et bon sens restent tes meilleurs alliés.\n\n💪 Forme : Accorde-toi une vraie coupure dans la journée.\n\n✨ Conseil du jour : Accepte aussi l’imprévu.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Tu pourrais être agréablement surpris par quelqu’un que tu connais déjà.\n\n💼 Travail : Un détail que les autres n’ont pas remarqué peut faire toute la différence.\n\n💰 Finances : Situation stable.\n\n💪 Forme : Bonne énergie si tu ne tires pas trop sur la corde.\n\n✨ Conseil du jour : Fais confiance à ton expérience.\n\n⭐ Note du jour : 4/5"
  ],

  balance: [
    "❤️ Amour : Une belle harmonie est possible aujourd’hui, à condition de dire clairement ce que tu ressens.\n\n💼 Travail : Les collaborations sont favorisées. Ne reste pas seul face à une difficulté.\n\n💰 Finances : Une envie de plaisir pourrait peser sur ton budget. Reste mesuré.\n\n💪 Forme : Ton équilibre passe par un bon dosage entre activité et repos.\n\n✨ Conseil du jour : Cherche l’équilibre, pas la perfection.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une rencontre ou un échange agréable pourrait égayer ta journée.\n\n💼 Travail : Ton sens de la diplomatie peut résoudre une situation tendue.\n\n💰 Finances : Rien de préoccupant, mais évite les achats inutiles.\n\n💪 Forme : Belle énergie si tu prends le temps de souffler.\n\n✨ Conseil du jour : Ne reporte pas une décision uniquement pour éviter de déplaire.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Tu pourrais retrouver une belle complicité avec une personne importante.\n\n💼 Travail : Une négociation ou un échange peut tourner à ton avantage.\n\n💰 Finances : Journée équilibrée.\n\n💪 Forme : Ton moral influence fortement ton énergie aujourd’hui.\n\n✨ Conseil du jour : Fais un choix et assume-le sereinement.\n\n⭐ Note du jour : 4/5"
  ],

  scorpion: [
    "❤️ Amour : Les émotions sont intenses. Une conversation profonde peut renforcer un lien important.\n\n💼 Travail : Ton intuition te permet de repérer ce que les autres ne voient pas.\n\n💰 Finances : Évite les décisions prises sous le coup de l’émotion.\n\n💪 Forme : Ton énergie est puissante mais irrégulière.\n\n✨ Conseil du jour : Utilise ton intensité pour construire, pas pour combattre.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une attirance ou une complicité peut devenir plus forte aujourd’hui.\n\n💼 Travail : Tu pourrais débloquer une situation compliquée grâce à ta persévérance.\n\n💰 Finances : Bonne maîtrise générale.\n\n💪 Forme : Pense à relâcher la pression.\n\n✨ Conseil du jour : Tout ne mérite pas une bataille.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Quelque chose pourrait être dit aujourd’hui qui change ta façon de voir une relation.\n\n💼 Travail : Une journée intéressante pour avancer discrètement sur un projet important.\n\n💰 Finances : Pas de changement majeur à prévoir.\n\n💪 Forme : Énergie correcte, mais attention au stress accumulé.\n\n✨ Conseil du jour : Fais confiance à ton instinct, il est particulièrement affûté.\n\n⭐ Note du jour : 4/5"
  ],

  sagittaire: [
    "❤️ Amour : Besoin de spontanéité et de légèreté. Une sortie ou un changement de programme peut faire beaucoup de bien.\n\n💼 Travail : Une nouvelle idée ou une nouvelle direction pourrait t’enthousiasmer.\n\n💰 Finances : Ton goût de l’aventure peut aussi toucher ton portefeuille. Reste raisonnable.\n\n💪 Forme : Très bonne énergie et besoin de mouvement.\n\n✨ Conseil du jour : Sors un peu de ta routine.\n\n⭐ Note du jour : 5/5",
    "❤️ Amour : Le climat est propice aux échanges joyeux et spontanés.\n\n💼 Travail : Une opportunité pourrait apparaître là où tu ne la cherchais pas.\n\n💰 Finances : Évite simplement les décisions trop rapides.\n\n💪 Forme : Belle vitalité générale.\n\n✨ Conseil du jour : Suis ta curiosité, elle pourrait t’emmener loin.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une rencontre ou un projet à deux peut redonner du rythme à ta journée.\n\n💼 Travail : Ton optimisme est communicatif et peut convaincre autour de toi.\n\n💰 Finances : Situation correcte, à condition de surveiller tes envies.\n\n💪 Forme : Besoin d’air et d’activité.\n\n✨ Conseil du jour : Regarde devant toi plutôt que derrière.\n\n⭐ Note du jour : 4/5"
  ],

  capricorne: [
    "❤️ Amour : Tu pourrais avoir besoin de davantage de stabilité et de preuves concrètes aujourd’hui.\n\n💼 Travail : Ta persévérance commence à porter ses fruits.\n\n💰 Finances : Bonne journée pour planifier ou mettre de l’argent de côté.\n\n💪 Forme : Ton endurance est bonne, mais ne néglige pas les pauses.\n\n✨ Conseil du jour : Continue d’avancer, même lentement.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Un geste simple pourrait avoir beaucoup plus d’importance que de grands discours.\n\n💼 Travail : Ton sérieux inspire confiance et pourrait être remarqué.\n\n💰 Finances : Gestion prudente et efficace.\n\n💪 Forme : Attention aux tensions liées à une charge mentale importante.\n\n✨ Conseil du jour : Ne porte pas tout sur tes épaules.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une relation peut gagner en profondeur si tu acceptes de montrer davantage ce que tu ressens.\n\n💼 Travail : Une tâche difficile peut enfin être bouclée.\n\n💰 Finances : Journée stable et raisonnable.\n\n💪 Forme : Ton corps réclame peut-être un peu plus de repos.\n\n✨ Conseil du jour : Autorise-toi à ralentir sans culpabiliser.\n\n⭐ Note du jour : 4/5"
  ],

  verseau: [
    "❤️ Amour : Tu as besoin de liberté mais aussi de complicité. Explique clairement ce que tu attends.\n\n💼 Travail : Une idée originale peut attirer l’attention autour de toi.\n\n💰 Finances : Évite les achats trop expérimentaux ou impulsifs.\n\n💪 Forme : Ton énergie mentale est excellente.\n\n✨ Conseil du jour : Ose faire autrement.\n\n⭐ Note du jour : 5/5",
    "❤️ Amour : Une rencontre atypique ou une conversation surprenante pourrait t’intriguer.\n\n💼 Travail : Ton originalité est ton principal atout aujourd’hui.\n\n💰 Finances : Situation stable, mais garde un minimum de prudence.\n\n💪 Forme : Besoin de nouveauté pour garder la motivation.\n\n✨ Conseil du jour : Ne cherche pas forcément à rentrer dans le moule.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Le dialogue peut prendre une tournure inattendue mais positive.\n\n💼 Travail : Une solution différente des méthodes habituelles pourrait fonctionner parfaitement.\n\n💰 Finances : Pas de changement notable.\n\n💪 Forme : Bonne énergie, surtout si tu évites la routine.\n\n✨ Conseil du jour : Ta différence est une force.\n\n⭐ Note du jour : 4/5"
  ],

  poissons: [
    "❤️ Amour : Ton intuition est particulièrement forte aujourd’hui. Écoute tes émotions sans leur laisser prendre toute la place.\n\n💼 Travail : Ta créativité peut apporter une solution inattendue à un problème.\n\n💰 Finances : Évite les achats dictés uniquement par l’émotion.\n\n💪 Forme : Tu as besoin de calme et de récupération.\n\n✨ Conseil du jour : Fais confiance à ce que tu ressens, mais garde les pieds sur terre.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une journée douce favorise les confidences et les rapprochements.\n\n💼 Travail : Ton imagination est un atout, surtout sur les projets créatifs.\n\n💰 Finances : Reste attentif aux petites dépenses qui s’accumulent.\n\n💪 Forme : Ton énergie sera meilleure si tu t’accordes quelques moments de tranquillité.\n\n✨ Conseil du jour : Écoute ton intuition sans oublier la réalité.\n\n⭐ Note du jour : 4/5",
    "❤️ Amour : Une belle surprise pourrait venir d’une personne à laquelle tu ne pensais pas.\n\n💼 Travail : Une intuition professionnelle mérite peut-être d’être explorée.\n\n💰 Finances : Journée plutôt stable.\n\n💪 Forme : Prends le temps de recharger tes batteries.\n\n✨ Conseil du jour : Laisse un peu de place au rêve, mais garde un œil sur le réel.\n\n⭐ Note du jour : 4/5"
  ]
};

if (horoscopeResult && zodiacButtons.length) {
  zodiacButtons.forEach((button) => {
   button.addEventListener("click", async () => {
      const sign = button.dataset.sign;

      zodiacButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const today = new Date();
      const dayNumber = Math.floor(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).getTime() / 86400000
      );

      const messages = technoroscopeMessages[sign];
      const messageIndex = dayNumber % messages.length;
     const sigastraSigns = {
  belier: "aries",
  taureau: "taurus",
  gemeaux: "gemini",
  cancer: "cancer",
  lion: "leo",
  vierge: "virgo",
  balance: "libra",
  scorpion: "scorpio",
  sagittaire: "sagittarius",
  capricorne: "capricorn",
  verseau: "aquarius",
  poissons: "pisces"
};
     const sigastraSign = sigastraSigns[sign];
     let dailyHoroscope = messages[messageIndex];

try {
  const response = await fetch(
    `https://sigastra.com/api/v1/daily?lang=fr&sign=${sigastraSign}`
  );

  if (response.ok) {
    const data = await response.json();
    dailyHoroscope = data.items?.[0]?.text || dailyHoroscope;
  }
} catch (error) {
  console.error("Technoroscope Sigastra :", error);
}

      const signNames = {
  belier: "BÉLIER",
  taureau: "TAUREAU",
  gemeaux: "GÉMEAUX",
  cancer: "CANCER",
  lion: "LION",
  vierge: "VIERGE",
  balance: "BALANCE",
  scorpion: "SCORPION",
  sagittaire: "SAGITTAIRE",
  capricorne: "CAPRICORNE",
  verseau: "VERSEAU",
  poissons: "POISSONS"
};

document.getElementById("horoscopeSign").textContent = signNames[sign];
document.getElementById("horoscopeDate").textContent =
  button.querySelector(".zodiac-date").textContent;

document.getElementById("horoscopeDay").textContent =
  dailyHoroscope

      const seed = dayNumber + Object.keys(signNames).indexOf(sign) * 17;

const stars = (n) =>
  "★".repeat(n) + "☆".repeat(5 - n);

const moods = [
  "Techno mélodique",
  "Eurodance 90's",
  "House solaire",
  "Trance euphorique",
  "Dancefloor rétro",
  "Deep House"
];

const love = 1 + (seed % 5);
const work = 1 + ((seed + 2) % 5);
const money = 1 + ((seed + 4) % 5);
const energy = 1 + ((seed + 1) % 5);
const dance = 60 + (seed % 41);

document.getElementById("loveRating").textContent = stars(love);
document.getElementById("workRating").textContent = stars(work);
document.getElementById("moneyRating").textContent = stars(money);
document.getElementById("energyRating").textContent = stars(energy);

document.getElementById("musicMood").textContent =
  moods[seed % moods.length];

document.getElementById("dancefloorIndex").textContent =
  dance + "%";
      
    });
  });
}

const shareHoroscopeButton = document.getElementById("shareHoroscopeButton");

if (shareHoroscopeButton) {
  shareHoroscopeButton.addEventListener("click", async () => {
    const sign = document.getElementById("horoscopeSign")?.textContent?.trim();
    const text = document.getElementById("horoscopeDay")?.textContent?.trim();

    if (!sign || sign === "VOTRE SIGNE" || !text) {
      alert("Sélectionnez d'abord votre signe astrologique.");
      return;
    }

    const shareText =
      `🔮 Mon Technoroscope ${sign} du jour sur Technorizon.fr\n\n` +
      `${text}\n\n` +
      `🎧 Découvre le tien sur Technorizon.fr`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Technoroscope ${sign} - Technorizon.fr`,
          text: shareText,
          url: "https://technorizon.fr/"
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Partage Technoroscope :", error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          shareText + "\nhttps://technorizon.fr/"
        );
        alert("✅ Technoroscope copié ! Vous pouvez maintenant le partager.");
      } catch (error) {
        console.error("Copie Technoroscope :", error);
      }
    }
  });
}
