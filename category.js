// ======================================================
// ✅ BrandRadar – Category Page (Clean FINAL Build)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  // ✅ Google Sheets config
  const SHEET_PRODUCTS = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_MAPPING  = "1e3tvfatBmnwDVs5nuR-OvSaQl0lIF-JUhuQtfvACo3g";
  const PRODUCTS_NAME = "BrandRadarProdukter";
  const MAPPING_NAME  = "CategoryMapping";

  const productUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/${PRODUCTS_NAME}`;
  const mappingUrl = `https://opensheet.elk.sh/${SHEET_MAPPING}/${MAPPING_NAME}`;

  // ✅ DOM elements
  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");
  const breadcrumbEl = document.querySelector(".breadcrumb");
  const categoryProductsSection = document.querySelector(".category-products");

  // ✅ URL Params
  const params = new URLSearchParams(window.location.search);
  const genderParam = params.get("gender");
  const categoryParam = params.get("category");
  const subParam = params.get("subcategory");

  if (!genderParam || !categoryParam) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  // ✅ Normalize helper
  const normalize = (txt) =>
    (txt || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "and")
      .replace(/[^\w\d]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const categorySlug = normalize(categoryParam);
  let genderSlug = normalize(genderParam);
  if (genderSlug === "herre") genderSlug = "men";
  if (genderSlug === "dame")  genderSlug = "women";
  if (genderSlug === "barn")  genderSlug = "kids";

  const subSlug = normalize(subParam);

  Promise.all([
    fetch(mappingUrl).then(r => r.json()),
    fetch(productUrl).then(r => r.json())
  ])
  .then(([mapRows, products]) => {

    // ✅ Mapping match
    const categoryMatches = mapRows.filter(row =>
      normalize(row.main_category) === categorySlug &&
      (!row.gender || normalize(row.gender) === genderSlug)
    );

    if (!categoryMatches.length) {
      emptyMessage.style.display = "block";
      return;
    }

    const mainCategory = categoryMatches[0];
    const categoryNameNo = mainCategory.display_name;

    let subNameNo = null;
    if (subSlug) {
      const subEntry = mapRows.find(row =>
        normalize(row.url_slug) === subSlug &&
        normalize(row.main_category) === categorySlug
      );
      if (subEntry) subNameNo = subEntry.display_name;
    }

    // ✅ Pretty gender text
    const g = genderParam.toLowerCase();
    const norskGender =
      g === "men" || g === "herre" ? "Herre" :
      g === "women" || g === "dame" ? "Dame" :
      g === "kids" || g === "barn" ? "Barn" : genderParam;

    // ✅ Title + Breadcrumb
    titleEl.textContent = subNameNo
      ? `${subNameNo} – ${norskGender}`
      : `${categoryNameNo} – ${norskGender}`;

    document.title = `${titleEl.textContent} | BrandRadar`;

    breadcrumbEl.innerHTML = `
      <a href="index.html">Hjem</a> ›
      <a href="category.html?gender=${genderParam}&category=${categoryParam}">
        ${norskGender}
      </a> ›
      ${subNameNo || categoryNameNo}
    `;

    // ✅ Filter Product List
    const filtered = products.filter(p => {
      const pGender = normalize(p.gender);
      return (
        normalize(p.category) === categorySlug &&
        (!subSlug || normalize(p.subcategory) === subSlug) &&
        (pGender === genderSlug || pGender === "unisex" || pGender === "")
      );
    });

    if (!filtered.length) {
      emptyMessage.style.display = "block";
      return;
    }

    emptyMessage.style.display = "none";

    // ✅ Render products
    function renderProducts(list) {
      productGrid.innerHTML = "";

      list.forEach((p) => {
        const rating = p.rating
          ? parseFloat(String(p.rating).replace(",", ".").replace(/[^0-9.]/g, ""))
          : null;

        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
          ${p.discount ? `<div class="discount-badge">${p.discount}%</div>` : ""}
          <img src="${p.image_url}" alt="${p.title}">
          <div class="product-info">
            <h3>${p.title}</h3>
            <p class="brand">${p.brand || ""}</p>
            ${rating ? `<p class="rating">⭐ ${rating.toFixed(1)}</p>` : ""}
            <p class="price">${p.price || ""} kr</p>
          </div>
        `;

        card.addEventListener("click", () => {
          window.location.href = `product.html?id=${p.id}`;
        });

        productGrid.appendChild(card);
      });

      document.querySelector(".result-count").textContent = `${list.length} produkter`;
    }

    // ✅ Create sort bar
    const sortBar = document.createElement("div");
    sortBar.className = "sort-bar";
    sortBar.innerHTML = `
      <span class="result-count">${filtered.length} produkter</span>
      <select id="sort-select">
        <option value="featured">Anbefalt</option>
        <option value="price-asc">Pris: lav → høy</option>
        <option value="price-desc">Pris: høy → lav</option>
        <option value="rating-desc">Best vurdert</option>
      </select>
    `;
    categoryProductsSection.prepend(sortBar);

    // ✅ Sorting Logic
    const sortSelect = document.getElementById("sort-select");
    sortSelect.addEventListener("change", () => {
      let sorted = [...filtered];

      if (sortSelect.value === "price-asc")
        sorted.sort((a,b) => Number(a.price) - Number(b.price));

      if (sortSelect.value === "price-desc")
        sorted.sort((a,b) => Number(b.price) - Number(a.price));

      if (sortSelect.value === "rating-desc") {
        const r = p =>
          parseFloat(String(p.rating).replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
        sorted.sort((a,b) => r(b) - r(a));
      }

      renderProducts(sorted);
    });

    // ✅ Initial display
    renderProducts(filtered);

    // ✅ Favorites count auto update
    setTimeout(() => updateFavoriteCount?.(), 50);
  })
  .catch(err => console.error("❌ Category error:", err));
});
