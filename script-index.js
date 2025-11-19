// ======================================================
// ✅ BrandRadar – Forside (Picks fra News via CSV)
// Bruker samme datastruktur som news.js
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script loaded (CSV mode)");

  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  try {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();

    // ✅ Konverter CSV → JS-objekter
    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());
    const items = rows.slice(1).map(row => {
      const obj = {};
      row.forEach((val, i) => (obj[headers[i]] = val.trim()));
      return obj;
    });

    // ✅ Filtrer ut de med "featured" = TRUE
    const featured = items.filter(p => p.featured?.toLowerCase() === "true");

    if (!featured.length) {
      grid.innerHTML = "<p>Ingen utvalgte produkter akkurat nå.</p>";
      return;
    }

    // ✅ Render produktkort
    grid.innerHTML = "";
    featured.forEach(p => {
      const id = Math.floor(Math.random() * 100000);
      const isFav = getFavorites().some(f => Number(f.id) === id);

      const card = document.createElement("div");
      card.classList.add("product-card");

      card.innerHTML = `
        <div class="fav-icon ${isFav ? "active" : ""}" title="Favoritt">
          <svg viewBox="0 0 24 24" class="heart-icon">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
            14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
            6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>

        <img src="${p.image_url}" alt="${p.product_name}">
        <div class="product-info" title="${p.reason || ''}">
          <h3>${p.product_name}</h3>
          <p class="brand">${p.brand}</p>
          ${p.price ? `<p class="price">${p.price} kr</p>` : ""}
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest(".fav-icon")) return;
        window.open(p.link, "_blank");
      });

      card.querySelector(".fav-icon").addEventListener("click", (e) => {
        e.stopPropagation();
        const cleanProduct = {
          id,
          title: p.product_name,
          brand: p.brand,
          price: p.price,
          image_url: p.image_url,
          product_url: p.link,
          description: p.reason
        };
        const exists = getFavorites().some(f => f.title === p.product_name);
        toggleFavorite(cleanProduct);
        e.currentTarget.classList.toggle("active", !exists);
      });

      grid.appendChild(card);
    });

  } catch (err) {
    console.error("❌ Klarte ikke laste Picks:", err);
    grid.innerHTML = "<p>Kunne ikke laste produktene akkurat nå.</p>";
  }
});


// ===============================
// Load Top Trending Products
// ===============================
async function loadTrendingProducts() {
  const SHEET_ID = "1NmFQi5tygEvjmsfqxtOuo5mgCOXzniF5GtTKXoGpNEY";
  const SHEET_NAME = "BrandRadarProdukter";

  const container = document.getElementById("trending-grid");
  if (!container) return;

  try {
    const data = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`).then(r => r.json());

    // Pick first 4 featured products for now
    const trending = data.slice(0, 4);

    container.innerHTML = trending
      .map(p => `
        <a href="product.html?id=${p.id}" class="product-card">
          <img src="${p.image_url}" alt="${p.name}" />
          <div class="info">
            <h3>${p.name}</h3>
            <p class="price">${p.price} kr</p>
          </div>
        </a>
      `).join("");

  } catch (err) {
    console.error("Trending error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadTrendingProducts);





