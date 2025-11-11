// ======================================================
// ✅ BrandRadar – Brand Page (vanlig + Luxury)
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const brandName = new URLSearchParams(window.location.search).get("brand");
  if (!brandName) return;

  // --- Google Sheets Sources
  const MAIN_BRAND_URL =
    "https://opensheet.elk.sh/1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw/Ark 1";
  const MAIN_PRODUCTS_URL =
    "https://opensheet.elk.sh/1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw/BrandRadarProdukter";

  const LUXURY_BRAND_URL =
    "https://opensheet.elk.sh/1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU/LuxuryBrands";
  const LUXURY_PRODUCTS_URL =
    "https://opensheet.elk.sh/1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU/LuxuryProducts";

  // --- DOM refs
  const titleEl = document.getElementById("brand-title");
  const descEl = document.getElementById("brand-description");
  const logoEl = document.getElementById("brand-logo");
  const siteBtn = document.getElementById("brand-site-btn");
  const favBtn = document.getElementById("favorite-brand-btn");
  const grid = document.querySelector(".product-grid");
  const emptyMsg = document.querySelector(".empty-message");
  const resultCount = document.querySelector(".result-count");
  const categorySelect = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");

  // --- Favorites logic
  function getFavBrands() {
    return JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
  }
  function toggleFavBrand() {
    let favs = getFavBrands();
    if (favs.includes(brandName)) favs = favs.filter(b => b !== brandName);
    else favs.push(brandName);
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

  // --- Fetch both normal + luxury brand data
  const [mainBrands, luxuryBrands] = await Promise.all([
    fetch(MAIN_BRAND_URL).then(r => r.json()).catch(() => []),
    fetch(LUXURY_BRAND_URL).then(r => r.json()).catch(() => [])
  ]);

  const allBrands = [...mainBrands, ...luxuryBrands];
  const brand = allBrands.find(
    b => b.brand?.toLowerCase().trim() === brandName.toLowerCase()
  );

  const isLuxury = luxuryBrands.some(
    b => b.brand?.toLowerCase().trim() === brandName.toLowerCase()
  );

  if (brand) {
    if (titleEl) titleEl.textContent = brand.brand || brandName;
    if (descEl)
      descEl.textContent =
        brand.about || brand.description || "Ingen informasjon tilgjengelig.";
    if (logoEl) logoEl.src = brand.logo || brand.image_url || "";
    if (siteBtn) siteBtn.href = brand.homepage_url || brand.link || "#";
  }

  updateFavUI();

  // --- Fetch both normal + luxury products
  const [mainProducts, luxuryProducts] = await Promise.all([
    fetch(MAIN_PRODUCTS_URL).then(r => r.json()).catch(() => []),
    fetch(LUXURY_PRODUCTS_URL).then(r => r.json()).catch(() => [])
  ]);

  const allProducts = [...mainProducts, ...luxuryProducts];
  let brandProducts = allProducts.filter(
    p => p.brand && p.brand.toLowerCase().trim() === brandName.toLowerCase().trim()
  );

  if (!brandProducts.length) {
    emptyMsg.style.display = "block";
    resultCount.textContent = "0 produkter";
  } else {
    applyFiltersAndSort();
  }

   // --- Helpers
  const cleanPrice = v =>
    parseFloat(String(v).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  const cleanRating = v =>
    parseFloat(String(v).replace(",", ".").replace(/[^0-9.]/g, "")) || 0;

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
      }
    }
    renderProducts(list);
  }

  // --- Render products
  function renderProducts(list) {
    grid.innerHTML = "";
    if (!list.length) {
      emptyMsg.style.display = "block";
      resultCount.textContent = "0 produkter";
      return;
    }

    emptyMsg.style.display = "none";
    resultCount.textContent = `${list.length} produkter`;

    list.forEach(p => {
      const id = p.id || p.product_id || Math.floor(Math.random() * 100000);
      const ratingNum = cleanRating(p.rating);
      const rating = ratingNum ? ratingNum.toFixed(1) : null;

      const img = p.image_url || p.image || p.img || "";
      const name = p.title || p.product_name || p.name || "Uten navn";

      if (!img) {
        console.warn("⚠️ Produkt uten bilde hoppet over:", name);
        return;
      }

      const isLuxuryProd = isLuxury || p.sheet_source === "luxury";
      const luxuryParam = isLuxuryProd ? "&luxury=true" : "";

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${img}" alt="${name}">
        <div class="product-info">
          <h3>${name}</h3>
          ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
          <p class="price">${p.price ? `${p.price} kr` : ""}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.href = \`product.html?id=\${id}\${luxuryParam}\`;
      });

      grid.appendChild(card);
    });
  }

  categorySelect?.addEventListener("change", applyFiltersAndSort);
  sortSelect?.addEventListener("change", applyFiltersAndSort);
});




