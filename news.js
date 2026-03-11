// ======================================================
// 📰 BrandRadar – News page (MASTER-driven, Elite cards)
//  - Partner banner
//  - Ukens Deals (1 rad slider + piler)
//  - Radar Picks (1 rad slider + piler)
//  - Ukens Spotlight (stor slider + piler)
//  - Nye Produkter & Trender (grid)
// ======================================================

(function () {
  console.log("✅ news.js loaded");

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

  const dealsTrack = document.getElementById("deals-track") || document.querySelector(".deals-grid");
  const picksTrack = document.getElementById("picks-track") || document.querySelector(".picks-grid");
  const spotlightTrack = document.getElementById("spotlight-track") || document.querySelector("#featured-news .featured-wrapper");
  const newsGridEl = document.querySelector("#news-grid");

  // ---------- HELPERS ----------
  const nb = new Intl.NumberFormat("nb-NO");

  const cleanRatingFn =
    window.cleanRating ||
    function (value) {
      if (!value) return null;
      const n = parseFloat(String(value).replace(",", ".").replace(/[^0-9.\-]/g, ""));
      return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : null;
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

  function buildStarIcon(fillPercent = 0) {
    const safeFill = Math.max(0, Math.min(100, fillPercent));

    return `
      <span class="rating-star" style="--fill:${safeFill}%;" aria-hidden="true">
        <svg class="rating-star-svg rating-star-outline" viewBox="0 0 24 24" focusable="false">
          <path d="M12 2.8l2.84 5.75 6.35.92-4.6 4.49 1.09 6.32L12 17.3 6.32 20.28l1.09-6.32-4.6-4.49 6.35-.92L12 2.8z"/>
        </svg>
        <span class="rating-star-fill-wrap">
          <svg class="rating-star-svg rating-star-fill" viewBox="0 0 24 24" focusable="false">
            <path d="M12 2.8l2.84 5.75 6.35.92-4.6 4.49 1.09 6.32L12 17.3 6.32 20.28l1.09-6.32-4.6-4.49 6.35-.92L12 2.8z"/>
          </svg>
        </span>
      </span>
    `;
  }

  function buildRatingMarkup(ratingValue) {
    const rating = cleanRatingFn(ratingValue);

    if (rating == null) {
      return "";
    }

    const stars = Array.from({ length: 5 }, (_, index) => {
      const fill = Math.max(0, Math.min(1, rating - index)) * 100;
      return buildStarIcon(fill);
    }).join("");

    return `
      <div class="rating-stars" aria-label="Rating ${rating.toFixed(1)} av 5">
        <div class="rating-stars-row">
          ${stars}
        </div>
        <span class="rating-value">${rating.toFixed(1)}</span>
      </div>
    `;
  }

  // ---------- ELITE CARD ----------
  function buildEliteCard(prod, options = {}) {
    const { showExcerpt = false, excerpt = "", tag = "", extraClasses = "" } = options;

    const pid =
      typeof window.resolveProductId === "function"
        ? window.resolveProductId(prod)
        : prod.id || prod.product_id || "";

    prod.id = pid;

    const ratingMarkup = buildRatingMarkup(prod.rating);
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
      typeof window.isProductFavorite === "function" && pid
        ? window.isProductFavorite(pid)
        : false;

    const card = document.createElement("article");
    card.className = `product-card ${extraClasses}`.trim();

    card.innerHTML = `
      ${discountPct ? `<div class="discount-badge">-${discountPct}%</div>` : ""}

      <button
        type="button"
        class="favorite-toggle ${isFav ? "active" : ""}"
        aria-label="Legg til favoritt"
      >
        <svg viewBox="0 0 24 24" class="heart-icon" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
          14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
          3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>

      <img src="${prod.image_url || ""}" alt="${prod.title || ""}" loading="lazy">

      <div class="product-info">
        <p class="brand">${prod.brand || ""}</p>
        <h3 class="product-name">${prod.title || ""}</h3>

        ${showExcerpt && excerpt ? `<p class="tagline">${excerpt}</p>` : ""}
        ${tag ? `<p class="product-tag">${tag}</p>` : ""}

        ${ratingMarkup}

        <div class="price-line">
          <span class="new-price">${newPriceNum != null ? formatPrice(newPriceNum) : ""}</span>
          ${oldPriceNum != null ? `<span class="old-price">${formatPrice(oldPriceNum)}</span>` : ""}
        </div>
      </div>
    `;

    const navigateToProduct = () => {
      if (!pid) return;
      window.location.href = `product.html?id=${encodeURIComponent(pid)}`;
    };

    card.addEventListener("click", (e) => {
      if (e.target.closest(".favorite-toggle")) return;
      navigateToProduct();
    });

    const favButton = card.querySelector(".favorite-toggle");
    favButton?.addEventListener("click", (e) => {
      e.stopPropagation();

      if (typeof window.toggleFavorite !== "function") return;

      const favoritePayload = {
        id: pid,
        title: prod.title || "",
        product_name: prod.title || "",
        brand: prod.brand || "",
        price: prod.price || "",
        discount: prod.discount || "",
        image_url: prod.image_url || "",
        product_url: prod.product_url || "",
        category: prod.category || "",
        rating: prod.rating ?? "",
        luxury: !!prod.luxury
      };

      const existsBefore =
        typeof window.isProductFavorite === "function" && pid
          ? window.isProductFavorite(pid)
          : false;

      window.toggleFavorite(favoritePayload, favButton);
      favButton.classList.toggle("active", !existsBefore);
    });

    return card;
  }

  // ---------- ARROW SLIDER ----------
  function initArrowSlider(trackEl) {
    if (!trackEl) return;

    const wrapper = trackEl.closest(".slider-wrapper");
    if (!wrapper) return;

    const btnPrev = wrapper.querySelector(".slider-btn.prev");
    const btnNext = wrapper.querySelector(".slider-btn.next");

    function getStep() {
      const first = trackEl.querySelector(".product-card");
      if (!first) return 320;
      const rect = first.getBoundingClientRect();
      return Math.max(260, Math.round(rect.width + 18));
    }

    function updateButtons() {
      const canScroll = trackEl.scrollWidth > trackEl.clientWidth + 8;
      if (!canScroll) {
        if (btnPrev) btnPrev.style.display = "none";
        if (btnNext) btnNext.style.display = "none";
        return;
      }
      if (btnPrev) btnPrev.style.display = "";
      if (btnNext) btnNext.style.display = "";
    }

    btnPrev?.addEventListener("click", () => {
      trackEl.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    btnNext?.addEventListener("click", () => {
      trackEl.scrollBy({ left: getStep(), behavior: "smooth" });
    });

    window.addEventListener("resize", updateButtons);
    setTimeout(updateButtons, 150);
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
  // 2) UKENS DEALS
  // ======================================================
  async function loadDeals() {
    if (!dealsTrack) return;

    try {
      const rows = await fetchJson(DEALS_SHEET_ID, DEALS_TAB);
      dealsTrack.classList.remove("loading");
      dealsTrack.innerHTML = "";

      if (!rows.length) {
        dealsTrack.textContent = "Ingen deals akkurat nå.";
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
          discount,
          image_url: d.image_url || "",
          product_url: d.link || "",
          rating: null,
          luxury: false,
          category: d.category || ""
        };

        if (typeof window.resolveProductId === "function") {
          prod.id = window.resolveProductId(prod);
        }

        const card = buildEliteCard(prod, { extraClasses: "deal-card" });

        card.addEventListener("click", (e) => {
          if (e.target.closest(".favorite-toggle")) return;
          if (prod.product_url) window.open(prod.product_url, "_blank");
        });

        dealsTrack.appendChild(card);
      });

      initArrowSlider(dealsTrack);
    } catch (err) {
      console.error("❌ Deals error:", err);
      dealsTrack.textContent = "Kunne ikke laste deals.";
    }
  }

  // ======================================================
  // 3) RADAR PICKS
  // ======================================================
  async function loadPicks() {
    if (!picksTrack) return;

    try {
      const rows = await fetchJson(PICKS_SHEET_ID, PICKS_TAB);
      picksTrack.classList.remove("loading");
      picksTrack.innerHTML = "";

      if (!rows.length) {
        picksTrack.textContent = "Ingen picks akkurat nå.";
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
          rating: p.rating || "",
          luxury: false,
          category: p.category || ""
        };

        if (typeof window.resolveProductId === "function") {
          prod.id = window.resolveProductId(prod);
        }

        const card = buildEliteCard(prod, {
          showExcerpt: false,
          tag: p.reason || "",
          extraClasses: "pick-card"
        });

        card.addEventListener("click", (e) => {
          if (e.target.closest(".favorite-toggle")) return;
          if (prod.product_url) window.open(prod.product_url, "_blank");
        });

        picksTrack.appendChild(card);
      });

      initArrowSlider(picksTrack);
    } catch (err) {
      console.error("❌ Picks error:", err);
      picksTrack.textContent = "Kunne ikke laste picks.";
    }
  }

  // ======================================================
  // 4) SPOTLIGHT + NEWS FEED
  // ======================================================
  async function loadNewsSections() {
    if (!spotlightTrack && !newsGridEl) return;

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

      if (spotlightTrack) {
        spotlightTrack.classList.remove("loading");
        spotlightTrack.innerHTML = "";

        if (!spotlightItems.length) {
          spotlightTrack.textContent = "Ingen spotlight-produkter akkurat nå.";
        } else {
          spotlightItems.forEach((item) => {
            const card = buildEliteCard(item.product, {
              showExcerpt: true,
              excerpt: item.excerpt,
              tag: item.tag || "Spotlight",
              extraClasses: "featured-card featured-large"
            });
            spotlightTrack.appendChild(card);
          });

          initArrowSlider(spotlightTrack);
        }
      }

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
      if (spotlightTrack) spotlightTrack.textContent = "Kunne ikke laste spotlight.";
      if (newsGridEl) newsGridEl.textContent = "Kunne ikke laste nyhetsfeed.";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadPartnerBanner();
    loadDeals();
    loadPicks();
    loadNewsSections();
  });
})();





