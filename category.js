// ======================================================
// ✅ BrandRadar.shop — CATEGORY SYSTEM 2.0
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");
  const breadcrumbEl = document.querySelector(".breadcrumb");

  const params = new URLSearchParams(window.location.search);
  const gender = params.get("gender");
  const category = params.get("category");
  const subcategory = params.get("subcategory");

  // ✅ Oversettelser
  const translateGender = {
    Men: "Herre",
    Women: "Dame",
    Kids: "Barn"
  };

  const translateCategory = {
    Clothing: "Klær",
    Shoes: "Sko",
    Gymcorner: "Gymcorner",
    Accessories: "Tilbehør",
    Selfcare: "Selfcare"
  };

  // ✅ Oversett subkategori — fallback: vis engelsk
  const translateSub = str =>
    (str || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  if (!gender || !category) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  const genderN = translateGender[gender] || gender;
  const categoryN = translateCategory[category] || category;
  const subN = subcategory ? translateSub(subcategory) : null;

  // ✅ Sett side-tittel
  if (subN) {
    titleEl.textContent = `${subN} – ${genderN}`;
    document.title = `${subN} – ${genderN} | BrandRadar`;
  } else {
    titleEl.textContent = `${categoryN} – ${genderN}`;
    document.title = `${categoryN} – ${genderN} | BrandRadar`;
  }

  // ✅ Breadcrumbs
  breadcrumbEl.innerHTML = `
    <a href="index.html">Hjem</a> ›
    <a href="category.html?gender=${gender}&category=${category}">
      ${genderN}
    </a> ›
    ${subcategory ? `<a>${subN}</a>` : `<a>${categoryN}</a>`}
  `;

  // ✅ Hent og filtrer produkter
  fetch(url)
    .then(res => res.json())
    .then(rows => {
      const filtered = rows.filter(item => {
        const byGender = item.gender === gender;
        const byCategory = item.category === category;
        const bySub = subcategory ? item.subcategory === subcategory : true;
        return byGender && byCategory && bySub;
      });

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
          ${product.discount ? 
            `<div class="discount-badge">${product.discount}% SALG</div>` : ""}
          <img src="${product.image_url}" alt="${product.title}">
          <div class="product-info">
            <h3>${product.title}</h3>
            <p class="brand">${product.brand || ""}</p>
            <p class="price">${product.price || ""} kr</p>
          </div>
        `;

        card.addEventListener("click", () => {
          window.location.href = `product.html?id=${product.id}`;
        });

        productGrid.appendChild(card);
      });
    })
    .catch(err => console.error("❌ Category error:", err));
});



