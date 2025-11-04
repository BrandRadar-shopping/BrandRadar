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
    if (titleEl) titleEl.textContent = "Ugyldig kategori";
    if (emptyMessage) emptyMessage.style.display = "block";
    return;
  }

  // Robust normalisering for matching og slugs
  const normalize = (txt) => (txt || "")
    .toString()
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
    fetch(mappingUrl).then((r) => r.json()),
    fetch(productUrl).then((r) => r.json()),
  ])
    .then(([mapRows, products]) => {
      console.log("✅ Mapping rows:", mapRows.length);
      console.log("✅ Products loaded:", products.length);

      // Finn mapping for valgt main category (+ evt. kjønn)
      const categoryMatches = mapRows.filter((row) =>
        normalize(row.main_category) === categorySlug &&
        (!row.gender || normalize(row.gender) === genderSlug)
      );

      if (!categoryMatches.length) {
        console.warn("⚠️ Ingen mapping funnet for:", categorySlug, genderSlug);
        if (emptyMessage) emptyMessage.style.display = "block";
        return;
      }

      const mainCategory = categoryMatches[0];
      const categoryNameNo = mainCategory.display_name;

      // Subcategory (valgfritt)
      let subNameNo = null;
      if (subSlug) {
        const subEntry = mapRows.find(
          (row) =>
            normalize(row.url_slug) === subSlug &&
            normalize(row.main_category) === categorySlug
        );
        if (subEntry) subNameNo = subEntry.display_name;
      }

      // Norsk kjønn til tittel/breadcrumb
      const g = (genderParam || "").toLowerCase();
      const norskGender =
        g === "men" || g === "herre"
          ? "Herre"
          : g === "women" || g === "dame"
          ? "Dame"
          : g === "kids" || g === "barn"
          ? "Barn"
          : genderParam;

      // Tittel
      if (titleEl) {
        titleEl.textContent = subNameNo
          ? `${subNameNo} – ${norskGender}`
          : `${categoryNameNo} – ${norskGender}`;
      }
      document.title = `${titleEl ? titleEl.textContent : "Kategori"} | BrandRadar`;

      // Breadcrumb
      if (breadcrumbEl) {
        breadcrumbEl.innerHTML = `
          <a href="index.html">Hjem</a> ›
          <a href="category.html?gender=${encodeURIComponent(genderParam)}&category=${encodeURIComponent(categoryParam)}">
            ${norskGender}
          </a> ›
          ${subNameNo || categoryNameNo}
        `;
      }

      // Produktfilter — inkluder Unisex og tom gender
      const filtered = products.filter((p) => {
        const pGender = normalize(p.gender);
        const pCat = normalize(p.category);
        const pSub = normalize(p.subcategory);

        const matchGender =
          pGender === genderSlug || pGender === "unisex" || pGender === "";

        const matchCategory = pCat === categorySlug;

        const matchSub = !subSlug || pSub === subSlug;

        return matchGender && matchCategory && matchSub;
      });

      console.log("🎯 Filtered products:", filtered.length);

      if (!filtered.length) {
        if (emptyMessage) emptyMessage.style.display = "block";
        if (productGrid) productGrid.innerHTML = "";
        // Oppdater teller selv om tomt
        if (typeof updateFavoriteCount === "function") {
          setTimeout(updateFavoriteCount, 0);
        }
        return;
      }

      if (emptyMessage) emptyMessage.style.display = "none";
      if (productGrid) productGrid.innerHTML = "";

      // ✅ SORTERING + RESULTATTELLER
const renderProducts = (items) => {
  productGrid.innerHTML = "";
  items.forEach((product) => {
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
};

// ✅ Sorteringsmeny UI
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
document.querySelector(".category-products").prepend(sortBar);

const sortSelect = document.getElementById("sort-select");
sortSelect.addEventListener("change", () => {
  let sorted = [...filtered];
  const val = sortSelect.value;

  if (val === "price-asc")
    sorted.sort((a, b) => Number(a.price) - Number(b.price));

  if (val === "price-desc")
    sorted.sort((a, b) => Number(b.price) - Number(a.price));

  if (val === "rating-desc")
    sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));

  renderProducts(sorted);
});

// ✅ Første visning (default sortering)
renderProducts(filtered);

      // ✅ Sorteringsfunksjon
document.getElementById("sort-select")?.addEventListener("change", (e) => {
  const val = e.target.value;
  let sorted = [...filtered];

  if (val === "price-asc") {
    sorted.sort((a,b) => Number(a.price) - Number(b.price));
  } else if (val === "price-desc") {
    sorted.sort((a,b) => Number(b.price) - Number(a.price));
  } else if (val === "rating-desc") {
    const getRating = (p) =>
      parseFloat(String(p.rating).replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
    sorted.sort((a,b) => getRating(b) - getRating(a));
  }

  renderProducts(sorted);
});


      // ✅ Oppdater favoritt-teller etter render
      if (typeof updateFavoriteCount === "function") {
        setTimeout(updateFavoriteCount, 0);
      }
    })
    .catch((err) => console.error("❌ Category FEIL:", err));
});







