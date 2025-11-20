// ======================================================
// ✅ BrandRadar – Forside (Picks + Trending Now + Top Brands)
// Full sync mot BrandRadarProdukter for Trending Now
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script loaded");

  // --------------------------------------------------
  // 0. Konstanter
  // --------------------------------------------------
  const PRODUCTS_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const PRODUCTS_TAB = "BrandRadarProdukter";

  // --------------------------------------------------
  // 1. Hjelpefunksjoner for pris / rabatt
  // --------------------------------------------------
  function parseNumber(val) {
    if (!val) return NaN;
    // støtter "1 399", "1399", "1,399", "1399,90"
    const clean = String(val).replace(/\s/g, "").replace(",", ".");
    return parseFloat(clean);
  }

  function formatPrice(num) {
    if (isNaN(num)) return "";
    // Norsk format, f.eks 1 119
    return Math.round(num).toLocaleString("nb-NO");
  }

  function buildPriceBlock(product) {
    const fullPrice = parseNumber(product.price);
    const discount = parseNumber(product.discount);
    const hasDiscount = !isNaN(fullPrice) && !isNaN(discount) && discount > 0;

    if (isNaN(fullPrice)) return "";

    let newPrice = fullPrice;
    if (hasDiscount) {
      newPrice = fullPrice * (1 - discount / 100);
    }

    const main = `<span class="price-main">${formatPrice(newPrice)} kr</span>`;

    if (!hasDiscount) {
      return `<div class="price-row">${main}</div>`;
    }

    return `
      <div class="price-row">
        ${main}
        <span class="old-price">${formatPrice(fullPrice)} kr</span>
        <span class="discount-badge">-${Math.round(discount)}%</span>
      </div>
    `;
  }

  function buildRatingBlock(product) {
    const rating = (product.rating || "").trim();
    if (!rating) return "";
    return `
      <div class="rating-row">
        <span class="rating-star">★</span>
        <span class="rating-value">${rating}</span>
      </div>
    `;
  }

  /**
   * Bygger et premium produktkort (samme stil som kategori/brands).
   * Brukes i "Trending Right Now".
   */
  function makeProductCard(product, highlightReason) {
    const id = (product.id || product.ID || "").toString().trim();
    const image =
      product.image_url ||
      product.image1 ||
      product.image ||
      "";
    const title = product.product_name || product.title || "";
    const brand = product.brand || "";
    const priceHtml = buildPriceBlock(product);
    const ratingHtml = buildRatingBlock(product);
    const titleAttr = highlightReason ? ` title="${highlightReason}"` : "";

    if (!id) {
      console.warn("🟡 Produkt mangler id i BrandRadarProdukter:", product);
    }

    return `
      <a class="product-card" href="product.html?id=${encodeURIComponent(id)}"${titleAttr}>
        <div class="product-image-wrapper">
          <img src="${image}" alt="${title}">
        </div>
        <div class="product-info">
          <p class="brand">${brand}</p>
          <h3>${title}</h3>
          ${ratingHtml}
          ${priceHtml}
        </div>
      </a>
    `;
  }

  // --------------------------------------------------
  // 2. FEATURED PICKS (CSV – fra news/picks sheet)
  // --------------------------------------------------
  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

  const featuredGrid = document.getElementById("featured-grid");

  if (featuredGrid) {
    try {
      const res = await fetch(CSV_URL);
      const csv = await res.text();

      const rows = csv.trim().split("\n").map(r => r.split(","));
      const headers = rows[0];

      const items = rows.slice(1).map(row => {
        const obj = {};
        row.forEach((val, i) => (obj[headers[i]] = val.trim()));
        return obj;
      });

      const featured = items.filter(
        p => (p.featured || "").toLowerCase() === "true"
      );

      if (!featured.length) {
        featuredGrid.innerHTML = "<p>Ingen utvalgte produkter akkurat nå.</p>";
      } else {
        featuredGrid.innerHTML = "";

        featured.forEach(p => {
          const cleanProduct = {
            id: p.product_name.replace(/\s+/g, "_"),
            title: p.product_name,
            brand: p.brand,
            price: p.price,
            image_url: p.image_url,
            product_url: p.link,
            description: p.reason
          };

          const card = document.createElement("div");
          card.className = "product-card";

          card.innerHTML = `
            <div class="fav-icon">
              <svg viewBox="0 0 24 24" class="heart-icon">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 
                2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 
                3.41.81 4.5 2.09C13.09 3.81 
                14.76 3 16.5 3 19.58 3 22 
                5.42 22 8.5c0 3.78-3.4 
                6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>

            <div class="product-image-wrapper">
              <img src="${cleanProduct.image_url}" alt="${cleanProduct.title}">
            </div>

            <div class="product-info">
              <p class="brand">${cleanProduct.brand}</p>
              <h3>${cleanProduct.title}</h3>
              ${
                cleanProduct.price
                  ? `<div class="price-row"><span class="price-main">${cleanProduct.price} kr</span></div>`
                  : ""
              }
            </div>
          `;

          card.addEventListener("click", e => {
            if (!e.target.closest(".fav-icon")) {
              window.location.href = `product.html?id=${cleanProduct.id}`;
            }
          });

          featuredGrid.appendChild(card);
        });
      }
    } catch (err) {
      console.error("❌ Klarte ikke laste Featured Picks:", err);
      featuredGrid.innerHTML =
        "<p>Kunne ikke laste produktene akkurat nå.</p>";
    }
  }

  // --------------------------------------------------
  // 3. TRENDING NOW – peker til BrandRadarProdukter
  //     Sheet: TrendingNow (product_id, rank, highlight_reason, active)
  // --------------------------------------------------
  async function loadTrending() {
    const TREND_SHEET_ID = "13klEz2o7CZ0Q4mbm8WT_b1Sz7LMoJqcluyrFyg58uRc";
    const TREND_TAB = "TrendingNow";

    const trendUrl = `https://opensheet.elk.sh/${TREND_SHEET_ID}/${TREND_TAB}`;
    const productsUrl = `https://opensheet.elk.sh/${PRODUCTS_SHEET_ID}/${PRODUCTS_TAB}`;

    try {
      const [trendRes, productsRes] = await Promise.all([
        fetch(trendUrl),
        fetch(productsUrl)
      ]);

      const [trendData, products] = await Promise.all([
        trendRes.json(),
        productsRes.json()
      ]);

      console.log("🔥 TrendingNow:", trendData);
      console.log("📦 BrandRadarProdukter:", products);

      const container = document.getElementById("trending-grid");
      if (!container || !Array.isArray(trendData) || !Array.isArray(products))
        return;

      // Map alle produkter på id for kjapp lookup
      const productMap = {};
      products.forEach(p => {
        const pid = (p.id || p.ID || "").toString().trim();
        if (pid) productMap[pid] = p;
      });

      // Filtrer aktive og sorter på rank
      const activeTrending = trendData
        .filter(
          row => (row.active || "").toLowerCase() === "true"
        )
        .sort((a, b) => {
          const ra = parseInt(a.rank, 10) || 9999;
          const rb = parseInt(b.rank, 10) || 9999;
          return ra - rb;
        });

      container.innerHTML = "";

      activeTrending.forEach(row => {
        const pid = (row.product_id || "").toString().trim();
        const product = productMap[pid];

        if (!product) {
          console.warn(
            "⚠️ Trending-produkt finnes ikke i BrandRadarProdukter:",
            pid
          );
          return;
        }

        const cardHtml = makeProductCard(product, row.highlight_reason);
        container.insertAdjacentHTML("beforeend", cardHtml);
      });
    } catch (err) {
      console.error("❌ TrendingNow error:", err);
    }
  }

  // --------------------------------------------------
  // 4. TOP BRANDS (egen sheet – uendret logikk)
  // --------------------------------------------------
  async function loadTopBrands() {
    const SHEET_ID = "1n3mCxmTb42RnZ_sNvP5CnYdGjwYFkU5kmnI_BFyiNkU";
    const TAB = "TopBrands";
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${TAB}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      console.log("🔥 TopBrands:", data);

      const container = document.getElementById("brands-grid");
      if (!container || !Array.isArray(data)) return;

      container.innerHTML = "";

      data.forEach(item => {
        if ((item.active || "").toLowerCase() !== "true") return;

        const card = document.createElement("a");
        card.className = "topbrand-card";
        card.href = item.link;
        card.target = "_blank";

        card.innerHTML = `
          <img src="${item.logo}" alt="${item.brand_name}">
          <h3>${item.brand_name}</h3>
          <p>${item.description}</p>
        `;

        container.appendChild(card);
      });
    } catch (err) {
      console.error("❌ TopBrands error:", err);
    }
  }

  // --------------------------------------------------
  // 5. Kjør seksjonene
  // --------------------------------------------------
  loadTrending();
  loadTopBrands();
});




