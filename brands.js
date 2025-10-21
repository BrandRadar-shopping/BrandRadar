// --- CONFIG ---
const BRANDS_JSON_URL = "https://script.google.com/macros/s/AKfycbww8jzK2SooI6Cs69IJGh3mqwzgH5xKZHStHAFlW335vS4pSjW72lVSDA96I-rBY8xV/exec"; 
const CACHE_KEY = "brands_cache";
const CACHE_TTL = 60 * 60 * 1000; // 1 time

// --- CACHE ---
function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.timestamp > CACHE_TTL) return null;
    return obj.data;
  } catch {
    return null;
  }
}

function setCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

function renderBrands(data) {
  const grid = document.getElementById("brands");
  grid.classList.remove("brand-grid"); // i tilfelle gammel HTML
  grid.innerHTML = "";

  if (!data || !data.length) {
    grid.innerHTML = "<p>Ingen brands funnet 😢</p>";
    return;
  }

  // Filtrer utvalgte og vanlige brands
  const featured = [];
  const regular = [];

  data.forEach(b => {
    const val = (b.highlight || "").toString().trim().toLowerCase();
    if (["true", "yes", "ja", "1", "highlight"].includes(val)) {
      featured.push(b);
    } else {
      regular.push(b);
    }
  });

  // --- RENDER UTVALGTE ---
  if (featured.length) {
    const featuredTitle = document.createElement("h2");
    featuredTitle.textContent = "Utvalgte Brands";
    featuredTitle.className = "brand-section-title";
    grid.appendChild(featuredTitle);

    const featuredGrid = document.createElement("div");
    featuredGrid.className = "brand-grid highlight-grid";

    featured.forEach(b => {
      const card = document.createElement("div");
      card.className = "brand-card highlight";
      card.innerHTML = `
        <img src="${b.brandlogo || ""}" alt="${b.brand || "Brand"}">
        <h3>${b.brand || "Ukjent merke"}</h3>
        <p>${b.description || ""}</p>
        ${b.link ? `<a href="${b.link}" target="_blank" class="btn primary">Besøk</a>` : ""}
      `;
      featuredGrid.appendChild(card);
    });

    grid.appendChild(featuredGrid);
  }

  // --- RENDER ALLE ANDRE ---
  const allTitle = document.createElement("h2");
  allTitle.textContent = "Alle Brands";
  allTitle.className = "brand-section-title";
  grid.appendChild(allTitle);

  const allGrid = document.createElement("div");
  allGrid.className = "brand-grid";

  regular.forEach(b => {
    const card = document.createElement("div");
    card.className = "brand-card";
    card.innerHTML = `
      <img src="${b.brandlogo || ""}" alt="${b.brand || "Brand"}">
      <h3>${b.brand || "Ukjent merke"}</h3>
      <p>${b.description || ""}</p>
      ${b.link ? `<a href="${b.link}" target="_blank" class="btn primary">Besøk</a>` : ""}
    `;
    allGrid.appendChild(card);
  });

  grid.appendChild(allGrid);
}

// --- LOAD ---
async function loadBrands() {
  const grid = document.getElementById("brands");
 grid.innerHTML = `
  <div class="brand-loader">
    <div class="spinner"></div>
    <p>Laster inn brands...</p>
  </div>
`;

  const cached = getCache();
  if (cached) renderBrands(cached);

  try {
    const res = await fetch(BRANDS_JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Nettverksfeil");
    const data = await res.json();

    const normalized = data.map(row => {
      const o = {};
      Object.keys(row || {}).forEach(k => o[String(k).trim().toLowerCase()] = row[k]);
      return o;
    });

    setCache(normalized);
    renderBrands(normalized);
  } catch (err) {
    console.error("Feil ved lasting av brands:", err);
    if (!cached) grid.innerHTML = "<p>Kunne ikke laste brands 😢</p>";
  }
}

// --- INIT ---
window.addEventListener("load", () => {
  loadBrands();
  updateFavCount(); // behold favoritt-teller synkronisert
});


