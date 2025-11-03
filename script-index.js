// ======================================================
// ✅ Index Page — Featured Products with Favorites and ID Routing
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Index script loaded");

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const productGrid = document.querySelector(".product-grid");

  if (!productGrid) return;

  fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`)
    .then(res => res.json())
    .then(rows => {
      console.log("✅ Products loaded:", rows.length);

      if (!rows.length) {
        productGrid.innerHTML = "<p>Ingen produkter tilgjengelig.</p>";
        return;
      }

      // ✅ Random utvalg 12 stk for frontpage
      const shuffled = [...rows].sort(() => Math.random() - 0.5).slice(0, 12);

      productGrid.innerHTML = "";

      shuffled.forEach(product => {
        if (!product.title || !product.image_url) return;

        const favorites = getFavorites();
        const isFav = favorites.some(f => f.id === product.id);

        const cleanRating = product.rating
          ? parseFloat(String(product.rating).replace(",", ".").replace(/[^0-9.]/g, ""))
          : null;

        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
          ${product.discount ? `<div class="discount-badge">${product.discount}%</div>` : ""}
          <div class="fav-icon ${isFav ? "active" : ""}">
            ❤️
          </div>
          <img src="${product.image_url}" alt="${product.title}">
          <div class="product-info">
            <h3>${product.title}</h3>
            ${product.brand ? `<p class="brand">${product.brand}</p>` : ""}
            ${cleanRating ? `<p class="rating">⭐ ${cleanRating}</p>` : ""}
            ${product.price ? `<p class="price">${product.price} kr</p>` : ""}
          </div>
        `;

        // ✅ Klikk på hele kortet → Local product page
        card.addEventListener("click", e => {
          if (e.target.closest(".fav-icon")) return;
          window.location.href = `product.html?id=${product.id}`;
        });

        // ✅ Favoritt-knapp
        card.querySelector(".fav-icon").addEventListener("click", e => {
          e.stopPropagation();

          let favs = getFavorites();
          const exists = favs.some(f => f.id === product.id);

          if (exists) {
            favs = favs.filter(f => f.id !== product.id);
            saveFavorites(favs);
            e.currentTarget.classList.remove("active");
            showToast("❌ Fjernet fra favoritter");
          } else {
            favs.push(product);
            saveFavorites(favs);
            e.currentTarget.classList.add("active");
            showToast("❤️ Lagt til i favoritter");
          }

          updateFavoriteCount();
        });

        productGrid.appendChild(card);
      });
    })
    .catch(err => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML = "<p>Kunne ikke laste produkter akkurat nå.</p>";
    });
});



