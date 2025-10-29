// ======================================================
// BrandRadar.shop – Favorittsystem (Dag 2)
// ======================================================

// Sjekk om localStorage har en "favorites"-liste fra før
const getFavorites = () => JSON.parse(localStorage.getItem("favorites") || "[]");

// Lagre ny favorittliste til localStorage
const saveFavorites = (favorites) => {
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavoriteCount();
};

// Legg til eller fjern et produkt
const toggleFavorite = (product) => {
  const favorites = getFavorites();
  const index = favorites.findIndex(fav => fav.title === product.title);

  if (index >= 0) {
    // Fjern
    favorites.splice(index, 1);
    showToast("❌ Fjernet fra favoritter");
  } else {
    // Legg til
    favorites.push(product);
    showToast("❤️ Lagt til i favoritter");
  }

  saveFavorites(favorites);
};

// Teller-funksjon (oppdaterer antall i header)
const updateFavoriteCount = () => {
  const count = getFavorites().length;
  const counter = document.getElementById("favorites-count");
  if (counter) counter.textContent = count;
};

// Toast (melding som vises kort)
const showToast = (message) => {
  let toast = document.querySelector(".toast-message");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-message";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
};

// Init ved lasting av side
document.addEventListener("DOMContentLoaded", updateFavoriteCount);
