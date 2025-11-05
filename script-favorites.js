// ======================================================
// BrandRadar.shop – Favorittsystem (ID-basert og stabilt)
// ======================================================

// ✅ Hent favoritter fra localStorage (produkter)
const getFavorites = () => JSON.parse(localStorage.getItem("favorites") || "[]");

// ✅ Lagre produktfavoritter + oppdater teller
const saveFavorites = (favorites) => {
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavoriteCount();
};

// ✅ Legg til / fjern produktfavoritt
const toggleFavorite = (product) => {
  const favorites = getFavorites();
  const productId = Number(product.id || product.Id || product.ID);

  const index = favorites.findIndex(fav => Number(fav.id) === productId);

  if (index >= 0) {
    favorites.splice(index, 1);
    showToast("❌ Fjernet fra favoritter");
  } else {
    const cleanProduct = {
      id: productId,
      title: product.title,
      brand: product.brand,
      price: product.price,
      discount: product.discount,
      image_url: product.image_url,
      image2: product.image2,
      image3: product.image3,
      image4: product.image4,
      product_url: product.product_url,
      category: product.category,
      subcategory: product.subcategory,
      gender: product.gender,
      description: product.description,
      rating: product.rating
    };

    favorites.push(cleanProduct);
    showToast("✅ Lagt til i favoritter");
  }

  saveFavorites(favorites);
};

// ✅ TELLER (kun produkter)
const updateFavoriteCount = () => {
  const count = getFavorites().length;
  document.querySelectorAll("#favorites-count").forEach(el => (el.textContent = count));
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


// ✅ BRAND FAVORITTER (NY DEL)
// ------------------------------------------------------

// ✅ Hent brand-favoritter (navn-liste)
const getFavoriteBrands = () =>
  JSON.parse(localStorage.getItem("favoriteBrands") || "[]");

// ✅ Lagre brand-favoritter
const saveFavoriteBrands = (brands) => {
  localStorage.setItem("favoriteBrands", JSON.stringify(brands));
};

// ✅ Legg til / fjern brand-favoritt
const toggleBrandFavorite = (brandName) => {
  let brands = getFavoriteBrands();
  brandName = brandName.trim();

  const index = brands.indexOf(brandName);

  if (index >= 0) {
    brands.splice(index, 1);
    showToast("❌ Fjernet brand fra favoritter");
  } else {
    brands.push(brandName);
    showToast("✅ Brand lagt til i favoritter");
  }

  saveFavoriteBrands(brands);
};


// ✅ Init
document.addEventListener("DOMContentLoaded", updateFavoriteCount);


