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

  // ✅ ENESTE ENDRING
  const dealsUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/deals`;

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
  const resetFiltersBtn = document.querySelector(".reset-filters-btn");
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
    gymcorner: ["gymcorner", "supplements", "supplement", "sportsnutrition", "nutrition", "kosttilskudd", "utstyr"],
    shoes: ["shoes", "sko", "footwear"],
    clothing: ["clothing", "klaer", "apparel", "clothes"],
    accessories: ["accessories", "tilbehor", "accessory"],
    selfcare: ["selfcare", "beauty", "hudpleie", "hygiene", "skincare"]
  };

  const SUBCATEGORY_ALIAS_MAP = {
    proteinbarer: ["proteinbarer", "proteinbar", "proteinbars", "protein-bar", "protein-bars", "bars", "soft-bar", "soft-bars"],
    proteinpulver: ["proteinpulver", "protein-pulver", "proteinpowder", "protein-powder", "whey", "whey-protein", "isolate"],
    kreatin: ["kreatin", "creatine"],
    pwo: ["pwo", "pre-workout", "preworkout", "pre-workout-pwo"],
    "vitaminer-mineraler": ["vitaminer-mineraler", "vitaminer", "mineraler", "vitamins", "minerals", "vitamins-minerals"],
    drikke: ["drikke", "drink", "drinks", "beverage", "beverages"],
    aminosyrer: ["aminosyrer", "amino", "amino-acids", "aminoacids", "bcaa", "eaa"],

    "gensere-hoodies": ["gensere-hoodies", "gensere", "hoodies", "hoodie", "genser", "sweatshirt", "sweatshirts"],
    "t-skjorter": ["t-skjorter", "t-skjorte", "tshirt", "tshirts", "tee", "tees"],
    bukser: ["bukser", "bukse", "pants", "trousers"],
    jeans: ["jeans", "denim"],
    jakker: ["jakker", "jakke", "jacket", "jackets"],
    gymwear: ["gymwear", "trainingwear", "workout-clothes", "treningstoy", "treningsklaer"],
    "dress-pentoy": ["dress-pentoy", "dress", "pentoy", "formalwear", "suit", "suits"],
    "undertoy-sokker": ["undertoy-sokker", "undertoy", "sokker", "underwear", "socks"],
    sport: ["sport", "sportswear"],
    onepiece: ["onepiece", "one-piece"],
    "jakker-blazere": ["jakker-blazere", "jakker", "blazere", "blazer", "blazers"],
    cardigans: ["cardigans", "cardigan"],
    "t-skjorter-topper": ["t-skjorter-topper", "t-skjorter", "topper", "topper", "top", "tops"],
    kjoler: ["kjoler", "kjole", "dress", "dresses"],
    kaper: ["kaper", "kape", "coat", "coats"],
    skjort: ["skjort", "skjorts"],
    skjorts: ["skjorts", "skjort"],
    skjorts2: ["skjort"],
    skjort3: ["skjort"],
    skjort4: ["skjort"],
    skjort5: ["skjort"],
    skjort6: ["skjort"],
    skjort7: ["skjort"],
    skjort8: ["skjort"],
    skjort9: ["skjort"],
    skjort10: ["skjort"],
    skjort11: ["skjort"],
    skjort12: ["skjort"],
    skjort13: ["skjort"],
    skjort14: ["skjort"],
    skjort15: ["skjort"],
    skjort16: ["skjort"],
    skjort17: ["skjort"],
    skjort18: ["skjort"],
    skjort19: ["skjort"],
    skjort20: ["skjort"],
    skjort21: ["skjort"],
    skjort22: ["skjort"],
    skjort23: ["skjort"],
    skjort24: ["skjort"],
    skjort25: ["skjort"],
    skjort26: ["skjort"],
    skjort27: ["skjort"],
    skjort28: ["skjort"],
    skjort29: ["skjort"],
    skjort30: ["skjort"],
    skjort31: ["skjort"],
    skjort32: ["skjort"],
    skjort33: ["skjort"],
    skjort34: ["skjort"],
    skjort35: ["skjort"],
    skjort36: ["skjort"],
    skjort37: ["skjort"],
    skjort38: ["skjort"],
    skjort39: ["skjort"],
    skjort40: ["skjort"],
    skjort41: ["skjort"],
    skjort42: ["skjort"],
    skjort43: ["skjort"],
    skjort44: ["skjort"],
    skjort45: ["skjort"],
    skjort46: ["skjort"],
    skjort47: ["skjort"],
    skjort48: ["skjort"],
    skjort49: ["skjort"],
    skjort50: ["skjort"],
    skjort51: ["skjort"],
    skjort52: ["skjort"],
    skjort53: ["skjort"],
    skjort54: ["skjort"],
    skjort55: ["skjort"],
    skjort56: ["skjort"],
    skjort57: ["skjort"],
    skjort58: ["skjort"],
    skjort59: ["skjort"],
    skjort60: ["skjort"],
    skjort61: ["skjort"],
    skjort62: ["skjort"],
    skjort63: ["skjort"],
    skjort64: ["skjort"],
    skjort65: ["skjort"],
    skjort66: ["skjort"],
    skjort67: ["skjort"],
    skjort68: ["skjort"],
    skjort69: ["skjort"],
    skjort70: ["skjort"],
    skjort71: ["skjort"],
    skjort72: ["skjort"],
    skjort73: ["skjort"],
    skjort74: ["skjort"],
    skjort75: ["skjort"],
    skjort76: ["skjort"],
    skjort77: ["skjort"],
    skjort78: ["skjort"],
    skjort79: ["skjort"],
    skjort80: ["skjort"],
    skjort81: ["skjort"],
    skjort82: ["skjort"],
    skjort83: ["skjort"],
    skjort84: ["skjort"],
    skjort85: ["skjort"],
    skjort86: ["skjort"],
    skjort87: ["skjort"],
    skjort88: ["skjort"],
    skjort89: ["skjort"],
    skjort90: ["skjort"],
    skjort91: ["skjort"],
    skjort92: ["skjort"],
    skjort93: ["skjort"],
    skjort94: ["skjort"],
    skjort95: ["skjort"],
    skjort96: ["skjort"],
    skjort97: ["skjort"],
    skjort98: ["skjort"],
    skjort99: ["skjort"],
    skjort100: ["skjort"],
    skjort: ["skjort", "skjorts", "skirt", "skirts"],
    sneakers: ["sneakers", "sneaker"],
    "boots-stovler": ["boots-stovler", "boots", "stovler", "boot", "stovel"],
    stovletter: ["stovletter", "stovlett", "ankle-boots"],
    "snoresho-pensko": ["snoresho-pensko", "pensko", "snoresho", "dress-shoes", "formal-shoes"],
    "flate-sko": ["flate-sko", "flate", "flats", "flat-shoes"],
    "sandaler-apne-sko": ["sandaler-apne-sko", "sandaler", "apne-sko", "sandals"],
    "sandaler-badesko": ["sandaler-badesko", "sandaler", "badesko", "slides", "flip-flops"],
    tofler: ["tofler", "toffel", "slippers"],
    sportssko: ["sportssko", "running-shoes", "training-shoes", "sport-shoes"],
    tursko: ["tursko", "hiking-shoes", "trail-shoes"],

    elektronikk: ["elektronikk", "electronics"],
    strikker: ["strikker", "bands", "resistance-bands"],
    hjemmetrening: ["hjemmetrening", "home-workout", "home-training"],
    kampsport: ["kampsport", "combat-sports", "martial-arts"],
    massasjeverktoy: ["massasjeverktoy", "massage-tools", "recovery-tools"],
    "vannflasker-shakers": ["vannflasker-shakers", "vannflasker", "shakers", "water-bottles", "shaker"],
    "vekter-apparater": ["vekter-apparater", "vekter", "apparater", "weights", "machines"],
    treningsbag: ["treningsbag", "gym-bag", "training-bag"],
    vektvest: ["vektvest", "weighted-vest"],

    "luer-caps": ["luer-caps", "luer", "caps", "cap", "beanies"],
    "torklaer-skjerf": ["torklaer-skjerf", "torklaer", "skjerf", "scarves", "scarf"],
    "hansker-votter": ["hansker-votter", "hansker", "votter", "gloves", "mittens"],
    "vesker-kofferter": ["vesker-kofferter", "vesker", "kofferter", "bags", "luggage"],
    smykker: ["smykker", "jewelry", "jewellery"],
    solbriller: ["solbriller", "sunglasses"],
    klokker: ["klokker", "watch", "watches"],
    belter: ["belter", "belt", "belts"],
    lommeboker: ["lommeboker", "lommebok", "wallet", "wallets"],
    "slips-tilbehor": ["slips-tilbehor", "slips", "ties", "tie"],
    vesker: ["vesker", "veske", "bag", "bags"],
    "hatter-hodeskjerf": ["hatter-hodeskjerf", "hatter", "hodeskjerf", "hats", "headscarves"],
    "skjerf-sjal": ["skjerf-sjal", "skjerf", "sjal", "shawls"],
    "harpynt": ["harpynt", "hair-accessories", "hair-accessory"],
    "bag-charms": ["bag-charms", "bag-charm"],

    ansikt: ["ansikt", "face"],
    kroppspleie: ["kroppspleie", "bodycare", "body-care"],
    deodorant: ["deodorant", "deo"],
    "aktiv-hudpleie": ["aktiv-hudpleie", "active-skincare"],
    "k-beauty": ["k-beauty", "kbeauty"],
    solprodukter: ["solprodukter", "sun-care", "suncare"],
    "beauty-tech": ["beauty-tech", "beautytech"],
    "mamma-barn": ["mamma-barn", "mom-baby"],
    hudpleiesett: ["hudpleiesett", "skincare-set", "skincare-sets"],
    reisestorrelser: ["reisestorrelser", "travel-size", "travel-sizes"],
    hudpleietilbehor: ["hudpleietilbehor", "skincare-accessories"],
    munnhygiene: ["munnhygiene", "oral-care"],
    parfyme: ["parfyme", "perfume", "fragrance"],
    barbering: ["barbering", "shaving"],
    "skjegg-bart": ["skjegg-bart", "skjegg", "bart", "beard", "moustache"],
    hudpleie: ["hudpleie", "skincare"],
    har: ["har", "hair"],
    gavesett: ["gavesett", "gift-set", "gift-sets"],

    "yttertoy": ["yttertoy", "outerwear"],
    "gensere-cardigans": ["gensere-cardigans", "gensere", "cardigans", "genser", "cardigan"],
    "sport-trening": ["sport-trening", "sport", "trening", "sportswear", "training"],
    "barn-98-134": ["barn-98-134", "98-134"],
    "ungdom-140-176": ["ungdom-140-176", "140-176"],
    "barn-21-34": ["barn-21-34", "21-34"],
    "ungdom-35-42": ["ungdom-35-42", "35-42"],
    "alle-accessories": ["alle-accessories", "all-accessories"],
    "bager-sekker": ["bager-sekker", "bager", "sekker", "bags", "backpacks"],
    "luer-capser": ["luer-capser", "luer", "capser", "caps"],
    hansker: ["hansker", "gloves"],
    "klokker-smykker": ["klokker-smykker", "klokker", "smykker", "watches", "jewelry"]
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

  function splitSlugTokens(value) {
    return normalize(value)
      .split("-")
      .map(part => part.trim())
      .filter(Boolean);
  }

  function buildLooseVariants(value) {
    const base = normalize(value);
    if (!base) return [];

    const variants = new Set([base]);
    const compact = base.replace(/-/g, "");
    if (compact && compact !== base) variants.add(compact);

    if (base.endsWith("er")) variants.add(base.slice(0, -2));
    if (base.endsWith("s")) variants.add(base.slice(0, -1));

    return [...variants].filter(Boolean);
  }

  function getExpandedAliases(slug, map) {
    const rawAliases = getAliases(slug, map);
    const expanded = new Set();

    rawAliases.forEach(alias => {
      buildLooseVariants(alias).forEach(v => expanded.add(v));
    });

    return [...expanded].filter(Boolean);
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
      product.brand,
      product.tags,
      product.tag,
      product.gender,
      product.material,
      product.type
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ");
  }

  function productMatchesCategory(product, targetCategorySlug) {
    const aliases = getExpandedAliases(targetCategorySlug, CATEGORY_ALIAS_MAP);
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

    const aliases = getExpandedAliases(targetSubSlug, SUBCATEGORY_ALIAS_MAP);
    const tokens = splitSlugTokens(targetSubSlug);

    const pSub = normalize(product.subcategory);
    const pCategory = normalize(product.category);
    const pMainCategory = normalize(product.main_category);
    const text = getProductSearchText(product);

    const hasDirectAliasMatch = aliases.some(alias =>
      pSub === alias ||
      pCategory === alias ||
      pMainCategory === alias ||
      text.includes(alias)
    );

    if (hasDirectAliasMatch) return true;

    if (tokens.length >= 2) {
      const matchedTokens = tokens.filter(token => {
        const loose = buildLooseVariants(token);
        return loose.some(v =>
          pSub === v ||
          pCategory === v ||
          pMainCategory === v ||
          text.includes(v)
        );
      });

      if (matchedTokens.length >= Math.max(2, tokens.length - 1)) {
        return true;
      }
    }

    if (tokens.length === 1) {
      const loose = buildLooseVariants(tokens[0]);
      return loose.some(v =>
        pSub === v ||
        pCategory === v ||
        pMainCategory === v ||
        text.includes(v)
      );
    }

    return false;
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
  const active = parseBool(row.active);
  const lowestPrice = parseNumber(row.lowest_price);
  const oldPrice = parseNumber(row.old_price);
  const discount = parseNumber(row.discount);

  // 🔥 VIKTIG: filtrer bort produkter uten deals
  if (!active || !lowestPrice) return null;

  const cleanUrl = (value) => {
    const url = String(value || "").trim();
    return /^https?:\/\//i.test(url) ? url : "";
  };

  const buyUrl =
    cleanUrl(row.affiliate_url) ||
    cleanUrl(row.store_url) ||
    cleanUrl(row.product_url);

  return {
    id: String(row.product_id || row.id || `deal_${index}`).trim(),
    product_id: String(row.product_id || row.id || "").trim(),
    title: row.product_name || row.title || "",
    brand: row.brand || "",
    price: lowestPrice,
    old_price: oldPrice || "",
    discount: discount || "",
    image_url: row.image_url || "",
    product_url: buyUrl,
    category: row.deal_category || row.category || "",
    rating: row.rating || "",
    priority: parseNumber(row.priority) || index + 1,
    featured: parseBool(row.featured),
    badge_text: row.badge_text || "Deal",
    merchant_slug: row.merchant_slug || "",
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

    if (resetFiltersBtn) {
      resetFiltersBtn.hidden = activeCount === 0;
    }

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

    resetFiltersBtn?.addEventListener("click", () => {
      if (brandFilter) brandFilter.value = "all";
      if (priceFilter) priceFilter.value = "all";
      if (discountFilter) discountFilter.checked = false;
      if (sortSelect) sortSelect.value = "featured";
      applyFiltersAndSort();
    });
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

 function getDealPriceParts(product) {
  const price = parseNumber(product.price);
  const oldPrice = parseNumber(product.old_price);

  let discount = parseNumber(product.discount);

  if ((!discount || discount <= 0) && price && oldPrice && oldPrice > price) {
    discount = Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  if ((!oldPrice || oldPrice <= price) && price && discount && discount > 0) {
    const estimatedOld = price / (1 - discount / 100);
    return {
      price,
      oldPrice: estimatedOld,
      discount: Math.round(discount)
    };
  }

  return {
    price,
    oldPrice,
    discount: discount ? Math.round(discount) : 0
  };
}

function buildDealHighlights(products) {
  if (!products.length) return null;

  const sorted = [...products].sort((a, b) => {
    const aParts = getDealPriceParts(a);
    const bParts = getDealPriceParts(b);

    if (bParts.discount !== aParts.discount) {
      return bParts.discount - aParts.discount;
    }

    return getEffectivePrice(a) - getEffectivePrice(b);
  });

  const picks = sorted.slice(0, 2);
  if (!picks.length) return null;

  function attachNavigate(el, product) {
    el.addEventListener("click", () => {
      if (product.product_url) {
        window.open(product.product_url, "_blank", "noopener");
        return;
      }

      const id = product.id || product.product_id || "";
      if (id) {
        window.location.href = `product.html?id=${encodeURIComponent(id)}`;
      }
    });
  }

  function buildFeaturedCard(product, index) {
    const parts = getDealPriceParts(product);
    const safeBrand = product.brand || "BrandRadar";
    const safeTitle = product.title || product.product_name || product.name || "Produkt";
    const image = product.image_url || "";

    const card = document.createElement("article");
    card.className = "deals-featured-card";

    card.innerHTML = `
      <div class="deals-featured-card__media">
        ${image ? `<img src="${image}" alt="${safeTitle}" loading="lazy">` : ""}
      </div>

      <div class="deals-featured-card__content">
        <p class="deals-featured-card__brand">${safeBrand}</p>
        <h3>${safeTitle}</h3>
        <p class="deals-featured-card__desc">
          ${index === 0 ? "Et sterkt tilbud valgt ut for deg." : "Populær deal akkurat nå."}
        </p>

        <div class="deals-featured-card__price-row">
          ${parts.price ? `<span class="deals-featured-card__price">${formatPrice(parts.price)}</span>` : ""}
          ${parts.oldPrice ? `<span class="deals-featured-card__oldprice">${formatPrice(parts.oldPrice)}</span>` : ""}
          ${parts.discount ? `<span class="deals-featured-card__discount">-${parts.discount}%</span>` : ""}
        </div>

        <div class="deals-featured-card__actions">
          <span class="deals-featured-card__button">Kjøp nå</span>
          <span class="deals-featured-card__heart">♡</span>
        </div>

        <p class="deals-featured-card__note">Tilbudet kan endres hos butikken.</p>
      </div>
    `;

    attachNavigate(card, product);
    return card;
  }

  const shell = document.createElement("section");
  shell.className = "deals-featured-section";

  shell.innerHTML = `
    <div class="deals-section-head">
      <h3>Utvalgte deals</h3>
      <a href="#deals-feed" class="deals-section-link">Se alle <span>→</span></a>
    </div>
  `;

  const grid = document.createElement("div");
  grid.className = "deals-featured-grid";

  picks.forEach((product, index) => {
    grid.appendChild(buildFeaturedCard(product, index));
  });

  shell.appendChild(grid);
  return shell;
}

function buildDealsTopZone(heroEl, highlightsEl) {
  const section = document.createElement("section");
  section.className = "deals-top-zone";

  const hero = document.createElement("section");
  hero.className = "deals-clean-hero";

  hero.innerHTML = `
    <div class="deals-clean-hero__content">
      <div class="deals-clean-hero__text">
        <h2>De beste dealsene</h2>
        <p>Oppdag sesongens beste tilbud fra dine favorittbrands.</p>

        <div class="deals-clean-benefits">
          <div class="deals-clean-benefit">
            <span class="deals-clean-benefit__icon">◇</span>
            <div>
              <strong>Eksklusive deals</strong>
              <span>Utvalgte tilbud samlet på ett sted</span>
            </div>
          </div>

          <div class="deals-clean-benefit">
            <span class="deals-clean-benefit__icon">□</span>
            <div>
              <strong>Nye deals hver uke</strong>
              <span>Friske tilbud kontinuerlig</span>
            </div>
          </div>

          <div class="deals-clean-benefit">
            <span class="deals-clean-benefit__icon">⌾</span>
            <div>
              <strong>Enkel oversikt</strong>
              <span>Sammenlign priser raskt</span>
            </div>
          </div>
        </div>
      </div>

      <div class="deals-clean-hero__visual" aria-hidden="true">
        <img
          src="assets/img/deals/deals-hero.png"
          alt=""
          class="deals-clean-hero__image"
          loading="eager"
        >
      </div>
    </div>
  `;

  const quickNav = document.createElement("section");
  quickNav.className = "deals-quick-nav";
  quickNav.innerHTML = `
  <button class="is-active" type="button" data-deal-filter="all">Alle deals</button>
  <button type="button" data-deal-filter="Shoes">Sko</button>
  <button type="button" data-deal-filter="clothing">Klær</button>
  <button type="button" data-deal-filter="supplements">Gym</button>
  <button type="button" data-deal-filter="Accessories">Tilbehør</button>
  <button class="deals-quick-nav__highlight" type="button" data-deal-sort="discount-desc">Best rabatt</button>
