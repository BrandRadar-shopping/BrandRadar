// ======================================================
// ⭐ BrandRadar – Global Favorites Core (produkter)
// ======================================================

(function () {
  console.log("✅ favorites-core.js loaded");

  // ---------- Hjelpere ----------

  function cleanRating(value) {
    if (!value) return null;
    const n = parseFloat(
      value.toString().replace(",", ".").replace(/[^0-9.\-]/g, "")
    );
    return Number.isFinite(n) ? n : null;
  }

  function getProductName(p) {
    return (
      p.product_name ||
      p.title ||
      p.name ||
      p.product ||
      ""
    );
  }

  function resolveProductId(p) {
    if (!p) return "";

    if (p.id != null && String(p.id).trim() !== "") {
      return String(p.id).trim();
    }
    if (p.product_id != null && String(p.product_id).trim() !== "") {
      return String(p.product_id).trim();
    }

    const name = getProductName(p);
    if (!name) return "";

    return String(name).trim().replace(/\s+/g, "_");
  }

  function readFavoritesArray() {
    try {
      const raw = JSON.parse(localStorage.getItem("favorites") || "[]");
      if (Array.isArray(raw)) return raw;
      return [];
    } catch (e) {
      console.warn("⚠️ Klarte ikke parse favorites:", e);
      return [];
    }
  }

  function writeFavoritesArray(arr) {
    localStorage.setItem("favorites", JSON.stringify(arr || []));
  }

  // ---------- Offentlige funksjoner ----------

  function getFavorites() {
    return readFavoritesArray();
  }

  function isProductFavorite(id) {
    if (!id) return false;
    const favorites = readFavoritesArray();
    return favorites.some(f => String(f.id) === String(id));
  }

  function showFavoriteToast(message, type = "success") {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove("success", "error");
    toast.classList.add(type);
    toast.classList.add("visible");

    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 2000);
  }

  function toggleFavorite(product, favEl) {
    if (!product) return;

    const id = resolveProductId(product);
    if (!id) return;

    const favorites = readFavoritesArray();
    const index = favorites.findIndex(f => String(f.id) === String(id));
    const name = getProductName(product) || "Produkt";

    if (index >= 0) {
      // Fjern
      favorites.splice(index, 1);
      if (favEl) favEl.classList.remove("active");
      showFavoriteToast(`${name} fjernet fra favoritter`, "success");
    } else {
      // Legg til – normaliser og lagre data vi trenger i favoritter.html
      const ratingValue = cleanRating(product.rating);

      const stored = {
        id,
        title: getProductName(product),
        brand: product.brand || "",
        price: product.price || product.new_price || "",
        discount: product.discount
          ? Number(
              product.discount.toString().replace(",", ".").replace(/[^\d.\-]/g, "")
            ) || null
          : null,
        image_url: product.image_url || product.image || "",
        product_url: product.product_url || "",
        category: product.category || product.main_category || "",
        rating: ratingValue,
        luxury: !!(product.luxury === true || product.sheet_source === "luxury")
      };

      favorites.push(stored);
      if (favEl) favEl.classList.add("active");
      showFavoriteToast(`${name} lagt til i favoritter`, "success");
    }

    writeFavoritesArray(favorites);
    updateFavoriteCounter();
  }

  function updateFavoriteCounter() {
    const productFavs = readFavoritesArray();
    let brandFavs = [];
    try {
      brandFavs = JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
      if (!Array.isArray(brandFavs)) brandFavs = [];
    } catch (e) {
      brandFavs = [];
    }

    const total = productFavs.length + brandFavs.length;

    document.querySelectorAll("#favorites-count").forEach(el => {
      el.textContent = total;
    });
  }

  // ---------- Eksponér globalt ----------

  window.cleanRating = cleanRating;
  window.getProductName = getProductName;
  window.resolveProductId = resolveProductId;
  window.getFavorites = getFavorites;
  window.isProductFavorite = isProductFavorite;
  window.toggleFavorite = toggleFavorite;
  window.updateFavoriteCounter = updateFavoriteCounter;
  window.showFavoriteToast = showFavoriteToast;

  document.addEventListener("DOMContentLoaded", () => {
    try {
      updateFavoriteCounter();
    } catch (e) {
      console.warn("⚠️ Kunne ikke oppdatere favoritt-teller ved load:", e);
    }
  });
})();
