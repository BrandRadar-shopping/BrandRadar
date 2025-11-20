// ======================================================
// ✅ BrandRadar – Forside (Picks + Trending Now + Top Brands)
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script loaded");

  // ---------- KONSTANTER ----------
  const PICKS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

  // BrandRadarProdukter (MASTER)
  const BRAND_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const BRAND_TAB = "BrandRadarProdukter";

  // TrendingNow peker på BrandRadarProdukter vha product_id
  const TRENDING_SHEET_ID = "13klEz2o7CZ0Q4mbm8WT_b1Sz7LMoJqcluyrFyg58uRc";
  const TRENDING_TAB = "TrendingNow";

  // TopBrands egen sheet
  const TOPBRANDS_SHEET_ID = "1n3mCxmTb42RnZ_sNvP5CnYdGjwYFkU5kmnI_BFyiNkU";
  const TOPBRANDS_TAB = "TopBrands";

  // ---------- HJELPEFUNKSJONER (PRIS / FORMAT) ----------

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

  // Henter price / old_price / discount i sync
  function getPriceInfo(p) {
    let price = parseNumber(p.price);
    let oldPrice = parseNumber(p.old_price);
    let discount = parseNumber(p.discount);

    // Hvis vi har oldPrice + discount → beregn ny pris
    if (!price && oldPrice && discount) {
      price = oldPrice * (1 - discount / 100);
    }

    // Hvis vi har price + discount → beregn original pris
    if (price && !oldPrice && discount) {
      oldPrice = price / (1 - discount / 100);
    }

    // Hvis vi har både price + oldPrice → beregn discount
    if (price && oldPrice && !discount && oldPrice > price) {
      discount = ((oldPrice - price) / oldPrice) * 100;
    }

    if (discount != null) discount = Math.round(discount);

    // Sikre at oldPrice faktisk er høyere enn price
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
    if (mainPrice) {
      html += `<span class="price-main">${mainPrice}</span>`;
    }
    if (oldPrice) {
      html += `<span class="old-price">${formatPrice(oldPrice)}</span>`;
    }
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

  // Bygger et “Elite”-produktkort (samme stil som kategori/brands)
  function buildProductCardMarkup(p) {
    const id = p.id || p.product_id || deriveId(p.product_name);
    const priceBlock = buildPriceBlock(p);

    return `
      <div class="product-card" data-id="${id}">
        <div class="product-image-wrapper">
          <img src="${p.image_url || ""}" alt="${p.product_name || ""}">
        </div>
        <div class="product-info">
          <p class="brand">${p.brand || ""}</p>
          <h3>${p.product_name || ""}</h3>
          ${priceBlock}
        </div>
      </div>
    `;
  }

  // Klikk → product.html?id=...
  function attachProductCardNavigation(container, productsInOrder) {
    const cards = container.querySelectorAll(".product-card");
    cards.forEach((card, idx) => {
      const product = productsInOrder[idx];
      if (!product) return;
      const id = encodeURIComponent(product.id || product.product_id || deriveId(product.product_name));
      card.addEventListener("click", e => {
        // (Favoritt-ikon kan hoppes over senere om vi legger det inn)
        if (e.target.closest(".fav-icon")) return;
        window.location.href = `product.html?id=${id}`;
      });
    });
  }

  // ---------- FEATURED PICKS (CSV) ----------

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
          image_url: p.image_url,
          link: p.link,
          reason: p.reason
        };

        const wrapper = document.createElement("div");
        wrapper.innerHTML = buildProductCardMarkup(product);
        const cardEl = wrapper.firstElementChild;

        // Klikk → product.html
        cardEl.addEventListener("click", e => {
          if (e.target.closest(".fav-icon")) return;
          const id = encodeURIComponent(product.id);
          window.location.href = `product.html?id=${id}`;
        });

        orderedProducts.push(product);
        grid.appendChild(cardEl);
      });
    } catch (err) {
      console.error("❌ Klarte ikke laste Featured Picks:", err);
      grid.innerHTML = "<p>Kunne ikke laste produktene akkurat nå.</p>";
    }
  }

 // ---------- TRENDING NOW (ROLLBACK TIL ORIGINAL GRID-VERSJON) ----------

async function loadTrendingNow() {
  const container = document.getElementById("trending-grid");  // ← tilbake til original
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

    if (!Array.isArray(trendingRows) || !trendingRows.length) return;

    const productById = {};
    allProducts.forEach(p => {
      if (!p.id) return;
      productById[String(p.id).trim()] = p;
    });

    const active = trendingRows
      .filter(r => String(r.active || "").toLowerCase() === "true")
      .map(r => {
        const key = String(r.product_id || "").trim();
        return { row: r, product: productById[key] };
      })
      .filter(x => x.product);

    // sorter etter rank
    active.sort((a, b) => {
      const ra = parseNumber(a.row.rank) || 9999;
      const rb = parseNumber(b.row.rank) || 9999;
      return ra - rb;
    });

    const limited = active.slice(0, 10);
    if (!limited.length) return;

    // Render kort i original stil
    container.innerHTML = "";
    const orderedProducts = [];

    limited.forEach(({ product }) => {
      // original "Elite" card renderer
      const wrapper = document.createElement("div");
      wrapper.innerHTML = buildProductCardMarkup(product);
      const cardEl = wrapper.firstElementChild;

      orderedProducts.push(product);
      container.appendChild(cardEl);
    });

    // Klikk → product.html
    attachProductCardNavigation(container, orderedProducts);

  } catch (err) {
    console.error("❌ TrendingNow error:", err);
  }
}


// ---------- PIL-LOGIKK FOR SLIDER ----------

function initTrendingArrows() {
  const track = document.getElementById("trendingTrack");
  const prev = document.getElementById("trendingPrev");
  const next = document.getElementById("trendingNext");

  if (!track || !prev || !next) {
    console.warn("⚠️ Mangler en eller flere slider-elementer");
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


  // ---------- TOP BRANDS ----------

  async function loadTopBrands() {
    const container = document.getElementById("brands-grid");
    if (!container) return;

    try {
      const url = `https://opensheet.elk.sh/${TOPBRANDS_SHEET_ID}/${TOPBRANDS_TAB}`;
      const res = await fetch(url);
      const data = await res.json();

      console.log("🔥 TopBrands:", data);

      if (!Array.isArray(data)) return;

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

  // ---------- KJØR ALLE SEKSJONENE ----------

  loadFeaturedPicks();
  loadTrendingNow();
  loadTopBrands();
});





