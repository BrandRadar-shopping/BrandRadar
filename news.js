// news.js — BrandRadar
// Henter og viser nyheter fra Google Sheet ("news")

const NEWS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

// Container-elementer på siden
const featuredContainer = document.querySelector("#featured-news");
const newsGrid = document.querySelector("#news-grid");

// Hent CSV-data og konverter til objekter
async function fetchNews() {
  try {
    const response = await fetch(NEWS_SHEET_URL);
    const csvText = await response.text();

    const rows = csvText.split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());
    const items = rows.slice(1).map(row => {
      const obj = {};
      row.forEach((val, i) => (obj[headers[i]] = val.trim()));
      return obj;
    });

    renderNews(items);
  } catch (error) {
    console.error("Klarte ikke hente nyhetsdata:", error);
  }
}

function renderNews(newsItems) {
  const featured = newsItems.filter(n => n.featured?.toLowerCase() === "true");
  const regular = newsItems.filter(n => n.featured?.toLowerCase() !== "true");

  // Render featured nyheter
  featuredContainer.innerHTML = featured.map(item => `
    <article class="featured-card fade-in">
      <img src="${item.image_url}" alt="${item.title}">
      <div class="featured-content">
        <h2>${item.title}</h2>
        <p>${item.excerpt}</p>
        <a href="${item.link}" target="_blank">Les mer →</a>
      </div>
    </article>
  `).join("");

  // Render vanlige nyheter i grid
  newsGrid.innerHTML = regular.map(item => `
    <article class="news-card fade-in">
      <img src="${item.image_url}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.excerpt}</p>
      <a href="${item.link}" target="_blank">Les mer</a>
    </article>
  `).join("");
}

// Init
fetchNews();
