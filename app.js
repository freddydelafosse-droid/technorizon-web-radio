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
console.log("Nombre de signes détectés :", zodiacButtons.length);

const technoroscopeMessages = {
  belier: [
    "⚡ Aujourd’hui, ton énergie monte dans le rouge. Profite-en pour avancer sur ce qui te tient à cœur, mais évite de partir au quart de tour.",
    "🔥 Une journée dynamique t’attend. Une bonne surprise pourrait arriver là où tu ne l’attends pas.",
    "🎧 Le rythme est avec toi aujourd’hui. Fais confiance à ton instinct et garde le tempo."
  ],

  taureau: [
    "🌟 Aujourd’hui, la stabilité sera ta meilleure alliée. Prends ton temps et laisse les bonnes choses venir à toi.",
    "🎶 Une journée agréable se profile. Côté cœur comme côté projets, privilégie la simplicité.",
    "💫 Ton calme fera la différence aujourd’hui. Une décision réfléchie pourrait porter ses fruits."
  ],

  gemeaux: [
    "✨ Les échanges sont favorisés aujourd’hui. Une discussion pourrait t’ouvrir une nouvelle porte.",
    "📻 Ton esprit est en mode grand mix ! Beaucoup d’idées arrivent : garde les meilleures et passe à l’action.",
    "⚡ Une rencontre ou un message pourrait mettre un peu de piment dans ta journée."
  ],

  cancer: [
    "🌙 Écoute ton intuition aujourd’hui : elle pourrait te guider mieux que prévu.",
    "💙 Une journée propice aux rapprochements et aux moments simples avec les personnes que tu apprécies.",
    "🎧 Ne laisse pas les petites contrariétés casser ton rythme. La soirée pourrait être bien meilleure que la journée."
  ],

  lion: [
    "🔥 Les projecteurs sont sur toi ! Profite de cette énergie pour faire entendre tes idées.",
    "👑 Confiance et charisme seront au rendez-vous aujourd’hui. Attention simplement à ne pas en faire trop.",
    "⚡ Une opportunité pourrait se présenter. À toi de monter le son au bon moment."
  ],

  vierge: [
    "✨ Ton sens du détail sera particulièrement utile aujourd’hui. Une situation pourrait enfin se débloquer.",
    "🎶 Pas besoin d’aller trop vite : un bon réglage vaut mieux qu’un mauvais remix.",
    "🌟 Une journée constructive se profile, particulièrement pour tes projets personnels."
  ],

  balance: [
    "💜 Aujourd’hui, cherche l’équilibre entre obligations et plaisir. Tu pourrais avoir une agréable surprise.",
    "🎧 Les relations sont à l’honneur. Une conversation sincère pourrait remettre les choses au clair.",
    "✨ Une belle énergie t’accompagne : laisse-toi porter sans vouloir tout contrôler."
  ],

  scorpion: [
    "🔥 Ton intuition sera redoutable aujourd’hui. Fais-lui confiance, mais garde quelques cartes dans ta manche.",
    "⚡ Une journée intense s’annonce. Transforme cette énergie en quelque chose de positif.",
    "🎶 Quelque chose pourrait changer de tempo aujourd’hui… et finalement te convenir parfaitement."
  ],

  sagittaire: [
    "🚀 Besoin de mouvement ! La journée pourrait t’offrir une occasion de sortir de la routine.",
    "✨ Optimisme et curiosité seront tes meilleurs alliés aujourd’hui.",
    "🎧 Une nouvelle idée pourrait rapidement devenir un vrai projet. Note-la avant qu’elle ne disparaisse !"
  ],

  capricorne: [
    "🌟 Tes efforts commencent à payer. Continue sans te laisser distraire par les petites difficultés.",
    "🎶 Aujourd’hui, avance morceau par morceau : inutile de vouloir mixer toute la playlist en une fois.",
    "💫 Une décision raisonnable pourrait t’apporter davantage que prévu."
  ],

  verseau: [
    "⚡ Ton originalité fera mouche aujourd’hui. N’hésite pas à proposer quelque chose de différent.",
    "🚀 Une idée inattendue pourrait changer ton programme. Laisse un peu de place à l’imprévu.",
    "🎧 Aujourd’hui, tu es clairement sur une autre fréquence… et c’est peut-être exactement ce qu’il fallait."
  ],

  poissons: [
    "🌊 Ton intuition et ta créativité seront particulièrement fortes aujourd’hui.",
    "💜 Prends le temps d’écouter ce que tu ressens. Une petite pause pourrait te faire beaucoup de bien.",
    "🎶 Laisse-toi porter par le rythme aujourd’hui : une belle surprise pourrait arriver sans prévenir."
  ]
};

if (horoscopeResult && zodiacButtons.length) {
  zodiacButtons.forEach((button) => {
    button.addEventListener("click", () => {
      alert("Clic détecté sur " + button.dataset.sign);
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

      horoscopeResult.innerHTML =
        "<strong>🔮 Ton Technoroscope du jour :</strong><br><br>" +
        messages[messageIndex] +
        "<br><br><small>✨ À prendre avec le sourire — Technorizon.fr</small>";
    });
  });
}
