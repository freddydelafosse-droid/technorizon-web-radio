export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.franceinfo.fr/titres.rss", {
      headers: {
        "User-Agent": "Technorizon/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Franceinfo RSS : ${response.status}`);
    }

    const xml = await response.text();

    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 10)
      .map((match) => {
        const item = match[1];

        const title =
          item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
          item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ||
          "";

        return {
          title: title
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .trim()
        };
      })
      .filter((item) => item.title);

    res.status(200).json({ items });

  } catch (error) {
    console.error("API NEWS :", error);
    res.status(500).json({
      error: "Impossible de récupérer les informations"
    });
  }
}