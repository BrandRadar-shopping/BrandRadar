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

  const TOPBRANDS_SHEET_ID = "1n3mCxmTb42RnZ_sNvP5CnYdGjwYFkU5kmnI_BFyiNkU";
  const TOPBRANDS_TAB = "TopBrands";

  // ---------- HJELPEFUNKSJONER ----------
  const nbFormatter = new Intl.NumberFormat("nb-NO");

  function parseNumber(val) {
    if (val == null) return null;
    const s = String(val).replace(/\s/g, "").replace(/[^\d,.\-]/g, "").replace(",", ".");
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

  function deriveId(raw) {
    if (!raw) return "";
    return String(raw).trim().replace(/\s+/g, "_");
  }

  // ======================================================
  // ⭐ FAVORITTLOGIKK (GLOBAL)
  // ======================================================

  function toggleFavorite(product, heartEl) {
    if (!product || !product.id) return;
    const pid = String(product.id);

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const index = favorites.indexOf(pid);

    if (index === -1) {
      favorites.push(pid);
      heartEl.classList.add("active");
    } else {
      favorites.splice(index, 1);
      heartEl.classList.remove("active");
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateFavoriteCounter();
  }

  function updateFavoriteCounter() {
    const counter = document.querySelector(".favorite-counter");
    if (!counter) return;

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    counter.textContent = favorites.length;
  }

  updateFavoriteCounter();

  // ======================================================
  // ⭐ PRODUKTKORT (KORREKT MARKUP)
  // ======================================================

  function buildProductCardMarkup(p) {
    const id = p.id || p.product_id || deriveId(p.product_name);
    const priceBlock = buildPriceBlock(p);

    return `
      <div class="product-card" data-id="${id}">

        <div class="fav-icon" data-id="${id}">
          <svg class="heart-icon" viewBox="0 0 24 24">
            <path d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.54 2 8.9 2 6.08 4.08 4 6.9 4c1.54 0 3.04.72 4 1.86C11.96 4.72 13.46 4 15 4c2.82 0 4.9 2.08 4.9 4.9 0 3.64-3.14 6.46-8.99 11.46l-1.81 1z"></path>
          </svg>
        </div>

        <div class="product-image-wrapper">
          <img src="${p.image_url || ""}" alt="${p.product_name || ""}">
        </div>

        <div class="product-info">
          <p class="brand">${p.brand || ""}</p>

          <!-- ⭐ KORREKT PRODUKTNAVN -->
          <h3 class="product-title">${p.product_name || ""}</h3>

          ${priceBlock}
        </div>
      </div>
    `;
  }

  // ======================================================
  // ⭐ KORTKLIKK (produkt + favoritt)
  // ======================================================

  function attachProductCardNavigation(container, productsInOrder) {
    const cards = container.querySelectorAll(".product-card");

    cards.forEach((card, idx) => {
      const product = productsInOrder[idx];
      if (!product) return;

      const id = encodeURIComponent(
        product.id || product.product_id || deriveId(product.product_name)
      );

      card.addEventListener("click", e => {
        const fav = e.target.closest(".fav-icon");

        if (fav) {
          toggleFavorite(product, fav);
          return;
        }

        window.location.href = `product.html?id=${id}`;
      });

      // ⭐ MARKER SOM FAVORITT VED RELOAD
      const favEl = card.querySelector(".fav-icon");
      const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
      if (favorites.includes(String(product.id))) {
        favEl.classList.add("active");
      }
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

      const featured = items.filter(p => (p.featured || "").toLowerCase() === "true");

      if (!featured.length) {
        grid.innerHTML = "<p>Ingen utvalgte produkter akkurat nå.</p>";
        return;
      }

      grid.innerHTML = "";
      const orderedProducts = [];

      featured.forEach(p => {
        const product = {
          id: p.id || deriveId(p.product_name),
          product_name: p.product_name,
          brand: p.brand,
          price: p.price,
          old_price: p.old_price,
          discount: p.discount,
          image_url: p.image_url
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
  // ⭐ TRENDING NOW (riktig versjon med produktnavn + hjerte)
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
        if (p.id) productById[String(p.id).trim()] = p;
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

      limited.forEach(({ product }) => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = buildProductCardMarkup(product);
        const cardEl = wrapper.firstElementChild;

        container.appendChild(cardEl);
        orderedProducts.push(product);
      });

      attachProductCardNavigation(container, orderedProducts);
    } catch (err) {
      console.error("❌ TrendingNow error:", err);
    }
  }

  // ======================================================
  // TOP BRANDS
  // ======================================================

  async function loadTopBrands() {
    const container = document.getElementById("brands-grid");
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
  // KJØR ALLE SEKSJONENE
  // ======================================================

  loadFeaturedPicks();
  loadTrendingNow();
  loadTopBrands();
});






