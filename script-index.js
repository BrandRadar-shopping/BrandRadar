// ======================================================
// ✅ BrandRadar – Forside (Picks + Trending Now + Top Brands)
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script loaded");

  /* ============================================================
     ⭐ FEATURED PICKS (CSV – fra Google Sheets)
  ============================================================ */
  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

  const featuredGrid = document.getElementById("featured-grid");

  if (featuredGrid) {
    try {
      const res = await fetch(CSV_URL);
      const csv = await res.text();

      const rows = csv.trim().split("\n").map(r => r.split(","));
      const headers = rows[0];

      const items = rows.slice(1).map(row => {
        const obj = {};
        row.forEach((val, i) => (obj[headers[i]] = val.trim()));
        return obj;
      });

      const featured = items.filter(p => p.featured?.toLowerCase() === "true");

      if (!featured.length) {
        featuredGrid.innerHTML = "<p>Ingen utvalgte produkter akkurat nå.</p>";
      } else {
        featuredGrid.innerHTML = "";

        featured.forEach(p => {
          const cleanProduct = {
            id: p.product_name.replace(/\s+/g, "_"),
            title: p.product_name,
            brand: p.brand,
            price: p.price,
            image_url: p.image_url,
            product_url: p.link,
            description: p.reason
          };

          const card = document.createElement("div");
          card.className = "product-card";

          card.innerHTML = `
            <div class="fav-icon">
              <svg viewBox="0 0 24 24" class="heart-icon">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 
                2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 
                3.41.81 4.5 2.09C13.09 3.81 
                14.76 3 16.5 3 19.58 3 22 
                5.42 22 8.5c0 3.78-3.4 
                6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>

            <img src="${cleanProduct.image_url}" alt="${cleanProduct.title}">

            <div class="product-info">
              <h3>${cleanProduct.title}</h3>
              <p class="brand">${cleanProduct.brand}</p>
              ${cleanProduct.price ? `<p class="price">${cleanProduct.price} kr</p>` : ""}
            </div>
          `;

          card.addEventListener("click", e => {
            if (!e.target.closest(".fav-icon")) {
              window.location.href = `product.html?id=${cleanProduct.id}`;
            }
          });

          featuredGrid.appendChild(card);
        });
      }
    } catch (err) {
      console.error("❌ Klarte ikke laste Featured Picks:", err);
      featuredGrid.innerHTML = "<p>Kunne ikke laste produktene akkurat nå.</p>";
    }
  }

  /* ============================================================
     🔥 TRENDING NOW (premium produktkort)
     Google Sheet: TrendingNow
  ============================================================ */

  async function loadTrending() {
    const SHEET_ID = "13klEz2o7CZ0Q4mbm8WT_b1Sz7LMoJqcluyrFyg58uRc";
    const TAB = "TrendingNow";
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${TAB}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      console.log("🔥 TrendingNow:", data);

      const container = document.getElementById("trending-grid");
      if (!container || !Array.isArray(data)) return;

      container.innerHTML = "";

      data.forEach(item => {
        if (item.active?.toLowerCase() !== "true") return;

        const cleanProduct = {
          id: item.product_name.replace(/\s+/g, "_"),
          title: item.product_name,
          brand: item.brand,
          price: item.price,
          image_url: item.image_url,
          product_url: item.link,
          description: item.highlight_reason
        };

        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
          <div class="fav-icon">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 
              2 12.28 2 8.5 2 5.42 4.42 3 7.5 
              3c1.74 0 3.41.81 4.5 2.09C13.09 
              3.81 14.76 3 16.5 3 19.58 3 22 
              5.42 22 8.5c0 3.78-3.4 
              6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <img src="${cleanProduct.image_url}" alt="${cleanProduct.title}">

          <div class="product-info">
            <h3>${cleanProduct.title}</h3>
            <p class="brand">${cleanProduct.brand}</p>
            ${cleanProduct.price ? `<p class="price">${cleanProduct.price} kr</p>` : ""}
          </div>
        `;

        // Klikk → product.html
        card.addEventListener("click", e => {
          if (!e.target.closest(".fav-icon")) {
            window.location.href = `product.html?id=${cleanProduct.id}`;
          }
        });

        container.appendChild(card);
      });
    } catch (err) {
      console.error("❌ TrendingNow error:", err);
    }
  }

  /* ============================================================
     💎 TOP BRANDS (Logo + Navn + Kort beskrivelse)
     Google Sheet: TopBrands
  ============================================================ */

  async function loadTopBrands() {
    const SHEET_ID = "1n3mCxmTb42RnZ_sNvP5CnYdGjwYFkU5kmnI_BFyiNkU";
    const TAB = "TopBrands";
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${TAB}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      console.log("🔥 TopBrands:", data);

      const container = document.getElementById("brands-grid");
      if (!container || !Array.isArray(data)) return;

      container.innerHTML = "";

      data.forEach(item => {
        if (item.active?.toLowerCase() !== "true") return;

        const card = document.createElement("a");
        card.className = "topbrand-card";
        card.href = item.link;
        card.target = "_blank";

        card.innerHTML = `
          <img src="${item.logo}" alt="${item.brand_name}">
          <h3>${item.brand_name}</h3>
          <p>${item.description}</p>
        `;

        container.appendChild(card);
      });
    } catch (err) {
      console.error("❌ TopBrands error:", err);
    }
  }

  // ============================================================
  // 🚀 Kjør alle seksjoner
  // ============================================================
  loadTrending();
  loadTopBrands();
});



