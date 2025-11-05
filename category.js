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

  const brandFilter = document.getElementById("brand-filter");
  const priceFilter = document.getElementById("price-filter");
  const discountFilter = document.getElementById("discount-filter");
  const sortSelect = document.getElementById("sort-select");

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

      const norskGender =
        genderSlug === "men" ? "Herre" :
        genderSlug === "women" ? "Dame" :
        genderSlug === "kids" ? "Barn" : genderParam;

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
      
      // ✅ Populate brand dropdown
      const brandSet = [...new Set(filtered.map(p => p.brand).filter(Boolean))].sort();
      brandSet.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        brandFilter.appendChild(opt);
      });

      function applyFiltersAndSort() {
        let result = [...filtered];

        const getPrice = v =>
          parseFloat(String(v).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        const getRating = v =>
          parseFloat(String(v).replace(",", ".").replace(/[^0-9.]/g, "")) || 0;

        // ✅ Filters
        if (brandFilter.value !== "all")
          result = result.filter(p => p.brand === brandFilter.value);

        if (priceFilter.value !== "all") {
          if (priceFilter.value === "1000+")
            result = result.filter(p => getPrice(p.price) >= 1000);
          else {
            const [min, max] = priceFilter.value.split("-").map(Number);
            result = result.filter(p => {
              const price = getPrice(p.price);
              return price >= min && price <= max;
            });
          }
        }

        if (discountFilter.checked)
          result = result.filter(p => parseFloat(p.discount) > 0);

        // ✅ Sortering
        switch (sortSelect.value) {
          case "price-asc":
            result.sort((a,b) => getPrice(a.price) - getPrice(b.price));
            break;
          case "price-desc":
            result.sort((a,b) => getPrice(b.price) - getPrice(a.price));
            break;
          case "rating-desc":
            result.sort((a,b) => getRating(b.rating) - getRating(a.rating));
            break;
        }

        renderProducts(result);
      }

      function renderProducts(list) {
        productGrid.innerHTML = "";

        list.forEach(p => {
          const id = Number(p.id);
          const rating = p.rating
            ? parseFloat(String(p.rating).replace(",", ".").replace(/[^0-9.]/g, "")) : null;
          const isFav = getFavorites().some(f => Number(f.id) === id);

          const card = document.createElement("div");
          card.classList.add("product-card");

          card.innerHTML = `
            ${p.discount ? `<div class="discount-badge">${p.discount}%</div>` : ""}
            <div class="fav-icon ${isFav ? "active" : ""}">
              ❤️
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
            if (!e.target.closest(".fav-icon"))
              window.location.href = `product.html?id=${id}`;
          });

          card.querySelector(".fav-icon").addEventListener("click", e => {
            e.stopPropagation();
            toggleFavorite(p);
            e.currentTarget.classList.toggle("active");
            updateFavoriteCount();
          });

          productGrid.appendChild(card);
        });

        const resultEl = document.querySelector(".filter-bar .result-count");
        if (resultEl) resultEl.textContent = `${list.length} produkter`;
      }

      // ✅ Event listeners
      brandFilter.addEventListener("change", applyFiltersAndSort);
      priceFilter.addEventListener("change", applyFiltersAndSort);
      discountFilter.addEventListener("change", applyFiltersAndSort);
      sortSelect.addEventListener("change", applyFiltersAndSort);

      applyFiltersAndSort();
      setTimeout(() => updateFavoriteCount?.(), 50);
    })
    .catch(err => console.error("❌ Category error:", err));
});
