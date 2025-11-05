// ======================================================
// ✅ BrandRadar – Brand Page (Clean Final Version)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const brandName = new URLSearchParams(window.location.search).get("brand");
  if (!brandName) return;

  // Sheets
  const brandInfoUrl = "https://opensheet.elk.sh/1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw/Ark 1";
  const productUrl   = "https://opensheet.elk.sh/1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw/BrandRadarProdukter";

  // DOM
  const titleEl = document.getElementById("brand-title");
  const descEl  = document.getElementById("brand-description");
  const logoEl  = document.getElementById("brand-logo");
  const siteBtn = document.getElementById("brand-site-btn");
  const favBtn  = document.getElementById("favorite-brand-btn");

  const grid = document.querySelector(".product-grid");
  const emptyMsg = document.querySelector(".empty-message");
  const resultCount = document.querySelector(".result-count");
  const categorySelect = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");

  // --- Favorite Brand (localStorage)
  function getFavBrands() {
    return JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
  }
  function toggleFavBrand() {
    let favs = getFavBrands();
    if (favs.includes(brandName)) {
      favs = favs.filter(b => b !== brandName);
    } else {
      favs.push(brandName);
    }
    localStorage.setItem("favoriteBrands", JSON.stringify(favs));
    updateFavUI();
    updateFavoriteCount?.();
  }
  function updateFavUI() {
    if (!favBtn) return;
    const isFav = getFavBrands().includes(brandName);
    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav ? "♥ I dine favoritter" : "♡ Favoritt-brand";
  }
  favBtn?.addEventListener("click", toggleFavBrand);

  // --- Fetch brand info
  fetch(brandInfoUrl)
    .then(r => r.json())
    .then(rows => {
      const brand = rows.find(
        b => b.brand?.toLowerCase().trim() === brandName.toLowerCase()
      );
      if (!brand) return;

      if (titleEl) titleEl.textContent = brand.brand || brandName;
      if (descEl)  descEl.textContent  = brand.about || "Ingen informasjon tilgjengelig.";
      if (logoEl)  logoEl.src          = brand.logo || "";
      if (siteBtn) siteBtn.href        = brand.homepage_url || "#";

      // Populate category filter (optional)
      if (brand.categories && categorySelect) {
        brand.categories
          .split(",")
          .map(c => c.trim())
          .filter(Boolean)
          .forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
          });
      }

      updateFavUI();
    })
    .catch(() => { /* ignore */ });

  // --- Fetch products
  let brandProducts = [];

  fetch(productUrl)
    .then(r => r.json())
    .then(products => {
      brandProducts = products.filter(
        p => p.brand && p.brand.toLowerCase().trim() === brandName.toLowerCase().trim()
      );

      if (!brandProducts.length) {
        if (emptyMsg) emptyMsg.style.display = "block";
        if (resultCount) resultCount.textContent = "0 produkter";
        return;
      }

      applyFiltersAndSort();
      updateFavoriteCount?.();
    })
    .catch(() => {
      if (emptyMsg) emptyMsg.style.display = "block";
    });

  // --- Helpers for sorting
  const cleanPrice  = v => parseFloat(String(v).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  const cleanRating = v => parseFloat(String(v).replace(",", ".").replace(/[^0-9.]/g, "")) || 0;

  // --- Filter + sort pipeline
  function applyFiltersAndSort() {
    let list = [...brandProducts];

    if (categorySelect && categorySelect.value !== "all") {
      list = list.filter(p => (p.category || "").trim() === categorySelect.value);
    }

    if (sortSelect) {
      switch (sortSelect.value) {
        case "price-asc":
          list.sort((a, b) => cleanPrice(a.price) - cleanPrice(b.price));
          break;
        case "price-desc":
          list.sort((a, b) => cleanPrice(b.price) - cleanPrice(a.price));
          break;
        case "rating-desc":
          list.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
          break;
        // "featured" or default: no sort
      }
    }

    renderProducts(list);
  }

  // --- Render product cards
  function renderProducts(list) {
    if (!grid) return;
    grid.innerHTML = "";

    if (!list.length) {
      if (emptyMsg) emptyMsg.style.display = "block";
      if (resultCount) resultCount.textContent = "0 produkter";
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";
    if (resultCount) resultCount.textContent = `${list.length} produkter`;

    list.forEach(p => {
      const id = p.id;
      const ratingNum = cleanRating(p.rating);
      const rating = ratingNum ? ratingNum.toFixed(1) : null;

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image_url}" alt="${p.title}">
        <div class="product-info">
          <h3>${p.title}</h3>
          ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
          <p class="price">${p.price ? `${p.price} kr` : ""}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.href = `product.html?id=${id}`;
      });

      grid.appendChild(card);
    });
  }

  // Listeners
  categorySelect?.addEventListener("change", applyFiltersAndSort);
  sortSelect?.addEventListener("change", applyFiltersAndSort);

  updateFavUI();
});




