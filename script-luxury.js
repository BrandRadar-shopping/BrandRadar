// ============================================
// 💎 Luxury Corner – stable version
// Bruker delt rating-system fra Product Card Engine
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU";
  loadLuxuryBrands(SHEET_ID, "LuxuryBrands");
  loadLuxuryProducts(SHEET_ID, "LuxuryProducts");
  initLuxuryHeroFade();
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
  const n = String(name || "").toLowerCase();
  for (const key in categoryMap) {
    if (categoryMap[key].some(x => n.includes(x))) return key;
  }
  return "other";
}

function cleanRating(value) {
  const parsed = parseFloat(
    String(value ?? "").replace(",", ".").replace(/[^0-9.]/g, "")
  );
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(5, parsed));
}

function cleanPrice(value) {
  return parseFloat(
    String(value ?? "").replace(/[^\d.,]/g, "").replace(",", ".")
  ) || 0;
}

function formatPrice(value) {
  const n = cleanPrice(value);
  return n ? `${Math.round(n)} kr` : "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getResolvedLuxuryId(product) {
  if (typeof resolveProductId === "function") return resolveProductId(product);
  return String(product.id || product.product_id || "").trim();
}

function buildLuxuryRatingMarkup(ratingValue) {
  if (
    window.BrandRadarProductCardEngine &&
    typeof window.BrandRadarProductCardEngine.buildRatingMarkup === "function"
  ) {
    return window.BrandRadarProductCardEngine.buildRatingMarkup(ratingValue, {
      showValue: true,
      emptyMode: "hide"
    });
  }

  const rating = cleanRating(ratingValue);
  if (rating === null) return "";
  return `<div class="rating-stars"><span class="rating-value">${rating.toFixed(1)}</span></div>`;
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
      if (!grid) return;

      grid.innerHTML = "";

      rows.forEach(b => {
        const card = document.createElement("div");
        card.classList.add("brand-card");
        card.innerHTML = `
          <img src="${escapeHtml(b.logo || "")}" class="brand-logo" alt="${escapeHtml(b.brand || "")}">
          <h3>${escapeHtml(b.brand || "")}</h3>
        `;
        card.addEventListener("click", () => {
          window.location.href = `brand-page.html?brand=${encodeURIComponent(b.brand || "")}`;
        });
        grid.appendChild(card);
      });
    })
    .catch(err => console.error("❌ Luxury brands error:", err));
}

// ============================================
// ✅ Premium Products
// ============================================
let allLuxury = [];

function loadLuxuryProducts(sheetId, sheetName) {
  const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

  fetch(url)
    .then(r => r.json())
    .then(rows => {
      allLuxury = rows.map(p => ({
        ...p,
        id: String(p.id || p.product_id || "").trim(),
        title: p.title || p.product_name || p.name || "Uten navn",
        brand: p.brand || "",
        image_url: p.image_url || "",
        price: p.price || "",
        discount: p.discount || "",
        product_url: p.product_url || p.link || "",
        rating: cleanRating(p.rating),
        category: detectCategory(p.tag || p.title || "")
      }));

      renderLuxuryProducts();
      setFilterEvents();
    })
    .catch(err => console.error("❌ Luxury products error:", err));
}

function renderLuxuryProducts() {
  const goldGrid = document.getElementById("luxuryGoldPickGrid");
  const prodGrid = document.getElementById("luxuryProductGrid");
  const empty = document.getElementById("luxury-empty");
  const filterEl = document.getElementById("filterCategory");
  const sortEl = document.getElementById("sortProducts");

  if (!goldGrid || !prodGrid || !empty || !filterEl || !sortEl) return;

  goldGrid.innerHTML = "";
  prodGrid.innerHTML = "";

  const filterVal = filterEl.value;
  const sortVal = sortEl.value;
  let list = [...allLuxury];

  if (filterVal !== "all") {
    list = list.filter(p => p.category === filterVal);
  }

  if (sortVal === "rating") {
    list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  } else if (sortVal === "highprice") {
    list.sort((a, b) => cleanPrice(b.price) - cleanPrice(a.price));
  } else if (sortVal === "lowprice") {
    list.sort((a, b) => cleanPrice(a.price) - cleanPrice(b.price));
  }

  empty.style.display = list.length ? "none" : "block";

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "luxury-product-card";

    const storedId = getResolvedLuxuryId(p);
    const isFav = typeof isProductFavorite === "function" && isProductFavorite(storedId);
    const favActive = isFav ? "active" : "";

    const goldPick = String(p.goldpick || "").toLowerCase() === "yes";
    const goldTag = goldPick
      ? `<span class="gold-pick-badge">👑 Gold Pick</span>`
      : "";

    const discountBadge = p.discount
      ? `<span class="discount-badge">-${String(p.discount).replace(/[^0-9]/g, "")}%</span>`
      : "";

    const ratingMarkup = buildLuxuryRatingMarkup(p.rating);
    const priceText = formatPrice(p.price);

    card.innerHTML = `
      ${discountBadge}
      ${goldTag}

      <button class="fav-btn ${favActive}" data-id="${escapeHtml(storedId)}" aria-label="${isFav ? "Fjern fra favoritter" : "Legg til favoritt"}">
        <svg class="fav-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                   2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
                   C13.09 3.81 14.76 3 16.5 3
                   19.58 3 22 5.42 22 8.5
                   c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>

      <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" class="luxury-img" loading="lazy">

      <div class="luxury-info">
        <h4>${escapeHtml(p.title)}</h4>
        <p class="brand">${escapeHtml(p.brand)}</p>
        ${ratingMarkup}
        <p class="price">${escapeHtml(priceText)}</p>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;

      if (p.id) {
        window.location.href = `product.html?id=${encodeURIComponent(p.id)}&luxury=true`;
      } else if (p.product_url) {
        window.open(p.product_url, "_blank", "noopener");
      }
    });

    const favBtn = card.querySelector(".fav-btn");
    favBtn?.addEventListener("click", (e) => {
      e.stopPropagation();

      const productData = {
        id: storedId,
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

      if (typeof toggleFavorite === "function") {
        toggleFavorite(productData, favBtn);
      }

      const nowActive = favBtn.classList.contains("active");
      favBtn.setAttribute(
        "aria-label",
        nowActive ? "Fjern fra favoritter" : "Legg til favoritt"
      );
    });

    if (goldPick) {
      goldGrid.appendChild(card);
    } else {
      prodGrid.appendChild(card);
    }
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
function initLuxuryHeroFade() {
  const slides = document.querySelectorAll(".luxury-hero-banner .hero-slide");
  let current = 0;

  if (!slides.length) return;

  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 6000);
}
