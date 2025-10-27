// ======================================================
// BRANDRADAR.SHOP – FAVORITT-HÅNDTERING
// ======================================================

console.log("✅ Favorittscript lastet");

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
  updateFavoriteCount();
}

// Legg til eller fjern produkt fra favoritter
function toggleFavorite(product) {
  let favorites = getFavorites();
  const exists = favorites.some((f) => f.title === product.title);

  if (exists) {
    favorites = favorites.filter((f) => f.title !== product.title);
    showToast("❌ Fjernet fra favoritter", false);
  } else {
    favorites.push(product);
    showToast("❤️ Lagt til i favoritter", true);
  }

  saveFavorites(favorites);
}

// Oppdater teller øverst i header
function updateFavoriteCount() {
  const countEl = document.getElementById("favorite-count");
  if (!countEl) return;
  const favs = getFavorites();
  countEl.textContent = favs.length;
}

// Enkel toast-popup
function showToast(message, success = true) {
  let toast = document.createElement("div");
  toast.className = `toast ${success ? "success" : "error"}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Init-teller ved lasting
document.addEventListener("DOMContentLoaded", () => {
  updateFavoriteCount();
});

