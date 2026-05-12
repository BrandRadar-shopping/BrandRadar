// ======================================================
// BrandRadar Feed Sync
// Syncs affiliate feeds into Supabase
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

    const products = await window.BrandRadarFeedEngine.loadAllFeeds({
      onlyInStock: true
    });

    return products;
  }

  function normalizeProduct(product) {
    return {
      external_id: product.id || "",
      original_id: product.original_id || "",

      title: product.title || "",
      brand: product.brand || "",

      category: product.category || "",
      subcategory: product.subcategory || "",
      gender: product.gender || "",

      description: product.description || "",
      short_description: product.short_description || "",

      price: parseFloat(product.price) || 0,
      old_price: parseFloat(product.old_price) || null,
      discount: parseInt(product.discount) || 0,

      image_url: product.image_url || "",
      image2: product.image2 || "",
      image3: product.image3 || "",
      image4: product.image4 || "",

      product_url: product.product_url || "",
      affiliate_url: product.affiliate_url || "",

      merchant_slug: product.merchant_slug || "",
      merchant_name: product.merchant_name || "",

      stock_status: product.stock_status || "",
      affiliate_network: product.affiliate_network || "",

      raw_category: product.raw_category || "",

      source: product.source || "",
      ean: product.ean || "",

      rating: product.rating || "",

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

      const normalized = feedProducts.map(normalizeProduct);

      await upsertProducts(normalized);

      console.log("✅ Feed sync complete");
      alert(`✅ Synced ${normalized.length} products to Supabase`);
    } catch (err) {
      console.error("❌ Feed sync failed:", err);
      alert("❌ Feed sync failed. Check console.");
    }
  }

  window.BrandRadarFeedSync = {
    syncFeeds
  };
})();
