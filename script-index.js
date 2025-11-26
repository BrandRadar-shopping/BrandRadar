// ======================================================
// ✅ BrandRadar – Forside (Picks + Trending Now + Top Brands)
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script loaded");

  // ---------- KONSTANTER ----------
  const PICKS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

  const BRAND_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const BRAND_TAB = "BrandRadarProdukter";

  const TRENDING_SHEET_ID = "13klEz2o7CZ0Q4mbm8WT_b1Sz7LMoJqcluyrFyg58uRc";
  const TRENDING_TAB = "TrendingNow";

  // ---------- FORMATTERING ----------
  const nbFormatter = new Intl.NumberFormat("nb-NO");

  function parseNumber(val) {
    if (val == null) return null;
    const s = String(val)
      .replace(/\s/g, "")
      .replace(/[^\d,.\-]/g, "")
      .replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function formatPrice(n) {
    if (n == null) return "";
    return `${nbFormatter.format(Math.round(n))} kr`;
  }

  function getPriceInfo(p) {
    let price = parseNumber(p.price);
    let oldPrice = parseNumber(p.old_price);
    let discount = parseNumber(p.discount);

    if (!price && oldPrice && discount) price = oldPrice * (1 - discount / 100);
    if (price && !oldPrice && discount) oldPrice = price / (1 - discount / 100);
    if (price && oldPrice && !discount && oldPrice > price)
      discount = ((oldPrice - price) / oldPrice) * 100;

    if (discount != null) discount = Math.round(discount);

    if (oldPrice && price && oldPrice <= price) {
      oldPrice = null;
      discount = null;
    }

    return { price, oldPrice, discount };
  }

  function buildPriceBlock(p) {
    const { price, oldPrice, discount } = getPriceInfo(p);
    const mainPrice = price ? formatPrice(price) : null;

    let html = `<div class="price-row">`;
    if (mainPrice) html += `<span class="price-main">${mainPrice}</span>`;
    if (oldPrice) html += `<span class="old-price">${formatPrice(oldPrice)}</span>`;
    html += `</div>`;

    if (discount) {
      html =
        `<div class="price-wrapper">` +
        html +
        `<span class="discount-pill">-${discount}%</span>` +
        `</div>`;
    }

    return html;
  }

  // ======================================================
  // ⭐ PRODUKTKORT (ELITE DESIGN – FELLES FOR INDEX)
  // ======================================================

  function buildProductCardMarkup(p) {
    const name = getProductName(p);
    const id = resolveProductId(p);
    const priceBlock = buildPriceBlock(p);

    return `
      <div class="product-card" data-id="${id}">
        <div class="fav-icon" data-id="${id}">
          <svg class="heart-icon" viewBox="0 0 24 24">
            <path d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.54 2 8.9 2 6.08 4.08 4 6.9 4c1.54 0 3.04.72 4 1.86C11.96 4.72 13.46 4 15 4c2.82 0 4.9 2.08 4.9 4.9 0 3.64-3.14 6.46-8.99 11.46l-1.81 1z"></path>
          </svg>
        </div>

        <div class="product-image-wrapper">
          <img src="${p.image_url || ""}" alt="${name}">
        </div>

        <div class="product-info">
          <p class="brand">${p.brand || ""}</p>
          <h3 class="product-title">${name}</h3>
          ${priceBlock}
        </div>
      </div>
    `;
  }

  // ======================================================
  // ⭐ NAVIGASJON + FAVORITTHJERTE
  // ======================================================

  function attachProductCardNavigation(container, productsInOrder) {
    const cards = container.querySelectorAll(".product-card");
    const favorites = getFavorites();
    const favIdSet = new Set(favorites.map(f => String(f.id)));

    cards.forEach((card, idx) => {
      const product = productsInOrder[idx];
      if (!product) return;

      const pid = resolveProductId(product);
      const favEl = card.querySelector(".fav-icon");

      if (favEl && favIdSet.has(String(pid))) {
        favEl.classList.add("active");
      }

      card.addEventListener("click", e => {
        const fav = e.target.closest(".fav-icon");

        if (fav) {
          e.stopPropagation();
          toggleFavorite(product, fav);
          return;
        }

        const idParam = encodeURIComponent(pid);
        window.location.href = `product.html?id=${idParam}`;
      });
    });
  }

  // ======================================================
  // FEATURED PICKS
  // ======================================================

  async function loadFeaturedPicks() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;

    try {
      const res = await fetch(PICKS_CSV_URL);
      const csvText = await res.text();

      const rows = csvText.trim().split("\n").map(r => r.split(","));
      const headers = rows[0].map(h => h.trim());

      const items = rows.slice(1).map(row => {
        const obj = {};
        row.forEach((val, i) => (obj[headers[i]] = val.trim()));
        return obj;
      });

      const featured = items.filter(
        p => (p.featured || "").toLowerCase() === "true"
      );

      grid.innerHTML = "";
      const orderedProducts = [];

      featured.forEach(p => {
        const product = {
          ...p,
          product_name: p.product_name || p.title || p.name,
          id: resolveProductId(p)
        };

        const wrapper = document.createElement("div");
        wrapper.innerHTML = buildProductCardMarkup(product);
        const cardEl = wrapper.firstElementChild;

        orderedProducts.push(product);
        grid.appendChild(cardEl);
      });

      attachProductCardNavigation(grid, orderedProducts);
    } catch (err) {
      console.error("❌ Klarte ikke laste Featured Picks:", err);
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
      const orderedProducts = [];

      container.innerHTML = "";

      limited.forEach(({ row, product }) => {
        const enriched = {
          ...product,
          product_name: getProductName(product),
          id: resolveProductId(product),
          highlight_reason: row.highlight_reason
        };

        const wrapper = document.createElement("div");
        wrapper.innerHTML = buildProductCardMarkup(enriched);
        const cardEl = wrapper.firstElementChild;

        container.appendChild(cardEl);
        orderedProducts.push(enriched);
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
// ⭐ TOP BRANDS (from BrandRadar_Brands – Ark 1)
// ======================================================

async function loadTopBrands() {
  const url = "https://opensheet.elk.sh/1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw/Ark 1";

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("✅ TopBrands rådata:", data);

    // 1. Filtrer: highlight === "yes"
    const highlights = data.filter(b => 
      (b.highlight || "").toLowerCase() === "yes"
    );

    // 2. Sorter alfabetisk på brandnavn
    highlights.sort((a, b) =>
      a.brand.localeCompare(b.brand, "no", { sensitivity: "base" })
    );

    // 3. Finne container
    const container = document.getElementById("topbrands-grid");
    container.innerHTML = "";

    // 4. Tom liste → return
    if (highlights.length === 0) {
      container.innerHTML = "<p>Ingen fremhevede brands akkurat nå.</p>";
      return;
    }

    // 5. Bygg markup
    highlights.forEach(b => {
      container.innerHTML += `
        <a class="topbrand-card" href="brand-page.html?brand=${encodeURIComponent(b.brand)}">
          <div class="topbrand-logo">
            <img src="${b.logo || ""}" alt="${b.brand}">
          </div>

          <h3 class="topbrand-name">${b.brand}</h3>

          <p class="topbrand-tagline">
            ${b.description?.trim() || "Utforsk dette merket"}
          </p>
        </a>
      `;
    });

    console.log("✅ Top Brands lastet inn:", highlights.length);

  } catch (err) {
    console.error("❌ TopBrands error:", err);
  }
}


  // ======================================================
  // RUN EVERYTHING
  // ======================================================

  loadFeaturedPicks();
  loadTrendingNow();
  loadTopBrands();
});







