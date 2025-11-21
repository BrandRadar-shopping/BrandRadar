// ======================================================
// BrandRadar – Favorittsystem (ID-basert & synket med index)
// ======================================================

const BRAND_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
const BRAND_TAB = "BrandRadarProdukter";
const BRAND_SHEET_URL = `https://opensheet.elk.sh/${BRAND_SHEET_ID}/${BRAND_TAB}`;

// --- Utils ---

function cleanRating(value) {
  if (!value) return null;
  return (
    parseFloat(
      value.toString().replace(",", ".").replace(/[^0-9.\-]/g, "")
    ) || null
  );
}

// 🔹 Hent produkt-favoritt-ID-er (ENESTE sanne formatet)
function getFavoriteProductIds() {
  const raw = JSON.parse(localStorage.getItem("favoriteProducts") || "[]");

  const ids = raw
    .map(v => {
      if (v == null) return "";
      if (typeof v === "object") {
        if ("id" in v && v.id != null) return String(v.id);
        return "";
      }
      return String(v);
    })
    .map(s => s.trim())
    .filter(id => id && id !== "undefined" && id !== "null");

  return [...new Set(ids)];
}

// 🔹 Lagre ID-er (og speil til "favorites" som ID-liste for kompat)
function setFavoriteProductIds(ids) {
  const unique = [...new Set(ids.map(String))].map(s => s.trim()).filter(Boolean);
  localStorage.setItem("favoriteProducts", JSON.stringify(unique));
  localStorage.setItem("favorites", JSON.stringify(unique));
}

// 🔹 Brand-favoritter (samme som før)
function getFavoriteBrands() {
  return JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
}

function toggleBrandFavorite(brand) {
  const brands = getFavoriteBrands();
  const index = brands.indexOf(brand);

  if (index >= 0) {
    brands.splice(index, 1);
    showToast("❌ Brand fjernet");
  } else {
    brands.push(brand);
    showToast("✅ Brand favorisert");
  }

  localStorage.setItem("favoriteBrands", JSON.stringify(brands));
  updateFavoriteTabsCount();
  updateFavoriteCount();
}

// 🔹 Teller i header
function updateFavoriteCount() {
  const productCount = getFavoriteProductIds().length;
  const brandCount = getFavoriteBrands().length;
  const total = productCount + brandCount;

  document
    .querySelectorAll("#favorites-count")
    .forEach(el => (el.textContent = total));
}

// 🔹 Teller på tabs
function updateFavoriteTabsCount() {
  const elProducts = document.getElementById("fav-products-count");
  const elBrands = document.getElementById("fav-brands-count");

  if (elProducts) elProducts.textContent = getFavoriteProductIds().length;
  if (elBrands) elBrands.textContent = getFavoriteBrands().length;
}

