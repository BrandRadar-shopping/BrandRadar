const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SHEET_ID = "15AWVMF5UhOmGS8MLelmU7HmE0IXJn41Syop6KrbI6ME";
const FEED_TAB = "StaybeautifulProducts";
const CATEGORY_RULES_TAB = "FeedCategoryRules";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
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

function slugify(value) {
  return normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseMoney(value) {
  if (value === null || value === undefined || value === "") return null;

  let s = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/[^\d.,-]/g, "");

  if (!s) return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = s.replace(",", ".");
  }

  const n = Number(s);

  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > 1000000) return null;

  return Number(n.toFixed(2));
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(
    String(value)
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "")
  );

  return Number.isFinite(n) ? n : null;
}

function parseBool(value) {
  const s = cleanText(value).toLowerCase();

  return (
    s === "true" ||
    s === "1" ||
    s === "yes" ||
    s === "ja" ||
    s === "in_stock"
  );
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

  return s || "in_stock";
}

function createDiscount(price, oldPrice, existingDiscount) {
  const existing = parseNumber(existingDiscount);

  if (existing && existing > 0) {
    return Math.round(existing < 1 ? existing * 100 : existing);
  }

  if (price && oldPrice && oldPrice > price) {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  return null;
}

async function fetchSheet(tab) {
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(tab)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Could not fetch ${tab}: ${res.status}`);
  }

  return await res.json();
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

  if (hasAny(coreText, ["shampoo", "conditioner", "balsam", "hair mask", "hårkur", "scalp", "leave-in", "leave in", "haircare"])) {
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

function mapFallbackCategory(row) {
  return mapStaybeautifulCategoryFallback(row);
}

function normalizeProduct(row, rules = []) {
  const originalId = cleanText(row.id || row.original_id);
  const source = "staybeautiful";
  const externalId = originalId ? `${source}_${originalId}` : "";

  const price = parseMoney(row.price);
  const oldPrice = parseMoney(row.old_price);

  const ruleMapped = mapByCategoryRules(row, source, rules);
  const fallbackMapped = mapFallbackCategory(row);
  const mapped = ruleMapped || fallbackMapped;

  return {
    external_id: externalId,
    original_id: originalId,

    source,
    affiliate_network: cleanText(row.affiliate_network) || "partnerads",

    merchant_slug: cleanText(row.merchant_slug) || "staybeautiful",
    merchant_name: cleanText(row.merchant_name || row.merchant) || "Staybeautiful",

    brand_slug: slugify(row.brand),
    brand_name: cleanText(row.brand),

    title: cleanText(row.title || row.product_name || row.name),
    description: cleanText(row.description || row.short_description),
    short_description: cleanText(row.short_description),

    category: mapped.category || "Selfcare",
    subcategory: mapped.subcategory || "Ansikt",
    gender: mapped.gender || cleanText(row.gender),

    price,
    old_price: oldPrice,
    discount: createDiscount(price, oldPrice, row.discount),

    currency: "NOK",

    image_url: cleanText(row.image_url),
    image2: cleanText(row.image2),
    image3: cleanText(row.image3),
    image4: cleanText(row.image4),

    product_url: cleanText(row.product_url),
    affiliate_url: cleanText(row.affiliate_url || row.product_url),

    stock_status: normalizeStock(row.stock_status),

    rating: parseNumber(row.rating),

    raw_category: cleanText(row.raw_category || row.category),
    raw_subcategory: cleanText(row.raw_subcategory || row.subcategory),

    ean: cleanText(row.ean),

    matched_category_rule: ruleMapped?.matched_rule || null,

    active: cleanText(row.active)
      ? parseBool(row.active)
      : normalizeStock(row.stock_status) !== "out_of_stock",

    updated_at: new Date().toISOString()
  };
}

async function supabaseUpsert(table, rows, conflictColumn) {
  const chunkSize = 500;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const res = await fetch(
      `${SUPABASE_URL}/${table}?on_conflict=${conflictColumn}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(chunk)
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase ${table} upsert failed: ${text}`);
    }

    console.log(`Synced ${chunk.length} rows to ${table}`);
  }
}

function buildBrands(products) {
  const map = new Map();

  for (const product of products) {
    if (!product.brand_slug || !product.brand_name) continue;

    if (!map.has(product.brand_slug)) {
      map.set(product.brand_slug, {
        slug: product.brand_slug,
        name: product.brand_name,
        active: true,
        source: "products",
        is_luxury: false,
        updated_at: new Date().toISOString()
      });
    }
  }

  return [...map.values()];
}

async function loadCategoryRules() {
  const rows = await fetchSheet(CATEGORY_RULES_TAB).catch((err) => {
    console.warn("Could not load FeedCategoryRules. Using fallback mapping.", err);
    return [];
  });

  return rows
    .filter((row) => parseBool(row.active))
    .map((row, index) => ({
      active: true,
      priority: parseNumber(row.priority) ?? 9999,
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
}

async function run() {
  console.log("Starting Staybeautiful sync...");

  const [rows, rules] = await Promise.all([
    fetchSheet(FEED_TAB),
    loadCategoryRules()
  ]);

  console.log(`Fetched ${rows.length} rows from feed sheet`);
  console.log(`Fetched ${rules.length} category rules`);

  const products = rows
    .map((row) => normalizeProduct(row, rules))
    .filter((p) => {
      return (
        p.external_id &&
        p.title &&
        p.brand_name &&
        p.price &&
        p.image_url &&
        p.product_url
      );
    });

  console.log(`Normalized ${products.length} valid products`);

  const debugProducts = products
    .filter((p) =>
      [
        "staybeautiful_staybeautiful-222",
        "staybeautiful_staybeautiful-216",
        "staybeautiful_staybeautiful-11"
      ].includes(p.external_id)
    )
    .map((p) => ({
      external_id: p.external_id,
      title: p.title,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price,
      old_price: p.old_price,
      discount: p.discount,
      matched_category_rule: p.matched_category_rule
    }));

  console.log("Debug mapped products:", debugProducts);

  await supabaseUpsert("products", products, "external_id");

  const brands = buildBrands(products);
  await supabaseUpsert("brands", brands, "slug");

  console.log("Staybeautiful sync complete");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
