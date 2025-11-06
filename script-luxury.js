// ============================================
// 💎 Luxury Corner - BrandRadar (Phase 4: Gold Picks Hero + Align Fix)
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU";
  const BRANDS_SHEET = "LuxuryBrands";
  const PRODUCTS_SHEET = "LuxuryProducts";

  loadLuxuryBrands(SHEET_ID, BRANDS_SHEET);
  loadLuxuryProducts(SHEET_ID, PRODUCTS_SHEET);
});

// =======================================================
// ✅ Load Luxury Brands
// =======================================================
function loadLuxuryBrands(sheetId, sheetName) {
  const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;
  const grid = document.getElementById("luxuryBrandGrid");

  fetch(url)
    .then(res => res.json())
    .then(rows => {
      const brands = rows.map(r => ({
        brand: (r.brand || "").trim(),
        logo: (r.logo || "").trim(),
        description: (r.description || "").trim(),
        homepage: (r.homepage_url || "#").trim()
      }));

      grid.innerHTML = "";

      brands.forEach(b => {
        const card = document.createElement("div");
        card.classList.add("brand-card");

        card.innerHTML = `
          <img src="${b.logo}" alt="${b.brand}" class="brand-logo">
          <h3>${b.brand}</h3>
        `;

        card.addEventListener("click", () => {
          window.location.href = `brand-page.html?brand=${encodeURIComponent(b.brand)}`;
        });

        grid.appendChild(card);
      });
    })
    .catch(err => console.error("🚨 FEIL LuxuryBrands:", err));
}

// =======================================================
// ✅ Load Luxury Products (med rating + GoldPick + HeroGrid)
// =======================================================
function loadLuxuryProducts(sheetId, sheetName) {
  const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;
  const grid = document.getElementById("luxuryProductGrid");
  const heroGrid = document.getElementById("luxuryGoldGrid");

  fetch(url)
    .then(res => res.json())
    .then(rows => {
      const products = rows.map(r => ({
        id: (r.id || "").trim(),
        title: (r.title || "").trim(),
        brand: (r.brand || "").trim(),
        price: (r.price || "").trim(),
        image_url: (r.image_url || "").trim(),
        discount: (r.discount || "").trim(),
        product_url: (r.product_url || "#").trim(),
        tag: (r.tag || "").trim(),
        rating: (r.rating || "").trim(),
        goldpick: (r.goldpick || "").trim().toLowerCase()
      }));

      // =======================================
      // 💛 HERO SECTION – Gold Picks (maks 6)
      // =======================================
      if (heroGrid) {
        const goldPicks = products.filter(p => p.goldpick === "yes").slice(0, 6);
        heroGrid.innerHTML = "";

        goldPicks.forEach(p => {
          const card = document.createElement("div");
          card.classList.add("luxury-hero-card");

          const ratingNum = parseFloat(String(p.rating).replace(",", "."));
          const ratingHtml = !isNaN(ratingNum)
            ? `<p class="rating">⭐ ${ratingNum.toFixed(1)}</p>`
            : "";

          card.innerHTML = `
            ${p.discount ? `<span class="discount-badge">${p.discount}%</span>` : ""}
            <span class="gold-pick-badge right">👑 Gold Pick</span>
            <img src="${p.image_url}" alt="${p.title}">
            <div class="hero-info">
              <h4>${p.title}</h4>
              <p class="brand">${p.brand}</p>
              ${ratingHtml}
              <p class="price">${p.price} kr</p>
            </div>
          `;

          card.addEventListener("click", () => {
            if (p.id) {
              window.location.href = `product.html?id=${p.id}`;
            } else {
              window.open(p.product_url, "_blank");
            }
          });

          heroGrid.appendChild(card);
        });
      }

      // =======================================
      // 💎 STANDARD LUXURY GRID
      // =======================================
      if (grid) {
        grid.innerHTML = "";
        products.forEach(p => {
          const card = document.createElement("div");
          card.classList.add("luxury-product-card");

          const ratingNum = parseFloat(String(p.rating).replace(",", "."));
          const ratingHtml = !isNaN(ratingNum)
            ? `<p class="rating">⭐ ${ratingNum.toFixed(1)}</p>`
            : "";

          const goldTag =
            p.goldpick === "yes"
              ? `<span class="gold-pick-badge right">👑 Gold Pick</span>`
              : "";

          card.innerHTML = `
            ${p.discount ? `<span class="discount-badge">${p.discount}%</span>` : ""}
            ${goldTag}
            <img src="${p.image_url}" alt="${p.title}">
            <div class="luxury-info">
              <h4>${p.title}</h4>
              <p class="brand">${p.brand}</p>
              ${ratingHtml}
              <p class="price">${p.price} kr</p>
            </div>
          `;

          card.addEventListener("click", () => {
            if (p.id) {
              window.location.href = `product.html?id=${p.id}`;
            } else {
              window.open(p.product_url, "_blank");
            }
          });

          grid.appendChild(card);
        });
      }
    })
    .catch(err => console.error("🚨 FEIL LuxuryProducts:", err));
}

