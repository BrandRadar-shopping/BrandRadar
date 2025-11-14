// ======================================================
// BrandRadar.shop – Favorittsystem (ID-basert og stabilt)
// ======================================================

// ✅ Hent produktfavoritter
const getFavorites = () =>
  JSON.parse(localStorage.getItem("favorites") || "[]");

// ✅ Sjekk om produkt allerede er i favoritter
const isFavorite = (id) => {
  const favorites = getFavorites();
  return favorites.some(f => String(f.id) === String(id));
};

// ✅ Lagre produkter + oppdater teller
const saveFavorites = (favorites) => {
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavoriteCount();
};

// ✅ Legg til / fjern produktfavoritt (nå med DOM-basert rating fallback)
const toggleFavorite = (product, sourceElement = null) => {
  const favorites = getFavorites();
  const productId = Number(product.id);
  const index = favorites.findIndex(fav => Number(fav.id) === productId);

  if (index >= 0) {
    favorites.splice(index, 1);
    showToast("❌ Fjernet fra favoritter");
  } else {
    // --- Hent rating (fra objekt, alternativt DOM) ---
    let ratingValue =
      product.rating ||
      product.Rating ||
      product["Product Rating"] ||
      "";

    if ((!ratingValue || ratingValue === "") && sourceElement) {
      const ratingEl = sourceElement.querySelector(".rating");
      if (ratingEl) {
        // Fjerner eventuelle "⭐" og formaterer til ren verdi
        ratingValue = ratingEl.textContent.replace(/[^\d.,]/g, "").trim();
      }
    }

    // --- Hent øvrige felt (uavhengig av store/små bokstaver) ---
    const title = product.title || product.Name || product.name || "";
    const brand = product.brand || product.Brand || "";
    const price = product.price || product.Price || "";
    const discount = product.discount || product.Discount || "";
    const image_url = product.image_url || product.Image || product.image || "";
    const product_url = product.product_url || product.Link || "";
    const category = product.category || product.Category || "";

    favorites.push({
      id: productId,
      title,
      brand,
      price,
      discount,
      image_url,
      product_url,
      category,
      rating: ratingValue || "",
      luxury: product.sheet_source === "luxury" || product.luxury === true
    });

    showToast("✅ Lagt til i favoritter");
  }

  saveFavorites(favorites);
};


// ✅ Oppdater teller i navbar
const updateFavoriteCount = () => {
  const count = getFavorites().length;
  document.querySelectorAll("#favorites-count")
    .forEach(el => el.textContent = count);
};

// ✅ Toast melding
const showToast = (message) => {
  let toast = document.querySelector(".toast-message");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-message";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
};

// ======================================================
// ✅ FAVORITT-BRANDS
// ======================================================

const getFavoriteBrands = () =>
  JSON.parse(localStorage.getItem("favoriteBrands") || "[]");

const toggleBrandFavorite = (brand) => {
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
};

// ======================================================
// ✅ Last inn produkt-favoritter
// ======================================================

function loadFavoriteProducts() {
  const favorites = getFavorites();
  const grid = document.getElementById("favorites-product-grid");
  const emptyMsg = document.getElementById("empty-products");

  if (!grid) return;
  grid.innerHTML = "";

  if (favorites.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";

  favorites.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    const ratingValue = parseFloat(product.rating) || null;

    // === Fjern-knapp ===
    const removeTag = document.createElement("span");
    removeTag.classList.add("remove-tag");
    removeTag.textContent = "Fjern";
    removeTag.dataset.id = product.id;
    card.appendChild(removeTag);

    // === Rabattmerke (beholdes) ===
    if (product.discount) {
      const discountBadge = document.createElement("div");
      discountBadge.classList.add("discount-badge");
      discountBadge.textContent = `-${product.discount}%`;
      card.appendChild(discountBadge);
    }

    // === Produktbilde ===
    const img = document.createElement("img");
    img.src = product.image_url;
    img.alt = product.title;
    img.loading = "lazy";
    card.appendChild(img);

    // === Info-seksjon ===
    const info = document.createElement("div");
    info.classList.add("product-info");

    // Brand
    const brand = document.createElement("p");
    brand.classList.add("brand");
    brand.textContent = product.brand || "";

    // Produktnavn
    const name = document.createElement("h3");
    name.classList.add("product-name");
    name.textContent = product.title || "";

    // Rating
    const rating = document.createElement("p");
    rating.classList.add("rating");
    if (ratingValue) {
      rating.innerHTML = `⭐ ${ratingValue.toFixed(1)}`;
    } else {
      rating.innerHTML = `<span style="color:#ccc;">–</span>`;
    }

    // === Prislinje ===
    const priceLine = document.createElement("div");
    priceLine.classList.add("price-line");

    // Beregn ny pris hvis rabatt finnes
    let newPriceValue = product.price;
    if (product.discount && product.price) {
      const numericPrice = parseFloat(product.price.replace(/[^\d.,]/g, "").replace(",", "."));
      if (!isNaN(numericPrice)) {
        newPriceValue = (numericPrice * (1 - product.discount / 100)).toFixed(0);
      }
    }

    const newPrice = document.createElement("span");
    newPrice.classList.add("new-price");
    newPrice.textContent = `${newPriceValue} kr`;
    priceLine.appendChild(newPrice);

    // Vis gammel pris strøket ut kun hvis rabatt finnes
    if (product.discount && product.price) {
      const oldPrice = document.createElement("span");
      oldPrice.classList.add("old-price");
      oldPrice.textContent = `${product.price} kr`;
      priceLine.appendChild(oldPrice);
    }

    info.append(brand, name, rating, priceLine);
    card.appendChild(info);

    // === Klikk = gå til produkt ===
    card.addEventListener("click", () => {
      const luxuryParam = product.luxury ? "&luxury=true" : "";
      window.location.href = `product.html?id=${product.id}${luxuryParam}`;
    });

    // === Fjern favoritt ===
    removeTag.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(product);
      loadFavoriteProducts();
      updateFavoriteTabsCount();
    });

    grid.appendChild(card);
  });
}

// ======================================================
// ✅ Brands i favoritter
// ======================================================

function loadFavoriteBrands() {
  const favBrands = getFavoriteBrands();
  const allBrandsData = JSON.parse(localStorage.getItem("allBrandsData") || "[]");

  const grid = document.getElementById("favorites-brand-grid");
  const emptyMsg = document.getElementById("empty-brands");

  if (!grid) return;

  grid.innerHTML = "";
  if (favBrands.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  favBrands.forEach(brand => {
    const brandData = allBrandsData.find(b => b.brand.trim() === brand.trim());
    if (!brandData) return;

    const card = document.createElement("div");
    card.classList.add("brand-card");

    card.innerHTML = `
      <span class="remove-brand-tag" data-brand="${brand}">Fjern</span>
      <img class="brand-logo" src="${brandData.logo}" alt="${brand}">
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

// ======================================================
// ✅ Teller
// ======================================================

function updateFavoriteTabsCount() {
  const elProducts = document.getElementById("fav-products-count");
  const elBrands = document.getElementById("fav-brands-count");

  if (elProducts) elProducts.textContent = getFavorites().length;
  if (elBrands) elBrands.textContent = getFavoriteBrands().length;
}

// ======================================================
// ✅ DOMContentLoaded – nederst (trygt og komplett)
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



