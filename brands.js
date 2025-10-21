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

// --- RENDER ---
function renderBrands(data) {
  const grid = document.getElementById("brands");
  grid.innerHTML = "";

  if (!data || !data.length) {
    grid.innerHTML = "<p>Ingen brands funnet 😢</p>";
    return;
  }

  data.forEach(b => {
    const card = document.createElement("div");
    card.className = "brand-card";
    if (b.highlight && b.highlight.toString().toLowerCase() === "true") {
      card.classList.add("highlight");
    }

    card.innerHTML = `
      <img src="${b.brandlogo || ""}" alt="${b.brand || "Brand"}">
      <h3>${b.brand || "Ukjent merke"}</h3>
      <p>${b.description || ""}</p>
      ${b.link ? `<a href="${b.link}" target="_blank" class="btn primary">Besøk</a>` : ""}
    `;

    grid.appendChild(card);
  });
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


