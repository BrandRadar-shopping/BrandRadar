// ======================================================
// ✅ BrandRadar – Brand Page
// Bruker Product Card Engine + Offers Engine
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const brandName = new URLSearchParams(window.location.search).get("brand");
  if (!brandName) return;

  // --- Helpers
  const cleanPrice = v =>
    parseFloat(String(v ?? "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

  const cleanRating = v =>
    parseFloat(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;

  const getEffectivePrice = p => {
    if (p?.offer_summary?.hasOffers) {
      return Number(p.offer_summary.lowestPrice);
    }
    return cleanPrice(p.price);
  };

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

  // --- Favoritter (brands)
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
  }

  function updateFavUI() {
    if (!favBtn) return;

    const isFav = getFavBrands().includes(brandName);

    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav
      ? "♥ I dine favoritter"
      : "♡ Favoritt-brand";
  }

  favBtn?.addEventListener("click", toggleFavBrand);

  // --- Hent brands
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

  // --- Sett brandinfo
  if (brand) {
    if (titleEl) {
      titleEl.textContent = brand.brand || brandName;
    }

    if (descEl) {
      descEl.textContent =
        brand.about ||
        brand.description ||
        "Ingen informasjon tilgjengelig.";
    }

    if (logoEl) {
      logoEl.src = brand.logo || brand.image_url || "";

      if (isLuxury && logoEl.parentElement && !logoEl.parentElement.querySelector(".luxury-badge-under")) {
        const badge = document.createElement("div");
        badge.className = "luxury-badge-under";
        badge.textContent = "Luxury Brand ✨";
        logoEl.parentElement.appendChild(badge);
      }
    }

    if (siteBtn) {
      siteBtn.href = brand.homepage_url || brand.link || "#";
    }
  }

  updateFavUI();

  // --- Hent produkter
  const [mainProducts, luxuryProducts] = await Promise.all([
    fetch(MAIN_PRODUCTS_URL).then(r => r.json()).catch(() => []),
    fetch(LUXURY_PRODUCTS_URL).then(r => r.json()).catch(() => [])
  ]);

  const allProducts = [...mainProducts, ...luxuryProducts];

  let brandProducts = allProducts.filter(
    p =>
      p.brand &&
      p.brand.toLowerCase().trim() === brandName.toLowerCase().trim()
  );

  // --- Enrich med offers
  if (window.BrandRadarOffersEngine) {
    await window.BrandRadarOffersEngine.init();
    brandProducts =
      await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(
        brandProducts
      );
  }

  // --- Fyll kategori-filter
  if (categorySelect) {
    const categories = [...new Set(brandProducts.map(p => (p.category || "").trim()).filter(Boolean))].sort();

    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  if (!brandProducts.length) {
    if (emptyMsg) emptyMsg.style.display = "block";
    if (resultCount) resultCount.textContent = "0 produkter";
  } else {
    applyFiltersAndSort();
  }

  // --------------------------------------------------
  // ⭐ FILTER + SORT
  // --------------------------------------------------

  function applyFiltersAndSort() {
    let list = [...brandProducts];

    if (categorySelect && categorySelect.value !== "all") {
      list = list.filter(
        p => (p.category || "").trim() === categorySelect.value
      );
    }

    if (sortSelect) {
      switch (sortSelect.value) {
        case "price-asc":
          list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
          break;

        case "price-desc":
          list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
          break;

        case "rating-desc":
          list.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
          break;
      }
    }

    renderProducts(list);
  }

  // --------------------------------------------------
  // ⭐ RENDER CARDS – via Product Card Engine
  // --------------------------------------------------

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

    list.forEach(product => {
      const card = window.BrandRadarProductCardEngine.createCard(product, {
        isLuxury,
        showBrand: false,
        showRating: true,
        enableFavorite: true,
        onNavigate: (p) => {
          const id = p.id || p.product_id;
          window.location.href = `product.html?id=${id}`;
        },
        favoriteProductFactory: (p) => ({
          id: p.id || p.product_id,
          title: p.title || p.product_name || p.name || "Uten navn",
          product_name: p.title || p.product_name || p.name || "Uten navn",
          brand: p.brand || "",
          price: p.price,
          discount: p.discount || "",
          image_url: p.image_url || "",
          product_url: p.product_url || p.link || "",
          category: p.category || "",
          rating: p.rating,
          luxury: !!isLuxury
        })
      });

      grid.appendChild(card);
    });
  }

  categorySelect?.addEventListener("change", applyFiltersAndSort);
  sortSelect?.addEventListener("change", applyFiltersAndSort);
});



