// ======================================================
// BrandRadar.shop – Favoritter Page Loader (ID-basert)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Favoritter-side lastet inn");

  const grid = document.getElementById("favorites-grid");
  let favorites = getFavorites();

  updateFavoriteCount(); // ✅ Telleren i header

  if (!favorites || favorites.length === 0) {
    showEmptyState();
    return;
  }

  grid.innerHTML = "";

  // Format discount to correct %
  function formatDiscount(value) {
    if (!value) return "";
    let num = String(value).replace("%", "").trim();
    num = parseFloat(num);
    if (num > 0 && num < 1) num = num * 100;
    return `${Math.round(num)}%`;
  }

  function showEmptyState() {
    grid.innerHTML = `
      <div class="empty-favorites">
        <p>Du har ingen favoritter ennå ❤️</p>
        <a href="index.html" class="back-btn">← Til forsiden</a>
      </div>
    `;
  }

  favorites.forEach((product) => {
    const productId = Number(product.id);

    const image = product.image_url || product.image || "https://via.placeholder.com/600x700?text=No+Image";
    const discount = formatDiscount(product.discount);

    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      ${discount ? `<div class="discount-badge">-${discount}</div>` : ""}
      <img src="${image}" alt="${product.title}" />
      <div class="product-info">
        <h3>${product.title}</h3>
        ${product.price ? `<p class="price">${product.price} kr</p>` : ""}
      </div>
      <button class="remove-btn">Fjern</button>
    `;

    // ✅ Gå til product.html via ID
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) return;
      if (!productId) return console.error("❌ Produkt uten ID i favoritter");
      window.location.href = `product.html?id=${productId}`;
    });

    // ✅ Fjern fra favoritter
    card.querySelector(".remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      favorites = favorites.filter((f) => Number(f.id) !== Number(productId));
      saveFavorites(favorites);
      updateFavoriteCount();
      card.remove();
      showToast("❌ Fjernet fra favoritter");

      if (favorites.length === 0) {
        showEmptyState();
      }
    });

    grid.appendChild(card);
  });
});


