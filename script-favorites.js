// ======================================================
// ⭐ BrandRadar – Favoritter-side
// Bruker favorites-core.js + offers-engine.js + product-card-engine.js
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
// ⭐ HJELPERE
// ===============================

function isTruthyLuxury(value) {
  if (value === true) return true;
  if (value === 1) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "luxury";
  }
  return false;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function isLuxuryBrand(brand) {
  const luxuryBrands = [
    "louis vuitton",
    "gucci",
    "prada",
    "dior",
    "hermès",
    "hermes",
    "chanel",
    "saint laurent",
    "ysl",
    "balenciaga",
    "givenchy",
    "fendi",
    "burberry",
    "valentino",
    "versace",
    "bottega veneta",
    "loewe",
    "celine",
    "cartier",
    "rolex",
    "omega",
    "tag heuer",
    "patek philippe",
    "audemars piguet",
    "richard mille",
    "hublot"
  ];

  return luxuryBrands.includes(normalizeText(brand));
}

function inferLuxury(product) {
  if (!product || typeof product !== "object") return false;

  if (isTruthyLuxury(product.luxury)) return true;
  if (isTruthyLuxury(product.is_luxury)) return true;

  const tier = normalizeText(product.tier);
  if (tier === "luxury" || tier === "premium") return true;

  const sheetSource = normalizeText(product.sheet_source);
  if (sheetSource === "luxury") return true;

  const collection = normalizeText(product.collection);
  if (collection === "luxury") return true;

  if (isLuxuryBrand(product.brand)) return true;

  return false;
}

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

  if (window.updateFavoriteCounter) {
    window.updateFavoriteCounter();
  }

  if (typeof updateFavoriteTabsCount === "function") {
    updateFavoriteTabsCount();
  }
}

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

async function loadFavoriteProducts() {
  if (!window.getFavorites) {
    console.warn("⚠️ getFavorites ikke tilgjengelig (favorites-core.js mangler?)");
    return;
  }

  const favorites = window.getFavorites();
  const grid = document.getElementById("favorites-product-grid");
  const emptyMsg = document.getElementById("empty-products");

  if (!grid) return;

  grid.innerHTML = "";

  if (!Array.isArray(favorites) || favorites.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

  const enrichedFavorites = window.BrandRadarOffersEngine
    ? await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(favorites)
    : favorites;

  for (const rawProduct of enrichedFavorites) {
    const isLuxury = inferLuxury(rawProduct);

    const product = {
      ...rawProduct,
      luxury: isLuxury
    };

    const id = product.id || "";

    const card = window.BrandRadarProductCardEngine.createCard(product, {
      isLuxury,
      showBrand: true,
      showRating: true,
      enableFavorite: true,
      onNavigate: (p) => {
        const pid = p.id || "";
        if (!pid) return;

        const productIsLuxury = inferLuxury(p);
        const luxuryParam = productIsLuxury ? "&luxury=true" : "";

        window.location.href = `product.html?id=${encodeURIComponent(pid)}${luxuryParam}`;
      },
      favoriteProductFactory: (p) => {
        const productIsLuxury = inferLuxury(p);

        return {
          id: p.id || "",
          product_name: p.title || p.product_name || p.name || "",
          title: p.title || p.product_name || p.name || "",
          brand: p.brand || "",
          price: p.price,
          discount: p.discount || "",
          image_url: p.image_url || "",
          product_url: p.product_url || "",
          category: p.category || "",
          rating: cleanRatingRef(p.rating),
          luxury: productIsLuxury
        };
      }
    });

    const favButton = card.querySelector(".favorite-toggle");

if (favButton) {
  favButton.classList.add("active");

  if (isLuxury) {
    favButton.classList.add("is-luxury");
  }
}

    // ✅ Fjern-knapp
    const removeTag = document.createElement("span");
    removeTag.classList.add("remove-tag");
    removeTag.textContent = "Fjern";
    removeTag.dataset.id = id;
    card.appendChild(removeTag);

    removeTag.addEventListener("click", (e) => {
      e.stopPropagation();

      if (window.toggleFavorite) {
        window.toggleFavorite(product);
      } else {
        const current = window.getFavorites ? window.getFavorites() : [];
        const idx = current.findIndex((f) => String(f.id) === String(id));
        if (idx >= 0) current.splice(idx, 1);
        localStorage.setItem("favorites", JSON.stringify(current));
      }

      loadFavoriteProducts();
      updateFavoriteTabsCount();
    });

    grid.appendChild(card);
  }
}

// ===============================
// ⭐ RENDER FAVORITT-BRANDS
// ===============================

function loadFavoriteBrands() {
  const favBrands = getFavoriteBrands();

  let allBrandsData = [];
  try {
    allBrandsData = JSON.parse(localStorage.getItem("allBrandsData") || "[]");
    if (!Array.isArray(allBrandsData)) {
      allBrandsData = [];
    }
  } catch (e) {
    console.warn("⚠️ Klarte ikke lese allBrandsData:", e);
    allBrandsData = [];
  }

  const grid = document.getElementById("favorites-brand-grid");
  const emptyMsg = document.getElementById("empty-brands");

  if (!grid) return;

  grid.innerHTML = "";

  if (!favBrands.length) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

  const showBrandTitle = window.innerWidth > 768;

  favBrands.forEach((brand) => {
    const brandData = allBrandsData.find(
      (b) => (b.brand || "").trim() === (brand || "").trim()
    );

    const card = document.createElement("div");
    card.classList.add("brand-card");

    const removeTag = document.createElement("span");
    removeTag.classList.add("remove-brand-tag");
    removeTag.dataset.brand = brand;
    removeTag.textContent = "Fjern";

    const logo = document.createElement("img");
    logo.classList.add("brand-logo");
    logo.src = brandData?.logo || "";
    logo.alt = brand;
    logo.loading = "lazy";

    card.appendChild(removeTag);
    card.appendChild(logo);

    if (showBrandTitle) {
      const title = document.createElement("h3");
      title.classList.add("brand-title");
      title.textContent = brand;
      card.appendChild(title);
    }

    removeTag.addEventListener("click", (e) => {
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

document.addEventListener("DOMContentLoaded", async () => {
  if (window.updateFavoriteCounter) {
    window.updateFavoriteCounter();
  }

  await loadFavoriteProducts();

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  if (tabBtns.length > 0) {
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const showTab = btn.dataset.tab;

        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        tabContents.forEach((c) => c.classList.remove("active"));

        const activeTab = document.getElementById(`tab-${showTab}`);
        if (activeTab) activeTab.classList.add("active");
      });
    });

    loadFavoriteBrands();
    updateFavoriteTabsCount();
  }
});
