// ======================================================
// ✅ Category System 3.0 – Dynamisk med Google Sheets
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  const SHEET_PRODUCTS = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_MAPPING = "1e3tvfatBmnwDVs5nuR-OvSaQl0lIF-JUhuQtfvACo3g";

  const PRODUCTS_NAME = "BrandRadarProdukter";
  const MAPPING_NAME = "CategoryMapping";

  const productUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/${PRODUCTS_NAME}`;
  const mappingUrl = `https://opensheet.elk.sh/${SHEET_MAPPING}/${MAPPING_NAME}`;

  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");
  const breadcrumbEl = document.querySelector(".breadcrumb");

  const params = new URLSearchParams(window.location.search);
  const gender = params.get("gender");
  const categorySlug = params.get("category");
  const subSlug = params.get("subcategory");

  if (!gender || !categorySlug) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  let mappingData = [];

  // ======================================================
  // ✅ Last CategoryMapping først
  // ======================================================
  fetch(mappingUrl)
    .then(res => res.json())
    .then(mapRows => {
      mappingData = mapRows;

      const category = mapRows.find(r => r.url_slug === categorySlug);
      if (!category) {
        titleEl.textContent = "Kategori ikke funnet";
        emptyMessage.style.display = "block";
        return;
      }

      const categoryNameNo = category.display_name || categorySlug;

      let subNameNo = null;
      if (subSlug) {
        const sub = mapRows.find(r => r.url_slug === subSlug);
        subNameNo = sub ? sub.display_name : subSlug;
      }

      // ✅ Sett sidetittel
      const norskGender = gender === "Men" ? "Herre" :
                          gender === "Women" ? "Dame" :
                          gender === "Kids" ? "Barn" : gender;

      titleEl.textContent = subNameNo ? `${subNameNo} – ${norskGender}` : `${categoryNameNo} – ${norskGender}`;
      document.title = `${titleEl.textContent} | BrandRadar`;

      // ✅ Breadcrumbs
      breadcrumbEl.innerHTML = `
        <a href="index.html">Hjem</a> ›
        <a href="category.html?gender=${gender}&category=${categorySlug}">
          ${norskGender}
        </a> ›
        ${subNameNo ? `<a>${subNameNo}</a>` : `<a>${categoryNameNo}</a>`}
      `;

      // ======================================================
      // ✅ Last produkter etter mapping er lastet ✅
      // ======================================================
      return fetch(productUrl);
    })
    .then(res => res.json())
    .then(products => {

      const normalize = txt => (txt || "")
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/\s+/g, "-")
  .trim();

const filtered = products.filter(p =>
  normalize(p.gender) === normalize(gender) &&
  normalize(p.category) === normalize(categorySlug) &&
  (!subSlug || normalize(p.subcategory) === normalize(subSlug))
);


      if (!filtered.length) {
        emptyMessage.style.display = "block";
        return;
      }

      emptyMessage.style.display = "none";
      productGrid.innerHTML = "";

      filtered.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
          ${product.discount ? `<div class="discount-badge">${product.discount}%</div>` : ""}
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
    .catch(err =>
      console.error("❌ Error i Category system:", err)
    );
});



