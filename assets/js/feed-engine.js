// ======================================================
// BrandRadar Feed Engine
// Handles affiliate product feeds like StaybeautifulProducts
// ======================================================

(function () {
  console.log("✅ feed-engine.js loaded");

  const AFFILIATE_FEEDS_SHEET_ID = "15AWVMF5UhOmGS8MLelmU7HmE0IXJn41Syop6KrbI6ME";

  const FEEDS = {
    staybeautiful: {
      tab: "StaybeautifulProducts",
      source: "staybeautiful",
      affiliate_network: "partnerads",
      defaultCategory: "Selfcare"
    }
  };

  function parseBool(value) {
    const s = String(value || "").trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "ja";
  }

  function parseNum(value) {
    if (value == null || value === "") return null;

    const n = Number(
      String(value)
        .replace(/\s/g, "")
        .replace(/[^\d.,\-]/g, "")
        .replace(",", ".")
    );

    return Number.isFinite(n) ? n : null;
  }

  function cleanText(value) {
    return String(value || "").trim();
  }

  function normalizeStock(value) {
    const s = String(value || "").trim().toLowerCase();

    if (s.includes("in stock") || s.includes("på lager")) return "in_stock";
    if (s.includes("out of stock") || s.includes("ikke på lager")) return "out_of_stock";

    return s || "";
  }

  function createDiscount(price, oldPrice, existingDiscount) {
    const p = parseNum(price);
    const old = parseNum(oldPrice);
    const existing = parseNum(existingDiscount);

    if (existing != null && existing > 0) {
      return Math.round(existing);
    }

    if (p != null && old != null && old > p) {
      return Math.round(((old - p) / old) * 100);
    }

    return "";
  }

function mapStaybeautifulCategory(row) {
  const raw = cleanText(row.raw_category || row.category || "").toLowerCase();
  const title = cleanText(row.title || row.product_name || "").toLowerCase();
  const sub = cleanText(row.subcategory || "").toLowerCase();

  // Beskrivelse brukes kun som støtte, ikke som hovedgrunnlag.
  const desc = cleanText(row.description || "").toLowerCase();

  const coreText = `${raw} ${title} ${sub}`;
  const fullText = `${coreText} ${desc}`;

  function hasAny(text, words) {
    return words.some((word) => text.includes(word));
  }

  function hasPerfumeNegative(text) {
    return hasAny(text, [
      "parfymefri",
      "parfyme fri",
      "uten parfyme",
      "duftfri",
      "duft fri",
      "fragrance free",
      "fragrance-free",
      "perfume free",
      "perfume-free",
      "without fragrance",
      "without perfume"
    ]);
  }

  // ======================================================
  // 1) HÅR
  // ======================================================
  if (
    hasAny(coreText, [
      "hår",
      "har",
      "hair",
      "shampoo",
      "conditioner",
      "balsam",
      "hårkur",
      "harkur",
      "hair mask",
      "scalp",
      "leave-in",
      "leave in",
      "styling",
      "haircare"
    ])
  ) {
    return {
      category: "Selfcare",
      subcategory: "Hår"
    };
  }

  // ======================================================
  // 2) KROPP
  // ======================================================
  if (
    hasAny(coreText, [
      "kropp",
      "body",
      "bodycare",
      "body care",
      "body lotion",
      "body cream",
      "body oil",
      "hand cream",
      "håndkrem",
      "handkrem",
      "foot cream",
      "fotkrem",
      "shower gel",
      "dusj",
      "bath",
      "scrub"
    ])
  ) {
    return {
      category: "Selfcare",
      subcategory: "Kroppspleie"
    };
  }

  // ======================================================
  // 3) SOLPRODUKTER
  // ======================================================
  if (
    hasAny(coreText, [
      "sol",
      "sun",
      "spf",
      "suncare",
      "sun care",
      "sunscreen",
      "solkrem",
      "after sun",
      "aftersun",
      "self tan",
      "self-tan",
      "tanning"
    ])
  ) {
    return {
      category: "Selfcare",
      subcategory: "Solprodukter"
    };
  }

  // ======================================================
  // 4) PARFYME
  // VIKTIG:
  // Kun title/raw/subcategory. Ikke description.
  // Dette hindrer at "parfymefri" hudpleie blir parfyme.
  // ======================================================
  if (
    !hasPerfumeNegative(coreText) &&
    hasAny(coreText, [
      "parfyme",
      "perfume",
      "fragrance",
      "duft",
      "eau de parfum",
      "eau de toilette",
      "edp",
      "edt"
    ])
  ) {
    return {
      category: "Selfcare",
      subcategory: "Parfyme"
    };
  }

  // ======================================================
  // 5) DEODORANT
  // ======================================================
  if (
    hasAny(coreText, [
      "deodorant",
      "deo",
      "antiperspirant"
    ])
  ) {
    return {
      category: "Selfcare",
      subcategory: "Deodorant"
    };
  }

  // ======================================================
  // 6) HUDPLEIESETT / KIT
  // ======================================================
  if (
    hasAny(coreText, [
      "hudpleiesett",
      "skincare set",
      "skin care set",
      "gift set",
      "gavesett",
      "starter kit",
      "kit",
      "routine",
      "set"
    ])
  ) {
    return {
      category: "Selfcare",
      subcategory: "Hudpleiesett"
    };
  }

  // ======================================================
  // 7) REISESTØRRELSER
  // ======================================================
  if (
    hasAny(coreText, [
      "travel",
      "travel size",
      "reisestørrelse",
      "reisestorrelse",
      "mini",
      "minis",
      "small size"
    ])
  ) {
    return {
      category: "Selfcare",
      subcategory: "Reisestørrelser"
    };
  }

  // ======================================================
  // 8) ANSIKT / HUDPLEIE
  // Bruker fullText her, fordi beskrivelser ofte avslører ansikt/hudpleie.
  // Dette er default for Staybeautiful hvis ingenting annet matcher.
  // ======================================================
  if (
    hasAny(fullText, [
      "ansikt",
      "face",
      "facial",
      "hudpleie",
      "skincare",
      "skin care",
      "serum",
      "cream",
      "krem",
      "moisturizer",
      "moisturiser",
      "cleanser",
      "cleansing",
      "rens",
      "toner",
      "peeling",
      "mask",
      "maske",
      "eye cream",
      "øyekrem",
      "oyekrem",
      "dagkrem",
      "nattkrem",
      "anti-age",
      "anti age",
      "acne",
      "blemish",
      "exfoliant",
      "retinol",
      "hyaluronic",
      "collagen",
      "vitamin c"
    ])
  ) {
    return {
      category: "Selfcare",
      subcategory: "Ansikt"
    };
  }

  // ======================================================
  // 9) FALLBACK
  // Staybeautiful er hovedsakelig selfcare. Ukjente produkter bør
  // heller lande i Ansikt enn feilaktig Parfyme.
  // ======================================================
  return {
    category: "Selfcare",
    subcategory: "Ansikt"
  };
}  


  function normalizeFeedProduct(row, feedKey = "staybeautiful") {
    const feed = FEEDS[feedKey] || {};
    const mapped = mapStaybeautifulCategory(row);

    const price = cleanText(row.price);
    const oldPrice = cleanText(row.old_price);
    const discount = createDiscount(price, oldPrice, row.discount);

    const idBase = cleanText(row.id);
    const source = cleanText(row.source) || feed.source || feedKey;

    return {
      id: idBase ? `${source}_${idBase}` : "",
      original_id: idBase,

      brand: cleanText(row.brand),
      title: cleanText(row.title),
      product_name: cleanText(row.title),

      price,
      old_price: oldPrice,
      discount,

      image_url: cleanText(row.image_url),
      image2: cleanText(row.image2),
      image3: cleanText(row.image3),
      image4: cleanText(row.image4),

      product_url: cleanText(row.product_url),
      affiliate_url: cleanText(row.product_url),

      category: cleanText(row.mapped_category) || mapped.category || feed.defaultCategory || "",
      raw_category: cleanText(row.raw_category),
      gender: cleanText(row.gender),
      subcategory: cleanText(row.subcategory) || mapped.subcategory || "",

      description: cleanText(row.description),
      short_description: cleanText(row.short_description),

      rating: cleanText(row.rating),

      stock_status: normalizeStock(row.stock_status),
      merchant: cleanText(row.merchant),
      ean: cleanText(row.ean),

      source,
      affiliate_network: cleanText(row.affiliate_network) || feed.affiliate_network || "",

      is_feed_product: true
    };
  }

  async function fetchSheet(tab) {
    if (!AFFILIATE_FEEDS_SHEET_ID || AFFILIATE_FEEDS_SHEET_ID === "PASTE_SHEET_ID_HERE") {
      throw new Error("Missing AFFILIATE_FEEDS_SHEET_ID in feed-engine.js");
    }

    const url = `https://opensheet.elk.sh/${AFFILIATE_FEEDS_SHEET_ID}/${encodeURIComponent(tab)}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Could not load feed tab ${tab}: ${res.status}`);
    }

    return res.json();
  }

  async function loadFeed(feedKey = "staybeautiful", options = {}) {
    const feed = FEEDS[feedKey];

    if (!feed) {
      console.warn("Unknown feed:", feedKey);
      return [];
    }

    const {
      onlyInStock = true,
      limit = null
    } = options;

    const rows = await fetchSheet(feed.tab);

    let products = rows
      .map((row) => normalizeFeedProduct(row, feedKey))
      .filter((p) => p.id && p.title && p.product_url && p.image_url);

    if (onlyInStock) {
      products = products.filter((p) => p.stock_status === "in_stock");
    }

    if (limit && Number(limit) > 0) {
      products = products.slice(0, Number(limit));
    }

    return products;
  }

  async function loadAllFeeds(options = {}) {
    const keys = Object.keys(FEEDS);
    const all = [];

    for (const key of keys) {
      try {
        const products = await loadFeed(key, options);
        all.push(...products);
      } catch (err) {
        console.error(`❌ Failed loading feed ${key}:`, err);
      }
    }

    return all;
  }

  window.BrandRadarFeedEngine = {
    feeds: FEEDS,
    loadFeed,
    loadAllFeeds,
    normalizeFeedProduct,
    mapStaybeautifulCategory
  };
})();
