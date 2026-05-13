const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SHEET_ID = "15AWVMF5UhOmGS8MLelmU7HmE0IXJn41Syop6KrbI6ME";
const FEED_TAB = "StaybeautifulProducts";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

function cleanText(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
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
  const s = cleanText(value).toLowerCase();

  if (
    s.includes("in stock") ||
    s.includes("på lager") ||
    s.includes("pa lager") ||
    s === "instock" ||
    s === "in_stock"
  ) {
    return "in_stock";
  }

  if (
    s.includes("out of stock") ||
    s.includes("ikke på lager") ||
    s.includes("ikke pa lager") ||
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

function normalizeProduct(row) {
  const originalId = cleanText(row.id || row.original_id);

  const source = "staybeautiful";

  const externalId = originalId
    ? `${source}_${originalId}`
    : "";

  const price = parseMoney(row.price);
  const oldPrice = parseMoney(row.old_price);

  return {
    external_id: externalId,
    original_id: originalId,

    source,
    affiliate_network:
      cleanText(row.affiliate_network) || "partnerads",

    merchant_slug:
      cleanText(row.merchant_slug) || "staybeautiful",

    merchant_name:
      cleanText(row.merchant_name || row.merchant) ||
      "Staybeautiful",

    brand_slug: slugify(row.brand),
    brand_name: cleanText(row.brand),

    title: cleanText(
      row.title ||
      row.product_name ||
      row.name
    ),

    description: cleanText(
      row.description ||
      row.short_description
    ),

    short_description: cleanText(
      row.short_description
    ),

    category:
      cleanText(row.category || row.mapped_category) ||
      "Selfcare",

    subcategory:
      cleanText(row.subcategory) || "Ansikt",

    gender: cleanText(row.gender),

    price,
    old_price: oldPrice,

    discount: createDiscount(
      price,
      oldPrice,
      row.discount
    ),

    currency: "NOK",

    image_url: cleanText(row.image_url),
    image2: cleanText(row.image2),
    image3: cleanText(row.image3),
    image4: cleanText(row.image4),

    product_url: cleanText(row.product_url),

    affiliate_url:
      cleanText(row.affiliate_url || row.product_url),

    stock_status: normalizeStock(row.stock_status),

    rating: parseNumber(row.rating),

    raw_category: cleanText(
      row.raw_category || row.category
    ),

    raw_subcategory: cleanText(
      row.raw_subcategory || row.subcategory
    ),

    ean: cleanText(row.ean),

    active: parseBool(row.active) !== false,

    updated_at: new Date().toISOString()
  };
}

async function fetchSheet(tab) {
  const url =
    `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(tab)}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Could not fetch ${tab}: ${res.status}`);
  }

  return await res.json();
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

      throw new Error(
        `Supabase ${table} upsert failed: ${text}`
      );
    }

    console.log(
      `Synced ${chunk.length} rows to ${table}`
    );
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

async function run() {
  console.log("Starting Staybeautiful sync...");

  const rows = await fetchSheet(FEED_TAB);

  console.log(
    `Fetched ${rows.length} rows from feed sheet`
  );

  const products = rows
    .map(normalizeProduct)
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

  console.log(
    `Normalized ${products.length} valid products`
  );

  const debugProduct = products.find(
    (p) =>
      p.external_id ===
      "staybeautiful_staybeautiful-222"
  );

  if (debugProduct) {
    console.log("Debug staybeautiful-222:", {
      title: debugProduct.title,
      price: debugProduct.price,
      old_price: debugProduct.old_price,
      discount: debugProduct.discount
    });
  }

  await supabaseUpsert(
    "products",
    products,
    "external_id"
  );

  const brands = buildBrands(products);

  await supabaseUpsert(
    "brands",
    brands,
    "slug"
  );

  console.log("Staybeautiful sync complete");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