`;

  section.appendChild(hero);
  section.appendChild(quickNav);

  if (highlightsEl) {
    section.appendChild(highlightsEl);
  }

  return section;
}

function insertBeforeFilterBar(elements = []) {
  if (!filterBar) return;
  const parent = filterBar.parentNode;
  if (!parent) return;

  elements.filter(Boolean).forEach(el => {
    parent.insertBefore(el, filterBar);
  });

  const productsSection = document.querySelector(".category-products");
  if (productsSection) {
    productsSection.id = "deals-feed";
  }
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

products = rows
  .map(mapDealRowToProduct)
  .filter(Boolean) // fjerner null (ingen deals)
  .sort((a, b) => {
    // featured først
    if (a.featured !== b.featured) return a.featured ? -1 : 1;

    // deretter priority
    return (a.priority || 999) - (b.priority || 999);
  });
        pageTitle = "Ukens Deals";
        breadcrumbLabel = "Deals";

        collectionHero = createCollectionHero({
          eyebrow: "BrandRadar Deals",
          title: "De beste dealene akkurat nå",
          text: "Her finner du tilbud vi mener er verdt å få med seg — samlet på ett sted, så det blir enklere å finne gode kjøp.",
          metaPills: [
            "Utvalgte deals",
            "Oppdatert nå",
            "Enklere oversikt"
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

        let dealQuickFilter = "all";
        let dealQuickSort = "";
      
      function applyFiltersAndSort() 
      if (collectionSlug === "deals") {
  document.querySelectorAll(".deals-quick-nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".deals-quick-nav button").forEach(b => {
        b.classList.remove("is-active");
      });

      btn.classList.add("is-active");

      dealQuickFilter = btn.dataset.dealFilter || "all";
      dealQuickSort = btn.dataset.dealSort || "";

      applyFiltersAndSort();
    });
  });
}
      {
        let result = [...enrichedProducts];

        if (collectionSlug === "deals") {
  if (dealQuickFilter !== "all") {
    result = result.filter(p => normalize(p.category) === normalize(dealQuickFilter));
  }
}

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

          if (collectionSlug === "deals" && dealQuickSort === "discount-desc") {
  result.sort((a, b) => (parseNumber(b.discount) || 0) - (parseNumber(a.discount) || 0));
}
        
        if (!(collectionSlug === "deals" && dealQuickSort === "discount-desc")) {
  switch (sortSelect?.value) { {
          case "price-asc":
            result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
            break;
          case "price-desc":
            result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
            break;
          case "rating-desc":
            result.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
            break;
        }}

        renderProducts(result, collectionSlug);
        updateFilterTags(applyFiltersAndSort);
        updateMobileFilterToggleSummary();
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
      updateMobileFilterToggleSummary();
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
