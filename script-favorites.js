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

// ✅ Legg til / fjern produktfavoritt
const toggleFavorite = (product) => {
  const favorites = getFavorites();
  const productId = Number(product.id);

  const index = favorites.findIndex(fav => Number(fav.id) === productId);

  if (index >= 0) {
    favorites.splice(index, 1);
    showToast("❌ Fjernet fra favoritter");
  } else {
    favorites.push({
      id: productId,
      title: product.title,
      brand: product.brand,
      price: product.price,
      discount: product.discount,
      image_url: product.image_url,
      product_url: product.product_url,
      category: product.category,
      rating: product.rating,
      luxury: product.sheet_source === "luxury" || product.luxury === true // 💎 NYTT felt
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
// ✅ Favoritter.html: Tabs og lasting
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  updateFavoriteCount();

  loadFavoriteProducts(); // ⭐ NYTT - last inn produkter

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const showTab = btn.dataset.tab;

        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        tabContents.forEach(c =>
          c.classList.remove("active")
        );
        document.getElementById(`tab-${showTab}`).classList.add("active");
      });
    });

    loadFavoriteBrands();
    updateFavoriteTabsCount();
  }
});

// ✅ Last inn produkt-favoritter
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

    // === Rabattmerke ===
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
    }

    // Prislinje
    const priceLine = document.createElement("div");
    priceLine.classList.add("price-line");

    const newPrice = document.createElement("span");
    newPrice.classList.add("new-price");
    newPrice.textContent = `${product.price || ""} kr`;
    priceLine.appendChild(newPrice);

    // gammel pris og rabatt vises kun hvis discount finnes
    if (product.old_price) {
      const oldPrice = document.createElement("span");
      oldPrice.classList.add("old-price");
      oldPrice.textContent = `${product.old_price} kr`;
      priceLine.appendChild(oldPrice);
    }

    if (product.discount) {
      const discount = document.createElement("span");
      discount.classList.add("discount");
      discount.textContent = `-${product.discount}%`;
      priceLine.appendChild(discount);
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
// ✅ Teller
// ======================================================
function updateFavoriteTabsCount() {
  const elProducts = document.getElementById("fav-products-count");
  const elBrands = document.getElementById("fav-brands-count");

  if (elProducts) elProducts.textContent = getFavorites().length;
  if (elBrands) elBrands.textContent = getFavoriteBrands().length;
}


