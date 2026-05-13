// ======================================================
// BrandRadar – Brands Page Supabase version
// Restored featured brand product hero + thumbnails
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL =
  window.BRANDRADAR_SUPABASE_URL ||
  window.SUPABASE_CONFIG?.url;

const SUPABASE_KEY =
  window.BRANDRADAR_SUPABASE_ANON_KEY ||
  window.SUPABASE_CONFIG?.anonKey;

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");

  if (!brandGrid) return;

  if (!SUPABASE_URL || !SUPABASE_KEY || !window.supabase) {
    console.error("Brands page: Supabase config mangler.");
    brandGrid.innerHTML = `<p class="brand-empty">Kunne ikke laste brands akkurat nå.</p>`;
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let allBrands = [];
  let allFeaturedProductsByBrand = new Map();

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .trim();

  const cleanPrice = (value) => {
    if (value === null || value === undefined || value === "") return null;

    const n = Number(
      String(value)
        .replace(/\s/g, "")
        .replace(/[^\d.,-]/g, "")
        .replace(",", ".")
    );

    if (!Number.isFinite(n)) return null;
    if (n <= 0 || n > 1000000) return null;

    return n;
  };

  const formatPrice = (value) => {
    const n = cleanPrice(value);
    if (n == null) return "";

    return `${new Intl.NumberFormat("nb-NO").format(Math.round(n))} kr`;
  };

  const getProductId = (product) =>
    product.external_id ||
    product.original_id ||
    product.id ||
    "";

  const getProductLink = (product) => {
    const id = getProductId(product);
    return id ? `product.html?id=${encodeURIComponent(id)}` : "#";
  };

  const getProductTitle = (product) =>
    product.title ||
    product.product_name ||
    product.name ||
    "Produkt";

  const getProductImage = (product) =>
    product.image_url ||
    product.image ||
    product.main_image ||
    "";

  function syncBrandHearts(brandKey, isActive) {
    document.querySelectorAll(".fav-icon[data-brand]").forEach((el) => {
      if (String(el.dataset.brand || "").trim() === brandKey) {
        el.classList.toggle("active", isActive);
      }
    });
  }

  function createLogoFallback(name) {
    return `
      <div class="brand-logo-placeholder" aria-hidden="true">
        ${escapeHtml(String(name || "?").slice(0, 1).toUpperCase())}
      </div>
    `;
  }

  function createBrandCard(brandObj, isFav) {
    const brandName = String(brandObj.name || "").trim();
    const logo = String(brandObj.logo_url || "").trim();
    const productCount = Number(brandObj.product_count || 0);

    const card = document.createElement("div");
    card.className = "brand-card";

    card.innerHTML = `
      <span class="fav-icon always-visible ${isFav ? "active" : ""}" data-brand="${escapeHtml(brandName)}">
        <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
        </svg>
      </span>

      ${
        logo
          ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(brandName)}" class="brand-logo" loading="lazy">`
          : createLogoFallback(brandName)
      }

      <h3>${escapeHtml(brandName)}</h3>

      <p class="brand-product-count">
        ${productCount} produkter
      </p>

      <a class="brand-btn">Se produkter →</a>
    `;

    card.querySelector(".brand-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brandName)}`;
    });

    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-icon")) return;
      if (e.target.closest(".brand-btn")) return;
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brandName)}`;
    });

    const heart = card.querySelector(".fav-icon");

    heart?.addEventListener("click", (e) => {
      e.stopPropagation();

      if (window.toggleBrandFavorite) {
        window.toggleBrandFavorite(brandName);
      }

      const updatedFavs = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
      const isNowFav = updatedFavs.includes(brandName);

      syncBrandHearts(brandName, isNowFav);

      if (window.updateFavoriteCounter) {
        window.updateFavoriteCounter();
      }
    });

    return card;
  }

  function getHeroProduct(products = []) {
    if (!products.length) return null;

    return [...products].sort((a, b) => {
      const ad = cleanPrice(a.discount) || 0;
      const bd = cleanPrice(b.discount) || 0;
      if (bd !== ad) return bd - ad;

      const ap = cleanPrice(a.price) || 0;
      const bp = cleanPrice(b.price) || 0;
      return bp - ap;
    })[0];
  }

  function getThumbProducts(products = [], heroProduct) {
    const unique = [];
    const seen = new Set();

    products.forEach((product) => {
      const key = String(getProductId(product) || getProductTitle(product)).trim();
      if (!key || seen.has(key)) return;

      seen.add(key);
      unique.push(product);
    });

    if (!heroProduct) return unique.slice(0, 5);

    const heroKey = String(getProductId(heroProduct) || getProductTitle(heroProduct)).trim();

    return [
      heroProduct,
      ...unique.filter((product) => {
        const key = String(getProductId(product) || getProductTitle(product)).trim();
        return key !== heroKey;
      }),
    ].slice(0, 5);
  }

  function buildSponsorIntro(brand) {
    if (brand.featured_intro) return brand.featured_intro;
    if (brand.description) return brand.description;

    return `${brand.name} er valgt ut som fremhevet brand akkurat nå. Utforsk utvalgte produkter og se hva som trender på BrandRadar.`;
  }

  function getBrandThemeColor(brandName) {
    const key = normalize(brandName);

    if (key.includes("nimue")) return "#f3f1ed";
    if (key.includes("is clinical")) return "#eef2f7";
    if (key.includes("neostrata")) return "#f6f3ee";
    if (key.includes("medex")) return "#f3f4f6";
    if (key.includes("mesoestetic")) return "#f1f0ec";
    if (key.includes("phformula")) return "#f4f2ef";

    return "#f3f1ed";
  }

  function createFeaturedBrandCard(brandObj, brandProducts, isFav) {
    const brandName = String(brandObj.name || "").trim();
    const intro = buildSponsorIntro(brandObj);
    const heroProduct = getHeroProduct(brandProducts);
    const thumbProducts = getThumbProducts(brandProducts, heroProduct);
    const bgColor = getBrandThemeColor(brandName);

    const heroImage = heroProduct
      ? getProductImage(heroProduct)
      : brandObj.logo_url || "";

    const heroTitle = heroProduct
      ? getProductTitle(heroProduct)
      : brandName;

    const heroPrice = heroProduct
      ? formatPrice(heroProduct.price)
      : "";

    const heroLink = heroProduct
      ? getProductLink(heroProduct)
      : `brand-page.html?brand=${encodeURIComponent(brandName)}`;

    const card = document.createElement("article");
    card.className = "featured-brand-card";

    card.innerHTML = `
      <div class="featured-brand-card__shell" style="--brand-bg:${escapeHtml(bgColor)};">
        <button class="fav-icon always-visible ${isFav ? "active" : ""}" data-brand="${escapeHtml(brandName)}" aria-label="Favoritt-brand">
          <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
          </svg>
        </button>

        <div class="featured-brand-card__rail">
          <div class="featured-brand-card__brandhead">
            <div class="featured-brand-card__logo-wrap">
              ${
                brandObj.logo_url
                  ? `<img src="${escapeHtml(brandObj.logo_url)}" alt="${escapeHtml(brandName)}" class="featured-brand-card__logo">`
                  : createLogoFallback(brandName)
              }
            </div>

            <span class="featured-brand-card__tag">
              ${escapeHtml(brandObj.featured_tag || "Fremhevet brand")}
            </span>
          </div>

          <div class="featured-brand-card__top">
            <div class="featured-brand-card__intro">
              <div class="featured-brand-card__eyebrow">Fremhevet brand</div>
              <h3 class="featured-brand-card__title">${escapeHtml(brandName)}</h3>
              <p class="featured-brand-card__copy">${escapeHtml(intro)}</p>

              <a class="featured-brand-card__cta" href="brand-page.html?brand=${encodeURIComponent(brandName)}">
                Se alle ${escapeHtml(brandName)}-produkter
              </a>
            </div>

            <a class="featured-brand-card__hero" href="${escapeHtml(heroLink)}">
              <div class="featured-brand-card__hero-stage">
                ${
                  heroImage
                    ? `<img src="${escapeHtml(heroImage)}" alt="${escapeHtml(heroTitle)}" class="featured-brand-card__hero-image" data-hero-image>`
                    : ""
                }
              </div>

              <div class="featured-brand-card__hero-caption">
                <div class="featured-brand-card__hero-name" data-hero-title>${escapeHtml(heroTitle)}</div>
                <div class="featured-brand-card__hero-price" data-hero-price>${escapeHtml(heroPrice)}</div>
              </div>
            </a>
          </div>

          <div class="featured-brand-card__thumbs">
            ${
              thumbProducts.length
                ? thumbProducts.map((product, index) => {
                    const image = getProductImage(product);
                    const title = getProductTitle(product);
                    const price = formatPrice(product.price);
                    const link = getProductLink(product);

                    return `
                      <button
                        type="button"
                        class="featured-brand-card__thumb ${index === 0 ? "is-active" : ""}"
                        data-thumb-image="${escapeHtml(image)}"
                        data-thumb-title="${escapeHtml(title)}"
                        data-thumb-price="${escapeHtml(price)}"
                        data-thumb-link="${escapeHtml(link)}"
                        aria-label="${escapeHtml(title)}"
                      >
                        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">` : ""}
                      </button>
                    `;
                  }).join("")
                : ""
            }
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

      if (heroImageEl && nextImage) heroImageEl.src = nextImage;
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
      btn.addEventListener("click", () => {
  setActiveThumb(btn);

  const link = btn.dataset.thumbLink;

  if (link) {
    window.location.href = link;
  }
});
    });

    const heart = card.querySelector(".fav-icon");

    heart?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (window.toggleBrandFavorite) {
        window.toggleBrandFavorite(brandName);
      }

      const updatedFavs = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
      const isNowFav = updatedFavs.includes(brandName);

      syncBrandHearts(brandName, isNowFav);

      if (window.updateFavoriteCounter) {
        window.updateFavoriteCounter();
      }
    });

    return card;
  }

  function setupMobileHighlightDots() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const grid = document.getElementById("highlight-grid");

    if (!isMobile || !grid) return;

    const oldDots = document.querySelector(".highlight-slider-dots");
    if (oldDots) oldDots.remove();

    const cards = Array.from(grid.querySelectorAll(".featured-brand-card"));
    if (cards.length <= 1) return;

    const dotsWrap = document.createElement("div");
    dotsWrap.className = "highlight-slider-dots";

    const dots = cards.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `highlight-slider-dot${index === 0 ? " is-active" : ""}`;
      dot.setAttribute("aria-label", `Gå til fremhevet brand ${index + 1}`);
      dot.addEventListener("click", () => {
        const card = cards[index];
        if (!card) return;

        grid.scrollTo({
          left: card.offsetLeft,
          behavior: "smooth",
        });
      });

      dotsWrap.appendChild(dot);
      return dot;
    });

    grid.insertAdjacentElement("afterend", dotsWrap);

    function updateActiveDot() {
      const scrollLeft = grid.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - scrollLeft);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === closestIndex);
      });
    }

    grid.addEventListener("scroll", updateActiveDot, { passive: true });
    updateActiveDot();
  }

  function initAlphabetFilter() {
    document.querySelectorAll(".brand-alphabet span").forEach((letterEl) => {
      letterEl.addEventListener("click", () => {
        document.querySelectorAll(".brand-alphabet span").forEach((x) => {
          x.classList.remove("active");
        });

        letterEl.classList.add("active");

        const letter = letterEl.dataset.letter;
        const label = letterEl.textContent.trim().toUpperCase();

        const filtered =
          letter === "all"
            ? allBrands
            : allBrands.filter((brand) =>
                String(brand.name || "").toUpperCase().startsWith(label)
              );

        renderBrands(filtered);
      });
    });
  }

  function setupMobileAlphabetToggle() {
    const toggleBtn = document.getElementById("brandAlphabetToggle");
    const alphabet = document.getElementById("brandAlphabet");

    if (!toggleBtn || !alphabet) return;

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    function applyState() {
      if (isMobile()) {
        alphabet.hidden = true;
        toggleBtn.hidden = false;
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.classList.remove("is-open");
      } else {
        alphabet.hidden = false;
        toggleBtn.hidden = true;
        toggleBtn.setAttribute("aria-expanded", "true");
        toggleBtn.classList.remove("is-open");
      }
    }

    toggleBtn.onclick = () => {
      const willOpen = alphabet.hidden;
      alphabet.hidden = !willOpen;
      toggleBtn.setAttribute("aria-expanded", String(willOpen));
      toggleBtn.classList.toggle("is-open", willOpen);
    };

    applyState();
    window.addEventListener("resize", applyState);
  }

  async function loadBrands() {
    const { data, error } = await client
      .from("brands")
      .select("*")
      .eq("active", true)
      .order("featured_sort", { ascending: true })
      .order("product_count", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Brands page Supabase error:", error);
      brandGrid.innerHTML = `<p class="brand-empty">Kunne ikke laste brands akkurat nå.</p>`;
      return [];
    }

    return data || [];
  }

  async function loadFeaturedProducts(featuredBrands) {
    const map = new Map();

    await Promise.all(
      featuredBrands.map(async (brand) => {
        const { data, error } = await client
          .from("products")
          .select("*")
          .eq("active", true)
          .eq("brand_slug", brand.slug)
          .not("image_url", "is", null)
          .order("updated_at", { ascending: false })
          .limit(8);

        if (error) {
          console.warn(`Could not load products for ${brand.name}:`, error);
          map.set(normalize(brand.name), []);
          return;
        }

        map.set(normalize(brand.name), data || []);
      })
    );

    return map;
  }

  function renderBrands(brands) {
    if (highlightGrid) {
      highlightGrid.innerHTML = "";

      const featured = brands.filter((brand) => brand.is_featured);

      featured.forEach((brand) => {
        const brandKey = String(brand.name || "").trim();
        const favList = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
        const isFav = favList.includes(brandKey);
        const products = allFeaturedProductsByBrand.get(normalize(brand.name)) || [];

        const card = createFeaturedBrandCard(brand, products, isFav);
        highlightGrid.appendChild(card);
      });

      setupMobileHighlightDots();
    }

    brandGrid.innerHTML = "";

    const favList = window.getFavoriteBrands ? window.getFavoriteBrands() : [];

    if (!brands.length) {
      brandGrid.innerHTML = `<p class="brand-empty">Ingen brands funnet.</p>`;
      return;
    }

    brands.forEach((brand) => {
      const brandKey = String(brand.name || "").trim();
      const isFav = favList.includes(brandKey);
      const card = createBrandCard(brand, isFav);
      brandGrid.appendChild(card);
    });
  }

  try {
    brandGrid.innerHTML = `<p class="brand-empty">Laster brands…</p>`;

    allBrands = await loadBrands();

    const featuredBrands = allBrands.filter((brand) => brand.is_featured);
    allFeaturedProductsByBrand = await loadFeaturedProducts(featuredBrands);

    localStorage.setItem(
      "allBrandsData",
      JSON.stringify(
        allBrands.map((brand) => ({
          name: brand.name,
          logo: brand.logo_url,
          description: brand.description || "",
        }))
      )
    );

    initAlphabetFilter();
    setupMobileAlphabetToggle();
    renderBrands(allBrands);

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const search = normalize(e.target.value);

        const filtered = !search
          ? allBrands
          : allBrands.filter((brand) =>
              normalize(brand.name).includes(search)
            );

        renderBrands(filtered);
      });
    }

    window.addEventListener("resize", setupMobileHighlightDots);
  } catch (err) {
    console.error("Brands page failed:", err);
    brandGrid.innerHTML = `<p class="brand-empty">Kunne ikke laste brands akkurat nå.</p>`;
  }
});
