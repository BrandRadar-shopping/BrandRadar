// ===============================
// BRANDRADAR PRODUCT SYSTEM v8
// (Google Sheets + Caching + Favorites + Popup + % Fix)
// ===============================

// 1️⃣ Google Sheets JSON-endepunkt
const sheetURL =
  "https://script.google.com/macros/s/AKfycbx71nm6tf7gmgq-cfw-Z-xa1MWT1PGZJ0PPATfugadqwf6DOFgOoGYtNEKVwykI5C0Q/exec";

// 2️⃣ Cache (30 minutter)
const CACHE_KEY = "products_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutter

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(data) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ timestamp: Date.now(), data })
  );
}

// 3️⃣ Hent produkter
async function loadProducts() {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = `
    <div class="brand-loader">
      <div class="spinner"></div>
      <p>Laster produkter …</p>
    </div>
  `;

  // Vis cache først hvis tilgjengelig
  const cached = getCache();
  if (cached) renderProducts(cached);

  try {
    const res = await fetch(sheetURL, { cache: "no-store" });
    if (!res.ok) throw new Error("Nettverksfeil");
    const data = await res.json();
    if (!Array.isArray(data) || !data.length)
      throw new Error("Tom eller ugyldig data");
    setCache(data);
    renderProducts(data);
  } catch (err) {
    console.error("Feil ved lasting av produkter:", err);
    if (!cached)
      container.innerHTML = "<p>Kunne ikke laste produkter nå 😢</p>";
  }
}

// 4️⃣ Gjengi produktene
function renderProducts(data) {
  const container = document.getElementById("products-container");
  if (!container) return;
  container.innerHTML = "";

  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

  data.forEach((p) => {
    const brand = p["Brand"] || "";
    const title = p["Title"] || "";
    const price = p["Price"] || "";
    let discount = p["Discount"] || "";
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

    if (!title || !image || !link) return;

    // Rabattvisning: støtt både 0.2 og 20
    if (discount !== "") {
      let num = parseFloat(discount);
      if (num > 0 && num < 1) num = num * 100;
      discount = `${Math.round(num)}%`;
    }

    // Rabatt-badge
    let badgeHTML = "";
    if (discount) {
      const clean = String(discount).replace(/[%"]/g, "").trim();
      const isNew = /nyhet|new/i.test(clean);
      badgeHTML = `<span class="badge ${isNew ? "new" : ""}">
        ${isNew ? "Nyhet!" : "Discount: ${clean}%"}
      </span>`;
    }

    // Favorittstatus
    const isFavorite = favorites.some((f) => f.title === title);

    // Produktkort
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        ${badgeHTML}
        <button class="favorite-btn ${isFavorite ? "active" : ""}" title="Legg til i favoritter">
          <svg viewBox="0 0 24 24">
            <path d="M12 21s-7-4.35-10-8.87C-1.33 8.24 1.42 3 6.6 3
            9.07 3 12 5.09 12 5.09S14.93 3 17.4 3
            c5.18 0 7.93 5.24 4.6 9.13C19 16.65 12 21 12 21z"/>
          </svg>
        </button>
        <img src="${image}" alt="${title}">
      </div>
      <div class="product-info">
        <h3 class="product-name">${brand ? brand + " " : ""}${title}</h3>
        <p class="product-price">${price}</p>
        <p class="product-category">
          ${category}${gender ? " • " + gender : ""}${subcategory ? " • " + subcategory : ""}
        </p>
      </div>
    `;

    // Klikk → gå til produktdetaljer
    card.addEventListener("click", (e) => {
      if (e.target.closest(".favorite-btn")) return;
      const productData = {
        brand,
        title,
        price,
        discount,
        image,
        image2,
        image3,
        image4,
        link,
        category,
        gender,
        subcategory,
        description,
        rating,
      };
      localStorage.setItem("selectedProduct", JSON.stringify(productData));
      window.location.href = "product.html";
    });

    // Favorittknapp
    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      const exists = favorites.some((f) => f.title === title);

      if (exists) {
        favorites = favorites.filter((f) => f.title !== title);
        favBtn.classList.remove("active");
        showFavPopup("Fjernet fra favoritter ❌");
      } else {
        favorites.push({
          brand,
          title,
          price,
          discount,
          image,
          image2,
          image3,
          image4,
          link,
          category,
          gender,
          subcategory,
          description,
          rating,
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

  if (!container.children.length)
    container.innerHTML = "<p>Ingen produkter å vise.</p>";
}

// 5️⃣ Popup for favoritt
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

// 6️⃣ Oppdater favoritt-teller
function updateFavCount() {
  const count = JSON.parse(localStorage.getItem("favorites") || "[]").length;
  document
    .querySelectorAll("[data-fav-count]")
    .forEach((el) => (el.textContent = count));
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateFavCount();
});













