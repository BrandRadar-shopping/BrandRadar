// ======================================================
// BrandRadar.shop – CATEGORY FILTER SYSTEM
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Category.js initialized");

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");

  const params = new URLSearchParams(window.location.search);

  const filterMain = params.get("main_category");
  const filterGender = params.get("gender");
  const filterSub = params.get("subcategory");
  const filterKidtype = params.get("kidtype");

  if (!filterMain) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  // ✅ Sett tittel (kun kategori, ikke kjønn – ditt valg B ✅)
  if (filterSub) {
    titleEl.textContent = filterSub.replace(/_/g, " ");
  } else {
    titleEl.textContent = filterMain;
  }

  fetch(url)
    .then(res => res.json())
    .then(rows => {
      console.log("✅ Products fetched:", rows.length);

      const filtered = rows.filter(item => {
        if (!item.main_category) return false;

        const byMain = item.main_category === filterMain;
        const byGender = filterGender ? item.gender === filterGender : true;
        const bySub = filterSub ? item.subcategory === filterSub : true;
        const byKid = filterKidtype ? item.kidtype === filterKidtype : true;

        return byMain && byGender && bySub && byKid;
      });

      console.log("🎯 Filtered products:", filtered.length);

      if (!filtered.length) {
        emptyMessage.style.display = "block";
        return;
      }

      productGrid.innerHTML = "";
      emptyMessage.style.display = "none";

      filtered.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
          ${product.discount ? `<div class="discount-badge">${Math.round(product.discount * 100)}% OFF</div>` : ""}
          <img src="${product.image_url}" alt="${product.title}">
          <div class="product-info">
            <h3>${product.title}</h3>
            <p class="brand">${product.brand || ""}</p>
            <p class="price">${product.price || ""}</p>
            <a href="${product.product_url}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;

        productGrid.appendChild(card);
      });
    })
    .catch(err =>
      console.error("❌ Feil ved lasting av kategori-produkter:", err)
    );
});




