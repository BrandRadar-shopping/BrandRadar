// ============================================
// ✅ Luxury Corner - BrandRadar (Phase 2)
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
        brand: r.brand || "",
        logo: r.logo || "",
        description: r.description || "",
        homepage: r.homepage_url || "#"
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
// ✅ Load Luxury Products
// =======================================================
function loadLuxuryProducts(sheetId, sheetName) {
  const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;
  const grid = document.getElementById("luxuryProductGrid");

  fetch(url)
    .then(res => res.json())
    .then(rows => {
      const products = rows.map(r => ({
        id: r.id || "",
        title: r.title || "",
        brand: r.brand || "",
        price: r.price || "",
        image_url: r.image_url || "",
        discount: r.discount || "",
        product_url: r.product_url || "#",
        tag: r.tag || "",
      }));

      grid.innerHTML = "";
      products.forEach(p => {
        const card = document.createElement("div");
        card.classList.add("luxury-product-card");

        card.innerHTML = `
          ${p.discount ? `<span class="discount-badge">${p.discount}%</span>` : ""}
          <img src="${p.image_url}" alt="${p.title}">
          <div class="luxury-info">
            <h4>${p.title}</h4>
            <p class="brand">${p.brand}</p>
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
    })
    .catch(err => console.error("🚨 FEIL LuxuryProducts:", err));
}

