// ======================================================
// BrandRadar.shop – Product Loader (final CSV version)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product script running with favorites...");

  // ✅ Direkte CSV-lenke fra publisering
  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv";

  const productGrid = document.querySelector(".product-grid");
  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  // -------------------------------
  // ❤️ Favoritt-funksjoner
  // -------------------------------
  function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  }

  function saveFavorites(favs) {
    localStorage.setItem("favorites", JSON.stringify(favs));
  }

  function isFavorite(title) {
    return getFavorites().some((f) => f.title === title);
  }

  function toggleFavorite(title, product) {
    let favs = getFavorites();
    if (isFavorite(title)) {
      favs = favs.filter((f) => f.title !== title);
    } else {
      favs.push(product);
    }
    saveFavorites(favs);
  }

  // -------------------------------
  // 📦 Hent CSV-data
  // -------------------------------
  fetch(CSV_URL)
    .then((res) => res.text())
    .then((csvText) => {
      const rows = csvText
        .trim()
        .split(/\r?\n/)
        .map((line) =>
          line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((v) => v.replace(/^"|"$/g, "")) || []
        );

      const headers = rows.shift().map((h) => h.trim().toLowerCase());
      const products = rows
        .map((r) =>
          Object.fromEntries(headers.map((h, i) => [h, r[i]?.trim() || ""]))
        )
        .filter((p) => p.title && p.image_url);

      console.log("✅ Produkter hentet:", products.length);

      productGrid.innerHTML = "";

      if (!products.length) {
        productGrid.innerHTML = "<p>Ingen produkter funnet.</p>";
        return;
      }

      // -------------------------------
      // 🧱 Bygg produktkort
      // -------------------------------
      products.forEach((item) => {
        let discountDisplay = "";
if (item.discount && !isNaN(parseFloat(item.discount))) {
  const cleanValue = parseFloat(item.discount);
  const percent = cleanValue < 1 ? cleanValue * 100 : cleanValue; // støtter både 0.2 og 20
  discountDisplay = `${percent}% OFF`;
}

        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
          ${discountDisplay ? `<div class="discount-badge">${discountDisplay}</div>` : ""}
          <div class="fav-icon ${isFavorite(item.title) ? "active" : ""}">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
              2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
              14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
              6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <img src="${item.image_url}" alt="${item.title}">
          <div class="product-info">
            <h3>${item.title}</h3>
            ${item.brand ? `<p class="brand">${item.brand}</p>` : ""}
            ${item.price ? `<p class="price">${item.price} kr</p>` : ""}
            ${item.rating ? `<p class="rating">⭐ ${item.rating}</p>` : ""}
            ${item.gender ? `<p class="gender">${item.gender}</p>` : ""}
            <a href="${item.product_url}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;

        // Klikk → product.html
        card.addEventListener("click", (e) => {
          if (e.target.closest(".fav-icon")) return;
          const params = new URLSearchParams(item);
          window.location.href = `product.html?${params.toString()}`;
        });

        // ❤️ Favorittknapp
        const heart = card.querySelector(".fav-icon");
        heart.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavorite(item.title, item);
          heart.classList.toggle("active");
        });

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML = "<p>Kunne ikke laste produkter 😞</p>";
    });
});


