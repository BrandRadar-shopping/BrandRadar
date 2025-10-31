// ======================================================
// BrandRadar.shop – Google Sheets Product Loader (with favs + detail links)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product script running with favorites...");

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const productGrid = document.querySelector(".product-grid");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  fetch(url)
    .then(res => {
      console.log("🟢 Response status:", res.status);
      return res.json();
    })
    .then(rows => {
      console.log("✅ Parsed rows:", rows);

      if (!rows.length) throw new Error("Ingen produkter funnet");

      productGrid.innerHTML = "";

      rows.forEach(row => {
        const brand = row.brand || "";
        const title = row.title || "";
        const price = row.price || "";
        const discount = row.discount || "";
        const image = row.image_url || "";
        const productUrl = row.product_url || "#";
        const category = row.category || "";
        const gender = row.gender || "";
        const subcategory = row.subcategory || "";
        const image2 = row.image2 || "";
        const image3 = row.image3 || "";
        const image4 = row.image4 || "";
        const description = row.description || "";
        const rating = row.rating || "";

        if (!title || !image) return;

        const favorites = getFavorites();
        const isFav = favorites.some(fav => fav.title === title);

        let discountDisplay = "";
        const d = parseFloat(discount);
        if (!isNaN(d)) {
          discountDisplay = d <= 1
            ? `${Math.round(d * 100)}% OFF`
            : `${Math.round(d)}% OFF`;
        }

        // ✅ OPPRETTER KORT FØR VI BRUKER DET
        const card = document.createElement("div");
        card.classList.add("product-card");

        // ✅ Rating renset (fjerner tekst som "Rated")
        const cleanRating = rating
          ? parseFloat(String(rating).replace(",", ".").replace(/[^0-9.]/g, ""))
          : "";

        card.innerHTML = `
          ${discountDisplay ? `<div class="discount-badge">${discountDisplay}</div>` : ""}
          <div class="fav-icon ${isFav ? "active" : ""}">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
              2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
              14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
              6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <img src="${image}" alt="${title}" />
          <div class="product-info">
            <h3>${title}</h3>
            ${brand ? `<p class="brand">${brand}</p>` : ""}
            ${cleanRating ? `<p class="rating">⭐ ${cleanRating}</p>` : ""}
            ${price ? `<p class="price">${price} kr</p>` : ""}
            ${gender ? `<p class="gender">${gender}</p>` : ""}
            <a href="${productUrl}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;

        card.addEventListener("click", e => {
          if (e.target.closest(".fav-icon") || e.target.closest(".buy-btn")) return;

          const params = new URLSearchParams({
            brand, title, price, discount, image, image2,
            image3, image4, url: productUrl, gender,
            category, subcategory, description, rating
          });

          window.location.href = `product.html?${params.toString()}`;
        });

        card.querySelector(".fav-icon").addEventListener("click", e => {
          e.stopPropagation();
          const p = { brand, title, price, discount, image, image2, image3, image4,
            url: productUrl, gender, category, subcategory, description, rating };

          let favs = getFavorites();
          const exists = favs.some(f => f.title === title);

          if (exists) {
            favs = favs.filter(f => f.title !== title);
            saveFavorites(favs);
            e.currentTarget.classList.remove("active");
            showToast("❌ Fjernet fra favoritter");
          } else {
            favs.push(p);
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


