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

<div class="fav-icon ${isFav ? "active" : ""}">
  <svg viewBox="0 0 24 24" class="heart-icon">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 
    2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 
    3.41.81 4.5 2.09C13.09 3.81 14.76 3 
    16.5 3 19.58 3 22 5.42 22 
    8.5c0 3.78-3.4 6.86-8.55 
    11.54L12 21.35z"/>
  </svg>
</div>


// ✅ Init
document.addEventListener("DOMContentLoaded", updateFavoriteCount);

