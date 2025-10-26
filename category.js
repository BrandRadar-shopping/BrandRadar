/* ================================
   CATEGORY PAGE – BRANDRADAR
   Dynamisk kategori-/filterside
   ================================ */

// 🔗 Google Sheet URL – samme som på forsiden
const PRODUCT_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7ok8qKUbRPrtW8EJdBnhsoN2c8iZL8zAGAjWlNqHPPADXpIF0nCh0sjR79jqbC3aZycHKYHcXIbfW/pub?output=csv"; // <- bruk den for "BrandRadarProdukter"

// HTML-elementer
const grid = document.querySelector("#category-grid");
const titleEl = document.querySelector("#category-title");
const subtitleEl = document.querySelector("#category-subtitle");

/* -------------------------------------
   Hjelpefunksjon for å parse CSV trygt
------------------------------------- */
function parseCSV(text) {
  const rows = text.trim().split("\n").map(r => r.split(","));
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    const obj = {};
    row.forEach((val, i) => obj[headers[i]] = val.trim());
    return obj;
  });
}

/* -------------------------------------
   Hent parametere fra URL
------------------------------------- */
function getFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    gender: params.get("gender"),
    category: params.get("category"),
    subcategory: params.get("subcategory")
  };
}

/* -------------------------------------
   Hent og filtrer produkter
------------------------------------- */
async function fetchProducts() {
  try {
    const response = await fetch(PRODUCT_SHEET_URL);
    const csv = await response.text();
    const allProducts = parseCSV(csv);
    const filters = getFilters();

    // Filtrer produkter basert på URL-parametere
    const filtered = allProducts.filter(p => {
      const genderOk = !filters.gender || p.gender?.toLowerCase() === filters.gender.toLowerCase();
      const catOk = !filters.category || p.category?.toLowerCase() === filters.category.toLowerCase();
      const subOk = !filters.subcategory || p.subcategory?.toLowerCase() === filters.subcategory.toLowerCase();
      return genderOk && catOk && subOk;
    });

    renderProducts(filtered, filters);
  } catch (err) {
    console.error("Feil ved henting av produkter:", err);
  }
}

/* -------------------------------------
   Render produktkortene
------------------------------------- */
function renderProducts(products, filters) {
  if (!grid) return;

  // Sett tittel ut fra filtrene
  const titleParts = [];
  if (filters.gender) titleParts.push(filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1));
  if (filters.category) titleParts.push(filters.category.charAt(0).toUpperCase() + filters.category.slice(1));
  if (filters.subcategory) titleParts.push(filters.subcategory.charAt(0).toUpperCase() + filters.subcategory.slice(1));

  titleEl.textContent = titleParts.length ? titleParts.join(" – ") : "Produkter";
  subtitleEl.textContent = `Viser ${products.length} produkter fra våre partnere`;

  // Render grid
  grid.innerHTML = products.length
    ? products.map(p => `
      <div class="product-card fade-in">
        <img src="${p.image_url}" alt="${p.product_name}">
        <div class="product-info">
          <h3>${p.brand}</h3>
          <p class="product-name">${p.product_name}</p>
          <p class="price">${p.price ? p.price + " kr" : ""}</p>
          <a href="product.html?brand=${encodeURIComponent(p.brand)}&title=${encodeURIComponent(p.product_name)}&price=${encodeURIComponent(p.price)}&image=${encodeURIComponent(p.image_url)}&link=${encodeURIComponent(p.link)}" class="buy-btn">Se produkt</a>
        </div>
      </div>
    `).join("")
    : `<p>Ingen produkter funnet for denne kategorien.</p>`;
}

fetchProducts();

