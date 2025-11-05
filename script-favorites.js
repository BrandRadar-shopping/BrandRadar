// ======================================================
// BrandRadar.shop – Favorittsystem (ID-basert og stabilt)
// ======================================================

// ✅ Hent produktfavoritter
const getFavorites = () =>
  JSON.parse(localStorage.getItem("favorites") || "[]");

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

// ✅ Hent brand-favoritter
const getFavoriteBrands = () =>
  JSON.parse(localStorage.getItem("favoriteBrands") || "[]");

// ✅ Legg til / fjern brandfavoritt
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
  updateFavoriteCount(); // ✅ Oppdater global teller

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

// ✅ Last brandfavoritter inn i grid
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

    if (!brandData) return; // Sikkerhetsnett

    const card = document.createElement("div");
    card.classList.add("brand-card");

    card.innerHTML = `
      <img class="brand-logo" src="${brandData.logo}" alt="${brand}">
      <h3>${brand}</h3>
    `;

    card.addEventListener("click", () => {
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brand)}`;
    });

    grid.appendChild(card);
  });
}

// ✅ Hent riktig logo fra BrandSheet
function getBrandLogo(brandName) {
  const allBrands = JSON.parse(localStorage.getItem("allBrandsData") || "[]");
  const match = allBrands.find(b =>
    b.brand.toLowerCase() === brandName.toLowerCase()
  );
  return match?.logo || "https://via.placeholder.com/120?text=?"; // fallback logo
}


// ✅ Teller for begge tabs
function updateFavoriteTabsCount() {
  const elProducts = document.getElementById("fav-products-count");
  const elBrands = document.getElementById("fav-brands-count");

  if (elProducts) elProducts.textContent = getFavorites().length;
  if (elBrands) elBrands.textContent = getFavoriteBrands().length;
}

