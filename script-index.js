// ======================================================
// ✅ Index Page — Featured Products with Favorites + ID Routing
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Index script loaded");

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const productGrid = document.querySelector(".product-grid");

  if (!productGrid) {
    console.warn("⚠️ Fant ikke .product-grid på index.html");
    return;
  }

  const toNumber = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));

  const formatDiscount = (value) => {
    if (value === null || value === undefined || value === "") return "";
    let num = parseFloat(String(value).replace("%", "").trim());
    if (!isNaN(num) && num > 0 && num < 1) num *= 100;  // 0.2 -> 20%
    if (isNaN(num)) return "";
    return `${Math.round(num)}%`;
  };

  const parseRating = (raw) => {
    if (!raw) return null;
    const n = parseFloat(String(raw).replace(",", ".").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  };

  fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`)
    .then((res) => res.json())
    .then((rows) => {
      console.log("✅ Products loaded:", rows.length);

      if (!rows.length) {
        productGrid.innerHTML = "<p>Ingen produkter tilgjengelig.</p>";
        return;
      }

      // Velg et tilfeldig utvalg (12) til forsiden
      const shuffled = [...rows].sort(() => Math.random() - 0.5).slice(0, 12);

      productGrid.innerHTML = "";

      shuffled.forEach((p) => {
        const id = toNumber(p.id);
        if (!id || !p.title || !p.image_url) return;

        const isFav = getFavorites().some((f) => Number(f.id) === id);
        const rating = parseRating(p.rating);
        const discountTxt = formatDiscount(p.discount);

        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
          ${discountTxt ? `<div class="discount-badge">-${discountTxt}</div>` : ""}
          <div class="fav-icon ${isFav ? "active" : ""}" aria-label="Legg til i favoritter" title="Favoritt">
            <svg viewBox="0 0 24 24" class="heart-icon" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
              2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
              14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
              6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <img src="${p.image_url}" alt="${p.title}">
          <div class="product-info">
            <h3>${p.title}</h3>
            ${p.brand ? `<p class="brand">${p.brand}</p>` : ""}
            ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
            ${p.price ? `<p class="price">${p.price} kr</p>` : ""}
          </div>
        `;

        // Klikk på kortet -> product.html?id=...
        card.addEventListener("click", (e) => {
          if (e.target.closest(".fav-icon")) return; // unngå navigasjon når man trykker på hjerte
          window.location.href = `product.html?id=${id}`;
        });

        // Favoritt-knapp (SVG)
        card.querySelector(".fav-icon").addEventListener("click", (e) => {
          e.stopPropagation();

          // Lag "cleanProduct" på samme format som i script-favorites.js
          const cleanProduct = {
            id,
            title: p.title,
            brand: p.brand,
            price: p.price,
            discount: p.discount,
            image_url: p.image_url,
            image2: p.image2,
            image3: p.image3,
            image4: p.image4,
            product_url: p.product_url,
            category: p.category,
            subcategory: p.subcategory,
            gender: p.gender,
            description: p.description,
            rating: p.rating,
          };

          const existing = getFavorites().some((f) => Number(f.id) === id);
          toggleFavorite(cleanProduct); // håndterer lagring + toast + teller

          // UI-oppdatering for hjertet
          e.currentTarget.classList.toggle("active", !existing);
        });

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML = "<p>Kunne ikke laste produkter akkurat nå.</p>";
    });
});



