// ======================================================
// BrandRadar.shop – Favoritter (bruker favorites-core.js)
// ======================================================

// FAVORITT-BRANDS (denne delen lar vi være her)
const getFavoriteBrands = () =>
  JSON.parse(localStorage.getItem("favoriteBrands") || "[]");

const toggleBrandFavorite = (brand) => {
  const brands = getFavoriteBrands();
  const index = brands.indexOf(brand);

  if (index >= 0) {
    brands.splice(index, 1);
    showFavoriteToast("❌ Brand fjernet", "success");
  } else {
    brands.push(brand);
    showFavoriteToast("✅ Brand favorisert", "success");
  }

  localStorage.setItem("favoriteBrands", JSON.stringify(brands));
  updateFavoriteTabsCount();
  updateFavoriteCounter();
};

// ======================================================
// LAST INN PRODUKT-FAVORITTER
// ======================================================

function loadFavoriteProducts() {
  const favorites = getFavorites(); // fra favorites-core
  const grid = document.getElementById("favorites-product-grid");
  const emptyMsg = document.getElementById("empty-products");

  if (!grid) return;
  grid.innerHTML = "";

  if (!favorites || favorites.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  favorites.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    const ratingValue = cleanRating(product.rating);

    // Fjern-knapp
    const removeTag = document.createElement("span");
    removeTag.classList.add("remove-tag");
    removeTag.textContent = "Fjern";
    removeTag.dataset.id = product.id;
    card.appendChild(removeTag);

    // Rabattmerke
    if (product.discount) {
      const discountBadge = document.createElement("div");
      discountBadge.classList.add("discount-badge");
      discountBadge.textContent = `-${product.discount}%`;
      card.appendChild(discountBadge);
    }

    // Produktbilde
    const img = document.createElement("img");
    img.src = product.image_url;
    img.alt = product.title || "";
    img.loading = "lazy";
    card.appendChild(img);

    // Info-seksjon
    const info = document.createElement("div");
    info.classList.add("product-info");

    const brand = document.createElement("p");
    brand.classList.add("brand");
    brand.textContent = product.brand || "";

    const name = document.createElement("h3");
    name.classList.add("product-name");
    name.textContent = product.title || "";

    // Rating
    const rating = document.createElement("p");
    rating.classList.add("rating");
    rating.innerHTML = ratingValue
      ? `⭐ ${ratingValue.toFixed(1)}`
      : `<span style="color:#ccc;">–</span>`;

    // Prislinje
    const priceLine = document.createElement("div");
    priceLine.classList.add("price-line");

    let basePrice = product.price;
    let numericPrice = null;

    if (basePrice != null) {
      const cleaned = basePrice.toString().replace(/[^\d.,]/g, "").replace(",", ".");
      const num = parseFloat(cleaned);
      if (!isNaN(num)) numericPrice = num;
    }

    let newPriceValue = numericPrice;

    if (product.discount && numericPrice != null) {
      newPriceValue = numericPrice * (1 - product.discount / 100);
    }

    const newPrice = document.createElement("span");
    newPrice.classList.add("new-price");
    if (newPriceValue != null) {
      newPrice.textContent = `${Math.round(newPriceValue)} kr`;
    } else if (basePrice != null) {
      newPrice.textContent = `${basePrice} kr`;
    }
    priceLine.appendChild(newPrice);

    if (product.discount && numericPrice != null) {
      const oldPrice = document.createElement("span");
      oldPrice.classList.add("old-price");
      oldPrice.textContent = `${Math.round(numericPrice)} kr`;
      priceLine.appendChild(oldPrice);
    }

    info.append(brand, name, rating, priceLine);
    card.appendChild(info);

    // Klikk → produktdetalj
    card.addEventListener("click", () => {
      const luxuryParam = product.luxury ? "&luxury=true" : "";
      window.location.href = `product.html?id=${encodeURIComponent(product.id)}${luxuryParam}`;
    });

    // Fjern favoritt (bruker global toggleFavorite)
    removeTag.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(product); // global
      loadFavoriteProducts();
      updateFavoriteTabsCount();
    });

    grid.appendChild(card);
  });
}

// ======================================================
// FAVORITT-BRANDS RENDERING
// ======================================================

function loadFavoriteBrands() {
  const favBrands = getFavoriteBrands();
  const allBrandsData = JSON.parse(localStorage.getItem("allBrandsData") || "[]");

  const grid = document.getElementById("favorites-brand-grid");
  const emptyMsg = document.getElementById("empty-brands");

  if (!grid) return;

  grid.innerHTML = "";
  if (!favBrands || favBrands.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  favBrands.forEach(brand => {
    const brandData = allBrandsData.find(b => (b.brand || "").trim() === brand.trim());
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
// TELLER
// ======================================================

function updateFavoriteTabsCount() {
  const elProducts = document.getElementById("fav-products-count");
  const elBrands = document.getElementById("fav-brands-count");

  if (elProducts) elProducts.textContent = (getFavorites() || []).length;
  if (elBrands) elBrands.textContent = getFavoriteBrands().length;
}

// ======================================================
// DOMContentLoaded — Nederst (riktig rekkefølge)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  updateFavoriteCounter();     // global teller
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


