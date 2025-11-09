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
      rating: product.rating
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

    const rating = parseFloat(product.rating) || null;

    card.innerHTML = `
  <span class="remove-tag" data-id="${product.id}">Fjern</span>

  ${product.discount ? `<div class="discount-badge">-${product.discount}%</div>` : ""}

  <img src="${product.image_url}" alt="${product.title}">
  <div class="product-info">
    <h3>${product.title}</h3>
    <p class="brand">${product.brand || ""}</p>
    <p class="rating">${rating ? `⭐ ${rating.toFixed(1)}` : ""}</p>
    <p class="price">${product.price ? `${product.price} kr` : ""}</p>
  </div>
`;


    // Klikk = gå til produkt
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${product.id}`;
    });

    // Fjern favoritt tag
    card.querySelector(".remove-tag").addEventListener("click", (e) => {
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


