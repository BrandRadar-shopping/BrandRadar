/* ===================================================
   CATEGORY PAGE – Dynamic Filter + Google Sheets Fetch
   =================================================== */

const CATEGORY_SHEET_URL = "https://opensheet.elk.sh/2PACX-1vQWnu8IsFKWjitEI3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUUs_oF1737lGxAtAa2NGlRq0ThN-/BrandRadarProdukter"; // 👈 bytt til riktig BrandRadarProdukter-URL

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category")?.toLowerCase() || "";
  const gender = params.get("gender")?.toLowerCase() || "";
  const subcategory = params.get("subcategory")?.toLowerCase() || "";

  const titleEl = document.getElementById("category-title");
  const descEl = document.getElementById("category-desc");
  const grid = document.getElementById("category-products");

  // Sett dynamisk tittel
  titleEl.textContent = `${capitalize(gender)} ${capitalize(category)} – ${capitalize(subcategory)}`;
  descEl.textContent = `Utforsk populære ${subcategory} innen ${category} for ${gender}.`;

  try {
    const res = await fetch(CATEGORY_SHEET_URL);
    const csv = await res.text();
    const rows = csv.split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const items = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = r[i]?.trim() || ""));
      return obj;
    });

    // Filtrer basert på URL-parametere
    const filtered = items.filter(p =>
      (!category || p.category?.toLowerCase() === category) &&
      (!gender || p.gender?.toLowerCase() === gender) &&
      (!subcategory || p.subcategory?.toLowerCase() === subcategory)
    );

    if (filtered.length === 0) {
      grid.innerHTML = `<p>Ingen produkter funnet for denne kategorien.</p>`;
      return;
    }

    // Render produkter
    grid.innerHTML = filtered
      .map(
        p => `
        <div class="product-card fade-in">
          <img src="${p.image_url}" alt="${p.product_name}">
          <div class="product-info">
            <h3>${p.brand}</h3>
            <p class="product-name">${p.product_name}</p>
            ${p.price ? `<p class="price">${p.price} kr</p>` : ""}
            <a href="${p.link}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        </div>`
      )
      .join("");
  } catch (err) {
    console.error("Feil ved lasting av produkter:", err);
    grid.innerHTML = `<p>Kunne ikke laste produkter akkurat nå.</p>`;
  }
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}



