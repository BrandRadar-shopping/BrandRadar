// ======================================================
// BrandRadar.shop – Category Page Loader (GVIZ stable version)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Category script running...");

  const SHEET_ID = "2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-";
const SHEET_NAME = "BrandRadarProdukter";
const url = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  const productGrid = document.querySelector(".product-grid");
  const categoryTitle = document.querySelector(".category-title");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = urlParams.get("category");
  const selectedSub = urlParams.get("subcategory");
  const selectedGender = urlParams.get("gender");

  if (categoryTitle && selectedCategory) {
    categoryTitle.textContent =
      selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  }

// ==  const url = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`; //==

  fetch(url)
    .then((res) => res.text())
    .then((text) => {
      const json = JSON.parse(text.substring(47, text.length - 2));
      const rows = json.table.rows.map((r) => ({
        brand: r.c[0]?.v || "",
        title: r.c[1]?.v || "",
        price: r.c[2]?.v || "",
        discount: r.c[3]?.v || "",
        image_url: r.c[4]?.v || "",
        product_url: r.c[5]?.v || "",
        category: r.c[6]?.v || "",
        gender: r.c[7]?.v || "",
        subcategory: r.c[8]?.v || "",
        description: r.c[9]?.v || "",
        rating: r.c[10]?.v || "",
        image2: r.c[11]?.v || "",
        image3: r.c[12]?.v || "",
        image4: r.c[13]?.v || "",
      }));

      let filtered = rows;
      if (selectedCategory)
        filtered = filtered.filter(
          (r) =>
            r.category?.toLowerCase().trim() ===
            selectedCategory.toLowerCase().trim()
        );
      if (selectedSub)
        filtered = filtered.filter(
          (r) =>
            r.subcategory?.toLowerCase().trim() ===
            selectedSub.toLowerCase().trim()
        );
      if (selectedGender)
        filtered = filtered.filter(
          (r) =>
            r.gender?.toLowerCase().trim() ===
            selectedGender.toLowerCase().trim()
        );

      console.log("✅ Filtrert:", filtered.length);

      productGrid.innerHTML = "";
      if (!filtered.length) {
        productGrid.innerHTML = `<p>Ingen produkter funnet i denne kategorien.</p>`;
        return;
      }

      filtered.forEach((row) => {
        const {
          brand,
          title,
          price,
          discount,
          image_url,
          product_url,
          rating,
          gender,
        } = row;
        if (!title || !image_url) return;

        let discountDisplay = "";
        if (discount) {
          const clean = parseFloat(discount.toString().replace("%", "").trim());
          if (!isNaN(clean)) {
            const displayValue = clean < 1 ? clean * 100 : clean;
            discountDisplay = `${displayValue}% OFF`;
          }
        }

        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          ${discountDisplay ? `<div class="discount-badge">${discountDisplay}</div>` : ""}
          <img src="${image_url}" alt="${title}">
          <div class="product-info">
            <h3>${title}</h3>
            ${brand ? `<p class="brand">${brand}</p>` : ""}
            ${price ? `<p class="price">${price} kr</p>` : ""}
            ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
            ${gender ? `<p class="gender">${gender}</p>` : ""}
            <a href="${product_url}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;
        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML = `<p>Kunne ikke laste produkter akkurat nå.</p>`;
    });
});

