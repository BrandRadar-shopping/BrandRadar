// ======================================================
// ⭐ BrandRadar – Favoritter-side (bruker favorites-core.js)
// ======================================================

// Vi gjenbruker cleanRating fra favorites-core hvis den finnes
const cleanRatingRef = window.cleanRating || function (value) {
  if (!value) return null;
  const n = parseFloat(
    value.toString().replace(",", ".").replace(/[^0-9.\-]/g, "")
  );
  return Number.isFinite(n) ? n : null;
};

// ===============================
// ⭐ FAVORITT-BRANDS (global)
// ===============================

function getFavoriteBrands() {
  try {
    const raw = JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    console.warn("⚠️ Klarte ikke lese favoriteBrands:", e);
    return [];
  }
}

function setFavoriteBrands(list) {
  localStorage.setItem("favoriteBrands", JSON.stringify(list || []));
}

function toggleBrandFavorite(brand) {
  if (!brand) return;

  const current = getFavoriteBrands();
  const idx = current.indexOf(brand);
  if (idx >= 0) {
    current.splice(idx, 1);
    if (window.showFavoriteToast) {
      window.showFavoriteToast(`${brand} fjernet fra favoritt-brands`, "success");
    }
  } else {
    current.push(brand);
    if (window.showFavoriteToast) {
      window.showFavoriteToast(`${brand} lagt til i favoritt-brands`, "success");
    }
  }

  setFavoriteBrands(current);

  // Oppdater global teller (produkter + brands)
  if (window.updateFavoriteCounter) {
    window.updateFavoriteCounter();
  }
  // Oppdater tabs hvis vi står på favoritter.html
  if (typeof updateFavoriteTabsCount === "function") {
    updateFavoriteTabsCount();
  }
}

// Eksponer globalt slik at script-brands.js kan bruke dem
window.getFavoriteBrands = getFavoriteBrands;
window.toggleBrandFavorite = toggleBrandFavorite;

// ===============================
// ⭐ FAVORITT-TABS COUNTER (lokal)
// ===============================

function updateFavoriteTabsCount() {
  const favProducts = (window.getFavorites ? window.getFavorites() : []) || [];
  const favBrands = getFavoriteBrands();

  const elProducts = document.getElementById("fav-products-count");
  const elBrands = document.getElementById("fav-brands-count");

  if (elProducts) elProducts.textContent = favProducts.length;
  if (elBrands) elBrands.textContent = favBrands.length;
}

window.updateFavoriteTabsCount = updateFavoriteTabsCount;

// ===============================
// ⭐ RENDER PRODUKT-FAVORITTER
// ===============================

