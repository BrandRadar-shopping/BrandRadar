// --- BrandRadar Brands Loader (JSON + cache) --- //
// 1) Lim inn Apps Script-URL her:
const BRANDS_JSON_URL = "PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE";

// 2) Konfig: cache-levetid (i ms). 6 timer = 6 * 60 * 60 * 1000
const CACHE_TTL = 6 * 60 * 60 * 1000;
const CACHE_KEY = "brands_json_cache_v1";

function renderBrands(data) {
  const highlightGrid = document.getElementById("highlight-grid");
  const grid = document.getElementById("brands");
  if (!highlightGrid || !grid) return;

  highlightGrid.innerHTML = "";
  grid.innerHTML = "";

  // Forventer felter: brand, brandlogo, description, link, highlight
  data
    .filter(r => r && r.brand) // dropp tomme rader
    .forEach(row => {
      const name = row.brand;
      const logo = row.brandlogo || "";
      const desc = row.description || "";
      const link = row.link || "";
      const highlight = String(row.highlight || "").toLowerCase().trim() === "yes";

      const card = document.createElement("div");
      card.className = "brand-card" + (highlight ? " highlight" : "");
      card.innerHTML = `
        ${logo ? `<img src="${logo}" alt="${name} logo">` : ""}
        <h3>${name}</h3>
        <p>${desc}</p>
      `;
      if (link) card.addEventListener("click", () => window.open(link, "_blank"));

      (highlight ? highlightGrid : grid).appendChild(card);
    });
}

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (!t || !data) return null;
    if (Date.now() - t > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
  } catch {}
}

async function loadBrands() {
  const brandsGrid = document.getElementById("brands");
  if (brandsGrid) brandsGrid.innerHTML = "<p>Laster brands …</p>";

  // 1) Prøv cache først (øyeblikkelig visning)
  const cached = getCache();
  if (cached) renderBrands(cached);

  // 2) Hent fersk data i bakgrunnen
  try {
    const res = await fetch(BRANDS_JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Nettverksfeil");
    const data = await res.json();
    // Sikre at keys er i lavere-case hvis noen har endret headere
    const normalized = data.map(row => {
      const o = {};
      Object.keys(row || {}).forEach(k => o[String(k).trim().toLowerCase()] = row[k]);
      return o;
    });
    setCache(normalized);
    renderBrands(normalized);
  } catch (err) {
    console.error("Kunne ikke hente brands:", err);
    if (!cached && brandsGrid) brandsGrid.innerHTML = "<p>Kunne ikke laste brands nå 😢</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadBrands);

// --- Favoritt-teller (så den er riktig på brands-siden også) ---
(function(){
  function readFavs(){ try { return JSON.parse(localStorage.getItem("favorites")||"[]"); } catch { return []; } }
  function updateFavCount(){
    const count = readFavs().length;
    document.querySelectorAll("[data-fav-count]").forEach(el => el.textContent = count);
  }
  document.addEventListener("DOMContentLoaded", updateFavCount);
  window.addEventListener("storage", e => { if (e.key === "favorites") updateFavCount(); });
})();

