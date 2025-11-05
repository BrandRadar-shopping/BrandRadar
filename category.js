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
    const id = Number(p.id);
    const rating = p.rating
      ? parseFloat(String(p.rating).replace(",", ".").replace(/[^0-9.]/g, ""))
      : null;

    // ✅ Sjekk om produktet er i favoritter
    const isFav = getFavorites().some(f => Number(f.id) === id);

    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      ${p.discount ? `<div class="discount-badge">${p.discount}%</div>` : ""}
      <div class="fav-icon ${isFav ? "active" : ""}" aria-label="Legg til favoritt">
        <svg viewBox="0 0 24 24" class="heart-icon">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
          14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
          6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>

      <img src="${p.image_url}" alt="${p.title}">
      <div class="product-info">
        <h3>${p.title}</h3>
        <p class="brand">${p.brand || ""}</p>
        ${rating ? `<p class="rating">⭐ ${rating.toFixed(1)}</p>` : ""}
        <p class="price">${p.price || ""} kr</p>
      </div>
    `;

    // ✅ Navigering til produktside (ikke når man trykker på hjertet)
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-icon")) return;
      window.location.href = `product.html?id=${id}`;
    });

    // ✅ Favoritt-ikon logikk
    const favIcon = card.querySelector(".fav-icon");
    favIcon.addEventListener("click", (e) => {
      e.stopPropagation();

      const productObj = {
        id,
        title: p.title,
        brand: p.brand,
        price: p.price,
        discount: p.discount,
        image_url: p.image_url,
        image2: p.image2,
        image3: p.image3,
        image4: p.image4,
        product_url: p.product_url,
        category: p.category,
        subcategory: p.subcategory,
        gender: p.gender,
        description: p.description,
        rating: p.rating
      };

      toggleFavorite(productObj);

      const nowFav = getFavorites().some(f => Number(f.id) === id);
      favIcon.classList.toggle("active", nowFav);
      updateFavoriteCount();
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

  const cleanPrice = (v) =>
    parseFloat(String(v).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

  const cleanRating = (v) =>
    parseFloat(String(v).replace(",", ".").replace(/[^0-9.]/g, "")) || 0;

  const val = sortSelect.value;

  switch (val) {
    case "price-asc":
      sorted.sort((a, b) => cleanPrice(a.price) - cleanPrice(b.price));
      break;

    case "price-desc":
      sorted.sort((a, b) => cleanPrice(b.price) - cleanPrice(a.price));
      break;

    case "rating-desc":
      sorted.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
      break;

    default:
      sorted = [...filtered];
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
