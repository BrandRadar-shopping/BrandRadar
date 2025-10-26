/* ===========================================================
   BrandRadar – Dynamic Category Page
   Henter produkter fra Google Sheet og filtrerer basert på
   ?category=clothing&gender=men&subcategory=jeans
   =========================================================== */

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv"; 
// ⬆️ bytt ut med din publiserte CSV-lenke til BrandRadarProdukter

document.addEventListener("DOMContentLoaded", initCategoryPage);

async function initCategoryPage() {
  const params = new URLSearchParams(window.location.search);
  const category = (params.get("category") || "").toLowerCase();
  const gender = (params.get("gender") || "").toLowerCase();
  const subcategory = (params.get("subcategory") || "").toLowerCase();

  const titleEl = document.getElementById("category-title");
  const gridEl = document.getElementById("product-grid");
  const noResultsEl = document.getElementById("no-results");

  // Sett dynamisk tittel
  const prettyGender = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "";
  const prettyCategory = subcategory
    ? subcategory.charAt(0).toUpperCase() + subcategory.slice(1)
    : category.charAt(0).toUpperCase() + category.slice(1);

  titleEl.textContent = `${prettyGender ? prettyGender + " " : ""}${prettyCategory}`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    const headers = rows[0].map(h => clean(h));
    const items = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = clean(r[i])));
      return obj;
    });

    const filtered = items.filter(p =>
      (!category || p.category?.toLowerCase() === category) &&
      (!gender || p.gender?.toLowerCase() === gender) &&
      (!subcategory || p.subcategory?.toLowerCase() === subcategory)
    );

    if (!filtered.length) {
      noResultsEl.style.display = "block";
      gridEl.innerHTML = "";
      return;
    }

    renderProducts(filtered, gridEl);
  } catch (err) {
    console.error("Feil ved lasting av produkter:", err);
    noResultsEl.style.display = "block";
  }
}

/* =============================
   CSV HJELPEFUNKSJONER
   ============================= */
function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') { cell += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === "," && !inQuotes) {
      row.push(cell); cell = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (cell.length || row.length) { row.push(cell); rows.push(row); }
      row = []; cell = "";
      if (c === "\r" && next === "\n") i++;
    } else {
      cell += c;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const clean = s => (s ?? "").trim();

/* =============================
   RENDER PRODUKTER
   ============================= */
function renderProducts(products, container) {
  container.innerHTML = products.map(p => `
    <div class="product-card fade-in">
      <img src="${p.image_url}" alt="${p.title}" class="product-image" />
      <div class="product-info">
        <h3>${p.brand}</h3>
        <p class="product-title">${p.title}</p>
        <p class="price">${p.price ? p.price + " kr" : ""} ${
          p.discount ? `<span class="discount">(${p.discount})</span>` : ""
        }</p>
        <a href="product.html?brand=${encodeURIComponent(p.brand)}&title=${encodeURIComponent(p.title)}" 
           class="view-btn">Se produkt</a>
      </div>
    </div>
  `).join("");
}


