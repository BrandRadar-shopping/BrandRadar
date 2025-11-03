// ======================================================
// BrandRadar.shop – Favorittsystem (ID-basert og stabilt)
// ======================================================

// ✅ Hent favoritter fra localStorage
const getFavorites = () => JSON.parse(localStorage.getItem("favorites") || "[]");

// ✅ Lagre favoritter + oppdater teller
const saveFavorites = (favorites) => {
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavoriteCount();
};

// ✅ Legg til / fjern favoritt (bruk ID for unik match)
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

// ✅ Oppdater teller i header
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

// ✅ Init
document.addEventListener("DOMContentLoaded", updateFavoriteCount);

