const clock = document.getElementById('clock');

function tick() {
  clock.textContent = new Date().toLocaleTimeString('fr-FR', {hour12:false});
}
tick();
setInterval(tick, 1000);

document.getElementById('listen').addEventListener('click', () => {
  document.getElementById('liveArea').scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
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
            const response = await fetch(
    "https://api.allorigins.win/raw?url=" + encodeURIComponent(apiUrl),
    { cache: "no-store" }
);

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
