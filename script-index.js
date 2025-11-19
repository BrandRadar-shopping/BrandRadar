// ======================================================
// ✅ BrandRadar – Forside (Picks + Trending + Brands)
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script loaded");

  /* ===========================================
     ⭐️ LOAD FEATURED PICKS (CSV)
  ============================================ */

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

  const grid = document.getElementById("featured-grid");
  if (grid) {
    try {
      const response = await fetch(CSV_URL);
      const csvText = await response.text();

      const rows = csvText.trim().split("\n").map(r => r.split(","));
      const headers = rows[0].map(h => h.trim());

      const items = rows.slice(1).map(row => {
        const obj = {};
        row.forEach((val, i) => (obj[headers[i]] = val.trim()));
        return obj;
      });

      const featured = items.filter(p => p.featured?.toLowerCase() === "true");

      if (!featured.length) {
        grid.innerHTML = "<p>Ingen utvalgte produkter akkurat nå.</p>";
      } else {
        grid.innerHTML = "";
        featured.forEach(p => {
          const id = Math.floor(Math.random() * 999999);

          const card = document.createElement("div");
          card.classList.add("product-card");

          card.innerHTML = `
            <div class="fav-icon" title="Favoritt">
              <svg viewBox="0 0 24 24" class="heart-icon">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
                14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
                6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>

            <img src="${p.image_url}" alt="${p.product_name}">
            <div class="product-info">
              <h3>${p.product_name}</h3>
              <p class="brand">${p.brand}</p>
              ${p.price ? `<p class="price">${p.price} kr</p>` : ""}
            </div>
          `;

          card.addEventListener("click", e => {
            if (e.target.closest(".fav-icon")) return;
            window.open(p.link, "_blank");
          });

          grid.appendChild(card);
        });
      }
    } catch (err) {
      console.error("❌ Klarte ikke laste Featured Picks:", err);
      grid.innerHTML = "<p>Kunne ikke laste produktene akkurat nå.</p>";
    }
  }

  /* ===========================================
     🔥 LOAD TRENDING NOW
  ============================================ */

  async function loadTrending() {
    const SHEET_ID = "13klEz2o7CZ0Q4mbm8WT_b1Sz7LMoJqcluyrFyg58uRc";
    const TAB = "TrendingNow";
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${TAB}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      console.log("🔥 TrendingNow:", data);

      if (!Array.isArray(data) || !data.length) return;

      const container = document.getElementById("trending-grid");
      if (!container) return;

      container.innerHTML = data
        .map(
          item => `
        <a class="trend-card" href="${item.link}" target="_blank">
          <img src="${item.image_url}" alt="${item.title}">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </a>
      `
        )
        .join("");
    } catch (err) {
      console.error("❌ TrendingNow error:", err);
    }
  }

  /* ===========================================
     💎 LOAD TOP BRANDS
  ============================================ */

  async function loadTopBrands() {
    const SHEET_ID = "1n3mCxmTb42RnZ_sNvP5CnYdGjwYFkU5kmnI_BFyiNkU";
    const TAB = "TopBrands";
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${TAB}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      console.log("🔥 TopBrands:", data);

      if (!Array.isArray(data) || !data.length) return;

      const container = document.getElementById("brands-grid");
      if (!container) return;

      container.innerHTML = data
        .map(
          item => `
        <a class="topbrand-card" href="${item.link}" target="_blank">
          <img src="${item.logo}" alt="${item.brand_name}">
          <h3>${item.brand_name}</h3>
          <p>${item.description}</p>
        </a>
      `
        )
        .join("");
    } catch (err) {
      console.error("❌ TopBrands error:", err);
    }
  }

  // Run loaders
  loadTrending();
  loadTopBrands();
});



