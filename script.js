// --- BrandRadar Product Loader v6 (header-basert + ekstra bilder/fields) --- //
const sheetURL = "https://script.google.com/macros/s/AKfycbx71nm6tf7gmgq-cfw-Z-xa1MWT1PGZJ0PPATfugadqwf6DOFgOoGYtNEKVwykI5C0Q/exec";
// --- Cache-hjelpere (lagrer JSON lokalt i 30 minutter) ---
const CACHE_KEY = "products_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutter

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null; // utløpt
    return data;
  } catch {
    return null;
  }
}

function setCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    data
  }));
}

// CSV-linjeparser som håndterer hermetegn og komma
function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'; i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

// Finn kolonneindeks ved å matche headernavn (case/space-insensitivt)
function idx(headers, candidates) {
  const norm = s => s.toLowerCase().replace(/\s+/g, "");
  const H = headers.map(norm);
  for (const c of candidates) {
    const k = norm(c);
    const i = H.indexOf(k);
    if (i !== -1) return i;
  }
  return -1;
}

async function loadProducts() {
  const container = document.getElementById("products-container");
  if (container) container.innerHTML = "<p class='loader'>Laster produkter …</p>";

  // 1️⃣ Prøv cache først (vises umiddelbart)
  const cached = getCache();
  if (cached) renderProducts(cached);

  // 2️⃣ Hent fersk data i bakgrunnen
  try {
    const res = await fetch(sheetURL, { cache: "no-store" });
    if (!res.ok) throw new Error("Nettverksfeil");
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      if (!cached) container.innerHTML = "<p>Ingen produkter funnet.</p>";
      return;
    }

    setCache(data); // lagre i cache
    renderProducts(data); // oppdater visning
  } catch (err) {
    console.error("Feil ved lasting av produkter:", err);
    if (!cached) container.innerHTML = "<p>Kunne ikke laste produkter nå 😢</p>";
  }
}

function renderProducts(data) {
  const container = document.getElementById("products-container");
  if (!container) return;
  container.innerHTML = "";

  data.forEach(p => {
    // Tilpasset feltnavn fra Google Sheet
    const brand = p["Brand"] || "";
    const title = p["Title"] || "";
    const price = p["Price"] || "";
    const discount = p["Discount"] || "";
    const image = p["Image URL"] || "";
    const link = p["Product URL"] || "";
    const category = p["Category"] || "";
    const gender = p["gender"] || "";
    const subcategory = p["Subcategory"] || "";
    const description = p["Description"] || "";
    const rating = p["Rating"] || "";
    const image2 = p["image2"] || "";
    const image3 = p["image3"] || "";
    const image4 = p["image4"] || "";

    // hopp over rader uten minimumsfelt
    if (!title || !image || !link) return;

    // rabatt / badge
    let badgeHTML = "";
    if (discount) {
      const clean = String(discount).replace(/[%"]/g, "").trim();
      const isNew = /nyhet|new/i.test(clean);
      badgeHTML = `<span class="badge ${isNew ? "new" : ""}">
        ${isNew ? "Nyhet!" : "Discount: " + clean}
      </span>`;
    }

    // favorittstatus
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const isFavorite = favorites.some(f => f.title === title);

    // hovedkort
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        ${badgeHTML}
        <button class="favorite-btn ${isFavorite ? "active" : ""}" title="Legg til i favoritter">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21s-7-4.35-10-8.87C-1.33 8.24 1.42 3 6.6 3 9.07 3 12 5.09 12 5.09S14.93 3 17.4 3c5.18 0 7.93 5.24 4.6 9.13C19 16.65 12 21 12 21z"/>
          </svg>
        </button>
        <img src="${image}" alt="${title}">
      </div>
      <div class="product-info">
        <h3 class="product-name">${brand ? brand + " " : ""}${title}</h3>
        <p class="product-price">${price}</p>
        <p class="product-category">${category}${gender ? " • " + gender : ""}${subcategory ? " • " + subcategory : ""}</p>
      </div>
    `;

    // klikk på kort -> gå til produkt
    card.addEventListener("click", (e) => {
      if (e.target.closest(".favorite-btn")) return; // unngå at hjerte klikker åpner produkt
      const productData = {
        brand, title, price, discount, image, image2, image3, image4,
        link, category, gender, subcategory, description, rating
      };
      localStorage.setItem("selectedProduct", JSON.stringify(productData));
      window.location.href = "product.html";
    });

    // favorittknapp
    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      const exists = favorites.some(f => f.title === title);

      if (exists) {
        favorites = favorites.filter(f => f.title !== title);
        favBtn.classList.remove("active");
        showFavPopup("Fjernet fra favoritter ❌");
      } else {
        favorites.push({
          brand, title, price, discount, image, image2, image3, image4,
          link, category, gender, subcategory, description, rating
        });
        favBtn.classList.add("active");
        showFavPopup("Lagt til i favoritter ❤️");
      }

      localStorage.setItem("favorites", JSON.stringify(favorites));
      updateFavCount();
      window.dispatchEvent(new Event("favoritesChanged"));
    });

    container.appendChild(card);
  });

  if (!container.children.length) {
    container.innerHTML = "<p>Ingen produkter å vise.</p>";
  }
}

// popup for favorittbekreftelse
function showFavPopup(message) {
  let popup = document.getElementById("fav-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "fav-popup";
    popup.className = "fav-popup";
    document.body.appendChild(popup);
  }
  popup.textContent = message;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 1500);
}


document.addEventListener("DOMContentLoaded", loadProducts);



// --- Favoritt-teller på alle sider (live oppdatering + sanntid) ---
(function () {
  const favoritesKey = "favorites";

  function readFavs() {
    try {
      return JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    } catch {
      return [];
    }
  }

  function updateFavCount() {
    const count = readFavs().length;
    document.querySelectorAll("[data-fav-count]").forEach(el => el.textContent = count);
  }

  // Lytt på endringer i localStorage (andre faner / sider)
  window.addEventListener("storage", e => {
    if (e.key === favoritesKey) updateFavCount();
  });

  // Lytt på custom eventer lokalt (fra product.html og favoritter.html)
  window.addEventListener("favoritesChanged", updateFavCount);

  // Init
  document.addEventListener("DOMContentLoaded", updateFavCount);
})();












