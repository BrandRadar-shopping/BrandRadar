// ======================================================
// BrandRadar.shop – Category Page Loader (OpenSheet stable version)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Category script running...");

  // -----------------------------
  // KONFIG
  // -----------------------------
  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQyI7NUrnyXgIHlQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const productGrid = document.querySelector(".product-grid");
  const categoryTitle = document.querySelector(".category-title");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  // -----------------------------
  // URL-parametere
  // -----------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = urlParams.get("category");
  const selectedSub = urlParams.get("subcategory");
  const selectedGender = urlParams.get("gender");

  if (categoryTitle && selectedCategory) {
    categoryTitle.textContent =
      selectedCategory.charAt(0).toUpperCase() +
      selectedCategory.slice(1);
  }

  // -----------------------------
  // Hent data fra Google Sheet via OpenSheet
  // -----------------------------
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  fetch(url)
    .then((res) => res.json())
    .then((rows) => {
      console.log("✅ Alle produkter:", rows.length);

      // --------------------------
      // Filtrering
      // --------------------------
      let filtered = rows;

      if (selectedCategory) {
        filtered = filtered.filter(
          (r) =>
            r.category?.toLowerCase().trim() ===
            selectedCategory.toLowerCase().trim()
        );
      }

      if (selectedSub) {
        filtered = filtered.filter(
          (r) =>
            r.subcategory?.toLowerCase().trim() ===
            selectedSub.toLowerCase().trim()
        );
      }

      if (selectedGender) {
        filtered = filtered.filter(
          (r) =>
            r.gender?.toLowerCase().trim() ===
            selectedGender.toLowerCase().trim()
        );
      }

      console.log(
        `✅ Filtrert: ${filtered.length} produkter (${selectedCategory || ""} ${
          selectedSub || ""
        } ${selectedGender || ""})`
      );

      // --------------------------
      // Ingen produkter
      // --------------------------
      productGrid.innerHTML = "";
      if (!filtered.length) {
        productGrid.innerHTML = `
          <div class="no-results">
            <p>Ingen produkter funnet i denne kategorien.</p>
          </div>`;
        return;
      }

      // --------------------------
      // Render produkter
      // --------------------------
      filtered.forEach((row) => {
        const {
          brand,
          title,
          price,
          discount,
          image_url,
          product_url,
          category,
          gender,
          subcategory,
          description,
          rating,
          image2,
          image3,
          image4,
        } = row;

        if (!title || !image_url) return;

        const favorites = getFavorites();
        const isFav = favorites.some((fav) => fav.title === title);

        // Riktig rabatt-format (20 → 20%, 0.2 → 20%)
        let discountDisplay = "";
        if (discount) {
          const cleanValue = parseFloat(
            discount.toString().replace("%", "").trim()
          );
          if (!isNaN(cleanValue)) {
            const displayValue = cleanValue < 1 ? cleanValue * 100 : cleanValue;
            discountDisplay = `${displayValue}% OFF`;
          }
        }

        const card = document.createElement("div");
        card.classList.add("product-card");

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

          <img src="${image_url}" alt="${title}" />
          <div class="product-info">
            <h3>${title}</h3>
            ${brand ? `<p class="brand">${brand}</p>` : ""}
            ${price ? `<p class="price">${price} kr</p>` : ""}
            ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
            ${gender ? `<p class="gender">${gender}</p>` : ""}
            <a href="${product_url}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;

        // Klikk på kort → product.html
        card.addEventListener("click", (e) => {
          if (e.target.classList.contains("fav-icon")) return;
          const params = new URLSearchParams({
            brand,
            title,
            price,
            discount,
            image_url,
            image2,
            image3,
            image4,
            url: product_url,
            gender,
            category,
            subcategory,
            description,
            rating,
          });
          window.location.href = `product.html?${params.toString()}`;
        });

        // ❤️ Favoritt-knapp
        const heart = card.querySelector(".fav-icon");
        heart.addEventListener("click", (e) => {
          e.stopPropagation();
          const product = {
            brand,
            title,
            price,
            discount,
            image_url,
            image2,
            image3,
            image4,
            url: product_url,
            gender,
            category,
            subcategory,
            description,
            rating,
          };
          const favorites = getFavorites();
          const isAlreadyFav = favorites.some((f) => f.title === title);

          if (isAlreadyFav) {
            const updated = favorites.filter((f) => f.title !== title);
            saveFavorites(updated);
            heart.classList.remove("active", "pop");
            heart.classList.add("unfav");
            showToast("❌ Fjernet fra favoritter", false);
          } else {
            favorites.push(product);
            saveFavorites(favorites);
            heart.classList.remove("unfav");
            heart.classList.add("active", "pop");
            showToast("❤️ Lagt til som favoritt", true);
          }

          updateFavoriteCount();
        });

        const buyBtn = card.querySelector(".buy-btn");
        if (buyBtn) buyBtn.addEventListener("click", (e) => e.stopPropagation());

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML =
        "<p>Kunne ikke laste produkter akkurat nå. Prøv igjen senere.</p>";
    });
});