// 🔹 Toast
function showToast(message) {
  let toast = document.querySelector(".toast-message");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-message";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

// 🔹 Toggle produkt-favoritt via ID
function toggleFavoriteById(id) {
  const pid = String(id).trim();
  if (!pid) return;

  const favorites = getFavoriteProductIds();
  const index = favorites.indexOf(pid);

  if (index >= 0) {
    favorites.splice(index, 1);
    showToast("❌ Fjernet fra favoritter");
  } else {
    favorites.push(pid);
    showToast("✅ Lagt til i favoritter");
  }

  setFavoriteProductIds(favorites);
  updateFavoriteCount();
  updateFavoriteTabsCount();
}

// ======================================================
// LAST INN FAVORITT-PRODUKTER (fra BrandRadarProdukter)
// ======================================================

async function loadFavoriteProducts() {
  const grid = document.getElementById("favorites-product-grid");
  const emptyMsg = document.getElementById("empty-products");
  if (!grid) return;

  const favIds = getFavoriteProductIds();
  grid.innerHTML = "";

  if (favIds.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    updateFavoriteTabsCount();
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  let allProducts = [];
  try {
    const res = await fetch(BRAND_SHEET_URL);
    allProducts = await res.json();
  } catch (err) {
    console.error("❌ Klarte ikke laste BrandRadarProdukter for favoritter:", err);
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  const productById = {};
  allProducts.forEach(p => {
    if (!p.id) return;
    productById[String(p.id).trim()] = p;
  });

  const validIds = [];
  favIds.forEach(fid => {
    const p = productById[fid];
    if (!p) return;

    validIds.push(fid);
    const ratingValue = cleanRating(p.rating);

    const card = document.createElement("div");
    card.classList.add("product-card");

    // Fjern-tag
    const removeTag = document.createElement("span");
    removeTag.classList.add("remove-tag");
    removeTag.textContent = "Fjern";
    removeTag.dataset.id = fid;
    card.appendChild(removeTag);

    // Rabattmerke
    if (p.discount) {
      const discountBadge = document.createElement("div");
      discountBadge.classList.add("discount-badge");
      discountBadge.textContent = `-${p.discount}%`;
      card.appendChild(discountBadge);
    }

    // Bilde
    const img = document.createElement("img");
    img.src = p.image_url || "";
    img.alt = p.title || p.product_name || "";
    img.loading = "lazy";
    card.appendChild(img);

    // Info-seksjon
    const info = document.createElement("div");
    info.classList.add("product-info");

    const brand = document.createElement("p");
    brand.classList.add("brand");
    brand.textContent = p.brand || "";

    const name = document.createElement("h3");
    name.classList.add("product-name");
    name.textContent = p.title || p.product_name || "";

    const rating = document.createElement("p");
    rating.classList.add("rating");
    rating.innerHTML = ratingValue
      ? `⭐ ${ratingValue.toFixed(1)}`
      : `<span style="color:#ccc;">–</span>`;

    // Prislinje
    const priceLine = document.createElement("div");
    priceLine.classList.add("price-line");

    const newPrice = document.createElement("span");
    newPrice.classList.add("new-price");

    let priceText = p.price || "";
    if (p.price) {
      const numericPrice = parseFloat(
        p.price.toString().replace(/[^\d.,]/g, "").replace(",", ".")
      );
      if (!isNaN(numericPrice)) {
        priceText = `${numericPrice.toFixed(0)} kr`;
      }
    }
    newPrice.textContent = priceText;
    priceLine.appendChild(newPrice);

    // Hvis både price + old_price -> vis gammel pris
    if (p.old_price) {
      const oldPrice = document.createElement("span");
      oldPrice.classList.add("old-price");
      oldPrice.textContent = `${p.old_price} kr`;
      priceLine.appendChild(oldPrice);
    }

    info.append(brand, name, rating, priceLine);
    card.appendChild(info);

    // Klikk → product.html?id=...
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${encodeURIComponent(fid)}`;
    });

    // Fjern favoritt (kun denne, ikke navigasjon)
    removeTag.addEventListener("click", e => {
      e.stopPropagation();
      toggleFavoriteById(fid);
      loadFavoriteProducts();
    });

    grid.appendChild(card);
  });

  // Rydd opp i lokale favoritter hvis noen IDs manglet i arket
  if (validIds.length !== favIds.length) {
    setFavoriteProductIds(validIds);
    updateFavoriteCount();
    updateFavoriteTabsCount();
  }

  updateFavoriteTabsCount();
}

// ======================================================
// FAVORITT-BRANDS RENDERING (som før)
// ======================================================

function loadFavoriteBrands() {
  const favBrands = getFavoriteBrands();
  const allBrandsData = JSON.parse(localStorage.getItem("allBrandsData") || "[]");

  const grid = document.getElementById("favorites-brand-grid");
  const emptyMsg = document.getElementById("empty-brands");

  if (!grid) return;

  grid.innerHTML = "";
  if (favBrands.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  favBrands.forEach(brand => {
    const brandData = allBrandsData.find(
      b => b.brand && b.brand.trim() === brand.trim()
    );
    if (!brandData) return;

    const card = document.createElement("div");
    card.classList.add("brand-card");

    card.innerHTML = `
      <span class="remove-brand-tag" data-brand="${brand}">Fjern</span>
      <img class="brand-logo" src="${brandData.logo}" alt="${brand}">
      <h3>${brand}</h3>
    `;

    card.querySelector(".remove-brand-tag").addEventListener("click", e => {
      e.stopPropagation();
      toggleBrandFavorite(brand);
      loadFavoriteBrands();
    });

    card.addEventListener("click", () => {
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brand)}`;
    });

    grid.appendChild(card);
  });
}

// ======================================================
// DOMContentLoaded – start alt
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  updateFavoriteCount();
  loadFavoriteProducts();

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const showTab = btn.dataset.tab;

        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        tabContents.forEach(c => c.classList.remove("active"));
        document.getElementById(`tab-${showTab}`).classList.add("active");
      });
    });

    loadFavoriteBrands();
    updateFavoriteTabsCount();
  }
});

