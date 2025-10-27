// ======================================================
// BRANDRADAR.SHOP – CATEGORY PAGE LOADER (CSV VERSION)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Category script running...");

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv";

  const productGrid = document.querySelector(".product-grid");
  const categoryTitle = document.querySelector(".category-title");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet!");
    return;
  }

  // Hent parametere fra URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = urlParams.get("category");
  const selectedSub = urlParams.get("subcategory");
  const selectedGender = urlParams.get("gender");

  // Sett tittel
  if (categoryTitle) {
    const titleParts = [];
    if (selectedGender) titleParts.push(selectedGender);
    if (selectedSub) titleParts.push(selectedSub);
    else if (selectedCategory) titleParts.push(selectedCategory);
    categoryTitle.textContent = titleParts.join(" • ").toUpperCase();
  }

  // Hent data fra Google Sheets (CSV)
  fetch(CSV_URL)
    .then((res) => res.text())
    .then((csvText) => {
      const rows = csvText.split("\n").map((r) => r.split(","));
      const headers = rows.shift().map((h) => h.trim());
      const products = rows
        .map((r) =>
          Object.fromEntries(headers.map((h, i) => [h, r[i]?.trim() || ""]))
        )
        .filter((p) => p.title && p.image_url);

      // --- Filtrering ---
      let filtered = products;

      if (selectedCategory)
        filtered = filtered.filter(
          (p) =>
            p.category?.toLowerCase().trim() ===
            selectedCategory.toLowerCase().trim()
        );

      if (selectedSub)
        filtered = filtered.filter(
          (p) =>
            p.subcategory?.toLowerCase().trim() ===
            selectedSub.toLowerCase().trim()
        );

      if (selectedGender)
        filtered = filtered.filter(
          (p) =>
            p.gender?.toLowerCase().trim() ===
            selectedGender.toLowerCase().trim()
        );

      console.log(
        `✅ Filtrert ${filtered.length} produkter (${selectedCategory || ""} ${selectedSub || ""} ${selectedGender || ""})`
      );

      // --- Render produkter ---
      productGrid.innerHTML = "";

      if (!filtered.length) {
        productGrid.innerHTML = `<p>Ingen produkter funnet i denne kategorien.</p>`;
        return;
      }

      filtered.forEach((item) => {
        let discountDisplay = "";
        if (item.discount) {
          const clean = parseFloat(item.discount.toString().replace("%", "").trim());
          if (!isNaN(clean)) {
            const displayValue = clean < 1 ? clean * 100 : clean;
            discountDisplay = `${displayValue}% OFF`;
          }
        }

        const isFav = getFavorites().some((f) => f.title === item.title);

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

          <img src="${item.image_url}" alt="${item.title}" />
          <div class="product-info">
            <h3>${item.title}</h3>
            ${item.brand ? `<p class="brand">${item.brand}</p>` : ""}
            ${item.price ? `<p class="price">${item.price} kr</p>` : ""}
            ${item.rating ? `<p class="rating">⭐ ${item.rating}</p>` : ""}
            ${item.gender ? `<p class="gender">${item.gender}</p>` : ""}
            <a href="${item.product_url}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;

        // Klikk på produkt → åpne detaljside
        card.addEventListener("click", (e) => {
          if (e.target.closest(".fav-icon")) return;
          const params = new URLSearchParams(item);
          window.location.href = `product.html?${params.toString()}`;
        });

        // ❤️ Favoritt-knapp
        const heart = card.querySelector(".fav-icon");
        heart.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavorite(item);
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
