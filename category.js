// ======================================================
// ✅ BrandRadar – Category Page
// Bruker Product Card Engine + Offers Engine
// - støtter category uten gender
// - støtter kidtype for barn
// - korrekt prisfilter + sortering basert på laveste offer-pris
// - mer robust kategori/subkategori-mapping
// - støtter umbrella-kategorier som Gymcorner
// - støtter collections som deals / picks / news
// - deals får egen editorial landing + highlights
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const SHEET_PRODUCTS = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_MAPPING = "1e3tvfatBmnwDVs5nuR-OvSaQl0lIF-JUhuQtfvACo3g";
  const SHEET_DEALS = "1GZH_z1dSV40X9GYRKWNV_F1Oe8JwapRBYy9nnDP0KmY";
  const SHEET_PICKS = "18eu0oOvtxuteHRf7wR0WEkmQMfNYet2qHtQSCgrpbYI";
  const SHEET_NEWS = "1CSJjHvL7VytKfCd61IQf-53g3nAl9GrnC1Vmz7ZGF54";

  const productUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/BrandRadarProdukter`;
  const mappingUrl = `https://opensheet.elk.sh/${SHEET_MAPPING}/CategoryMapping`;
  const dealsUrl = `https://opensheet.elk.sh/${SHEET_DEALS}/deals`;
  const picksUrl = `https://opensheet.elk.sh/${SHEET_PICKS}/picks`;
  const newsUrl = `https://opensheet.elk.sh/${SHEET_NEWS}/news`;

  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");
  const breadcrumbEl = document.querySelector(".breadcrumb");

  const brandFilter = document.getElementById("brand-filter");
  const priceFilter = document.getElementById("price-filter");
  const discountFilter = document.getElementById("discount-filter");
  const sortSelect = document.getElementById("sort-select");
  const filterTagsContainer = document.querySelector(".filter-tags");
  const filterBar = document.querySelector(".filter-bar");
  const filterToggle = document.querySelector(".filter-toggle");
  const filterToggleMeta = document.querySelector(".filter-toggle-meta");
  const mobileMediaQuery = window.matchMedia("(max-width: 768px)");
  const filterStorageKey = `br_category_filters_collapsed:${window.location.pathname}${window.location.search}`;

  const params = new URLSearchParams(window.location.search);
  const genderParam = params.get("gender");
  const categoryParam = params.get("category");
  const subParam = params.get("subcategory");
  const kidtypeParam = params.get("kidtype");
  const collectionParam = params.get("collection");

  if (!categoryParam && !collectionParam) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  const normalize = txt =>
    (txt || "")
      .toLowerCase()
      .replace(/æ/g, "a")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/&/g, " ")
      .replace(/\//g, " ")
      .replace(/\bog\b/g, " ")
      .replace(/\band\b/g, " ")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\d]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const categorySlug = normalize(categoryParam);
  let genderSlug = genderParam ? normalize(genderParam) : "";
  if (genderSlug === "herre") genderSlug = "men";
  if (genderSlug === "dame") genderSlug = "women";
  if (genderSlug === "barn") genderSlug = "kids";

  const subSlug = normalize(subParam);
  const kidtypeSlug = normalize(kidtypeParam);

  const CATEGORY_ALIAS_MAP = {
    gymcorner: ["gymcorner", "supplements", "supplement", "sportsnutrition", "nutrition"],
    shoes: ["shoes", "sko"],
    clothing: ["clothing", "klaer"],
    accessories: ["accessories", "tilbehor"],
    selfcare: ["selfcare", "beauty", "hudpleie", "hygiene"]
  };

  const SUBCATEGORY_ALIAS_MAP = {
    proteinbarer: ["proteinbarer", "proteinbar", "proteinbars", "protein-bar", "protein-bars", "bars", "soft-bar", "soft-bars"],
    proteinpulver: ["proteinpulver", "protein-pulver", "proteinpowder", "protein-powder", "whey", "whey-protein", "isolate"],
    kreatin: ["kreatin", "creatine"],
    pwo: ["pwo", "pre-workout", "preworkout", "pre-workout-pwo"],
    "vitaminer-mineraler": ["vitaminer-mineraler", "vitaminer", "mineraler", "vitamins", "minerals", "vitamins-minerals"],
    drikke: ["drikke", "drink", "drinks", "beverage", "beverages"],
    aminosyrer: ["aminosyrer", "amino", "amino-acids", "aminoacids", "bcaa", "eaa"]
  };

  function parseNumber(val) {
    if (val == null) return null;
    const s = String(val)
      .replace(/\s/g, "")
      .replace(/[^\d,.\-]/g, "")
      .replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function cleanRating(v) {
    return parseFloat(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
  }

  function parseBool(v) {
    if (!v && v !== 0) return false;
    const s = String(v).trim().toLowerCase();
    return s === "true" || s === "1" || s === "ja" || s === "yes";
  }

  function formatPrice(num) {
    if (num == null || !Number.isFinite(Number(num))) return "";
    return `${new Intl.NumberFormat("nb-NO").format(Math.round(Number(num)))} kr`;
  }

  function getFallbackPrice(product) {
    let price = parseNumber(product.price);
    let oldPrice = parseNumber(product.old_price);
    let discount = parseNumber(product.discount);

    if (!price && oldPrice && discount) price = oldPrice * (1 - discount / 100);
    if (price && !oldPrice && discount) oldPrice = price / (1 - discount / 100);
    if (price && oldPrice && !discount && oldPrice > price) {
      discount = ((oldPrice - price) / oldPrice) * 100;
    }

    return price ?? 0;
  }

  function getEffectivePrice(product) {
    if (product?.offer_summary?.hasOffers && product.offer_summary.lowestPrice != null) {
      return Number(product.offer_summary.lowestPrice);
    }
    return getFallbackPrice(product);
  }

  function hasDiscountFallback(product) {
    const price = parseNumber(product.price);
    const oldPrice = parseNumber(product.old_price);
    const discount = parseNumber(product.discount);

    if (discount && discount > 0) return true;
    if (price && oldPrice && oldPrice > price) return true;

    return false;
  }

  function getAliases(slug, map) {
    return [...new Set([slug, ...(map[slug] || [])])];
  }

  function getProductSearchText(product) {
    return [
      product.category,
      product.main_category,
      product.subcategory,
      product.title,
      product.product_name,
      product.name,
      product.info,
      product.description,
      product.brand
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ");
  }

  function productMatchesCategory(product, targetCategorySlug) {
    const aliases = getAliases(targetCategorySlug, CATEGORY_ALIAS_MAP);
    const pCategory = normalize(product.category);
    const pMainCategory = normalize(product.main_category);
    const text = getProductSearchText(product);

    return aliases.some(alias =>
      pCategory === alias ||
      pMainCategory === alias ||
      text.includes(alias)
    );
  }

  function productMatchesSubcategory(product, targetSubSlug) {
    if (!targetSubSlug) return true;

    const aliases = getAliases(targetSubSlug, SUBCATEGORY_ALIAS_MAP);
    const pSub = normalize(product.subcategory);
    const pCategory = normalize(product.category);
    const text = getProductSearchText(product);

    return aliases.some(alias =>
      pSub === alias ||
      pCategory === alias ||
      text.includes(alias)
    );
  }

  function createBaseProduct(masterRow) {
    if (!masterRow) return null;

    return {
      ...masterRow,
      id: String(masterRow.id || masterRow.product_id || "").trim(),
      title: masterRow.title || masterRow.product_name || masterRow.name || "",
      brand: masterRow.brand || "",
      price: masterRow.price || "",
      discount: masterRow.discount || "",
      image_url: masterRow.image_url || "",
      product_url: masterRow.product_url || "",
      category: masterRow.category || masterRow.main_category || "",
      rating: masterRow.rating || "",
      luxury: parseBool(masterRow.luxury)
    };
  }

  function mapDealRowToProduct(row, index = 0) {
    const oldPrice = parseNumber(row.old_price);
    const newPrice = parseNumber(row.new_price);
    const discount =
      oldPrice && newPrice
        ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
        : parseNumber(row.discount);

    return {
      id: String(row.id || row.product_id || `deal_${index}`).trim(),
      title: row.product_name || row.title || "",
      brand: row.brand || "",
      price: newPrice != null ? newPrice : (oldPrice ?? row.price ?? ""),
      old_price: oldPrice ?? "",
      discount: discount ?? "",
      image_url: row.image_url || "",
      product_url: row.link || row.product_url || "",
      category: row.category || "",
      rating: row.rating || "",
      luxury: false
    };
  }

  function populateBrandFilter(products) {
    if (!brandFilter) return;

    brandFilter.innerHTML = `<option value="all">Alle brands</option>`;

    [...new Set(products.map(p => p.brand).filter(Boolean))]
      .sort()
      .forEach(b => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        brandFilter.appendChild(opt);
      });
  }

  function renderProducts(list, collectionSlug = "") {
    if (!productGrid) return;
    productGrid.innerHTML = "";

    list.forEach(product => {
      const pid = typeof resolveProductId === "function"
        ? resolveProductId(product)
        : (product.id || product.product_id || "");

      const card = window.BrandRadarProductCardEngine.createCard(product, {
        isLuxury: !!product.luxury,
        showBrand: true,
        showRating: true,
        enableFavorite: true,
        onNavigate: (p) => {
          if (p.product_url && collectionSlug === "deals") {
            window.open(p.product_url, "_blank", "noopener");
            return;
          }

          const id = typeof resolveProductId === "function"
            ? resolveProductId(p)
            : (p.id || p.product_id || "");

          if (id) {
            window.location.href = `product.html?id=${encodeURIComponent(id)}`;
          }
        },
        favoriteProductFactory: (p) => ({
          id: pid,
          product_name: p.title || p.product_name || p.name || "Uten navn",
          title: p.title || p.product_name || p.name || "Uten navn",
          brand: p.brand || "",
          price: p.price,
          discount: p.discount,
          image_url: p.image_url,
          product_url: p.product_url,
          category: p.category || p.main_category || "",
          rating: p.rating,
          luxury: !!p.luxury
        })
      });

      productGrid.appendChild(card);
    });

    const resultEl = document.querySelector(".filter-bar .result-count");
    if (resultEl) resultEl.textContent = `${list.length} produkter`;
  }

  function updateFilterTags(applyFiltersAndSort) {
    if (!filterTagsContainer) return;

    filterTagsContainer.innerHTML = "";
    const tags = [];

    if (brandFilter && brandFilter.value !== "all") {
      tags.push({
        label: brandFilter.value,
        remove: () => {
          brandFilter.value = "all";
          applyFiltersAndSort();
        }
      });
    }

    if (priceFilter && priceFilter.value !== "all") {
      tags.push({
        label: `Pris: ${priceFilter.options[priceFilter.selectedIndex].text}`,
        remove: () => {
          priceFilter.value = "all";
          applyFiltersAndSort();
        }
      });
    }

    if (discountFilter && discountFilter.checked) {
      tags.push({
        label: "Kun tilbud",
        remove: () => {
          discountFilter.checked = false;
          applyFiltersAndSort();
        }
      });
    }

    filterTagsContainer.classList.toggle("hidden", tags.length === 0);

    tags.forEach(tag => {
      const el = document.createElement("div");
      el.classList.add("filter-tag");
      el.innerHTML = `${tag.label} <span class="close-tag">×</span>`;
      el.addEventListener("click", tag.remove);
      filterTagsContainer.appendChild(el);
    });
  }

    function getActiveFilterCount() {
    let count = 0;

    if (brandFilter && brandFilter.value !== "all") count += 1;
    if (priceFilter && priceFilter.value !== "all") count += 1;
    if (discountFilter && discountFilter.checked) count += 1;
    if (sortSelect && sortSelect.value !== "featured") count += 1;

    return count;
  }

  function updateMobileFilterToggleSummary() {
    if (!filterToggleMeta || !filterBar) return;

    const countText =
      document.querySelector(".filter-bar .result-count")?.textContent?.trim() || "";

    const activeCount = getActiveFilterCount();
    const isCollapsed = filterBar.classList.contains("is-collapsed");

    if (isCollapsed) {
      const parts = [];
      if (countText) parts.push(countText);
      parts.push(
        activeCount > 0
          ? `${activeCount} aktiv${activeCount === 1 ? "t filter" : "e filtre"}`
          : "Vis filtre"
      );
      filterToggleMeta.textContent = parts.join(" • ");
      return;
    }

    filterToggleMeta.textContent =
      activeCount > 0
        ? `${activeCount} aktiv${activeCount === 1 ? "t filter" : "e filtre"}`
        : "Skjul filtre";
  }

  function applyMobileFilterCollapsedState(shouldCollapse, persist = true) {
    if (!filterBar || !filterToggle) return;

    if (!mobileMediaQuery.matches) {
      filterBar.classList.remove("is-collapsed");
      filterToggle.setAttribute("aria-expanded", "true");
      updateMobileFilterToggleSummary();
      return;
    }

    filterBar.classList.toggle("is-collapsed", shouldCollapse);
    filterToggle.setAttribute("aria-expanded", String(!shouldCollapse));

    if (persist) {
      sessionStorage.setItem(filterStorageKey, shouldCollapse ? "1" : "0");
    }

    updateMobileFilterToggleSummary();
  }

  function setupMobileFilterToggle() {
    if (!filterBar || !filterToggle) return;

    const stored = sessionStorage.getItem(filterStorageKey);
    const initialCollapsed =
      mobileMediaQuery.matches
        ? (stored === null ? true : stored === "1")
        : false;

    applyMobileFilterCollapsedState(initialCollapsed, false);

    filterToggle.addEventListener("click", () => {
      const isCollapsed = filterBar.classList.contains("is-collapsed");
      applyMobileFilterCollapsedState(!isCollapsed, true);
    });

    const handleViewportChange = () => {
      const storedState = sessionStorage.getItem(filterStorageKey);
      const shouldCollapse =
        mobileMediaQuery.matches
          ? (storedState === null ? true : storedState === "1")
          : false;

      applyMobileFilterCollapsedState(shouldCollapse, false);
    };

    if (typeof mobileMediaQuery.addEventListener === "function") {
      mobileMediaQuery.addEventListener("change", handleViewportChange);
    } else if (typeof mobileMediaQuery.addListener === "function") {
      mobileMediaQuery.addListener(handleViewportChange);
    }
  }

  function bindFilterEvents(applyFiltersAndSort) {
    brandFilter?.addEventListener("change", applyFiltersAndSort);
    priceFilter?.addEventListener("change", applyFiltersAndSort);
    discountFilter?.addEventListener("change", applyFiltersAndSort);
    sortSelect?.addEventListener("change", applyFiltersAndSort);
  }
  function ensurePageRootCollectionClass(slug) {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;
    mainEl.classList.add("collection-page");
    if (slug) mainEl.classList.add(`collection-page--${slug}`);
  }

  function createCollectionHero({ eyebrow, title, text, metaPills = [] }) {
    const hero = document.createElement("section");
    hero.className = "collection-hero";
    hero.innerHTML = `
      <div class="collection-hero__eyebrow">${eyebrow}</div>
      <h2>${title}</h2>
      <p>${text}</p>
      <div class="collection-meta">
        ${metaPills.map(p => `<span class="collection-meta__pill">${p}</span>`).join("")}
      </div>
    `;
    return hero;
  }

 function buildDealHighlights(products) {
  if (!products.length) return null;

  const sorted = [...products].sort((a, b) => {
    const aDisc = parseNumber(a.discount) || 0;
    const bDisc = parseNumber(b.discount) || 0;

    if (bDisc !== aDisc) return bDisc - aDisc;

    return getEffectivePrice(a) - getEffectivePrice(b);
  });

  const picks = sorted.slice(0, 3);
  if (!picks.length) return null;

  const shell = document.createElement("section");
  shell.className = "deals-highlights-shell";

  const head = document.createElement("div");
  head.className = "deals-highlight-head";

  head.innerHTML = `
    <div>
      <h3>Utvalgte deals akkurat nå</h3>
      <p>En rask oversikt over tilbudene som skiller seg mest ut akkurat nå.</p>
    </div>
  `;

  const grid = document.createElement("div");
  grid.className = "deals-highlight-grid";

  picks.forEach((product, index) => {
    const discount = parseNumber(product.discount) || 0;
    const newPrice = parseNumber(product.price);
    const oldPrice = parseNumber(product.old_price);
    const savings =
      oldPrice != null && newPrice != null && oldPrice > newPrice
        ? Math.round(oldPrice - newPrice)
        : null;

    const label =
      index === 0 ? "Beste deal" :
      index === 1 ? "Sterkt tilbud" :
      "Verdt å sjekke";

    const card = document.createElement("article");
    card.className =
      index === 0
        ? "deal-highlight-card deal-highlight-card--primary"
        : "deal-highlight-card";

    const primaryEditorialBlock = index === 0
      ? `
        <div class="deal-why-block">
          <p class="deal-why-title">Hvorfor denne dealen?</p>
          <ul class="deal-why-list">
            ${discount ? `<li>${Math.round(discount)}% rabatt akkurat nå</li>` : ""}
            ${product.brand ? `<li>${product.brand} er et sterkt brand i denne kategorien</li>` : ""}
            ${savings ? `<li>Du sparer ${formatPrice(savings)}</li>` : ""}
          </ul>
        </div>
      `
      : "";

    const primaryValueBlock = index === 0 && (oldPrice != null || savings != null)
      ? `
        <div class="deal-value-row">
          ${oldPrice != null ? `<span>Vanlig pris: <strong>${formatPrice(oldPrice)}</strong></span>` : ""}
          ${savings != null ? `<span>Du sparer: <strong>${formatPrice(savings)}</strong></span>` : ""}
        </div>
      `
      : "";

    card.innerHTML = `
      <div class="deal-highlight-card__media">
        <span class="deal-highlight-badge">${label}</span>
        ${discount ? `<span class="deal-highlight-discount">-${Math.round(discount)}%</span>` : ""}
        <img src="${product.image_url || ""}" alt="${product.title || ""}" loading="lazy">
      </div>

      <div class="deal-highlight-card__body">
        <p class="deal-highlight-brand">${product.brand || "BrandRadar"}</p>

        <h3 class="deal-highlight-title">${product.title || "Produkt"}</h3>

        <p class="deal-highlight-copy">
          ${index === 0
            ? "Et tilbud som kombinerer høy rabatt, sterk merkeinteresse og tydelig verdi."
            : "Et aktuelt tilbud som skiller seg ut akkurat nå."}
        </p>

        ${primaryEditorialBlock}
        ${primaryValueBlock}

        <div class="deal-highlight-pricing">
          ${newPrice != null ? `<span class="deal-highlight-price">${formatPrice(newPrice)}</span>` : ""}
          ${oldPrice != null ? `<span class="deal-highlight-oldprice">${formatPrice(oldPrice)}</span>` : ""}
        </div>

        <div class="deal-highlight-cta">Se deal →</div>
      </div>
    `;

    card.addEventListener("click", () => {
      if (product.product_url) {
        window.open(product.product_url, "_blank", "noopener");
        return;
      }

      const id = product.id || product.product_id || "";
      if (id) {
        window.location.href = `product.html?id=${encodeURIComponent(id)}`;
      }
    });

    grid.appendChild(card);
  });

  shell.appendChild(head);
  shell.appendChild(grid);

  return shell;
}

  function buildDealsTopZone(heroEl, highlightsEl) {
    const section = document.createElement("section");
    section.className = "deals-top-zone";

    const inner = document.createElement("div");
    inner.className = "deals-top-zone__inner";

    if (heroEl) inner.appendChild(heroEl);
    if (highlightsEl) inner.appendChild(highlightsEl);

    const divider = document.createElement("div");
    divider.className = "deals-top-zone-divider";

    section.appendChild(inner);
    section.appendChild(divider);

    return section;
  }

  function insertBeforeFilterBar(elements = []) {
    if (!filterBar) return;
    const parent = filterBar.parentNode;
    if (!parent) return;

    elements.filter(Boolean).forEach(el => {
      parent.insertBefore(el, filterBar);
    });
  }

  try {
    // ======================================================
    // COLLECTION MODE
    // ======================================================
    if (collectionParam) {
      const collectionSlug = normalize(collectionParam);

      let products = [];
      let pageTitle = "";
      let breadcrumbLabel = "";
      let collectionHero = null;
      let collectionIntroBlock = null;

      if (collectionSlug === "deals") {
        ensurePageRootCollectionClass("deals");

        const rows = await fetch(dealsUrl).then(r => r.json());
        products = rows.map(mapDealRowToProduct).filter(p => p.id || p.product_url);
        pageTitle = "Ukens Deals";
        breadcrumbLabel = "Deals";

        collectionHero = createCollectionHero({
  eyebrow: "BrandRadar Deals",
  title: "De beste dealene, kuratert for raskere valg",
  text: "Vi samler tilbudene som faktisk er verdt oppmerksomheten din — slik at du kan scanne raskt, sammenligne smartere og finne høy verdi uten støy.",
  metaPills: [
    "Kuratert av BrandRadar",
    "Høy verdi, lavere støy",
    "Bygget for rask scanning"
  ]
});
      } else if (collectionSlug === "picks") {
        ensurePageRootCollectionClass("picks");

        const [pickRows, masterRows] = await Promise.all([
          fetch(picksUrl).then(r => r.json()),
          fetch(productUrl).then(r => r.json())
        ]);

        const masterById = new Map(
          masterRows.map(row => [String(row.id || "").trim(), row])
        );

        products = pickRows.map((row, index) => {
          const id = String(row.id || row.product_id || "").trim();
          const master = masterById.get(id);

          if (master) {
            return {
              ...createBaseProduct(master),
              tag: row.reason || ""
            };
          }

          return {
            id: id || `pick_${index}`,
            title: row.product_name || row.title || "",
            brand: row.brand || "",
            price: row.price || "",
            discount: row.discount || "",
            image_url: row.image_url || "",
            product_url: row.link || row.product_url || "",
            category: row.category || "",
            rating: row.rating || "",
            luxury: parseBool(row.luxury),
            tag: row.reason || ""
          };
        }).filter(Boolean);

        pageTitle = "Radar Picks";
        breadcrumbLabel = "Radar Picks";
      } else if (collectionSlug === "news") {
        ensurePageRootCollectionClass("news");

        const [newsRows, masterRows] = await Promise.all([
          fetch(newsUrl).then(r => r.json()),
          fetch(productUrl).then(r => r.json())
        ]);

        const masterById = new Map(
          masterRows.map(row => [String(row.id || "").trim(), row])
        );

        products = newsRows
          .filter(row => parseBool(row.show_in_feed))
          .map((row) => {
            const id = String(row.id || "").trim();
            const master = masterById.get(id);
            if (!master) return null;
            return createBaseProduct(master);
          })
          .filter(Boolean);

        pageTitle = "Nye Produkter & Trender";
        breadcrumbLabel = "Nyheter";
      } else {
        titleEl.textContent = "Ugyldig kategori";
        emptyMessage.style.display = "block";
        return;
      }

      titleEl.textContent = pageTitle;
      document.title = `${pageTitle} | BrandRadar`;

      if (breadcrumbEl) {
  if (collectionSlug === "deals") {
    breadcrumbEl.innerHTML = `<a href="index.html">Hjem</a> › ${breadcrumbLabel}`;
  } else {
    breadcrumbEl.innerHTML = `<a href="index.html">Hjem</a> › <a href="news.html">Nyheter</a> › ${breadcrumbLabel}`;
  }
}

      const enrichedProducts = window.BrandRadarOffersEngine
        ? await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(products)
        : products;

      if (!enrichedProducts.length) {
        emptyMessage.style.display = "block";
        emptyMessage.textContent = "Ingen produkter funnet.";
        return;
      }

      emptyMessage.style.display = "none";
      populateBrandFilter(enrichedProducts);

      if (collectionSlug === "deals") {
        const highlights = buildDealHighlights(enrichedProducts);
        const topZone = buildDealsTopZone(collectionHero, highlights);

        collectionIntroBlock = document.createElement("div");
        collectionIntroBlock.className = "collection-subhead";
        collectionIntroBlock.innerHTML = `
          <div class="collection-subhead__text">
            <h3>Alle deals</h3>
            <p>Browse hele utvalget, filtrer smart og finn tilbudene som faktisk er relevante.</p>
          </div>
        `;

        insertBeforeFilterBar([topZone, collectionIntroBlock]);
      } else if (collectionHero) {
        insertBeforeFilterBar([collectionHero]);
      }

      function applyFiltersAndSort() {
        let result = [...enrichedProducts];

        if (brandFilter && brandFilter.value !== "all") {
          result = result.filter(p => p.brand === brandFilter.value);
        }

        if (priceFilter && priceFilter.value !== "all") {
          if (priceFilter.value === "1000+") {
            result = result.filter(p => getEffectivePrice(p) >= 1000);
          } else {
            const [min, max] = priceFilter.value.split("-").map(Number);
            result = result.filter(p => {
              const price = getEffectivePrice(p);
              return price >= min && price <= max;
            });
          }
        }

        if (discountFilter && discountFilter.checked) {
          result = result.filter(p => {
            if (p.offer_summary?.hasOffers) return true;
            return hasDiscountFallback(p);
          });
        }

        switch (sortSelect?.value) {
          case "price-asc":
            result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
            break;
          case "price-desc":
            result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
            break;
          case "rating-desc":
            result.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
            break;
        }

        renderProducts(result, collectionSlug);
        updateFilterTags(applyFiltersAndSort);
      }

      bindFilterEvents(applyFiltersAndSort);
      setupMobileFilterToggle();
      
      if (collectionSlug === "deals") {
        if (sortSelect) sortSelect.value = "price-asc";
        if (discountFilter) discountFilter.checked = true;
      }

      applyFiltersAndSort();

      setTimeout(() => {
        if (typeof updateFavoriteCounter === "function") {
          updateFavoriteCounter();
        }
      }, 50);

      return;
    }

    // ======================================================
    // NORMAL CATEGORY MODE
    // ======================================================
    const [mapRows, products] = await Promise.all([
      fetch(mappingUrl).then(r => r.json()),
      fetch(productUrl).then(r => r.json())
    ]);

    const match = mapRows.find(row => {
      const mainOk = normalize(row.main_category) === categorySlug;
      const genderOk = genderSlug
        ? normalize(row.gender) === genderSlug
        : !row.gender || normalize(row.gender) === "";
      const kidtypeOk = kidtypeSlug
        ? normalize(row.kidtype) === kidtypeSlug
        : true;

      return mainOk && genderOk && kidtypeOk;
    });

    if (!match) {
      titleEl.textContent = "Ugyldig kategori";
      emptyMessage.style.display = "block";
      return;
    }

    const norskGender =
      genderSlug === "men" ? "Herre" :
      genderSlug === "women" ? "Dame" :
      genderSlug === "kids" ? "Barn" : "";

    let subNameNo = null;

    if (subSlug) {
      const subMatch = mapRows.find(row => {
        const mainOk = normalize(row.main_category) === categorySlug;
        const subOk = normalize(row.url_slug) === subSlug;
        const genderOk = genderSlug
          ? normalize(row.gender) === genderSlug
          : !row.gender || normalize(row.gender) === "";
        const kidtypeOk = kidtypeSlug
          ? normalize(row.kidtype) === kidtypeSlug
          : true;

        return mainOk && subOk && genderOk && kidtypeOk;
      });

      if (subMatch) subNameNo = subMatch.display_name;
    }

    if (subNameNo && norskGender) {
      titleEl.textContent = `${subNameNo} – ${norskGender}`;
    } else if (subNameNo) {
      titleEl.textContent = subNameNo;
    } else if (match.display_name && norskGender) {
      titleEl.textContent = `${match.display_name} – ${norskGender}`;
    } else {
      titleEl.textContent = match.display_name || categoryParam;
    }

    document.title = `${titleEl.textContent} | BrandRadar`;

    let breadcrumbHtml = `<a href="index.html">Hjem</a> › `;

    if (norskGender) {
      breadcrumbHtml += `
        <a href="category.html?gender=${encodeURIComponent(genderParam || norskGender)}&category=${encodeURIComponent(categoryParam)}">
          ${norskGender}
        </a> ›
      `;
    } else {
      breadcrumbHtml += `
        <a href="category.html?category=${encodeURIComponent(categoryParam)}">
          ${match.display_name || categoryParam}
        </a> ›
      `;
    }

    breadcrumbHtml += `${subNameNo || match.display_name || categoryParam}`;
    breadcrumbEl.innerHTML = breadcrumbHtml;

    const filteredBase = products.filter(p => {
      const categoryOk = productMatchesCategory(p, categorySlug);
      const subOk = productMatchesSubcategory(p, subSlug);

      let genderOk = true;
      if (genderSlug) {
        const pGender = normalize(p.gender);
        genderOk = pGender === genderSlug || pGender === "unisex" || pGender === "";
      }

      return categoryOk && subOk && genderOk;
    });

    const filtered = window.BrandRadarOffersEngine
      ? await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(filteredBase)
      : filteredBase;

    if (!filtered.length) {
      emptyMessage.style.display = "block";
      return;
    }

    emptyMessage.style.display = "none";
    populateBrandFilter(filtered);

    function applyFiltersAndSort() {
      let result = [...filtered];

      if (brandFilter.value !== "all") {
        result = result.filter(p => p.brand === brandFilter.value);
      }

      if (priceFilter.value !== "all") {
        if (priceFilter.value === "1000+") {
          result = result.filter(p => getEffectivePrice(p) >= 1000);
        } else {
          const [min, max] = priceFilter.value.split("-").map(Number);
          result = result.filter(p => {
            const price = getEffectivePrice(p);
            return price >= min && price <= max;
          });
        }
      }

      if (discountFilter.checked) {
        result = result.filter(p => {
          if (p.offer_summary?.hasOffers) return true;
          return hasDiscountFallback(p);
        });
      }

      switch (sortSelect.value) {
        case "price-asc":
          result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
          break;
        case "price-desc":
          result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
          break;
        case "rating-desc":
          result.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
          break;
      }

      renderProducts(result);
      updateFilterTags(applyFiltersAndSort);
    }

    bindFilterEvents(applyFiltersAndSort);
    setupMobileFilterToggle();
    applyFiltersAndSort();

    setTimeout(() => {
      if (typeof updateFavoriteCounter === "function") {
        updateFavoriteCounter();
      }
    }, 50);
  } catch (err) {
    console.error("❌ Category error:", err);
  }
});
