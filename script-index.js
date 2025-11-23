// ======================================================
// ✅ BrandRadar – Forside (Elite v9 kort)
//  - Featured Picks (CSV)
//  - Trending Now (master + TrendingNow-ark)
//  - Top Brands This Week
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script (Elite v9) loaded");

  // ---------- KONSTANTER ----------
  const PICKS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

  const BRAND_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const BRAND_TAB = "BrandRadarProdukter";

  const TRENDING_SHEET_ID = "13klEz2o7CZ0Q4mbm8WT_b1Sz7LMoJqcluyrFyg58uRc";
  const TRENDING_TAB = "TrendingNow";

  const TOPBRANDS_SHEET_ID = "1n3mCxmTb42RnZ_sNvP5CnYdGjwYFkU5kmnI_BFyiNkU";
  const TOPBRANDS_TAB = "TopBrands";

  // ---------- FORMATTERING / HJELPERE ----------
  const nbFormatter = new Intl.NumberFormat("nb-NO");

  const cleanRatingRef =
    window.cleanRating ||
    function (value) {
      if (!value) return null;
      const n = parseFloat(
        value.toString().replace(",", ".").replace(/[^0-9.\-]/g, "")
      );
      return Number.isFinite(n) ? n : null;
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

  function formatPrice(n) {
    if (n == null) return "";
    return `${nbFormatter.format(Math.round(n))} kr`;
  }

  // Gjenbruker pris-logikken fra gammel index, men rendrer i Elite v9-markup
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

  // ======================================================
  // ⭐ ELITE V9 PRODUKTKORT – FELLES FOR INDEX
  // ======================================================
  function buildEliteCard(prod, options = {}) {
    const {
      showExcerpt = false,
      excerpt = "",
      tag = "",
      extraClasses = "",
      openExternal = false // true = åpne ekstern lenke, false = product.html
    } = options;

    if (typeof window.getProductName === "function") {
      prod.product_name = prod.product_name || window.getProductName(prod);
    }

    const pid =
      typeof window.resolveProductId === "function"
        ? window.resolveProductId(prod)
        : prod.id || prod.product_id || "";

    prod.id = pid;

    const ratingValue = cleanRatingRef(prod.rating);
    const { price, oldPrice, discount } = getPriceInfo(prod);

    const isFav =
      typeof window.isProductFavorite === "function" && pid
        ? window.isProductFavorite(pid)
        : false;

    const card = document.createElement("article");
    card.className = `product-card ${extraClasses}`.trim();

    card.innerHTML = `
      ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}

      <div class="fav-icon ${isFav ? "active" : ""}" aria-label="Legg til favoritt">
        <svg class="heart-icon" viewBox="0 0 24 24">
          <path d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.54 2 8.9 2 6.08 4.08 4 6.9 4c1.54 0 3.04.72 4 1.86C11.96 4.72 13.46 4 15 4c2.82 0 4.9 2.08 4.9 4.9 0 3.64-3.14 6.46-8.99 11.46l-1.81 1z"></path>
        </svg>
      </div>

      <img src="${prod.image_url || ""}" alt="${prod.product_name || ""}" loading="lazy">

      <div class="product-info">
        <p class="brand">${prod.brand || ""}</p>
        <h3 class="product-name">${prod.product_name || ""}</h3>

        ${
          showExcerpt && excerpt
            ? `<p class="tagline">${excerpt}</p>`
            : ""
        }
        ${
          tag
            ? `<p class="product-tag">${tag}</p>`
            : ""
        }

        <p class="rating">
          ${
            ratingValue
              ? `⭐ ${ratingValue.toFixed(1)}`
              : `<span style="color:#ccc;">–</span>`
          }
        </p>

        <div class="price-line">
          <span class="new-price">
            ${price != null ? formatPrice(price) : ""}
          </span>
          ${
            oldPrice != null
              ? `<span class="old-price">${formatPrice(oldPrice)}</span>`
              : ""
          }
        </div>
      </div>
    `;

    // Klikk på kort → enten ekstern lenke eller product.html
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-icon")) return;

      if (openExternal && prod.product_url) {
        window.open(prod.product_url, "_blank");
        return;
      }

      if (!pid) return;
      const idParam = encodeURIComponent(pid);
      window.location.href = `product.html?id=${idParam}`;
    });

    // Favoritt-klikk
    const favEl = card.querySelector(".fav-icon");
    favEl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof window.toggleFavorite === "function") {
        window.toggleFavorite(prod, favEl);
      }
    });

    return card;
  }

  // ======================================================
  // ⭐ FEATURED PICKS (fra CSV – grid)
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

      featured.forEach(p => {
        const product = {
          ...p,
          product_name: p.product_name || p.title || p.name || "",
          brand: p.brand || "",
          price: p.price || "",
          old_price: p.old_price || "",
          discount: p.discount || "",
          image_url: p.image_url || "",
          product_url: p.link || ""
        };

        if (typeof window.resolveProductId === "function") {
          product.id = window.resolveProductId(product);
        }

        const card = buildEliteCard(product, {
          showExcerpt: false,
          tag: "",
          extraClasses: "home-feature card-medium",
          openExternal: false // vi antar disse finnes i master og har product-page
        });

        grid.appendChild(card);
      });
    } catch (err) {
      console.error("❌ Klarte ikke laste Featured Picks:", err);
    }
  }

  // ======================================================
  // ⭐ TRENDING NOW (master + TrendingNow-ark)
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

      container.innerHTML = "";

      limited.forEach(({ row, product }) => {
        const enriched = {
          ...product,
          product_name: window.getProductName
            ? window.getProductName(product)
            : (product.product_name || product.title || product.name || ""),
          highlight_reason: row.highlight_reason || ""
        };

        if (typeof window.resolveProductId === "function") {
          enriched.id = window.resolveProductId(enriched);
        }

        const card = buildEliteCard(enriched, {
          showExcerpt: false,
          tag: enriched.highlight_reason,
          extraClasses: "trending-card card-medium",
          openExternal: false
        });

        container.appendChild(card);
      });

      initTrendingArrows();
    } catch (err) {
      console.error("❌ TrendingNow error:", err);
    }
  }

  // ======================================================
  // ⭐ PIL-NAVIGASJON FOR TRENDING (horisontal scroll)
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
  // ⭐ TOP BRANDS THIS WEEK
  // ======================================================
  async function loadTopBrands() {
    const container = document.getElementById("topbrands-grid");
    if (!container) return;

    try {
      const url = `https://opensheet.elk.sh/${TOPBRANDS_SHEET_ID}/${TOPBRANDS_TAB}`;
      const res = await fetch(url);
      const data = await res.json();

      container.innerHTML = "";

      data.forEach(item => {
        if (String(item.active || "").toLowerCase() !== "true") return;

        const card = document.createElement("a");
        card.className = "topbrand-card";
        card.href = item.link || "#";
        card.target = "_blank";

        card.innerHTML = `
          <img src="${item.logo || ""}" alt="${item.brand_name || ""}">
          <h3>${item.brand_name || ""}</h3>
          <p>${item.description || ""}</p>
        `;

        container.appendChild(card);
      });
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







