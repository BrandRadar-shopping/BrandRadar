// ======================================================
// ✅ BrandRadar – Forside
// Bruker Product Card Engine + Offers Engine
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script loaded");

  // ---------- KONSTANTER ----------
  const PICKS_URL =
    "https://opensheet.elk.sh/18eu0oOvtxuteHRf7wR0WEkmQMfNYet2qHtQSCgrpbYI/picks";

  const BRAND_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const BRAND_TAB = "BrandRadarProdukter";

  const TRENDING_SHEET_ID = "13klEz2o7CZ0Q4mbm8WT_b1Sz7LMoJqcluyrFyg58uRc";
  const TRENDING_TAB = "TrendingNow";

  // ---------- FORMATTERING ----------
  function parseNumber(val) {
    if (val == null) return null;
    const s = String(val)
      .replace(/\s/g, "")
      .replace(/[^\d,.\-]/g, "")
      .replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  // ======================================================
  // ⭐ FAVORITT/NAVIGASJON FOR KORT
  // ======================================================

  function attachProductCardNavigation(container, productsInOrder) {
    const cards = container.querySelectorAll(".product-card");

    cards.forEach((card, idx) => {
      const product = productsInOrder[idx];
      if (!product) return;

      const pid = typeof resolveProductId === "function"
        ? resolveProductId(product)
        : (product.id || product.product_id || "");

      card.addEventListener("click", (e) => {
        const fav = e.target.closest(".fav-icon");

        if (fav) {
          e.stopPropagation();
          if (typeof toggleFavorite === "function") {
            const cleanProduct = {
              id: pid,
              product_name: product.title || product.product_name || product.name || "Uten navn",
              title: product.title || product.product_name || product.name || "Uten navn",
              brand: product.brand || "",
              price: product.price,
              discount: product.discount,
              image_url: product.image_url,
              product_url: product.product_url,
              category: product.category || "",
              rating: product.rating,
              luxury: false
            };
            toggleFavorite(cleanProduct, fav);
          }
          return;
        }

        const idParam = encodeURIComponent(pid);
        window.location.href = `product.html?id=${idParam}`;
      });
    });
  }

  // ======================================================
  // ⭐️ RADAR PICKS
  // ======================================================

  async function loadFeaturedPicks() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  try {
    const picksUrl = PICKS_URL;
    const productsUrl = `https://opensheet.elk.sh/${BRAND_SHEET_ID}/${BRAND_TAB}`;

    const [picksRes, productsRes] = await Promise.all([
      fetch(picksUrl),
      fetch(productsUrl)
    ]);

    if (!picksRes.ok) throw new Error(`Radar Picks fetch failed: ${picksRes.status}`);
    if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.status}`);

    const pickRows = await picksRes.json();
    const allProducts = await productsRes.json();

    const productById = {};
    allProducts.forEach(p => {
      if (!p.id) return;
      productById[String(p.id).trim()] = p;
    });

    const active = pickRows
      .filter(row => String(row.active || "").trim().toLowerCase() === "true")
      .map((row, index) => {
        const productId = String(row.product_id || row.id || "").trim();
        const product = productById[productId];

        if (!product) {
          console.warn(`⚠️ Radar Pick finnes ikke i BrandRadarProdukter: ${productId}`, row);
          return null;
        }

        return {
          row,
          product,
          rank: parseNumber(row.rank) || index + 1
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank);

    const baseProducts = active.map(({ row, product }) => ({
      ...product,
      id: product.id || product.product_id || "",
      product_name: product.title || product.product_name || product.name || "Uten navn",
      title: product.title || product.product_name || product.name || "Uten navn",
      highlight_reason: row.reason || ""
    }));

    const enrichedProducts =
      window.BrandRadarOffersEngine
        ? await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(baseProducts)
        : baseProducts;

    grid.innerHTML = "";

    enrichedProducts.forEach(product => {
      const card = window.BrandRadarProductCardEngine.createCard(product, {
        isLuxury: false,
        showBrand: true,
        showRating: false,
        enableFavorite: true,
        onNavigate: (p) => {
          const id = typeof resolveProductId === "function"
            ? resolveProductId(p)
            : (p.id || p.product_id || "");

          if (id) {
            window.location.href = `product.html?id=${encodeURIComponent(id)}`;
          }
        },
        favoriteProductFactory: (p) => ({
          id: p.id || p.product_id || "",
          title: p.title || p.product_name || p.name || "Uten navn",
          product_name: p.title || p.product_name || p.name || "Uten navn",
          brand: p.brand || "",
          price: p.price,
          discount: p.discount || "",
          image_url: p.image_url || "",
          product_url: p.product_url || "",
          category: p.category || "",
          rating: p.rating,
          luxury: false
        })
      });

      grid.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Klarte ikke laste Radar Picks:", err);
    grid.innerHTML = "";
  }
}

  // ======================================================
  // ⭐ TRENDING NOW
  // ======================================================

  async function loadTrendingNow() {
    const container = document.getElementById("trending-grid");
    if (!container) return;

    try {
      const trendingUrl = `https://opensheet.elk.sh/${TRENDING_SHEET_ID}/${TRENDING_TAB}`;
      const productsUrl = `https://opensheet.elk.sh/${BRAND_SHEET_ID}/${BRAND_TAB}`;

      const [trendingRes, productsRes] = await Promise.all([
        fetch(trendingUrl),
        fetch(productsUrl)
      ]);

      const trendingRows = await trendingRes.json();
      const allProducts = await productsRes.json();

      const productById = {};
      allProducts.forEach(p => {
        if (!p.id) return;
        productById[String(p.id).trim()] = p;
      });

      const active = trendingRows
        .filter(r => String(r.active || "").toLowerCase() === "true")
        .map(r => ({
          row: r,
          product: productById[String(r.product_id || "").trim()]
        }))
        .filter(x => x.product);

      active.sort((a, b) => {
        const ra = parseNumber(a.row.rank) || 9999;
        const rb = parseNumber(b.row.rank) || 9999;
        return ra - rb;
      });

      const limited = active.slice(0, 10);

      const baseProducts = limited.map(({ row, product }) => ({
        ...product,
        product_name: product.title || product.product_name || product.name || "Uten navn",
        id: product.id || product.product_id || "",
        highlight_reason: row.highlight_reason
      }));

      const enrichedProducts =
        window.BrandRadarOffersEngine
          ? await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(baseProducts)
          : baseProducts;

      const orderedProducts = [];
      container.innerHTML = "";

      enrichedProducts.forEach(product => {
        const card = window.BrandRadarProductCardEngine.createCard(product, {
          isLuxury: false,
          showBrand: true,
          showRating: false,
          enableFavorite: true,
          onNavigate: (p) => {
            const id = typeof resolveProductId === "function"
              ? resolveProductId(p)
              : (p.id || p.product_id || "");
            window.location.href = `product.html?id=${encodeURIComponent(id)}`;
          },
          favoriteProductFactory: (p) => ({
            id: p.id || p.product_id || "",
            title: p.title || p.product_name || p.name || "Uten navn",
            product_name: p.title || p.product_name || p.name || "Uten navn",
            brand: p.brand || "",
            price: p.price,
            discount: p.discount || "",
            image_url: p.image_url || "",
            product_url: p.product_url || "",
            category: p.category || "",
            rating: p.rating,
            luxury: false
          })
        });

        container.appendChild(card);
        orderedProducts.push(product);
      });

      attachProductCardNavigation(container, orderedProducts);
      initTrendingArrows();
    } catch (err) {
      console.error("❌ TrendingNow error:", err);
    }
  }

  // ======================================================
  // ⭐ PIL-NAVIGASJON FOR TRENDING
  // ======================================================

  function initTrendingArrows() {
    const track = document.getElementById("trending-grid");
    const prev = document.getElementById("trendingPrev");
    const next = document.getElementById("trendingNext");

    if (!track || !prev || !next) {
      console.warn("⚠️ Pilene ble ikke funnet i DOM");
      return;
    }

    const scrollAmount = 320;

    prev.addEventListener("click", () => {
      track.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      track.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }

  // ======================================================
  // ⭐ TOP BRANDS
  // ======================================================

  async function loadTopBrands() {
    const url = "https://opensheet.elk.sh/1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw/Ark 1";

    try {
      const res = await fetch(url);
      const data = await res.json();

      const highlights = data.filter(
        b => (b.highlight || "").toLowerCase() === "yes"
      );

      highlights.sort((a, b) =>
        a.brand.localeCompare(b.brand, "no", { sensitivity: "base" })
      );

      const container = document.getElementById("topbrands-grid");
      if (!container) return;

      container.innerHTML = "";

      if (highlights.length === 0) {
        container.innerHTML = "<p>Ingen fremhevede brands akkurat nå.</p>";
        return;
      }

      highlights.forEach(b => {
        container.innerHTML += `
          <a
            class="topbrand-card"
            href="brand-page.html?brand=${encodeURIComponent(b.brand)}"
            aria-label="Utforsk ${b.brand}"
            title="${b.brand}"
          >
            <div class="topbrand-logo">
              <img src="${b.logo || ""}" alt="${b.brand}" loading="lazy">
            </div>

            <span class="topbrand-hover-cta" aria-hidden="true">
              Explore brand
            </span>
          </a>
        `;
      });
    } catch (err) {
      console.error("❌ TopBrands error:", err);
    }
  }

  // ======================================================
  // RUN EVERYTHING
  // ======================================================

  await loadFeaturedPicks();
  await loadTrendingNow();
  await loadTopBrands();
});






