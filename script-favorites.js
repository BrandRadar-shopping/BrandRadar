if (!window.__FAV_INIT__) {
  window.__FAV_INIT__ = true;

  function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  }

  function saveFavorites(favs) {
    localStorage.setItem("favorites", JSON.stringify(favs));
  }

  function toggleFavorite(product) {
    let favs = getFavorites();
    const exists = favs.some((f) => f.title === product.title);
    if (exists) {
      favs = favs.filter((f) => f.title !== product.title);
    } else {
      favs.push(product);
    }
    saveFavorites(favs);
    updateFavoriteCount();
  }

  function updateFavoriteCount() {
    const count = getFavorites().length;
    const el = document.getElementById("favorite-count");
    if (el) el.textContent = count;
  }

  window.getFavorites = getFavorites;
  window.toggleFavorite = toggleFavorite;
  window.updateFavoriteCount = updateFavoriteCount;
}


