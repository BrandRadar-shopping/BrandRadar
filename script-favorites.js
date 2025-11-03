// ======================================================
// BrandRadar.shop – Favoritter Page Loader (ID-basert)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("favorites-grid");
  const favorites = getFavorites();

  if (!grid) return;

  if (!favorites.length) {
    grid.innerHTML = `<p>Ingen favoritter enda ❤️</p>`;
    return;
  }

  grid.innerHTML = "";

  favorites.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      ${product.discount ? `<div class="discount-badge">${product.discount}%</div>` : ""}
      <img src="${product.image_url}" alt="${product.title}" />
      <div class="product-info">
        <h3>${product.title}</h3>
        <p class="brand">${product.brand || ""}</p>
        <p class="price">${product.price || ""} kr</p>
      </div>
      <button class="remove-fav-btn">Fjern</button>
    `;

    // ✅ Gå til produkten (ID-basert)
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-fav-btn")) return;
      window.location.href = `product.html?id=${product.id}`;
    });

    // ✅ Fjern fra favoritter-knapp
    card.querySelector(".remove-fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();

      const updated = getFavorites().filter(fav => Number(fav.id) !== Number(product.id));
      saveFavorites(updated);

      card.remove();
      updateFavoriteCount();

      if (!updated.length) {
        grid.innerHTML = `<p>Ingen favoritter igjen ❤️</p>`;
      }
    });

    grid.appendChild(card);
  });
});


