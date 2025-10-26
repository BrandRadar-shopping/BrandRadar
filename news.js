/* ================================
   NEWS SECTION (news.html)
   ================================ */

const NEWS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

const featuredContainer = document.querySelector("#featured-news");
const newsGrid = document.querySelector("#news-grid");

async function fetchNews() {
  try {
    const response = await fetch(NEWS_SHEET_URL);
    const csvText = await response.text();

    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());
    const items = rows.slice(1).map(row => {
      const obj = {};
      row.forEach((val, i) => (obj[headers[i]] = val.trim()));
      return obj;
    });

    renderNews(items);
  } catch (error) {
    console.error("Feil ved henting av nyhetsdata:", error);
  }
}

function renderNews(newsItems) {
  if (!featuredContainer || !newsGrid) return;

  // Sorter nyheter (nyeste først)
  newsItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  const featured = newsItems.filter(n => n.featured?.toLowerCase() === "true");
  const regular = newsItems.filter(n => n.featured?.toLowerCase() !== "true");

  // Siste nytt (featured)
  featuredContainer.innerHTML = `
    <h2>Siste nytt 🗞️</h2>
    ${featured.map(item => `
      <article class="featured-card fade-in">
        <img src="${item.image_url}" alt="${item.title}">
        <div class="featured-content">
          <h3>${item.title}</h3>
          <p>${item.excerpt}</p>
          <a href="${item.link}" target="_blank">Les mer →</a>
        </div>
      </article>
    `).join("")}
  `;

  // Flere artikler
  newsGrid.innerHTML = `
    ${regular.map(item => `
      <article class="news-card fade-in">
        <img src="${item.image_url}" alt="${item.title}">
        <div class="news-info">
          <h3>${item.title}</h3>
          <p>${item.excerpt}</p>
          <a href="${item.link}" target="_blank" class="read-more">Les mer</a>
        </div>
      </article>
    `).join("")}
  `;
}

fetchNews();

