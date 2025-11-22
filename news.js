// ======================================================
// 📰 BrandRadar – MASTER-Driven News Page
// (Spotlight + News Feed + Partner + Deals + Picks)
// ======================================================

(function () {
  console.log("✅ news.js (master-driven) loaded");

  // ---------- SHEET-KONFIG ----------
  const NEWS_SHEET_ID = "1CSJjHvL7VytKfCd61IQf-53g3nAl9GrnC1Vmz7ZGF54";
  const NEWS_TAB = "news";

  const MASTER_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const MASTER_TAB = "BrandRadarProdukter";

  const DEALS_SHEET_ID = "1GZH_z1dSV40X9GYRKWNV_F1Oe8JwapRBYy9nnDP0KmY";
  const DEALS_TAB = "deals";

  const PICKS_SHEET_ID = "18eu0oOvtxuteHRf7wR0WEkmQMfNYet2qHtQSCgrpbYI";
  const PICKS_TAB = "picks";

  const PARTNER_SHEET_ID = "166anlag430W7KlUKCrkVGd585PldREW7fC8JQ5g7WK4";
  const PARTNER_TAB = "partner_banner";

  // ---------- DOM ----------
  const partnerBannerEl = document.querySelector(".partner-banner");
  const dealsGridEl = document.querySelector(".deals-grid");
  const picksGridEl = document.querySelector(".picks-grid");
  const spotlightWrapper = document.querySelector("#featured-news .featured-wrapper");
  const newsGridEl = document.querySelector("#news-grid");

  // ---------- HELPERS ----------
  const nb = new Intl.NumberFormat("nb-NO");

  function parseNum(v) {
    if (!v) return null;
    return Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  }

  function formatPrice(n) {
    return n == null ? "" : `${nb.format(Math.round(n))} kr`;
  }

  async function fetchJson(id, sheet) {
    const url = `https://opensheet.elk.sh/${id}/${sheet}`;
    const res = await fetch(url);
    return res.json();
  }

  function escapeAttr(v) {
    return String(v || "").replace(/"/g, "&quot;");
  }

  function renderFavoriteButton(p) {
    return `
      <button class="favorite-toggle"
        data-product-id="${escapeAttr(p.id)}"
        data-product-brand="${escapeAttr(p.brand)}"
        data-product-name="${escapeAttr(p.title)}"
        data-product-image="${escapeAttr(p.image_url)}"
        data-product-price="${escapeAttr(p.price)}"
        data-product-link="${escapeAttr(p.product_url)}"
        data-product-category="${escapeAttr(p.category)}"
      >
        <span class="heart-icon">❤</span>
      </button>
    `;
  }

  function cardClickHandler(card, url) {
    if (!card || !url) return;
    card.addEventListener("click", (e) => {
      if (e.target.closest(".favorite-toggle")) return;
      window.open(url, "_blank");
    });
  }

  // ======================================================
  // 1) PARTNER BANNER
  // ======================================================
  async function loadPartnerBanner() {
    if (!partnerBannerEl) return;
    try {
      const [row] = await fetchJson(PARTNER_SHEET_ID, PARTNER_TAB);
      if (!row) return;

      partnerBannerEl.classList.remove("loading");
      partnerBannerEl.innerHTML = `
        <div class="partner-banner-inner">
          <div class="partner-banner-text">
            <p class="partner-tag">${row.campaign_name}</p>
            <h2>${row.description}</h2>
            <p class="partner-sub">${row.alt_text || ""}</p>
            ${row.link ? `<a class="partner-cta" href="${row.link}" target="_blank">${row.cta_text || "Se kampanjen"}</a>` : ""}
          </div>
          ${row.image_url ? `<div class="partner-banner-image"><img src="${row.image_url}"></div>` : ""}
        </div>
      `;
    } catch (err) {
      console.error("❌ Partner error", err);
    }
  }

  // ======================================================
  // 2) UKENS DEALS
  // ======================================================
  async function loadDeals() {
    if (!dealsGridEl) return;
    try {
      const rows = await fetchJson(DEALS_SHEET_ID, DEALS_TAB);
      dealsGridEl.classList.remove("loading");
      dealsGridEl.innerHTML = "";

      rows.forEach((d, i) => {
        const oldP = parseNum(d.old_price);
        const newP = parseNum(d.new_price);
        const discount = oldP && newP ? Math.round(((oldP - newP) / oldP) * 100) : null;

        const p = {
          id: d.id || `deal_${i}`,
          brand: d.brand || "",
          title: d.product_name || "",
          price: newP || oldP || "",
          image_url: d.image_url || "",
          product_url: d.link || "",
          category: "Deal",
        };

        const card = document.createElement("article");
        card.className = "product-card deal-card";
        card.innerHTML = `
          <div class="product-card-inner">
            <div class="product-card-media">
              ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}
              <div class="favorite-wrapper">${renderFavoriteButton(p)}</div>
              <div class="product-image"><img src="${p.image_url}"></div>
            </div>
            <div class="product-card-body">
              <p class="brand">${p.brand}</p>
              <h3 class="product-name">${p.title}</h3>
              <div class="price-line">
                <span class="new-price">${newP ? formatPrice(newP) : ""}</span>
                ${oldP ? `<span class="old-price">${formatPrice(oldP)}</span>` : ""}
              </div>
            </div>
          </div>
        `;

        cardClickHandler(card, p.product_url);
        dealsGridEl.appendChild(card);
      });

    } catch (err) {
      console.error("❌ Deals error", err);
    }
  }

  // ======================================================
  // 3) RADAR PICKS
  // ======================================================
  async function loadPicks() {
    if (!picksGridEl) return;
    try {
      const rows = await fetchJson(PICKS_SHEET_ID, PICKS_TAB);
      picksGridEl.classList.remove("loading");
      picksGridEl.innerHTML = "";

      rows.forEach((p, i) => {
        const id = p.id || p.product_id || `pick_${i}`;
        const price = parseNum(p.price);
        const rating = parseNum(p.rating);
        const discount = parseNum(p.discount);

        const meta = {
          id,
          brand: p.brand,
          title: p.product_name,
          price,
          image_url: p.image_url,
          product_url: p.link,
          category: "Pick",
        };

        const card = document.createElement("article");
        card.className = "product-card pick-card";
        card.innerHTML = `
          <div class="product-card-inner">
            <div class="product-card-media">
              ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}
              <div class="favorite-wrapper">${renderFavoriteButton(meta)}</div>
              <div class="product-image"><img src="${meta.image_url}"></div>
            </div>
            <div class="product-card-body">
              <p class="brand">${meta.brand}</p>
              <h3 class="product-name">${meta.title}</h3>
              <p class="rating">${rating ? `⭐ ${rating.toFixed(1)}` : `<span style="color:#ccc;">–</span>`}</p>
              ${price ? `<p class="price">${formatPrice(price)}</p>` : ""}
            </div>
          </div>
        `;

        cardClickHandler(card, meta.product_url);
        picksGridEl.appendChild(card);
      });

    } catch (err) {
      console.error("❌ Picks error", err);
    }
  }

  // ======================================================
  // 4) SPOTLIGHT + NEWS FEED (Master-driven)
// ======================================================
  async function loadNewsFeed() {
    if (!newsGridEl && !spotlightWrapper) return;

    try {
      // Load News-rows (id + metadata)
      const newsRows = await fetchJson(NEWS_SHEET_ID, NEWS_TAB);

      // Load master product data
      const masterProducts = await fetchJson(MASTER_SHEET_ID, MASTER_TAB);

      const merged = [];

      newsRows.forEach(row => {
        const master = masterProducts.find(p => String(p.id).trim() === String(row.id).trim());
        if (!master) return;

        merged.push({
          ...master,
          excerpt: row.excerpt || "",
          featured: String(row.featured || "").toLowerCase() === "true",
          tag: row.tag || "",
          priority: row.priority ? parseInt(row.priority) : 999,
        });
      });

      const spotlight = merged.filter(p => p.featured);
      const regular = merged.filter(p => !p.featured).sort((a, b) => a.priority - b.priority);

      // ===== Spotlight =====
      if (spotlightWrapper) {
        spotlightWrapper.classList.remove("loading");
        spotlightWrapper.innerHTML = "";

        if (!spotlight.length) {
          spotlightWrapper.textContent = "Ingen spotlight-produkter.";
        } else {
          spotlight.forEach(prod => {
            const newPrice = parseNum(prod.price);
            const oldPrice = prod.old_price ? parseNum(prod.old_price) : null;
            const discount = oldPrice && newPrice ? Math.round(((oldPrice - newPrice) / oldPrice) * 100) : null;
            const rating = parseNum(prod.rating);

            const card = document.createElement("article");
            card.className = "product-card featured-card";
            card.innerHTML = `
              <div class="product-card-inner featured-layout">
                <div class="product-card-media">
                  ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}
                  <div class="favorite-wrapper">${renderFavoriteButton(prod)}</div>
                  <div class="product-image"><img src="${prod.image_url}"></div>
                </div>
                <div class="product-card-body">
                  <p class="brand">${prod.brand}</p>
                  <h3 class="product-name">${prod.title}</h3>
                  ${prod.excerpt ? `<p class="excerpt">${prod.excerpt}</p>` : ""}
                  <p class="rating">${rating ? `⭐ ${rating.toFixed(1)}` : `<span style="color:#ccc;">–</span>`}</p>
                  ${newPrice ? `<p class="price">${formatPrice(newPrice)}</p>` : ""}
                </div>
              </div>
            `;

            cardClickHandler(card, prod.product_url);
            spotlightWrapper.appendChild(card);
          });
        }
      }

      // ===== News Feed =====
      if (newsGridEl) {
        newsGridEl.classList.remove("loading");
        newsGridEl.innerHTML = "";

        if (!regular.length) {
          newsGridEl.textContent = "Ingen nye produkter akkurat nå.";
          return;
        }

        regular.forEach(prod => {
          const newPrice = parseNum(prod.price);
          const oldPrice = prod.old_price ? parseNum(prod.old_price) : null;
          const discount = oldPrice && newPrice ? Math.round(((oldPrice - newPrice) / oldPrice) * 100) : null;
          const rating = parseNum(prod.rating);

          const card = document.createElement("article");
          card.className = "product-card news-card";
          card.innerHTML = `
            <div class="product-card-inner">
              <div class="product-card-media">
                ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}
                <div class="favorite-wrapper">${renderFavoriteButton(prod)}</div>
                <div class="product-image"><img src="${prod.image_url}"></div>
              </div>
              <div class="product-card-body">
                <p class="brand">${prod.brand}</p>
                <h3 class="product-name">${prod.title}</h3>
                ${prod.excerpt ? `<p class="tagline">${prod.excerpt}</p>` : ""}
                <p class="rating">${rating ? `⭐ ${rating.toFixed(1)}` : `<span style="color:#ccc;">–</span>`}</p>
                ${newPrice ? `<p class="price">${formatPrice(newPrice)}</p>` : ""}
              </div>
            </div>
          `;

          cardClickHandler(card, prod.product_url);
          newsGridEl.appendChild(card);
        });
      }

    } catch (err) {
      console.error("❌ News feed error", err);
    }
  }

  // ======================================================
  // RUN
  // ======================================================
  document.addEventListener("DOMContentLoaded", () => {
    loadPartnerBanner();
    loadDeals();
    loadPicks();
    loadNewsFeed();
  });
})();



