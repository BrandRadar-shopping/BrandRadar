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

  // ---------- FORMATTERING ----------
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
  // ⭐ FAVORITTLOGIKK (GLOBAL – INDEKSEN SIN EGEN)
  // ======================================================

  function getFavoriteProducts() {
    // Støtter både gammel "favorites" og ny "favoriteProducts"
    const a = JSON.parse(localStorage.getItem("favoriteProducts") || "[]");
    const b = JSON.parse(localStorage.getItem("favorites") || "[]");
    const arr = [...a, ...b].map(String);
    return [...new Set(arr)]; // unike
  }

  function setFavoriteProducts(list) {
    const unique = [...new Set(list.map(String))];
    localStorage.setItem("favoriteProducts", JSON.stringify(unique));
    // skriv også til "favorites" for max kompat
    localStorage.setItem("favorites", JSON.stringify(unique));
  }

  function updateFavoriteCounter() {
    const counter = document.getElementById("favorites-count");
    if (!counter) return;

    const productFavs = getFavoriteProducts();
    const brandFavs = JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
    const total = productFavs.length + brandFavs.length;

    counter.textContent = total;
  }

  function getProductName(p) {
    // Robust navn – uansett hva kolonnen heter
    return (
      p.product_name ||
      p.title ||
      p.name ||
      p.product ||
      ""
    );
  }

  // 🔔 Toast-melding når man legger til / fjerner favoritt
  function showFavoriteToast(message, type = "success") {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove("success", "error");
    toast.classList.add(type);
    toast.classList.add("visible");

    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 2000);
  }

  function toggleFavorite(product, favEl) {
    if (!product) return;
    const pid = String(product.id || product.product_id || deriveId(getProductName(product)));
    if (!pid) return;

    let favorites = getFavoriteProducts();
    const index = favorites.indexOf(pid);

    if (index === -1) {
      favorites.push(pid);
      favEl && favEl.classList.add("active");
      const name = getProductName(product) || "Produkt";
      showFavoriteToast(`${name} lagt til i favoritter`, "success");
    } else {
      favorites.splice(index, 1);
      favEl && favEl.classList.remove("active");
      const name = getProductName(product) || "Produkt";
      showFavoriteToast(`${name} fjernet fra favoritter`, "success");
    }

    setFavoriteProducts(favorites);
    updateFavoriteCounter();
  }

  updateFavoriteCounter();

  // ======================================================
  // ⭐ PRODUKTKORT (ELITE DESIGN – FELLES FOR INDEX)
  // ======================================================

  function buildProductCardMarkup(p) {
    const name = getProductName(p);
    const id = p.id || p.product_id || deriveId(name);
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
    const currentFavs = getFavoriteProducts();

    cards.forEach((card, idx) => {
      const product = productsInOrder[idx];
      if (!product) return;

      const name = getProductName(product);
      const pid = String(product.id || product.product_id || deriveId(name));

      const favEl = card.querySelector(".fav-icon");
      if (favEl && currentFavs.includes(pid)) {
        favEl.classList.add("active");
      }

      card.addEventListener("click", e => {
        const fav = e.target.closest(".fav-icon");

        if (fav) {
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

      const featured = items.filter(p => (p.featured || "").toLowerCase() === "true");

      grid.innerHTML = "";
      const orderedProducts = [];

      featured.forEach(p => {
        const product = {
          id: p.id || deriveId(p.product_name || p.title || p.name),
          product_name: p.product_name || p.title || p.name,
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

    limited.forEach(({ product }) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = buildProductCardMarkup(product);
      const cardEl = wrapper.firstElementChild;

      container.appendChild(cardEl);
      orderedProducts.push(product);
    });

    attachProductCardNavigation(container, orderedProducts);

    // ⭐ Aktiver pilene etter rendering
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
  // TOP BRANDS
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







