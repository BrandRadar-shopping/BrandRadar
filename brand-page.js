// ======================================================
// ✅ BrandRadar – Brand Page
// Bruker Product Card Engine + Offers Engine
// + Affiliate feed products support
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const t = window.BrandRadarLang?.t || ((key, fallback) => fallback || key);

  const brandName = new URLSearchParams(window.location.search).get("brand");
  if (!brandName) return;

  function normalizeBrand(value) {
    return String(value || "").trim().toLowerCase();
  }

  function cleanPrice(v) {
    return parseFloat(String(v ?? "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  }

  function cleanRating(v) {
    return parseFloat(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
  }

  function getEffectivePrice(p) {
    if (p?.offer_summary?.hasOffers) {
      return Number(p.offer_summary.lowestPrice);
    }
    return cleanPrice(p.price);
  }

  function getProductTitle(p) {
    return p.title || p.product_name || p.name || t("unnamed_product", "Uten navn");
  }

  const MAIN_BRAND_URL =
    "https://opensheet.elk.sh/1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw/Ark 1";

  const MAIN_PRODUCTS_URL =
    "https://opensheet.elk.sh/1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw/BrandRadarProdukter";

  const LUXURY_BRAND_URL =
    "https://opensheet.elk.sh/1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU/LuxuryBrands";

  const LUXURY_PRODUCTS_URL =
    "https://opensheet.elk.sh/1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU/LuxuryProducts";

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

  function getFavBrands() {
    return JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
  }

  function updateFavUI() {
    if (!favBtn) return;

    const isFav = getFavBrands().includes(brandName);

    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav
      ? "♥ I dine favoritter"
      : "♡ Favoritt-brand";
  }

  function toggleFavBrand() {
    let favs = getFavBrands();

    if (favs.includes(brandName)) {
      favs = favs.filter((b) => b !== brandName);
    } else {
      favs.push(brandName);
    }

    localStorage.setItem("favoriteBrands", JSON.stringify(favs));
    updateFavUI();

    if (window.updateFavoriteCounter) {
      window.updateFavoriteCounter();
    }
  }

  favBtn?.addEventListener("click", toggleFavBrand);

  const [mainBrands, luxuryBrands, mainProducts, luxuryProducts, feedProducts] =
    await Promise.all([
      fetch(MAIN_BRAND_URL).then((r) => r.json()).catch(() => []),
      fetch(LUXURY_BRAND_URL).then((r) => r.json()).catch(() => []),
      fetch(MAIN_PRODUCTS_URL).then((r) => r.json()).catch(() => []),
      fetch(LUXURY_PRODUCTS_URL).then((r) => r.json()).catch(() => []),
      window.BrandRadarFeedEngine
        ? window.BrandRadarFeedEngine.loadAllFeeds({ onlyInStock: true }).catch((err) => {
            console.warn("⚠️ Could not load feed products on brand page:", err);
            return [];
          })
        : Promise.resolve([])
    ]);

  const allBrands = [...mainBrands, ...luxuryBrands];

  const brand = allBrands.find(
    (b) => normalizeBrand(b.brand) === normalizeBrand(brandName)
  );

  const isLuxury = luxuryBrands.some(
    (b) => normalizeBrand(b.brand) === normalizeBrand(brandName)
  );

  const normalizedFeedProducts = feedProducts.map((p) => ({
    ...p,
    id: String(p.id || p.product_id || "").trim(),
    title: getProductTitle(p),
    brand: String(p.brand || "").trim(),
    image_url: String(p.image_url || "").trim(),
    price: p.price || "",
    product_url: String(p.product_url || p.affiliate_url || "").trim(),
    category: p.category || p.mapped_category || "Selfcare",
    subcategory: p.subcategory || "",
    rating: p.rating || "",
    is_feed_product: true,
    sheet_source: "affiliate_feed"
  }));

  const allProducts = [
    ...mainProducts,
    ...luxuryProducts,
    ...normalizedFeedProducts
  ];

  let brandProducts = allProducts.filter(
    (p) => normalizeBrand(p.brand) === normalizeBrand(brandName)
  );

  const isFeedBrand = normalizedFeedProducts.some(
    (p) => normalizeBrand(p.brand) === normalizeBrand(brandName)
  );

  if (titleEl) {
    titleEl.textContent = brand?.brand || brandName;
  }

  if (descEl) {
    descEl.textContent =
      brand?.about ||
      brand?.description ||
      (isFeedBrand
        ? `${brandName} produkter fra Staybeautiful Norge.`
        : t("no_brand_info", "Ingen informasjon tilgjengelig."));
  }

  if (logoEl) {
    const logo = brand?.logo || brand?.image_url || "";

    if (logo) {
      logoEl.src = logo;
      logoEl.style.display = "";
    } else {
      logoEl.style.display = "none";
    }

    if (
      isLuxury &&
      logoEl.parentElement &&
      !logoEl.parentElement.querySelector(".luxury-badge-under")
    ) {
      const badge = document.createElement("div");
      badge.className = "luxury-badge-under";
      badge.textContent = "Luxury Brand ✨";
      logoEl.parentElement.appendChild(badge);
    }
  }

  if (siteBtn) {
    const firstFeedProduct = brandProducts.find((p) => p.product_url);
    siteBtn.href =
      brand?.homepage_url ||
      brand?.link ||
      firstFeedProduct?.product_url ||
      "#";
  }

  updateFavUI();

  if (window.BrandRadarOffersEngine) {
    await window.BrandRadarOffersEngine.init?.();
    brandProducts =
      await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(
        brandProducts
      );
  }

  if (categorySelect) {
    const categories = [
      ...new Set(
        brandProducts
          .map((p) => (p.category || p.mapped_category || "").trim())
          .filter(Boolean)
      )
    ].sort();

    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  if (!brandProducts.length) {
    if (emptyMsg) {
      emptyMsg.style.display = "block";
      emptyMsg.textContent = t("no_products_found", "Ingen produkter funnet.");
    }
    if (resultCount) resultCount.textContent = "0 produkter";
    return;
  }

  applyFiltersAndSort();

  function applyFiltersAndSort() {
    let list = [...brandProducts];

    if (categorySelect && categorySelect.value !== "all") {
      list = list.filter(
        (p) =>
          (p.category || p.mapped_category || "").trim() ===
          categorySelect.value
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

  function renderProducts(list) {
    if (!grid) return;

    grid.innerHTML = "";

    if (!list.length) {
      if (emptyMsg) emptyMsg.style.display = "block";
      if (resultCount) resultCount.textContent = "0 produkter";
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";
    if (resultCount) {
      resultCount.textContent = `${list.length} ${t("products", "produkter")}`;
    }

    list.forEach((product) => {
      const card = window.BrandRadarProductCardEngine.createCard(product, {
        isLuxury,
        showBrand: true,
        showRating: true,
        enableFavorite: true,
        onNavigate: (p) => {
          const id = p.id || p.product_id;
          if (id) {
            window.location.href = `product.html?id=${encodeURIComponent(id)}`;
          }
        },
        favoriteProductFactory: (p) => ({
          id: p.id || p.product_id,
          title: p.title || p.product_name || p.name || t("unnamed_product", "Uten navn"),
          product_name: p.title || p.product_name || p.name || t("unnamed_product", "Uten navn"),
          brand: p.brand || "",
          price: p.price,
          discount: p.discount || "",
          image_url: p.image_url || "",
          product_url: p.product_url || p.affiliate_url || p.link || "",
          category: p.category || p.mapped_category || "",
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
