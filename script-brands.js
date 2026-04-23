// ======================================================
// ✅ BrandRadar – Brands Page
// Standard cards i "Alle brands"
// Premium sponsored cards i "Fremhevede brands" på desktop
// Mobil: trygg fallback til vanlige cards
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const BRAND_SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const BRAND_SHEET_NAME = "Ark 1";

  const PRODUCT_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const PRODUCT_SHEET_NAME = "BrandRadarProdukter";

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");
  const desktopFeaturedQuery = window.matchMedia("(min-width: 769px)");

  let allBrands = [];
  let allProducts = [];

  // ------------------------------------------------------
  // 🩶 Favoritt-ikonet skal alltid være synlig
  // ------------------------------------------------------
  const forceHeartStyles = document.createElement("style");
  forceHeartStyles.textContent = `
    .brand-card { position: relative; }
    .brand-card .fav-icon.always-visible {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }
    .brand-card:hover .fav-icon.always-visible { opacity: 1 !important; }
    .brand-card .fav-icon.always-visible .heart-icon {
      stroke: #222;
      fill: transparent;
      stroke-width: 1.4px;
      transition: .22s ease;
    }
    .brand-card .fav-icon.always-visible.active .heart-icon {
      fill: #ff1f3d;
      stroke: #ff1f3d;
    }
  `;
  document.head.appendChild(forceHeartStyles);

  function normalizeBrand(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/&/g, "and");
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
    const parsed = parseFloat(
      String(value ?? "").replace(/[^\d.,]/g, "").replace(",", ".")
    );
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatPrice(value) {
    const n = cleanPrice(value);
    if (!n) return "";
    return `${new Intl.NumberFormat("nb-NO").format(Math.round(n))} kr`;
  }

  function getProductTitle(product) {
    return (
      product.title ||
      product.product_name ||
      product.name ||
      "Uten navn"
    );
  }

  function getProductImage(product) {
    return (
      product.image_url ||
      product.image2 ||
      product.image3 ||
      product.image4 ||
      ""
    );
  }

  function getProductDestination(product) {
    const id = String(product.id || product.product_id || "").trim();
    if (id) {
      return `product.html?id=${encodeURIComponent(id)}`;
    }

    const external = String(product.product_url || "").trim();
    if (/^https?:\/\//i.test(external)) return external;

    return "#";
  }

  function getBrandIntro(brand) {
    return (
      brand.about ||
      brand.description ||
      `${brand.brand} er valgt ut som fremhevet brand akkurat nå. Utforsk utvalgte produkter og få en rask oversikt over hva som gjør brandet interessant akkurat nå.`
    );
  }

  function getPaletteForBrand(name) {
    const palettes = [
      {
        surface: "#fff8f1",
        surface2: "#f5eadc",
        line: "rgba(166,106,44,0.18)",
        accent: "#8f5a25",
        badge: "#8f5a25"
      },
      {
        surface: "#fffaf5",
        surface2: "#efe3d6",
        line: "rgba(146,97,61,0.18)",
        accent: "#8e5c3c",
        badge: "#8e5c3c"
      },
      {
        surface: "#fffaf7",
        surface2: "#f3e7de",
        line: "rgba(150,104,86,0.18)",
        accent: "#936552",
        badge: "#936552"
      },
      {
        surface: "#fffdf8",
        surface2: "#efe8d8",
        line: "rgba(143,118,68,0.18)",
        accent: "#8a7243",
        badge: "#8a7243"
      }
    ];

    let hash = 0;
    const text = String(name || "");
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return palettes[hash % palettes.length];
  }

  function getProductsForBrand(brandName) {
    const target = normalizeBrand(brandName);

    return allProducts
      .filter(p => normalizeBrand(p.brand) === target)
      .filter(p => getProductImage(p))
      .sort((a, b) => cleanPrice(b.price) - cleanPrice(a.price));
  }

  // ------------------------------------------------------
  // ✅ Sync hjerter for samme brand i hele DOM
  // ------------------------------------------------------
  function syncBrandHearts(brandKey, isActive) {
    document.querySelectorAll(".fav-icon[data-brand]").forEach(el => {
      if (String(el.dataset.brand || "").trim() === brandKey) {
        el.classList.toggle("active", isActive);
      }
    });
  }

  function toggleBrandFavoriteState(brandKey) {
    if (window.toggleBrandFavorite) window.toggleBrandFavorite(brandKey);

    const updatedFavs = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
    const isNowFav = updatedFavs.includes(brandKey);

    syncBrandHearts(brandKey, isNowFav);

    if (window.updateFavoriteCounter) window.updateFavoriteCounter();
  }

  // ------------------------------------------------------
  // 🧩 Standard kort for "Alle brands"
  // ------------------------------------------------------
  function createStandardBrandCard(brand, isFav) {
    const brandKey = String(brand.brand || "").trim();

    const card = document.createElement("div");
    card.classList.add("brand-card");

    card.innerHTML = `
      <span class="fav-icon always-visible ${isFav ? "active" : ""}" data-brand="${escapeHtml(brandKey)}">
        <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
        </svg>
      </span>

      <img src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brandKey)}" class="brand-logo">
      <h3>${escapeHtml(brandKey)}</h3>
      <p>${escapeHtml(brand.description || "")}</p>
      <a class="brand-btn">Se produkter →</a>
    `;

    card.querySelector(".brand-btn")?.addEventListener("click", e => {
      e.stopPropagation();
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brandKey)}`;
    });

    card.addEventListener("click", () => {
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brandKey)}`;
    });

    card.querySelector(".fav-icon")?.addEventListener("click", e => {
      e.stopPropagation();
      toggleBrandFavoriteState(brandKey);
    });

    return card;
  }

  // ------------------------------------------------------
  // 💎 Premium featured card for desktop
  // ------------------------------------------------------
  function createFeaturedPremiumCard(brand, isFav) {
    const brandKey = String(brand.brand || "").trim();
    const products = getProductsForBrand(brandKey).slice(0, 6);
    const heroProduct = products[0] || null;
    const thumbProducts = products.slice(0, 5);
    const palette = getPaletteForBrand(brandKey);

    const card = document.createElement("article");
    card.className = "brand-card brand-card--featured-premium";
    card.style.setProperty("--featured-surface", palette.surface);
    card.style.setProperty("--featured-surface-2", palette.surface2);
    card.style.setProperty("--featured-line", palette.line);
    card.style.setProperty("--featured-accent", palette.accent);
    card.style.setProperty("--featured-badge", palette.badge);

    const intro = getBrandIntro(brand);
    const heroTitle = heroProduct ? getProductTitle(heroProduct) : `${brandKey} utvalgte produkter`;
    const heroPrice = heroProduct ? formatPrice(heroProduct.price) : "";
    const heroImg = heroProduct ? getProductImage(heroProduct) : (brand.logo || "");
    const heroDestination = heroProduct ? getProductDestination(heroProduct) : `brand-page.html?brand=${encodeURIComponent(brandKey)}`;

    card.innerHTML = `
      <div class="featured-brand-premium">
        <div class="featured-brand-premium__badge-row">
          <span class="featured-brand-premium__badge">Sponset</span>

          <span class="fav-icon always-visible ${isFav ? "active" : ""}" data-brand="${escapeHtml(brandKey)}">
            <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
            </svg>
          </span>
        </div>

        <div class="featured-brand-premium__grid">
          <div class="featured-brand-premium__copy">
            <div class="featured-brand-premium__brand-head">
              <div class="featured-brand-premium__logo-wrap">
                <img src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brandKey)}" class="featured-brand-premium__logo">
              </div>

              <div class="featured-brand-premium__brand-meta">
                <p class="featured-brand-premium__eyebrow">Fremhevet brand</p>
                <h3>${escapeHtml(brandKey)}</h3>
              </div>
            </div>

            <p class="featured-brand-premium__intro">${escapeHtml(intro)}</p>

            <div class="featured-brand-premium__actions">
              <a class="brand-btn featured-brand-premium__cta" href="brand-page.html?brand=${encodeURIComponent(brandKey)}">Se alle produkter</a>
            </div>
          </div>

          <div class="featured-brand-premium__showcase">
            <a class="featured-brand-premium__hero" href="${escapeHtml(heroDestination)}">
              <div class="featured-brand-premium__hero-media">
                <img
                  src="${escapeHtml(heroImg)}"
                  alt="${escapeHtml(heroTitle)}"
                  class="featured-brand-premium__hero-image"
                >
              </div>

              <div class="featured-brand-premium__hero-info">
                <p class="featured-brand-premium__hero-kicker">Utvalgt produkt</p>
                <h4 class="featured-brand-premium__hero-title">${escapeHtml(heroTitle)}</h4>
                ${heroPrice ? `<p class="featured-brand-premium__hero-price">${escapeHtml(heroPrice)}</p>` : ""}
              </div>
            </a>

            <div class="featured-brand-premium__thumbs">
              ${thumbProducts.map((product, index) => {
                const title = getProductTitle(product);
                const price = formatPrice(product.price);
                const image = getProductImage(product);
                const destination = getProductDestination(product);

                return `
                  <button
                    type="button"
                    class="featured-brand-premium__thumb ${index === 0 ? "is-active" : ""}"
                    data-image="${escapeHtml(image)}"
                    data-title="${escapeHtml(title)}"
                    data-price="${escapeHtml(price)}"
                    data-link="${escapeHtml(destination)}"
                    aria-label="${escapeHtml(title)}"
                  >
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    card.querySelector(".fav-icon")?.addEventListener("click", e => {
      e.stopPropagation();
      e.preventDefault();
      toggleBrandFavoriteState(brandKey);
    });

    const heroLink = card.querySelector(".featured-brand-premium__hero");
    const heroImage = card.querySelector(".featured-brand-premium__hero-image");
    const heroTitleEl = card.querySelector(".featured-brand-premium__hero-title");
    const heroPriceEl = card.querySelector(".featured-brand-premium__hero-price");
    const thumbs = card.querySelectorAll(".featured-brand-premium__thumb");

    thumbs.forEach(thumb => {
      const activate = () => {
        thumbs.forEach(t => t.classList.remove("is-active"));
        thumb.classList.add("is-active");

        const nextImage = thumb.dataset.image || "";
        const nextTitle = thumb.dataset.title || "";
        const nextPrice = thumb.dataset.price || "";
        const nextLink = thumb.dataset.link || "#";

        if (heroImage) {
          heroImage.src = nextImage;
          heroImage.alt = nextTitle;
        }

        if (heroTitleEl) {
          heroTitleEl.textContent = nextTitle;
        }

        if (heroPriceEl) {
          heroPriceEl.textContent = nextPrice;
          heroPriceEl.style.display = nextPrice ? "block" : "none";
        }

        if (heroLink) {
          heroLink.href = nextLink;
        }
      };

      thumb.addEventListener("mouseenter", activate);
      thumb.addEventListener("focus", activate);
      thumb.addEventListener("click", activate);
    });

    return card;
  }

  // ------------------------------------------------------
  // 🔁 Render
  // ------------------------------------------------------
  function renderBrands(brands) {
    if (!highlightGrid || !brandGrid) return;

    highlightGrid.innerHTML = "";
    brandGrid.innerHTML = "";

    const favList = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
    const showPremiumFeatured = desktopFeaturedQuery.matches;

    brands.forEach(brand => {
      const brandKey = String(brand.brand || "").trim();
      const isFav = favList.includes(brandKey);

      // Alle brands
      brandGrid.appendChild(createStandardBrandCard(brand, isFav));

      // Fremhevede brands
      if (brand.highlight) {
        const featuredCard = showPremiumFeatured
          ? createFeaturedPremiumCard(brand, isFav)
          : createStandardBrandCard(brand, isFav);

        highlightGrid.appendChild(featuredCard);
      }
    });
  }

  // ------------------------------------------------------
  // 🔤 Alfabetfilter
  // ------------------------------------------------------
  function initAlphabetFilter(allBrandsSource) {
    document.querySelectorAll(".brand-alphabet span").forEach(letterEl => {
      letterEl.addEventListener("click", () => {
        document.querySelectorAll(".brand-alphabet span").forEach(x => x.classList.remove("active"));
        letterEl.classList.add("active");

        const letter = letterEl.dataset.letter || letterEl.textContent || "";
        const filtered =
          letter === "all"
            ? allBrandsSource
            : allBrandsSource.filter(b =>
                String(b.brand || "").toUpperCase().startsWith(letter.toUpperCase())
              );

        renderBrands(filtered);
      });
    });
  }

  try {
    const brandUrl = `https://opensheet.elk.sh/${BRAND_SHEET_ID}/${BRAND_SHEET_NAME}`;
    const productUrl = `https://opensheet.elk.sh/${PRODUCT_SHEET_ID}/${PRODUCT_SHEET_NAME}`;

    const [brandRows, productRows] = await Promise.all([
      fetch(brandUrl).then(res => res.json()),
      fetch(productUrl).then(res => res.json()).catch(() => [])
    ]);

    allBrands = brandRows
      .map(r => ({
        brand: (r.brand || "").trim(),
        logo: (r.logo || "").trim(),
        description: (r.description || "").trim(),
        homepage: (r.homepage_url || "").trim() || "#",
        about: (r.about || "").trim(),
        highlight: String(r.highlight || "").toLowerCase() === "yes",
        categories: r.categories ? r.categories.split(",").map(c => c.trim()) : []
      }))
      .filter(b => b.brand);

    allProducts = (Array.isArray(productRows) ? productRows : [])
      .map(p => ({
        ...p,
        id: String(p.id || p.product_id || "").trim(),
        title: getProductTitle(p),
        brand: String(p.brand || "").trim(),
        image_url: getProductImage(p),
        price: p.price || "",
        product_url: p.product_url || ""
      }))
      .filter(p => p.brand);

    localStorage.setItem("allBrandsData", JSON.stringify(allBrands));

    initAlphabetFilter(allBrands);
    renderBrands(allBrands);

    if (searchInput) {
      searchInput.addEventListener("input", e => {
        const search = String(e.target.value || "").toLowerCase().trim();
        const filtered = !search
          ? allBrands
          : allBrands.filter(b => b.brand.toLowerCase().includes(search));

        renderBrands(filtered);
      });
    }

    const handleFeaturedModeChange = () => {
      const search = String(searchInput?.value || "").toLowerCase().trim();
      const activeLetterEl = document.querySelector(".brand-alphabet span.active");
      const activeLetter = activeLetterEl?.dataset.letter || activeLetterEl?.textContent || "all";

      let filtered = [...allBrands];

      if (activeLetter !== "all") {
        filtered = filtered.filter(b =>
          String(b.brand || "").toUpperCase().startsWith(String(activeLetter).toUpperCase())
        );
      }

      if (search) {
        filtered = filtered.filter(b => b.brand.toLowerCase().includes(search));
      }

      renderBrands(filtered);
    };

    if (typeof desktopFeaturedQuery.addEventListener === "function") {
      desktopFeaturedQuery.addEventListener("change", handleFeaturedModeChange);
    } else if (typeof desktopFeaturedQuery.addListener === "function") {
      desktopFeaturedQuery.addListener(handleFeaturedModeChange);
    }
  } catch (err) {
    console.error("❌ FEIL ved lasting av brands/products:", err);
  }
});
