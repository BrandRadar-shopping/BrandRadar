// ======================================================
// BrandRadar Feed Sync
// Syncs affiliate feeds into Supabase
// Robust price parsing for Norwegian/European decimals
// ======================================================

(function () {
  console.log("🚀 feed-sync.js loaded");

  const SUPABASE_URL = window.SUPABASE_CONFIG?.url;
  const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing SUPABASE_CONFIG");
    return;
  }

  async function fetchFeedProducts() {
    if (!window.BrandRadarFeedEngine) {
      throw new Error("BrandRadarFeedEngine missing");
    }

    return await window.BrandRadarFeedEngine.loadAllFeeds({
      onlyInStock: true
    });
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
      // Example: 1.362,12 -> 1362.12
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (hasComma) {
      // Example: 1362,12 -> 1362.12
      s = s.replace(",", ".");
    } else if (hasDot) {
      const parts = s.split(".");

      // Example: 1.362 -> 1362
      if (parts.length > 2 || parts.at(-1)?.length === 3) {
        s = s.replace(/\./g, "");
      }
    }

    const n = Number(s);

    if (!Number.isFinite(n)) return null;
    if (n <= 0) return null;
    if (n > 1000000) return null;

    return Number(n.toFixed(2));
  }

  function parseRating(value) {
    if (value === null || value === undefined || value === "") return null;

    const n = Number(
      String(value)
        .replace(",", ".")
        .replace(/[^0-9.]/g, "")
    );

    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(5, n));
  }

  function parseDiscount(value) {
    if (value === null || value === undefined || value === "") return null;

    const n = Number(
      String(value)
        .replace(",", ".")
        .replace(/[^0-9.-]/g, "")
    );

    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n < 1 ? n * 100 : n);
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeProduct(product) {
    const price = parseMoney(product.price);
    const oldPrice = parseMoney(product.old_price);

    return {
      external_id: product.id || "",
      original_id: product.original_id || "",

      source: product.source || "",
      affiliate_network: product.affiliate_network || "",

      merchant_slug: product.merchant_slug || "",
      merchant_name: product.merchant_name || product.merchant || "",

      brand_slug: slugify(product.brand),
      brand_name: product.brand || "",

      title: product.title || product.product_name || "",
      description: product.description || product.short_description || "",
      short_description: product.short_description || "",

      category: product.category || "",
      subcategory: product.subcategory || "",
      gender: product.gender || "",

      price,
      old_price: oldPrice,
      discount: parseDiscount(product.discount),

      currency: "NOK",

      image_url: product.image_url || "",
      image2: product.image2 || "",
      image3: product.image3 || "",
      image4: product.image4 || "",

      product_url: product.product_url || "",
      affiliate_url: product.affiliate_url || product.product_url || "",

      stock_status: product.stock_status || "",

      rating: parseRating(product.rating),

      raw_category: product.raw_category || "",
      raw_subcategory: product.raw_subcategory || "",

      ean: product.ean || "",

      active: true,
      updated_at: new Date().toISOString()
    };
  }

  async function upsertProducts(products) {
    const chunkSize = 500;

    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);

      console.log(`📦 Syncing chunk ${i} → ${i + chunk.length}`);

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/products?on_conflict=external_id`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify(chunk)
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Supabase sync error:", errorText);
        throw new Error(errorText);
      }

      console.log(`✅ Synced ${chunk.length} products`);
    }
  }

  async function syncFeeds() {
    try {
      console.log("🚀 Starting BrandRadar feed sync...");

      const feedProducts = await fetchFeedProducts();

      console.log("📦 Feed products loaded:", feedProducts.length);

      const normalized = feedProducts
        .map(normalizeProduct)
        .filter((p) => p.external_id && p.title && p.price);

      console.log("📦 Normalized products:", normalized.length);

      await upsertProducts(normalized);

      console.log("✅ Feed sync complete");
      alert(`✅ Synced ${normalized.length} products to Supabase`);
    } catch (err) {
      console.error("❌ Feed sync failed:", err);
      alert("❌ Feed sync failed. Check console.");
    }
  }

  window.BrandRadarFeedSync = {
    syncFeeds,
    parseMoney
  };
})();
