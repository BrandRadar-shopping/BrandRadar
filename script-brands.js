// ======================================================
// ✅ BrandRadar – Brands Page
// Featured sponsor cards refined closer to approved mockup
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const BRANDS_SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const BRANDS_SHEET_NAME = "Ark 1";

  const PRODUCTS_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const PRODUCTS_SHEET_NAME = "BrandRadarProdukter";

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");

  if (!highlightGrid || !brandGrid) return;

  const forceHeartStyles = document.createElement("style");
  forceHeartStyles.textContent = `
    .brand-card { position: relative; }
    .brand-card .fav-icon.always-visible,
    .featured-brand-card .fav-icon.always-visible {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }
    .brand-card:hover .fav-icon.always-visible,
    .featured-brand-card:hover .fav-icon.always-visible {
      opacity: 1 !important;
    }
    .brand-card .fav-icon.always-visible .heart-icon,
    .featured-brand-card .fav-icon.always-visible .heart-icon {
      stroke: #222;
      fill: transparent;
      stroke-width: 1.4px;
      transition: .22s ease;
    }
    .brand-card .fav-icon.always-visible.active .heart-icon,
    .featured-brand-card .fav-icon.always-visible.active .heart-icon {
      fill: #ff1f3d;
      stroke: #ff1f3d;
    }
  `;
  document.head.appendChild(forceHeartStyles);

  function normalizeBrand(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cleanPrice(value) {
    const n = parseFloat(String(value ?? "").replace(/[^\d.,]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function formatPrice(value) {
    const n = cleanPrice(value);
    if (n == null) return "";
    return `${new Intl.NumberFormat("nb-NO").format(Math.round(n))} kr`;
  }

  function getProductTitle(product) {
    return product.title || product.product_name || product.name || "Produkt";
  }

  function getProductLink(product) {
    const id = String(product.id || product.product_id || "").trim();
    if (id) return `product.html?id=${encodeURIComponent(id)}`;
    if (product.product_url) return product.product_url;
    return "#";
  }

  function getHeroProduct(products = []) {
    if (!products.length) return null;

    const byPriority = [...products].sort((a, b) => {
      const ad = cleanPrice(a.discount) || 0;
      const bd = cleanPrice(b.discount) || 0;
      if (bd !== ad) return bd - ad;

      const ar = parseFloat(String(a.rating || "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
      const br = parseFloat(String(b.rating || "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
      if (br !== ar) return br - ar;

      return 0;
    });

    return byPriority[0];
  }

  function getThumbProducts(products = [], heroProduct) {
    const unique = [];
    const seen = new Set();

    products.forEach((p) => {
      const key = String(p.id || p.product_id || p.product_url || getProductTitle(p)).trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      unique.push(p);
    });

    const heroKey = heroProduct
      ? String(heroProduct.id || heroProduct.product_id || heroProduct.product_url || getProductTitle(heroProduct)).trim()
      : "";

    const ordered = heroProduct
      ? [heroProduct, ...unique.filter((p) => String(p.id || p.product_id || p.product_url || getProductTitle(p)).trim() !== heroKey)]
      : unique;

    return ordered.slice(0, 5);
  }

  function syncBrandHearts(brandKey, isActive) {
    document.querySelectorAll(".fav-icon[data-brand]").forEach((el) => {
      if (String(el.dataset.brand || "").trim() === brandKey) {
        el.classList.toggle("active", isActive);
      }
    });
  }

  function buildSponsorIntro(brandObj) {
    if (brandObj.about) return brandObj.about;
    if (brandObj.description) return brandObj.description;

    return `${brandObj.brand} er valgt ut som fremhevet brand akkurat nå. Utforsk utvalgte produkter og få en rask oversikt over hva som gjør brandet interessant akkurat nå.`;
  }

  function getBrandThemeColor(brandName) {
    const brandColors = {
      nike: "#f3f1ed",
      adidas: "#f1f1f1",
      puma: "#f5efe6",
      "new balance": "#eef2f6",
      "the north face": "#f6f3ee",
      salomon: "#eef3f1",
      arcteryx: "#f1f0ec",
      "arc'teryx": "#f1f0ec",
      zara: "#f5f2eb",
      gucci: "#f6f1ea",
      moncler: "#f3f4f6",
      rolex: "#f2f3ed",
      "star nutrition": "#f3f6fb",
      gymgrossisten: "#f2f5f8"
    };

    return brandColors[normalizeBrand(brandName)] || "#f3f1ed";
  }

  function createRegularBrandCard(brandObj, isFav) {
    const brandKey = String(brandObj.brand || "").trim();

    const card = document.createElement("div");
    card.className = "brand-card";

    card.innerHTML = `
      <span class="fav-icon always-visible ${isFav ? "active" : ""}" data-brand="${escapeHtml(brandKey)}">
        <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
        </svg>
      </span>

      <img src="${escapeHtml(brandObj.logo || "")}" alt="${escapeHtml(brandKey)}" class="brand-logo">
      <h3>${escapeHtml(brandKey)}</h3>
      <p>${escapeHtml(brandObj.description || "")}</p>
      <a class="brand-btn">Se produkter →</a>
    `;

    card.querySelector(".brand-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brandKey)}`;
    });

    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-icon")) return;
      if (e.target.closest(".brand-btn")) return;
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brandKey)}`;
    });

    const heart = card.querySelector(".fav-icon");
    heart?.addEventListener("click", (e) => {
      e.stopPropagation();

      if (window.toggleBrandFavorite) {
        window.toggleBrandFavorite(brandKey);
      }

      const updatedFavs = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
      const isNowFav = updatedFavs.includes(brandKey);

      syncBrandHearts(brandKey, isNowFav);

      if (window.updateFavoriteCounter) {
        window.updateFavoriteCounter();
      }
    });

    return card;
  }

  function createFeaturedBrandCard(brandObj, allBrandProducts, isFav) {
    const brandKey = String(brandObj.brand || "").trim();
    const intro = buildSponsorIntro(brandObj);
    const heroProduct = getHeroProduct(allBrandProducts);
    const thumbProducts = getThumbProducts(allBrandProducts, heroProduct);
    const bgColor = getBrandThemeColor(brandObj.brand);

    const heroImage = heroProduct?.image_url || brandObj.logo || "";
    const heroTitle = heroProduct ? getProductTitle(heroProduct) : brandKey;
    const heroPrice = heroProduct ? formatPrice(heroProduct.price) : "";
    const heroLink = heroProduct ? getProductLink(heroProduct) : `brand-page.html?brand=${encodeURIComponent(brandKey)}`;

    const card = document.createElement("article");
    card.className = "featured-brand-card";

    card.innerHTML = `
      <div class="featured-brand-card__shell" style="--brand-bg:${escapeHtml(bgColor)};">
        <button class="fav-icon always-visible ${isFav ? "active" : ""}" data-brand="${escapeHtml(brandKey)}" aria-label="Favoritt-brand">
          <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
          </svg>
        </button>

        <div class="featured-brand-card__rail">
          <div class="featured-brand-card__brandhead">
            <div class="featured-brand-card__logo-wrap">
              <img src="${escapeHtml(brandObj.logo || "")}" alt="${escapeHtml(brandKey)}" class="featured-brand-card__logo">
            </div>
            <span class="featured-brand-card__tag">Sponset</span>
          </div>

          <div class="featured-brand-card__top">
            <div class="featured-brand-card__intro">
              <div class="featured-brand-card__eyebrow">Fremhevet brand</div>
              <h3 class="featured-brand-card__title">${escapeHtml(brandKey)}</h3>
              <p class="featured-brand-card__copy">${escapeHtml(intro)}</p>

              <a class="featured-brand-card__cta" href="brand-page.html?brand=${encodeURIComponent(brandKey)}">
                Se alle ${escapeHtml(brandKey)}-produkter
              </a>
            </div>

            <a class="featured-brand-card__hero" href="${escapeHtml(heroLink)}">
              <div class="featured-brand-card__hero-stage">
                <img
                  src="${escapeHtml(heroImage)}"
                  alt="${escapeHtml(heroTitle)}"
                  class="featured-brand-card__hero-image"
                  data-hero-image
                >
              </div>

              <div class="featured-brand-card__hero-caption">
                <div class="featured-brand-card__hero-name" data-hero-title>${escapeHtml(heroTitle)}</div>
                <div class="featured-brand-card__hero-price" data-hero-price>${escapeHtml(heroPrice)}</div>
              </div>
            </a>
          </div>

          <div class="featured-brand-card__thumbs">
            ${thumbProducts.map((product, index) => `
              <button
                type="button"
                class="featured-brand-card__thumb ${index === 0 ? "is-active" : ""}"
                data-thumb-image="${escapeHtml(product.image_url || "")}"
                data-thumb-title="${escapeHtml(getProductTitle(product))}"
                data-thumb-price="${escapeHtml(formatPrice(product.price))}"
                data-thumb-link="${escapeHtml(getProductLink(product))}"
                aria-label="${escapeHtml(getProductTitle(product))}"
              >
                <img src="${escapeHtml(product.image_url || "")}" alt="${escapeHtml(getProductTitle(product))}">
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    const heroLinkEl = card.querySelector(".featured-brand-card__hero");
    const heroImageEl = card.querySelector("[data-hero-image]");
    const heroTitleEl = card.querySelector("[data-hero-title]");
    const heroPriceEl = card.querySelector("[data-hero-price]");
    const thumbs = card.querySelectorAll(".featured-brand-card__thumb");

    function setActiveThumb(btn) {
      thumbs.forEach((thumb) => thumb.classList.remove("is-active"));
      btn.classList.add("is-active");

      const nextImage = btn.dataset.thumbImage || "";
      const nextTitle = btn.dataset.thumbTitle || "";
      const nextPrice = btn.dataset.thumbPrice || "";
      const nextLink = btn.dataset.thumbLink || "#";

      if (heroImageEl) heroImageEl.src = nextImage;
      if (heroImageEl) heroImageEl.alt = nextTitle;
      if (heroTitleEl) heroTitleEl.textContent = nextTitle;
      if (heroPriceEl) heroPriceEl.textContent = nextPrice;
      if (heroLinkEl) heroLinkEl.href = nextLink;
    }

    thumbs.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        if (window.matchMedia("(hover: hover)").matches) {
          setActiveThumb(btn);
        }
      });
      btn.addEventListener("focus", () => setActiveThumb(btn));
      btn.addEventListener("click", () => setActiveThumb(btn));
    });

    const heart = card.querySelector(".fav-icon");
    heart?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (window.toggleBrandFavorite) {
        window.toggleBrandFavorite(brandKey);
      }

      const updatedFavs = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
      const isNowFav = updatedFavs.includes(brandKey);

      syncBrandHearts(brandKey, isNowFav);

      if (window.updateFavoriteCounter) {
        window.updateFavoriteCounter();
      }
    });

    return card;
  }

  function initAlphabetFilter(allBrands, allProducts) {
    document.querySelectorAll(".brand-alphabet span").forEach((letterEl) => {
      letterEl.addEventListener("click", () => {
        document.querySelectorAll(".brand-alphabet span").forEach((x) => x.classList.remove("active"));
        letterEl.classList.add("active");

        const letter = letterEl.dataset.letter;
        const filtered =
          letter === "all"
            ? allBrands
            : allBrands.filter((b) =>
                b.brand.toUpperCase().startsWith(letterEl.textContent.trim().toUpperCase())
              );

        renderBrands(filtered, allProducts);
      });
    });
  }

  function renderBrands(brands, allProducts) {
    highlightGrid.innerHTML = "";
    brandGrid.innerHTML = "";

    const favList = window.getFavoriteBrands ? window.getFavoriteBrands() : [];

    const highlightedBrands = brands.filter((b) => b.highlight);
    const regularBrands = brands;

    highlightedBrands.forEach((brandObj) => {
      const brandKey = String(brandObj.brand || "").trim();
      const isFav = favList.includes(brandKey);

      const relatedProducts = allProducts.filter(
        (p) => normalizeBrand(p.brand) === normalizeBrand(brandObj.brand)
      );

      const featuredCard = createFeaturedBrandCard(brandObj, relatedProducts, isFav);
      highlightGrid.appendChild(featuredCard);
    });

    regularBrands.forEach((brandObj) => {
      const brandKey = String(brandObj.brand || "").trim();
      const isFav = favList.includes(brandKey);
      const card = createRegularBrandCard(brandObj, isFav);
      brandGrid.appendChild(card);
    });
  }

  try {
    const brandsUrl = `https://opensheet.elk.sh/${BRANDS_SHEET_ID}/${BRANDS_SHEET_NAME}`;
    const productsUrl = `https://opensheet.elk.sh/${PRODUCTS_SHEET_ID}/${PRODUCTS_SHEET_NAME}`;

    const [brandRows, productRows] = await Promise.all([
      fetch(brandsUrl).then((res) => res.json()),
      fetch(productsUrl).then((res) => res.json())
    ]);

    const brands = brandRows
      .map((r) => ({
        brand: String(r.brand || "").trim(),
        logo: String(r.logo || "").trim(),
        description: String(r.description || "").trim(),
        homepage: String(r.homepage_url || "").trim() || "#",
        about: String(r.about || "").trim(),
        highlight: String(r.highlight || "").toLowerCase() === "yes",
        categories: r.categories ? String(r.categories).split(",").map((c) => c.trim()) : []
      }))
      .filter((b) => b.brand);

    const products = productRows
      .map((p) => ({
        ...p,
        id: String(p.id || p.product_id || "").trim(),
        title: getProductTitle(p),
        brand: String(p.brand || "").trim(),
        image_url: String(p.image_url || "").trim(),
        price: p.price || "",
        product_url: String(p.product_url || "").trim()
      }))
      .filter((p) => p.brand && p.image_url);

    localStorage.setItem("allBrandsData", JSON.stringify(brands));

    initAlphabetFilter(brands, products);
    renderBrands(brands, products);

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const search = String(e.target.value || "").toLowerCase().trim();

        const filtered = !search
          ? brands
          : brands.filter((b) => b.brand.toLowerCase().includes(search));

        renderBrands(filtered, products);
      });
    }
  } catch (err) {
    console.error("❌ FEIL ved lasting av brands/products:", err);
  }
});
