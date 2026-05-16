// ======================================================
// ✅ BrandRadar – Forside SUPABASE VERSION
// - Radar Picks fra news_picks + products
// - Trending Now fra news_trending + products
// - Top Brands fra brands
// - Ingen Google Sheets
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const t = window.BrandRadarLang?.t || ((key, fallback) => fallback || key);
  const supabase = window.BrandRadarSupabase;

  console.log("✅ Index script loaded – Supabase version");

  if (!supabase?.from) {
    console.error("❌ Supabase client mangler på index.html");
    return;
  }

  function parseNumber(val) {
    if (val == null || val === "") return null;
    const s = String(val)
      .replace(/\s/g, "")
      .replace(/[^\d,.\-]/g, "")
      .replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeProduct(p) {
    if (!p) return null;

    const id = p.external_id || p.original_id || p.id;
    if (!id) return null;

    return {
      ...p,
      id,
      product_id: id,
      title: p.title || p.product_name || "",
      product_name: p.product_name || p.title || "",
      brand: p.brand_name || p.brand || p.brand_slug || "",
      price: p.price ?? "",
      old_price: p.old_price ?? "",
      discount: p.discount ?? "",
      image_url: p.image_url || "",
      image2: p.image2 || p.image_2 || "",
      image3: p.image3 || p.image_3 || "",
      image4: p.image4 || p.image_4 || "",
      product_url: p.affiliate_url || p.product_url || "",
      affiliate_url: p.affiliate_url || p.product_url || "",
      category: p.category || "",
      main_category: p.category || "",
      subcategory: p.subcategory || "",
      rating: p.rating || "",
      source: p.source || "supabase",
      sheet_source: p.source || "supabase",
      is_supabase_product: true
    };
  }

  async function fetchControlledProducts(tableName, limit = 12) {
    const { data: rows, error: rowError } = await supabase
      .from(tableName)
      .select("*")
      .eq("active", true)
      .order("rank", { ascending: true })
      .limit(limit);

    if (rowError) throw rowError;

    const ids = [...new Set(
      (rows || [])
        .map(row => String(row.product_id || "").trim())
        .filter(Boolean)
    )];

    if (!ids.length) return [];

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*")
      .in("external_id", ids);

    if (productError) throw productError;

    const productMap = new Map(
      (products || []).map(p => [String(p.external_id || "").trim(), normalizeProduct(p)])
    );

    return (rows || [])
      .map(row => {
        const product = productMap.get(String(row.product_id || "").trim());
        if (!product) return null;

        return {
          ...product,
          highlight_reason:
            row.reason ||
            row.highlight_reason ||
            row.excerpt ||
            "",
          tag:
            row.label ||
            row.badge ||
            row.tag ||
            ""
        };
      })
      .filter(Boolean);
  }

  function renderProductCards(container, products, options = {}) {
    if (!container) return;

    container.innerHTML = "";

    products.forEach(product => {
      const card = window.BrandRadarProductCardEngine.createCard(product, {
        isLuxury: !!product.luxury,
        showBrand: true,
        showRating: options.showRating ?? false,
        enableFavorite: true,
        onNavigate: (p) => {
          const id = p.external_id || p.id || p.product_id || "";
          if (id) {
            window.location.href = `product.html?id=${encodeURIComponent(id)}`;
          }
        },
        favoriteProductFactory: (p) => ({
          id: p.external_id || p.id || p.product_id || "",
          title: p.title || p.product_name || t("unnamed_product", "Uten navn"),
          product_name: p.product_name || p.title || t("unnamed_product", "Uten navn"),
          brand: p.brand || p.brand_name || "",
          price: p.price,
          discount: p.discount || "",
          image_url: p.image_url || "",
          product_url: p.product_url || p.affiliate_url || "",
          category: p.category || "",
          rating: p.rating,
          luxury: !!p.luxury
        })
      });

      container.appendChild(card);
    });
  }

  async function loadFeaturedPicks() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;

    try {
      const products = await fetchControlledProducts("news_picks", 12);
      renderProductCards(grid, products, { showRating: false });
    } catch (err) {
      console.error("❌ Klarte ikke laste Radar Picks:", err);
      grid.innerHTML = "";
    }
  }

  async function loadTrendingNow() {
    const container = document.getElementById("trending-grid");
    if (!container) return;

    try {
      const products = await fetchControlledProducts("news_trending", 12);
      renderProductCards(container, products, { showRating: false });
      initTrendingArrows();
    } catch (err) {
      console.error("❌ TrendingNow error:", err);
      container.innerHTML = "";
    }
  }

  function initTrendingArrows() {
    const track = document.getElementById("trending-grid");
    const prev = document.getElementById("trendingPrev");
    const next = document.getElementById("trendingNext");

    if (!track || !prev || !next) return;

    const scrollAmount = 320;

    prev.addEventListener("click", () => {
      track.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      track.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }

  async function loadTopBrands() {
    const container = document.getElementById("topbrands-grid");
    if (!container) return;

    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("active", true)
        .eq("is_featured", true)
        .order("featured_sort", { ascending: true });

      if (error) throw error;

      container.innerHTML = "";

      if (!data?.length) {
        container.innerHTML = `<p>${t("no_featured_brands_now", "Ingen fremhevede brands akkurat nå.")}</p>`;
        return;
      }

      data.forEach(brand => {
        container.innerHTML += `
          <a
            class="topbrand-card"
            href="brand-page.html?brand=${encodeURIComponent(brand.slug)}"
            aria-label="${t("explore_brand", "Utforsk")} ${brand.name}"
            title="${brand.name}"
          >
            <div class="topbrand-logo">
              ${
                brand.logo_url
                  ? `<img src="${brand.logo_url}" alt="${brand.name}" loading="lazy">`
                  : `<span>${brand.name}</span>`
              }
            </div>

            <span class="topbrand-hover-cta" aria-hidden="true">
              ${t("explore_brand", "Explore brand")}
            </span>
          </a>
        `;
      });
    } catch (err) {
      console.error("❌ TopBrands error:", err);
    }
  }

  await loadFeaturedPicks();
  await loadTrendingNow();
  await loadTopBrands();

  if (typeof updateFavoriteCounter === "function") {
    updateFavoriteCounter();
  }
});
