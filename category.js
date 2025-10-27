// ======================================================
// BrandRadar.shop – Category Page Loader (CSV stable version)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Category script running...");

  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv";

  const productGrid = document.querySelector(".product-grid");
  const categoryTitle = document.querySelector(".category-title");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const selectedCategory = params.get("category");
  const selectedSub = params.get("subcategory");
  const selectedGender = params.get("gender");

  if (categoryTitle && selectedCategory) {
    categoryTitle.textContent =
      selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  }

  fetch(CSV_URL)
    .then((res) => res.text())
    .then((csvText) => {
      const rows = csvText.split("\n").map((r) => r.split(","));
      const headers = rows.shift().map((h) => h.trim());
      const all = rows.map((r) =>
        Object.fromEntries(headers.map((h, i) => [h, r[i]?.trim() || ""]))
      );

      // Filtrering
      let filtered = all;
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

      console.log(`✅ Filtrert: ${filtered.length} produkter`);

      productGrid.innerHTML = "";
      if (!filtered.length) {
        productGrid.innerHTML = `<p>Ingen produkter funnet i denne kategorien.</p>`;
        return;
      }

      filtered.forEach((item) => {
        let discountDisplay = "";
if (discount && !isNaN(parseFloat(discount))) {
  discountDisplay = `${parseFloat(discount)}% OFF`;
}


        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          ${discountDisplay ? `<div class="discount-badge">${discountDisplay}</div>` : ""}
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
        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML = "<p>Kunne ikke laste produkter akkurat nå 😞</p>";
    });
});

