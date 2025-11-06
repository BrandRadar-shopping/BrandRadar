// ============================================
// ✅ Luxury Corner - BrandRadar
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU";
  const BRANDS_SHEET = "LuxuryBrands";

  const url = `https://opensheet.elk.sh/${SHEET_ID}/${BRANDS_SHEET}`;
  const grid = document.getElementById("luxuryBrandGrid");

  fetch(url)
    .then(res => res.json())
    .then(rows => {
      const brands = rows.map(r => ({
        brand: r.brand || "",
        logo: r.logo || "",
        country: r.country || "",
        category: r.category || ""
      }));

      renderLuxuryBrands(brands);
      localStorage.setItem("LuxuryBrandList", JSON.stringify(brands));
    })
    .catch(err => console.error("🚨 FEIL LuxuryBrands:", err));
});

function renderLuxuryBrands(brands) {
  const grid = document.getElementById("luxuryBrandGrid");
  grid.innerHTML = "";

  brands.forEach(b => {
    const card = document.createElement("div");
    card.classList.add("brand-card");

    card.innerHTML = `
      <img src="${b.logo}" alt="${b.brand}" class="brand-logo">
      <h3>${b.brand}</h3>
      <p class="lux-sub">${b.country || ""}</p>
    `;

    card.addEventListener("click", () => {
      window.location.href = `brand-page.html?brand=${encodeURIComponent(b.brand)}`;
    });

    grid.appendChild(card);
  });
}
