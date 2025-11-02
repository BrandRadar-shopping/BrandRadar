// ======================================================
// ✅ Category System ULTRA-STABLE – BrandRadar
// Dynamisk fra Google Sheets + tolerant matching
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

  // ✅ Super normalize (slugify everything!)
  const normalize = txt => (txt || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\d]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // ✅ Load sheets in parallel
  Promise.all([
    fetch(mappingUrl).then(r => r.json()),
    fetch(productUrl).then(r => r.json())
  ])
  .then(([mapRows, products]) => {

    console.log("✅ Mapping rows:", mapRows.length);
    console.log("✅ Products loaded:", products.length);

    // ✅ Normalize lookup targets
    const normalizedGender = normalize(gender);
    const normalizedCategorySlug = normalize(categorySlug);
    const normalizedSubSlug = normalize(subSlug);

    // ✅ Find category mapping rows for gender + category
    const categoryMaps = mapRows.filter(r =>
      normalize(r.main_category) === normalizedCategorySlug &&
      normalize(r.gender) === normalizedGender
    );

    if (!categoryMaps.length) {
      console.warn("⚠️ Ingen matching category i mapping:", categorySlug);
      emptyMessage.style.display = "block";
      return;
    }

    const mainCategoryEntry = categoryMaps[0];
    const categoryNameNo = mainCategoryEntry.display_name;

    let subSlugResolved = null;
    let subNameNo = null;

    if (subSlug) {
      const matchedSub = categoryMaps.find(r =>
        normalize(r.url_slug) === normalizedSubSlug ||
        normalize(r.display_name) === normalizedSubSlug
      );

      if (matchedSub) {
        subSlugResolved = normalize(matchedSub.url_slug);
        subNameNo = matchedSub.display_name;
      }
    }

    // ✅ Page Title & Breadcrumbs
    const norskGender =
      gender === "Men" ? "Herre" :
      gender === "Women" ? "Dame" :
      gender === "Kids" ? "Barn" : gender;

    titleEl.textContent = subNameNo ?
      `${subNameNo} – ${norskGender}` :
      `${categoryNameNo} – ${norskGender}`;

    document.title = `${titleEl.textContent} | BrandRadar`;

    breadcrumbEl.innerHTML = `
      <a href="index.html">Hjem</a> ›
      <a href="category.html?gender=${gender}&category=${categorySlug}">
        ${norskGender}
      </a> ›
      ${subNameNo || categoryNameNo}
    `;

    // ✅ ULTRA-robust produktmatching ✅
    const filtered = products.filter(p => {
      const pGender = normalize(p.gender);
      const pCategory = normalize(p.category);
      const pSub = normalize(p.subcategory);
      const pTitle = normalize(p.title);

      const matchGender = pGender === normalizedGender;
      const matchCategory =
        pCategory.includes(normalizedCategorySlug) ||
        normalizedCategorySlug.includes(pCategory);

      const matchSub = !subSlugResolved ||
        pSub === subSlugResolved ||
        pTitle.includes(subSlugResolved);

      return matchGender && matchCategory && matchSub;
    });

    console.log("🎯 Filtered products:", filtered.length);

    if (!filtered.length) {
      emptyMessage.style.display = "block";
      return;
    }

    // ✅ Render
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
  .catch(err => console.error("❌ Category error:", err));

});





