/* ================================
   BRANDRADAR FEED – PRODUCT MODE
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

    renderProducts(items);
  } catch (error) {
    console.error("Feil ved henting av produktdata:", error);
  }
}

function renderProducts(products) {
  if (!featuredContainer || !newsGrid) return;

  const featured = products.filter(p => p.featured?.toLowerCase() === "true");
  const regular = products.filter(p => p.featured?.toLowerCase() !== "true");

  // 🌟 Ukens Spotlight
  featuredContainer.innerHTML = `
    <h2>Ukens Spotlight ✨</h2>
    ${featured.map(item => `
      <article class="featured-card fade-in">
        <img src="${item.image_url}" alt="${item.product_name}">
        <div class="featured-content">
          <h3>${item.brand} – ${item.product_name}</h3>
          <p>${item.tagline}</p>
          <p class="price">${item.price ? `${item.price} kr` : ""}</p>
          <a href="${item.link}" target="_blank" class="read-more">Se produkt</a>
        </div>
      </article>
    `).join("")}
  `;

  // 🛍️ Flere produkter
  newsGrid.innerHTML = `
    ${regular.map(item => `
      <article class="news-card fade-in">
        <img src="${item.image_url}" alt="${item.product_name}">
        <div class="news-info">
          <h3>${item.brand}</h3>
          <p class="product">${item.product_name}</p>
          <p class="price">${item.price ? `${item.price} kr` : ""}</p>
          <p class="tagline">${item.tagline}</p>
          <a href="${item.link}" target="_blank" class="read-more">Se produkt</a>
        </div>
      </article>
    `).join("")}
  `;
}

fetchNews();


