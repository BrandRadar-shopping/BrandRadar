// ======================================================
// BrandRadar.shop – Favoritter Page Loader (ID-basert)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Favoritter-side lastet inn");

  const grid = document.getElementById("favorites-grid");

  // ✅ Fjern produkter uten ID før visning
  let favorites = getFavorites().filter(f => Number(f.id));

  updateFavoriteCount(); // Oppdater header ved start

  const showEmptyState = () => {
    grid.innerHTML = `
      <div class="empty-favorites">
        <p>Du har ingen favoritter ennå ❤️</p>
        <a href="index.html" class="back-btn">← Til forsiden</a>
      </div>
    `;
  };

  if (!favorites.length) {
    showEmptyState();
    return;
  }

  grid.innerHTML = "";

  // ✅ Standardisert rabattformat
  const formatDiscount = (value) => {
    if (!value) return "";
    let num = parseFloat(String(value).replace("%", "").trim());
    if (num > 0 && num < 1) num *= 100;
    return `${Math.round(num)}%`;
  };

  favorites.forEach((p) => {
    const productId = Number(p.id);
    const price = p.price ? `${p.price} kr` : "";
    
    const image =
      p.image_url?.trim() ||
      p.image?.trim() ||
      "https://via.placeholder.com/600x700?text=No+Image";

    const discount = formatDiscount(p.discount);

    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      ${discount ? `<div class="discount-badge">-${discount}</div>` : ""}
      <img src="${image}" alt="${p.title}" />
      <div class="product-info">
        <h3>${p.title}</h3>
        ${price ? `<p class="price">${price}</p>` : ""}
      </div>
      <button class="remove-btn">Fjern</button>
    `;

    // ✅ Klikk åpner produkt-siden via ID
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) return;
      if (!productId) {
        console.error("❌ Favoritt uten ID – bør renskes!");
        return;
      }
      window.location.href = `product.html?id=${productId}`;
    });

    // ✅ Fjern fra favoritter
    card.querySelector(".remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();

      favorites = favorites.filter(f => Number(f.id) !== productId);
      saveFavorites(favorites);
      updateFavoriteCount(); // 🔥 Sikrer korrekt teller

      card.remove();
      showToast("✅ Fjernet fra favoritter");

      if (favorites.length === 0) showEmptyState();
    });

    grid.appendChild(card);
  });

  // 🔄 Sikrer at teller også oppdateres etter render
  setTimeout(updateFavoriteCount, 50);
});