function loadFavoriteProducts() {
  if (!window.getFavorites) {
    console.warn("⚠️ getFavorites ikke tilgjengelig (favorites-core.js mangler?)");
    return;
  }

  const favorites = window.getFavorites(); // fra favorites-core.js
  const grid = document.getElementById("favorites-product-grid");
  const emptyMsg = document.getElementById("empty-products");

  if (!grid) return;
  grid.innerHTML = "";

  if (!Array.isArray(favorites) || favorites.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  favorites.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    const id = product.id || "";
    const title = product.title || window.getProductName?.(product) || "";
    const brand = product.brand || "";
    const imgUrl = product.image_url || "";
    const isLuxury = !!product.luxury;
    const ratingValue =
      typeof product.rating === "number"
        ? product.rating
        : cleanRatingRef(product.rating);

    // ✅ Fjern-knapp
    const removeTag = document.createElement("span");
    removeTag.classList.add("remove-tag");
    removeTag.textContent = "Fjern";
    removeTag.dataset.id = id;
    card.appendChild(removeTag);

    // ✅ Rabattmerke (hvis vi har discount)
    if (product.discount) {
      const discountBadge = document.createElement("div");
      discountBadge.classList.add("discount-badge");
      discountBadge.textContent = `-${product.discount}%`;
      card.appendChild(discountBadge);
    }

    // ✅ Bilde
    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = title;
    img.loading = "lazy";
    card.appendChild(img);

    // ✅ Info-seksjon
    const info = document.createElement("div");
    info.classList.add("product-info");

    const brandEl = document.createElement("p");
    brandEl.classList.add("brand");
    brandEl.textContent = brand || "";

    const nameEl = document.createElement("h3");
    nameEl.classList.add("product-name");
    nameEl.textContent = title || "";

    const ratingEl = document.createElement("p");
    ratingEl.classList.add("rating");
    ratingEl.innerHTML = ratingValue
      ? `⭐ ${ratingValue.toFixed(1)}`
      : `<span style="color:#ccc;">–</span>`;

    const priceLine = document.createElement("div");
    priceLine.classList.add("price-line");

    let priceText = product.price || "";
    if (priceText && !/kr/i.test(priceText)) {
      priceText = `${priceText} kr`;
    }

    const newPrice = document.createElement("span");
    newPrice.classList.add("new-price");
    newPrice.textContent = priceText || "";
    priceLine.appendChild(newPrice);

    info.append(brandEl, nameEl, ratingEl, priceLine);
    card.appendChild(info);

    // ✅ Klikk på kort → product.html
    card.addEventListener("click", () => {
      if (!id) return;
      const luxuryParam = isLuxury ? "&luxury=true" : "";
      window.location.href = `product.html?id=${encodeURIComponent(id)}${luxuryParam}`;
    });

    // ✅ Fjern favoritt
    removeTag.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.toggleFavorite) {
        window.toggleFavorite(product); // bruker favorites-core.js
      } else {
        // fallback: manuelt
        const current = window.getFavorites ? window.getFavorites() : [];
        const idx = current.findIndex(f => String(f.id) === String(id));
        if (idx >= 0) current.splice(idx, 1);
        localStorage.setItem("favorites", JSON.stringify(current));
      }
      loadFavoriteProducts();
      updateFavoriteTabsCount();
    });

    grid.appendChild(card);
  });
}

// ===============================
// ⭐ RENDER FAVORITT-BRANDS
// ===============================

function loadFavoriteBrands() {
  const favBrands = getFavoriteBrands();
  const allBrandsData = JSON.parse(localStorage.getItem("allBrandsData") || "[]");

  const grid = document.getElementById("favorites-brand-grid");
  const emptyMsg = document.getElementById("empty-brands");

  if (!grid) return;

  grid.innerHTML = "";
  if (!favBrands.length) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  favBrands.forEach(brand => {
    const brandData = allBrandsData.find(
      b => (b.brand || "").trim() === (brand || "").trim()
    );

    const card = document.createElement("div");
    card.classList.add("brand-card");

    const logo = brandData?.logo || "";
    card.innerHTML = `
      <span class="remove-brand-tag" data-brand="${brand}">Fjern</span>
      <img class="brand-logo" src="${logo}" alt="${brand}">
      <h3>${brand}</h3>
    `;

    card.querySelector(".remove-brand-tag").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBrandFavorite(brand);
      loadFavoriteBrands();
      updateFavoriteTabsCount();
    });

    card.addEventListener("click", () => {
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brand)}`;
    });

    grid.appendChild(card);
  });
}

// ===============================
// ⭐ INIT – KUN PÅ favoritter.html
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // Header-teller (fra favorites-core)
  if (window.updateFavoriteCounter) {
    window.updateFavoriteCounter();
  }

  // Render produkter
  loadFavoriteProducts();

  // Tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const showTab = btn.dataset.tab;

        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        tabContents.forEach(c => c.classList.remove("active"));
        const activeTab = document.getElementById(`tab-${showTab}`);
        if (activeTab) activeTab.classList.add("active");
      });
    });

    // Brand-favoritter + tab-teller
    loadFavoriteBrands();
    updateFavoriteTabsCount();
  }
});
