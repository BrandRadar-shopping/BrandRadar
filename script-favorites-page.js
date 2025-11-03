// ======================================================
// BrandRadar.shop – Favoritter Page Loader (ID-basert)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Favoritter-side lastet inn");

  const grid = document.getElementById("favorites-grid");
  
  // ✅ Fjern gamle favoritter uten ID
  let favorites = getFavorites().filter(f => f.id);

  updateFavoriteCount(); // Oppdater header-teller

  function showEmptyState() {
    grid.innerHTML = `
      <div class="empty-favorites">
        <p>Du har ingen favoritter ennå ❤️</p>
        <a href="index.html" class="back-btn">← Til forsiden</a>
      </div>
    `;
  }

  if (!favorites.length) {
    showEmptyState();
    return;
  }

  grid.innerHTML = "";

  // ✅ Riktig rabatt-format
  function formatDiscount(value) {
    if (!value) return "";
    let num = String(value).replace("%", "").trim();
    num = parseFloat(num);
    if (num > 0 && num < 1) num *= 100;
    return `${Math.round(num)}%`;
  }

  favorites.forEach((product) => {
    const productId = Number(product.id);

    const image = product.image_url || product.image ||
      "https://via.placeholder.com/600x700?text=No+Image";
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

    // ✅ Naviger korrekt til produkt via ID
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) return;
      if (!productId) return console.error("❌ Produkt uten ID i favoritter");
      window.location.href = `product.html?id=${productId}`;
    });

    // ✅ Fjern fra favoritter (både UI og localStorage)
    card.querySelector(".remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();

      favorites = favorites.filter(f => Number(f.id) !== Number(productId));
      saveFavorites(favorites);
      updateFavoriteCount(); // ✅ Teller ned med en gang

      card.remove();
      showToast("❌ Fjernet fra favoritter");

      if (!favorites.length) showEmptyState();
    });

    grid.appendChild(card);
  });
});



