// ======================================================
// BRANDRADAR.SHOP – CATEGORY PAGE LOADER (CSV VERSION)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Category script running...");

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv";

  // Matcher din HTML: <div class="product-grid" id="category-products"></div>
  const productGrid =
    document.getElementById("category-products") ||
    document.querySelector(".product-grid");

  const categoryTitle = document.querySelector(".category-title");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid / #category-products funnet!");
    return;
  }

  // 1) Les parametere fra URL
  const params = new URLSearchParams(window.location.search);
  const selectedCategory = params.get("category");
  const selectedSub = params.get("subcategory");
  const selectedGender = params.get("gender");

  if (categoryTitle && selectedCategory) {
    categoryTitle.textContent =
      selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  }

  // 2) Hent CSV
  fetch(CSV_URL)
    .then((res) => res.text())
    .then((csvText) => {
      // Robust CSV-splitting (støtter komma i felt med "")
      const rows = csvText
        .trim()
        .split(/\r?\n/)
        .map(
          (line) =>
            line
              .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
              ?.map((v) => v.replace(/^"|"$/g, "")) || []
        );

      const headers = rows.shift().map((h) => h.trim().toLowerCase());
      const products = rows
        .map((r) =>
          Object.fromEntries(headers.map((h, i) => [h, (r[i] || "").trim()]))
        )
        .filter((p) => p.title && p.image_url);

      console.log("✅ Produkter hentet:", products.length);

      // 3) Filtrering
      let filtered = products;

      if (selectedCategory) {
        filtered = filtered.filter(
          (p) =>
            (p.category || "").toLowerCase().trim() ===
            selectedCategory.toLowerCase().trim()
        );
      }

      if (selectedGender) {
        filtered = filtered.filter(
          (p) =>
            (p.gender || "").toLowerCase().trim() ===
            selectedGender.toLowerCase().trim()
        );
      }

      if (selectedSub) {
        filtered = filtered.filter(
          (p) =>
            (p.subcategory || "").toLowerCase().trim() ===
            selectedSub.toLowerCase().trim()
        );
      }

      console.log("✅ Filtrerte produkter:", filtered.length);

      // 4) Render
      productGrid.innerHTML = "";

      if (!filtered.length) {
        productGrid.innerHTML =
          '<p>Ingen produkter funnet i denne kategorien.</p>';
        return;
      }

      filtered.forEach((item) => {
        // Rabatt: støtt både 20 og 0.2 → vis som 20% OFF
        let discountDisplay = "";
        if (item.discount && !isNaN(parseFloat(item.discount))) {
          const clean = parseFloat(item.discount);
          const percent = clean < 1 ? clean * 100 : clean;
          discountDisplay = `${percent}% OFF`;
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
            <a href="product.html?${new URLSearchParams(item).toString()}" class="buy-btn">Se produkt</a>
          </div>
        `;

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML =
        "<p>Kunne ikke laste produkter akkurat nå.</p>";
    });
});

