// ======================================================
// ✅ BrandRadar – Category Page FINAL
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_PRODUCTS = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_MAPPING = "1e3tvfatBmnwDVs5nuR-OvSaQl0lIF-JUhuQtfvACo3g";
  const productUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/BrandRadarProdukter`;
  const mappingUrl = `https://opensheet.elk.sh/${SHEET_MAPPING}/CategoryMapping`;

  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");
  const breadcrumbEl = document.querySelector(".breadcrumb");
  const categoryProductsSection = document.querySelector(".category-products");

  const params = new URLSearchParams(window.location.search);
  const genderParam = params.get("gender");
  const categoryParam = params.get("category");
  const subParam = params.get("subcategory");

  if (!genderParam || !categoryParam) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  const normalize = txt =>
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
  if (genderSlug === "dame") genderSlug = "women";
  if (genderSlug === "barn") genderSlug = "kids";

  const subSlug = normalize(subParam);

  Promise.all([
    fetch(mappingUrl).then(r => r.json()),
    fetch(productUrl).then(r => r.json())
  ])
    .then(([mapRows, products]) => {
      const match = mapRows.find(row =>
        normalize(row.main_category) === categorySlug &&
        (!row.gender || normalize(row.gender) === genderSlug)
      );

      if (!match) {
        emptyMessage.style.display = "block";
        return;
      }

      const norskGender = genderSlug === "men" ? "Herre" :
                          genderSlug === "women" ? "Dame" :
                          genderSlug === "kids" ? "Barn" :
                          genderParam;

      let subNameNo = null;
      if (subSlug) {
        const subMatch = mapRows.find(row =>
          normalize(row.url_slug) === subSlug &&
          normalize(row.main_category) === categorySlug
        );
        if (subMatch) subNameNo = subMatch.display_name;
      }

      titleEl.textContent = subNameNo
        ? `${subNameNo} – ${norskGender}`
        : `${match.display_name} – ${norskGender}`;

      document.title = `${titleEl.textContent} | BrandRadar`;

      breadcrumbEl.innerHTML = `
        <a href="index.html">Hjem</a> ›
        <a href="category.html?gender=${genderParam}&category=${categoryParam}">
          ${norskGender}
        </a> ›
        ${subNameNo || match.display_name}
      `;

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

      function renderProducts(list) {
        productGrid.innerHTML = "";

        list.forEach(p => {
          const id = Number(p.id);
          const rating = p.rating
            ? parseFloat(String(p.rating).replace(",", ".").replace(/[^0-9.]/g, ""))
            : null;
          const isFav = getFavorites().some(f => Number(f.id) === id);

          const card = document.createElement("div");
          card.classList.add("product-card");

          card.innerHTML = `
            ${p.discount ? `<div class="discount-badge">${p.discount}%</div>` : ""}
            <div class="fav-icon ${isFav ? "active" : ""}">
              <svg viewBox="0 0 24 24" class="heart-icon">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2
                12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74
                0 3.41.81 4.5 2.09C13.09 3.81 14.76 3
                16.5 3 19.58 3 22 5.42 22 8.5c0
                3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
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

          card.addEventListener("click", e => {
            if (e.target.closest(".fav-icon")) return;
            window.location.href = `product.html?id=${id}`;
          });

          card.querySelector(".fav-icon").addEventListener("click", e => {
            e.stopPropagation();

            toggleFavorite(p);

            const nowFav = getFavorites().some(f => Number(f.id) === id);
            e.currentTarget.classList.toggle("active", nowFav);
            updateFavoriteCount();
          });

          productGrid.appendChild(card);
        });

        const resultEl = document.querySelector(".filter-bar .result-count");
if (resultEl) resultEl.textContent = `${list.length} produkter`;

      }

      
      const sortSelect = document.getElementById("sort-select");

      const cleanPrice = v =>
        parseFloat(String(v).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
      const cleanRating = v =>
        parseFloat(String(v).replace(",", ".").replace(/[^0-9.]/g, "")) || 0;

      sortSelect.addEventListener("change", () => {
        let sorted = [...filtered];

        switch (sortSelect.value) {
          case "price-asc":
            sorted.sort((a,b) => cleanPrice(a.price) - cleanPrice(b.price));
            break;
          case "price-desc":
            sorted.sort((a,b) => cleanPrice(b.price) - cleanPrice(a.price));
            break;
          case "rating-desc":
            sorted.sort((a,b) => cleanRating(b.rating) - cleanRating(a.rating));
            break;
        }

        renderProducts(sorted);
      });

      renderProducts(filtered);
      setTimeout(() => updateFavoriteCount?.(), 50);
    })
    .catch(err => console.error("❌ Category error:", err));
});
