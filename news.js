// ======================================================
// 📰 BrandRadar – News page (MASTER-driven, Elite v8)
//  - Partner banner
//  - Ukens Deals (slider m/piler-only)
//  - Radar Picks (slider m/piler-only)
//  - Ukens Spotlight (slider m/piler-only)
//  - Nye Produkter & Trender (grid)
// ======================================================

(function () {
  console.log("✅ news.js (piler-only sliders) loaded");

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
  const cleanRatingFn =
    window.cleanRating ||
    function (value) {
      if (!value) return null;
      const n = parseFloat(value.toString().replace(",", ".").replace(/[^0-9.\-]/g, ""));
      return Number.isFinite(n) ? n : null;
    };

  function parseNum(v) {
    if (v == null || v === "") return null;
    const n = Number(String(v).replace(/\s/g, "").replace(/[^\d.,\-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function formatPrice(n) {
    if (n == null) return "";
    return `${nb.format(Math.round(n))} kr`;
  }

  function parseBool(v) {
    if (!v && v !== 0) return false;
    const s = String(v).trim().toLowerCase();
    return s === "true" || s === "1" || s === "ja" || s === "yes";
  }

  async function fetchJson(sheetId, tab) {
    const url = `https://opensheet.elk.sh/${sheetId}/${tab}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Feil ved henting av ${tab}: ${res.status}`);
    return res.json();
  }

  function createProductBaseFromMaster(masterRow) {
    if (!masterRow) return null;

    const base = {
      id: String(masterRow.id || "").trim(),
      title: masterRow.title || masterRow.product_name || masterRow.name || "",
      product_name: masterRow.title || masterRow.product_name || masterRow.name || "",
      brand: masterRow.brand || "",
      price: masterRow.price || "",
      discount: masterRow.discount || "",
      image_url: masterRow.image_url || "",
      product_url: masterRow.product_url || "",
      category: masterRow.category || masterRow.main_category || "",
      rating: masterRow.rating || "",
      luxury: false,
      sheet_source: masterRow.sheet_source || "master"
    };

    if (typeof window.resolveProductId === "function") {
      base.id = window.resolveProductId(base);
    }

    return base;
  }

  // ---------- ELITE-KORT ----------
  function buildEliteCard(prod, options = {}) {
    const { showExcerpt = false, excerpt = "", tag = "", extraClasses = "" } = options;

    const pid =
      typeof window.resolveProductId === "function"
        ? window.resolveProductId(prod)
        : prod.id || prod.product_id || "";

    prod.id = pid;

    const ratingValue = cleanRatingFn(prod.rating);
    const priceNum = parseNum(prod.price);
    const discountNum = prod.discount ? parseNum(prod.discount) : null;

    let newPriceNum = null;
    let oldPriceNum = null;
    let discountPct = null;

    if (priceNum != null && discountNum != null && discountNum > 0) {
      const percent = discountNum > 1 ? discountNum : discountNum * 100;
      discountPct = Math.round(percent);
      oldPriceNum = priceNum;
      newPriceNum = Math.round(priceNum * (1 - percent / 100));
    } else if (priceNum != null) {
      newPriceNum = priceNum;
    }

    const isFav =
      typeof window.isProductFavorite === "function" && pid ? window.isProductFavorite(pid) : false;

    const card = document.createElement("article");
    card.className = `product-card ${extraClasses}`.trim();

    card.innerHTML = `
      ${discountPct ? `<div class="discount-badge">-${discountPct}%</div>` : ""}

      <div class="fav-icon ${isFav ? "active" : ""}" aria-label="Legg til favoritt">
        <svg viewBox="0 0 24 24" class="heart-icon">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 
          12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 
          0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 
          16.5 3 19.58 3 22 5.42 22 8.5c0 
          3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>

      <img src="${prod.image_url || ""}" alt="${prod.title || ""}" loading="lazy">

      <div class="product-info">
        <p class="brand">${prod.brand || ""}</p>
        <h3 class="product-name">${prod.title || ""}</h3>

        ${showExcerpt && excerpt ? `<p class="tagline">${excerpt}</p>` : ""}
        ${tag ? `<p class="product-tag">${tag}</p>` : ""}

        <p class="rating">
          ${ratingValue ? `⭐ ${ratingValue.toFixed(1)}` : `<span style="color:#ccc;">–</span>`}
        </p>

        <div class="price-line">
          <span class="new-price">${newPriceNum != null ? formatPrice(newPriceNum) : ""}</span>
          ${oldPriceNum != null ? `<span class="old-price">${formatPrice(oldPriceNum)}</span>` : ""}
        </div>
      </div>
    `;

    // Kort-klikk → product.html
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-icon")) return;
      if (!pid) return;
      window.location.href = `product.html?id=${encodeURIComponent(pid)}`;
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
  // ✅ Piler-only slider helper (samme stil som related)
  // ======================================================
  function ensureArrowSlider(sectionEl, trackEl, scrollAmount = 340) {
    if (!sectionEl || !trackEl) return;

    // marker track for CSS ([data-slider])
    trackEl.setAttribute("data-slider", "true");

    // wrap track i slider-wrapper hvis ikke allerede
    let wrapper = trackEl.closest(".slider-wrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "slider-wrapper";
      trackEl.parentNode.insertBefore(wrapper, trackEl);
      wrapper.appendChild(trackEl);
    }

    // unngå duplikate knapper
    if (wrapper.querySelector(".slider-btn.prev") || wrapper.querySelector(".slider-btn.next")) return;

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "slider-btn prev";
    prev.setAttribute("aria-label", "Forrige");
    prev.textContent = "❮";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "slider-btn next";
    next.setAttribute("aria-label", "Neste");
    next.textContent = "❯";

    prev.addEventListener("click", () => {
      trackEl.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      trackEl.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });

    wrapper.appendChild(prev);
    wrapper.appendChild(next);
  }

  // ======================================================
  // 1) PARTNER BANNER
  // ======================================================
  async function loadPartnerBanner() {
    if (!partnerBannerEl) return;
    try {
      const rows = await fetchJson(PARTNER_SHEET_ID, PARTNER_TAB);
      const row = rows[0];
      if (!row) return;

      partnerBannerEl.classList.remove("loading");
      partnerBannerEl.innerHTML = `
        <div class="partner-banner-inner">
          <div class="partner-banner-text">
            <p class="partner-tag">${row.campaign_name || "Ukens partner"}</p>
            <h2>${row.description || ""}</h2>
            <p class="partner-sub">${row.alt_text || ""}</p>
            ${
              row.link
                ? `<a href="${row.link}" target="_blank" class="partner-cta">
                    ${row.cta_text || "Se kampanjen"}
                   </a>`
                : ""
            }
          </div>
          ${
            row.image_url
              ? `<div class="partner-banner-image">
                   <img src="${row.image_url}" alt="${row.alt_text || row.campaign_name || ""}">
                 </div>`
              : ""
          }
        </div>
      `;
    } catch (err) {
      console.error("❌ Partner banner error:", err);
      partnerBannerEl.textContent = "Kunne ikke laste partnerkampanjen.";
    }
  }

  // ======================================================
  // 2) UKENS DEALS (piler-only slider)
  // ======================================================
  async function loadDeals() {
    if (!dealsGridEl) return;
    try {
      const rows = await fetchJson(DEALS_SHEET_ID, DEALS_TAB);
      dealsGridEl.classList.remove("loading");
      dealsGridEl.innerHTML = "";

      if (!rows.length) {
        dealsGridEl.textContent = "Ingen deals akkurat nå.";
        return;
      }

      rows.forEach((d, index) => {
        const oldPrice = parseNum(d.old_price);
        const newPrice = parseNum(d.new_price);
        const discount =
          oldPrice && newPrice ? Math.round(((oldPrice - newPrice) / oldPrice) * 100) : null;

        const prod = {
          id: d.id || d.product_id || `deal_${index}`,
          title: d.product_name || "",
          brand: d.brand || "",
          price: newPrice != null ? newPrice : oldPrice,
          discount: discount,
          image_url: d.image_url || "",
          product_url: d.link || "",
          category: "Deal",
          rating: null,
          luxury: false
        };

        if (typeof window.resolveProductId === "function") {
          prod.id = window.resolveProductId(prod);
        }

        const isFav =
          typeof window.isProductFavorite === "function" && prod.id
            ? window.isProductFavorite(prod.id)
            : false;

        const card = document.createElement("article");
        card.className = "product-card deal-card";

        card.innerHTML = `
          ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}

          <div class="fav-icon ${isFav ? "active" : ""}" aria-label="Legg til favoritt">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 
              12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 
              0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 
              16.5 3 19.58 3 22 5.42 22 8.5c0 
              3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <img src="${prod.image_url}" alt="${prod.title}" loading="lazy">

          <div class="product-info">
            <p class="brand">${prod.brand}</p>
            <h3 class="product-name">${prod.title}</h3>
            <div class="price-line">
              <span class="new-price">${newPrice != null ? formatPrice(newPrice) : ""}</span>
              ${oldPrice != null ? `<span class="old-price">${formatPrice(oldPrice)}</span>` : ""}
            </div>
          </div>
        `;

        // Click → ekstern link
        card.addEventListener("click", (e) => {
          if (e.target.closest(".fav-icon")) return;
          if (prod.product_url) window.open(prod.product_url, "_blank");
        });

        // Fav click
        const favEl = card.querySelector(".fav-icon");
        favEl.addEventListener("click", (e) => {
          e.stopPropagation();
          if (typeof window.toggleFavorite === "function") {
            window.toggleFavorite(prod, favEl);
          }
        });

        dealsGridEl.appendChild(card);
      });

      const dealsSection = document.getElementById("deals-section");
      ensureArrowSlider(dealsSection, dealsGridEl, 340);
    } catch (err) {
      console.error("❌ Deals error:", err);
      dealsGridEl.textContent = "Kunne ikke laste deals.";
    }
  }

  // ======================================================
  // 3) RADAR PICKS (piler-only slider)
  // ======================================================
  async function loadPicks() {
    if (!picksGridEl) return;
    try {
      const rows = await fetchJson(PICKS_SHEET_ID, PICKS_TAB);
      picksGridEl.classList.remove("loading");
      picksGridEl.innerHTML = "";

      if (!rows.length) {
        picksGridEl.textContent = "Ingen picks akkurat nå.";
        return;
      }

      rows.forEach((p, index) => {
        const prod = {
          id: p.id || p.product_id || `pick_${index}`,
          title: p.product_name || "",
          brand: p.brand || "",
          price: p.price || "",
          discount: p.discount || "",
          image_url: p.image_url || "",
          product_url: p.link || "",
          category: "Radar Pick",
          rating: p.rating || "",
          luxury: false
        };

        if (typeof window.resolveProductId === "function") {
          prod.id = window.resolveProductId(prod);
        }

        const card = buildEliteCard(prod, {
          showExcerpt: false,
          excerpt: "",
          tag: p.reason || "",
          extraClasses: "pick-card"
        });

        // Override → ekstern link
        card.addEventListener("click", (e) => {
          if (e.target.closest(".fav-icon")) return;
          if (prod.product_url) window.open(prod.product_url, "_blank");
        });

        picksGridEl.appendChild(card);
      });

      const picksSection = document.getElementById("picks-section");
      ensureArrowSlider(picksSection, picksGridEl, 340);
    } catch (err) {
      console.error("❌ Picks error:", err);
      picksGridEl.textContent = "Kunne ikke laste picks.";
    }
  }

  // ======================================================
  // 4) SPOTLIGHT + NEWS FEED (MASTER + NEWS-ark)
  //      NEWS: id | spotlight | show_in_feed | excerpt | tag | priority
  // ======================================================
  async function loadNewsSections() {
    if (!spotlightWrapper && !newsGridEl) return;

    try {
      const [newsRows, masterRows] = await Promise.all([
        fetchJson(NEWS_SHEET_ID, NEWS_TAB),
        fetchJson(MASTER_SHEET_ID, MASTER_TAB)
      ]);

      const merged = [];

      newsRows.forEach((row) => {
        const id = String(row.id || "").trim();
        if (!id) return;

        const master = masterRows.find((p) => String(p.id || "").trim() === id);
        if (!master) return;

        const base = createProductBaseFromMaster(master);
        if (!base) return;

        merged.push({
          product: base,
          spotlight: parseBool(row.spotlight),
          showInFeed: parseBool(row.show_in_feed),
          excerpt: row.excerpt || "",
          tag: row.tag || "",
          priority: row.priority ? parseInt(row.priority, 10) || 999 : 999
        });
      });

      const spotlightItems = merged.filter((m) => m.spotlight);
      const feedItems = merged
        .filter((m) => m.showInFeed)
        .sort((a, b) => a.priority - b.priority);

      // ----- Spotlight (piler-only slider) -----
      if (spotlightWrapper) {
        spotlightWrapper.classList.remove("loading");
        spotlightWrapper.innerHTML = "";

        if (!spotlightItems.length) {
          spotlightWrapper.textContent = "Ingen spotlight-produkter akkurat nå.";
        } else {
          spotlightItems.forEach((item) => {
            const card = buildEliteCard(item.product, {
              showExcerpt: true,
              excerpt: item.excerpt,
              tag: item.tag || "Spotlight",
              extraClasses: "featured-card"
            });
            spotlightWrapper.appendChild(card);
          });

          const spotlightSection = document.getElementById("featured-news");
          ensureArrowSlider(spotlightSection, spotlightWrapper, 420);
        }
      }

      // ----- News feed (grid) -----
      if (newsGridEl) {
        newsGridEl.classList.remove("loading");
        newsGridEl.innerHTML = "";

        if (!feedItems.length) {
          newsGridEl.textContent = "Ingen nye produkter akkurat nå.";
          return;
        }

        feedItems.forEach((item) => {
          const card = buildEliteCard(item.product, {
            showExcerpt: true,
            excerpt: item.excerpt,
            tag: item.tag || "",
            extraClasses: "news-card"
          });
          newsGridEl.appendChild(card);
        });
      }
    } catch (err) {
      console.error("❌ News sections error:", err);
      if (spotlightWrapper) spotlightWrapper.textContent = "Kunne ikke laste spotlight.";
      if (newsGridEl) newsGridEl.textContent = "Kunne ikke laste nyhetsfeed.";
    }
  }

  // ======================================================
  // RUN
  // ======================================================
  document.addEventListener("DOMContentLoaded", () => {
    loadPartnerBanner();
    loadDeals();
    loadPicks();
    loadNewsSections();
  });
})();





