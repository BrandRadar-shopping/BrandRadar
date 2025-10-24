// ======================================================
// BrandRadar.shop – Google Sheets Product Loader (with thumbs, favorites + details)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product script running with favorites...");

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadar-produkter";
  const productGrid = document.querySelector(".product-grid");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

  fetch(url)
    .then(res => res.text())
    .then(data => {
      const json = JSON.parse(data.substr(47).slice(0, -2));
      const rows = json.table.rows;
      productGrid.innerHTML = "";

      rows.forEach(row => {
        if (!row.c) return;

        // Kolonner (A–O)
        const brand = row.c[0]?.v || "";
        const title = row.c[1]?.v || "";
        const price = row.c[2]?.v || "";
        const discount = row.c[3]?.v || "";
        const image = row.c[4]?.v || "";
        const productUrl = row.c[5]?.v || "#";
        const category = row.c[6]?.v || "";
        const gender = row.c[7]?.v || "";
        const subcategory = row.c[8]?.v || "";
        const image2 = row.c[10]?.v || "";
        const image3 = row.c[11]?.v || "";
        const image4 = row.c[12]?.v || "";
        const description = row.c[13]?.v || "";
        const rating = row.c[14]?.v || "";

        if (!title || !image) return;

        const favorites = getFavorites();
        const isFav = favorites.some(fav => fav.title === title);

        // Konverter rabattverdi (0.2 → 20%)
        const discountDisplay =
          discount && !isNaN(discount)
            ? `${Math.round(discount * 100)}% OFF`
            : discount || "";

        // Lag produktkort
        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
          ${discountDisplay ? `<div class="discount-badge">${discountDisplay}</div>` : ""}
          <div class="fav-icon ${isFav ? "active" : ""}">❤️</div>
          <img src="${image}" alt="${title}" />
          <div class="product-info">
            <h3>${title}</h3>
            ${brand ? `<p class="brand">${brand}</p>` : ""}
            ${price ? `<p class="price">${price}</p>` : ""}
            ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
            <p class="gender">${gender || ""}</p>
            <a href="${productUrl}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;

        // Klikk → product.html med data
        card.addEventListener("click", (e) => {
          if (e.target.classList.contains("fav-icon")) return; // unngå konflikt
          const params = new URLSearchParams({
            brand,
            title,
            price,
            discount,
            image,
            image2,
            image3,
            image4,
            url: productUrl,
            gender,
            category,
            subcategory,
            description,
            rating
          });
          window.location.href = `product.html?${params.toString()}`;
        });

        // ❤️ ikon – legg til/fjern favoritt
        const heart = card.querySelector(".fav-icon");
        heart.addEventListener("click", (e) => {
          e.stopPropagation();
          const product = {
            brand,
            title,
            price,
            discount,
            image,
            image2,
            image3,
            image4,
            url: productUrl,
            gender,
            category,
            subcategory,
            description,
            rating
          };
          toggleFavorite(product);
          heart.classList.toggle("active");
        });

        // "Se produkt" knapp – stopp klikk-bobling
        const buyBtn = card.querySelector(".buy-btn");
        if (buyBtn) {
          buyBtn.addEventListener("click", (e) => e.stopPropagation());
        }

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML =
        "<p>Kunne ikke laste produkter akkurat nå. Prøv igjen senere.</p>";
    });
});
