// ======================================================
// BrandRadar.shop – Favoritter-side
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("favorites-grid");
  const favorites = getFavorites();

  if (!favorites || favorites.length === 0) {
    grid.innerHTML = `
      <div class="empty-favorites">
        <p>Du har ingen favoritter ennå 🛍️</p>
        <a href="index.html" class="back-btn">Gå til forsiden</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = ""; // Tøm tidligere innhold

  favorites.forEach((fav) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <img src="${fav.image}" alt="${fav.title}" />
      <h3>${fav.title}</h3>
      <p>${fav.brand || ""}</p>
      <p><strong>${fav.price || ""}</strong></p>
      <button class="remove-fav-btn">🗑 Fjern</button>
    `;

    // Klikk for å åpne produktet igjen
    card.addEventListener("click", (e) => {
      if (!e.target.classList.contains("remove-fav-btn")) {
        window.location.href = `product.html?${new URLSearchParams(fav).toString()}`;
      }
    });

    // Fjern knapp
    card.querySelector(".remove-fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const updated = favorites.filter((f) => f.title !== fav.title);
      saveFavorites(updated);
      card.remove();
      updateFavoriteCount();

      if (updated.length === 0) {
        grid.innerHTML = `
          <div class="empty-favorites">
            <p>Du har ingen favoritter ennå 🛍️</p>
            <a href="index.html" class="back-btn">Gå til forsiden</a>
          </div>
        `;
      }

      showToast("❌ Fjernet fra favoritter");
    });

    grid.appendChild(card);
  });
});
