// ============================================
// 💎 Luxury Corner - FINAL v5 (Feilfri + Favorittfix)
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU";
  loadLuxuryBrands(SHEET_ID, "LuxuryBrands");
  loadLuxuryProducts(SHEET_ID, "LuxuryProducts");
});

// ---------------- Helpers ---------------- //
const categoryMap = {
  bag: ["bag", "handbag", "purse", "tote"],
  watch: ["watch", "klokke"],
  sneakers: ["shoe", "sneaker", "boots"],
  jewelry: ["jewelry", "ring", "bracelet", "necklace"],
  accessories: ["belt", "scarf", "glasses", "wallet"]
};

function detectCategory(name) {
  const n = name.toLowerCase();
  for (const key in categoryMap) {
    if (categoryMap[key].some(x => n.includes(x))) return key;
  }
  return "other";
}

// ============================================
// ✅ Eksklusive Brands
// ============================================
function loadLuxuryBrands(sheetId, sheetName) {
  const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;
  fetch(url)
    .then(r => r.json())
    .then(rows => {
      const grid = document.getElementById("luxuryBrandGrid");
      grid.innerHTML = "";
      rows.forEach(b => {
        const card = document.createElement("div");
        card.classList.add("brand-card");
        card.innerHTML = `
          <img src="${b.logo}" class="brand-logo" alt="${b.brand}">
          <h3>${b.brand}</h3>
        `;
        card.addEventListener("click", () => {
          window.location.href = `brand-page.html?brand=${encodeURIComponent(b.brand)}`;
        });
        grid.appendChild(card);
      });
    });
}

// ============================================
// ✅ Premium Products (Filters + GoldPick + Favorites)
// ============================================
let allLuxury = [];

function loadLuxuryProducts(sheetId, sheetName) {
  const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;
  fetch(url)
    .then(r => r.json())
    .then(rows => {
      allLuxury = rows.map(p => ({
        ...p,
        rating: parseFloat((p.rating || "0").replace(",", ".")),
        category: detectCategory(p.tag || "")
      }));
      renderLuxuryProducts();
      setFilterEvents();
    });
}

function renderLuxuryProducts() {
  const goldGrid = document.getElementById("luxuryGoldPickGrid");
  const prodGrid = document.getElementById("luxuryProductGrid");
  const empty = document.getElementById("luxury-empty");

  if (!goldGrid || !prodGrid) return;
  goldGrid.innerHTML = "";
  prodGrid.innerHTML = "";

  const filterVal = document.getElementById("filterCategory").value;
  const sortVal = document.getElementById("sortProducts").value;
  let list = [...allLuxury];

  if (filterVal !== "all") list = list.filter(p => p.category === filterVal);
  if (sortVal === "rating") list.sort((a, b) => b.rating - a.rating);
  if (sortVal === "highprice") list.sort((a, b) => Number(b.price) - Number(a.price));
  if (sortVal === "lowprice") list.sort((a, b) => Number(a.price) - Number(b.price));

  empty.style.display = list.length ? "none" : "block";

  list.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("luxury-product-card");

    const goldPick = (p.goldpick || "").toLowerCase() === "yes";
    const goldTag = goldPick ? `<span class="gold-pick-badge">👑 Gold Pick</span>` : "";
    const discount = p.discount ? `<span class="discount-badge">${p.discount}%</span>` : "";

    // GLOBAL FAVORITT-STATUS
    const storedId = resolveProductId(p);
    const isFav = typeof isProductFavorite === "function" && isProductFavorite(storedId);
    const favActive = isFav ? "active" : "";

    card.innerHTML = `
      ${discount}
      ${goldTag}
      <button class="fav-btn ${favActive}" data-id="${storedId}">
        <svg class="fav-icon" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                   2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
                   C13.09 3.81 14.76 3 16.5 3
                   19.58 3 22 5.42 22 8.5
                   c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>

      <img src="${p.image_url}" alt="${p.title}" class="luxury-img">
      <div class="luxury-info">
        <h4>${p.title}</h4>
        <p class="brand">${p.brand}</p>
        <p class="rating">⭐ ${p.rating.toFixed(1)}</p>
        <p class="price">${p.price} kr</p>
      </div>
    `;

    // Klikk → produktdetalj
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;
      if (p.id) window.location.href = `product.html?id=${p.id}&luxury=true`;
      else if (p.product_url) window.open(p.product_url, "_blank");
    });

    // ❤️ FAVORITT-KNAPP
    const favBtn = card.querySelector(".fav-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const productData = {
        id: resolveProductId(p),
        product_name: p.title,
        title: p.title,
        brand: p.brand,
        price: p.price,
        discount: p.discount,
        image_url: p.image_url,
        product_url: p.product_url,
        category: p.category,
        rating: p.rating,
        luxury: true
      };

      toggleFavorite(productData, favBtn);
    });

    if (goldPick) goldGrid.appendChild(card);
    else prodGrid.appendChild(card);
  });
}

// ============================================
// Filters
// ============================================
function setFilterEvents() {
  const filter = document.getElementById("filterCategory");
  const sort = document.getElementById("sortProducts");
  if (filter) filter.addEventListener("change", renderLuxuryProducts);
  if (sort) sort.addEventListener("change", renderLuxuryProducts);
}

// ============================================
// Hero Banner Fade
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".luxury-hero-banner .hero-slide");
  let current = 0;

  if (!slides.length) return;

  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 6000);
});


