// ======================================================
// ✅ Category System FINAL — BrandRadar
// Full støtte for Gender + Kidtype + Unisex
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  const SHEET_PRODUCTS = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_MAPPING  = "1e3tvfatBmnwDVs5nuR-OvSaQl0lIF-JUhuQtfvACo3g";

  const PRODUCTS_NAME = "BrandRadarProdukter";
  const MAPPING_NAME  = "CategoryMapping";

  const productUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/${PRODUCTS_NAME}`;
  const mappingUrl = `https://opensheet.elk.sh/${SHEET_MAPPING}/${MAPPING_NAME}`;

  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");
  const breadcrumbEl = document.querySelector(".breadcrumb");

  const params = new URLSearchParams(window.location.search);
  const genderParam = params.get("gender");
  const categoryParam = params.get("category");
  const subParam = params.get("subcategory");

  if (!genderParam || !categoryParam) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  const normalize = txt => (txt || "")
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

    console.log("✅ Mapping rows:", mapRows.length);
    console.log("✅ Products loaded:", products.length);

    const categoryMatches = mapRows.filter(row =>
      normalize(row.main_category) === categorySlug &&
      (!row.gender || normalize(row.gender) === genderSlug)
    );

    if (!categoryMatches.length) {
      console.warn("⚠️ Ingen mapping funnet for:", categorySlug, genderSlug);
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

    const g = genderParam.toLowerCase();
    const norskGender =
      g === "men" || g === "herre" ? "Herre" :
      g === "women" || g === "dame" ? "Dame" :
      g === "kids" || g === "barn" ? "Barn" : genderParam;

    titleEl.textContent =
      subNameNo ? `${subNameNo} – ${norskGender}` :
                  `${categoryNameNo} – ${norskGender}`;

    document.title = `${titleEl.textContent} | BrandRadar`;

    breadcrumbEl.innerHTML = `
      <a href="index.html">Hjem</a> ›
      <a href="category.html?gender=${genderParam}&category=${categoryParam}">
        ${norskGender}
      </a> ›
      ${subNameNo || categoryNameNo}
    `;

    // ✅ Produktfilter — FINAL RULESET
    const filtered = products.filter(p => {
      const pGender = normalize(p.gender);
      const pCat = normalize(p.category);
      const pSub = normalize(p.subcategory);

      const matchGender =
        pGender === genderSlug ||
        pGender === "unisex" ||
        !pGender;

      const matchCategory =
        pCat === categorySlug ||
        pCat.includes(categorySlug) ||
        categorySlug.includes(pCat);

      const matchSub =
        !subSlug || pSub === subSlug;

      return matchGender && matchCategory && matchSub;
    });

    console.log("🎯 Filtered products:", filtered.length);

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
        window.location.href = \`product.html?id=\${Number(product.id)}\`;
      });

      productGrid.appendChild(card);
    });

  })
  .catch(err => console.error("❌ Category FEIL:", err));

});







