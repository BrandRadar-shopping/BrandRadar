// ======================================================
// BrandRadar.shop – Favoritter-side (Oppdatert design)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Favoritter-side lastet inn");

  const grid = document.getElementById("favorites-grid");
  const favorites = getFavorites();

  if (!favorites || favorites.length === 0) {
    grid.innerHTML = `
      <div class="empty-favorites">
        <p>Du har ingen favoritter ennå ❤️</p>
        <a href="index.html" class="back-btn">← Til forsiden</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = "";

  favorites.forEach((fav) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
     ${fav.discount ? `<div class="discount-badge">-${formatDiscount(fav.discount)}</div>` : ""}
      <img src="${fav.image}" alt="${fav.title}" />
      <div class="product-info">
        <h3>${fav.title}</h3>
        ${fav.price ? `<p class="price">${fav.price}</p>` : ""}
        ${fav.gender ? `<p class="gender">${fav.gender}</p>` : ""}
        <div class="fav-actions">
          <a href="${fav.url}" target="_blank" class="buy-btn">Kjøp</a>
          <button class="remove-btn">Fjern</button>
        </div>
      </div>
    `;

    // Klikk på kort → product.html
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) return;
      window.location.href = `product.html?${new URLSearchParams(fav).toString()}`;
    });

    // Fjern favoritt
    const removeBtn = card.querySelector(".remove-btn");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const updated = favorites.filter((f) => f.title !== fav.title);
      saveFavorites(updated);
      card.remove();
      updateFavoriteCount();

      if (updated.length === 0) {
        grid.innerHTML = `
          <div class="empty-favorites">
            <p>Du har ingen favoritter ennå ❤️</p>
            <a href="index.html" class="back-btn">← Til forsiden</a>
          </div>
        `;
      }

      showToast("❌ Fjernet fra favoritter");
    });

    grid.appendChild(card);
  });
});

