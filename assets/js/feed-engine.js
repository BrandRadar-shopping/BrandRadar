// ======================================================
// BrandRadar Feed Engine
// Handles affiliate product feeds like StaybeautifulProducts
// Uses FeedCategoryRules as primary category mapping
// ======================================================

(function () {
  console.log("✅ feed-engine.js loaded");

  const AFFILIATE_FEEDS_SHEET_ID = "15AWVMF5UhOmGS8MLelmU7HmE0IXJn41Syop6KrbI6ME";
  const CATEGORY_RULES_TAB = "FeedCategoryRules";

  const FEEDS = {
    staybeautiful: {
      tab: "StaybeautifulProducts",
      source: "staybeautiful",
      affiliate_network: "partnerads",
      merchant_slug: "staybeautiful",
      merchant_name: "Staybeautiful",
      defaultCategory: "Selfcare",
      defaultSubcategory: "Ansikt"
    }
  };

  let categoryRulesCache = null;

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

  function normalizeText(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function normalizeStock(value) {
    const s = normalizeText(value);

    if (
      s.includes("in stock") ||
      s.includes("pa lager") ||
      s.includes("på lager") ||
      s === "instock" ||
      s === "in_stock"
    ) {
      return "in_stock";
    }

    if (
      s.includes("out of stock") ||
      s.includes("ikke pa lager") ||
      s.includes("ikke på lager") ||
      s === "outofstock" ||
      s === "out_of_stock"
    ) {
      return "out_of_stock";
    }

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

  async function loadCategoryRules() {
    if (categoryRulesCache) return categoryRulesCache;

    try {
      const rows = await fetchSheet(CATEGORY_RULES_TAB);

      categoryRulesCache = rows
        .filter((row) => parseBool(row.active))
        .map((row, index) => ({
          active: true,
          priority: parseNum(row.priority) ?? 9999,
          source: normalizeText(row.source),
          match_field: normalizeText(row.match_field || "all"),
          keyword: normalizeText(row.keyword),
          category: cleanText(row.category),
          subcategory: cleanText(row.subcategory),
          gender: cleanText(row.gender),
          negative_keywords: cleanText(row.negative_keywords)
            .split(",")
            .map((x) => normalizeText(x))
            .filter(Boolean),
          notes: cleanText(row.notes),
          _index: index
        }))
        .filter((rule) => rule.keyword && rule.category && rule.subcategory)
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a._index - b._index;
        });

      console.log("✅ FeedCategoryRules loaded:", categoryRulesCache.length);
      return categoryRulesCache;
    } catch (err) {
      console.warn("⚠️ Could not load FeedCategoryRules. Using fallback mapping.", err);
      categoryRulesCache = [];
      return categoryRulesCache;
    }
  }

  function getMatchValue(row, field) {
    const values = {
      title: row.title || row.product_name || row.name || "",
      raw_category: row.raw_category || row.category || "",
      category: row.category || row.raw_category || "",
      subcategory: row.subcategory || "",
      description: row.description || "",
      brand: row.brand || "",
      all: [
        row.raw_category,
        row.category,
        row.subcategory,
        row.title,
        row.product_name,
        row.name,
        row.brand,
        row.description
      ].filter(Boolean).join(" ")
    };

    return normalizeText(values[field] ?? values.all);
  }

  function ruleMatches(row, rule, source) {
    if (rule.source && rule.source !== normalizeText(source)) return false;

    const matchValue = getMatchValue(row, rule.match_field);
    const allValue = getMatchValue(row, "all");

    if (!matchValue && rule.keyword !== "*") return false;

    const blocked = rule.negative_keywords.some((negative) => {
      return negative && allValue.includes(negative);
    });

    if (blocked) return false;

    if (rule.keyword === "*") return true;

    return matchValue.includes(rule.keyword);
  }

  function mapByCategoryRules(row, source, rules) {
    const match = rules.find((rule) => ruleMatches(row, rule, source));

    if (!match) return null;

    return {
      category: match.category,
      subcategory: match.subcategory,
      gender: match.gender || cleanText(row.gender),
      matched_rule: {
        priority: match.priority,
        match_field: match.match_field,
        keyword: match.keyword,
        notes: match.notes
      }
    };
  }

  function mapStaybeautifulCategoryFallback(row) {
    const raw = normalizeText(row.raw_category || row.category || "");
    const title = normalizeText(row.title || row.product_name || "");
    const sub = normalizeText(row.subcategory || "");
    const desc = normalizeText(row.description || "");

    const coreText = `${raw} ${title} ${sub}`;
    const fullText = `${coreText} ${desc}`;

    function hasAny(text, words) {
      return words.some((word) => text.includes(normalizeText(word)));
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

    if (hasAny(coreText, ["hår", "har", "hair", "shampoo", "conditioner", "balsam", "hair mask", "scalp", "leave-in"])) {
      return { category: "Selfcare", subcategory: "Hår" };
    }

    if (hasAny(coreText, ["kropp", "body", "body lotion", "body cream", "hand cream", "håndkrem", "shower gel", "dusj"])) {
      return { category: "Selfcare", subcategory: "Kroppspleie" };
    }

    if (hasAny(coreText, ["sol", "sun", "spf", "sunscreen", "solkrem", "after sun"])) {
      return { category: "Selfcare", subcategory: "Solprodukter" };
    }

    if (
      !hasPerfumeNegative(coreText) &&
      (
        raw.includes("parfyme") ||
        raw.includes("perfume") ||
        raw.includes("fragrance") ||
        title.includes("eau de parfum") ||
        title.includes("eau de toilette") ||
        title.includes(" edp") ||
        title.includes(" edt")
      )
    ) {
      return { category: "Selfcare", subcategory: "Parfyme" };
    }

    if (hasAny(coreText, ["deodorant", "antiperspirant"])) {
      return { category: "Selfcare", subcategory: "Deodorant" };
    }

    if (hasAny(coreText, ["gift set", "gavesett"])) {
      return { category: "Selfcare", subcategory: "Gavesett" };
    }

    if (hasAny(coreText, ["skincare set", "hudpleiesett", "starter kit", "kit"])) {
      return { category: "Selfcare", subcategory: "Hudpleiesett" };
    }

    if (hasAny(coreText, ["travel", "reisestørrelse", "reisestorrelse", "mini"])) {
      return { category: "Selfcare", subcategory: "Reisestørrelser" };
    }

    if (
      hasAny(fullText, [
        "ansikt",
        "face",
        "facial",
        "hudpleie",
        "skincare",
        "serum",
        "cream",
        "krem",
        "moisturizer",
        "cleanser",
        "cleansing",
        "rens",
        "toner",
        "peeling",
        "mask",
        "retinol",
        "vitamin c"
      ])
    ) {
      return { category: "Selfcare", subcategory: "Ansikt" };
    }

    return { category: "Selfcare", subcategory: "Ansikt" };
  }

  function mapFallbackCategory(row, feedKey) {
    if (feedKey === "staybeautiful") {
      return mapStaybeautifulCategoryFallback(row);
    }

    const feed = FEEDS[feedKey] || {};

    return {
      category: cleanText(row.mapped_category) || cleanText(row.category) || feed.defaultCategory || "",
      subcategory: cleanText(row.subcategory) || feed.defaultSubcategory || "",
      gender: cleanText(row.gender)
    };
  }

  function normalizeFeedProduct(row, feedKey = "staybeautiful", rules = []) {
    const feed = FEEDS[feedKey] || {};
    const source = cleanText(row.source) || feed.source || feedKey;

    const ruleMapped = mapByCategoryRules(row, source, rules);
    const fallbackMapped = mapFallbackCategory(row, feedKey);
    const mapped = ruleMapped || fallbackMapped;

    const price = cleanText(row.price);
    const oldPrice = cleanText(row.old_price);
    const discount = createDiscount(price, oldPrice, row.discount);

    const idBase = cleanText(row.id);

    return {
      id: idBase ? `${source}_${idBase}` : "",
      original_id: idBase,

      brand: cleanText(row.brand),
      title: cleanText(row.title || row.product_name || row.name),
      product_name: cleanText(row.title || row.product_name || row.name),

      price,
      old_price: oldPrice,
      discount,

      image_url: cleanText(row.image_url),
      image2: cleanText(row.image2),
      image3: cleanText(row.image3),
      image4: cleanText(row.image4),

      product_url: cleanText(row.product_url),
      affiliate_url: cleanText(row.affiliate_url || row.product_url),

      category: mapped.category || feed.defaultCategory || "",
      mapped_category: mapped.category || feed.defaultCategory || "",
      raw_category: cleanText(row.raw_category || row.category),
      gender: mapped.gender || cleanText(row.gender),
      subcategory: mapped.subcategory || feed.defaultSubcategory || "",

      description: cleanText(row.description),
      short_description: cleanText(row.short_description),

      rating: cleanText(row.rating),

      stock_status: normalizeStock(row.stock_status),
      merchant_slug: cleanText(row.merchant_slug) || feed.merchant_slug || source,
      merchant_name: cleanText(row.merchant_name) || cleanText(row.merchant) || feed.merchant_name || "",
      merchant: cleanText(row.merchant) || feed.merchant_name || "",
      ean: cleanText(row.ean),

      source,
      affiliate_network: cleanText(row.affiliate_network) || feed.affiliate_network || "",

      matched_category_rule: ruleMapped?.matched_rule || null,
      is_feed_product: true
    };
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

    const [rows, rules] = await Promise.all([
      fetchSheet(feed.tab),
      loadCategoryRules()
    ]);

    let products = rows
      .map((row) => normalizeFeedProduct(row, feedKey, rules))
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

  function clearCategoryRulesCache() {
    categoryRulesCache = null;
  }

  window.BrandRadarFeedEngine = {
    feeds: FEEDS,
    loadFeed,
    loadAllFeeds,
    normalizeFeedProduct,
    loadCategoryRules,
    clearCategoryRulesCache
  };
})();
