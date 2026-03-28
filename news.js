// ======================================================
// 📰 BrandRadar – News page (MASTER-driven, Editorial + Elite cards)
//  - Partner banner
//  - Ukens Deals (1 rad slider + piler)
//  - Radar Picks (1 rad slider + piler)
//  - Ukens Spotlight (stor editorial slider + hover gallery)
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

  const dealsTrack =
    document.getElementById("deals-track") ||
    document.querySelector(".deals-grid");

  const picksTrack =
    document.getElementById("picks-track") ||
    document.querySelector(".picks-grid");

  const spotlightTrack =
    document.getElementById("spotlight-track") ||
    document.querySelector("#featured-news .featured-wrapper");

  const newsGridEl = document.getElementById("news-grid");

  // ---------- HELPERS ----------
  const nb = new Intl.NumberFormat("nb-NO");

  const cleanRatingFn =
    window.cleanRating ||
    function (value) {
      if (!value && value !== 0) return null;
      const n = parseFloat(
        String(value).replace(",", ".").replace(/[^0-9.\-]/g, "")
      );
      return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : null;
    };

  function parseNum(v) {
    if (v == null || v === "") return null;
    const n = Number(
      String(v)
        .replace(/\s/g, "")
        .replace(/[^\d.,\-]/g, "")
        .replace(",", ".")
    );
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function fetchJson(sheetId, tab) {
    const url = `https://opensheet.elk.sh/${sheetId}/${tab}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Feil ved henting av ${tab}: ${res.status}`);
    }
    return res.json();
  }

  function resolveProductIdSafe(productLike) {
    if (typeof window.resolveProductId === "function") {
      return window.resolveProductId(productLike);
    }
    return (
      productLike?.id ||
      productLike?.product_id ||
      productLike?.productId ||
      ""
    );
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
      image_2: masterRow.image_2 || masterRow.image2 || masterRow.thumbnail_1 || "",
      image_3: masterRow.image_3 || masterRow.image3 || masterRow.thumbnail_2 || "",
      image_4: masterRow.image_4 || masterRow.image4 || masterRow.thumbnail_3 || "",
      image_5: masterRow.image_5 || masterRow.image5 || masterRow.thumbnail_4 || "",
      product_url: masterRow.product_url || "",
      category: masterRow.category || masterRow.main_category || "",
      rating: masterRow.rating || "",
      luxury: parseBool(masterRow.luxury),
      sheet_source: masterRow.sheet_source || "master"
    };

    base.id = resolveProductIdSafe(base);
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
    if (rating == null) return "";

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

  function getPriceState(prod) {
    const explicitOldPrice = parseNum(prod.old_price);
    const explicitNewPrice = parseNum(prod.new_price);

    if (
      explicitOldPrice != null &&
      explicitNewPrice != null &&
      explicitOldPrice > explicitNewPrice
    ) {
      const discountPct = Math.round(
        ((explicitOldPrice - explicitNewPrice) / explicitOldPrice) * 100
      );

      return {
        priceNum: explicitOldPrice,
        discountNum: discountPct,
        newPriceNum: explicitNewPrice,
        oldPriceNum: explicitOldPrice,
        discountPct
      };
    }

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

    return {
      priceNum,
      discountNum,
      newPriceNum,
      oldPriceNum,
      discountPct
    };
  }

  function buildFavoritePayload(prod, pid) {
    return {
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
  }

  function getSpotlightImages(prod) {
    const rawImages = [
      prod.image_url,
      prod.image_2,
      prod.image_3,
      prod.image_4,
      prod.image_5
    ];

    const cleaned = rawImages
      .map((img) => String(img || "").trim())
      .filter(Boolean);

    return [...new Set(cleaned)].slice(0, 5);
  }

         function ensureDealsRibbonStyles() {
    if (document.getElementById("news-deals-ribbon-styles")) return;

    const style = document.createElement("style");
    style.id = "news-deals-ribbon-styles";
    style.textContent = `
      .news-section--deals .deal-card.product-card {
        position: relative;
        overflow: hidden;
      }

      .news-section--deals .deal-card.product-card .discount-badge {
        display: none !important;
      }

      .news-section--deals .deal-card .deals-corner-ribbon {
        position: absolute;
        top: 14px;
        left: -40px;
        width: 126px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 1px;
        overflow: visible;
        pointer-events: none;
        z-index: 9;

        color: #ffffff;
        font-size: 0.64rem;
        font-weight: 900;
        letter-spacing: 0.15em;
        line-height: 1;
        text-align: center;
        text-transform: uppercase;

        transform: rotate(-45deg);
        transform-origin: center;

        background:
          linear-gradient(
            135deg,
            #0b1220 0%,
            #1b2638 20%,
            #334155 50%,
            #1e293b 76%,
            #0b1220 100%
          );

        border-radius: 0 8px 0 8px;
        box-shadow:
          0 10px 18px rgba(0, 0, 0, 0.22),
          0 2px 0 rgba(255,255,255,0.06) inset,
          0 -2px 0 rgba(0,0,0,0.18) inset;
      }

      /* Gloss stripe on top face */
      .news-section--deals .deal-card .deals-corner-ribbon::before {
        content: "";
        position: absolute;
        left: 8px;
        right: 6px;
        top: 3px;
        height: 9px;
        border-radius: 999px;
        background:
          linear-gradient(
            to bottom,
            rgba(255,255,255,0.30) 0%,
            rgba(255,255,255,0.12) 42%,
            rgba(255,255,255,0.00) 100%
          );
        opacity: 0.9;
        pointer-events: none;
      }

      /* Curved top roll */
      .news-section--deals .deal-card .deals-corner-ribbon::after {
        content: "";
        position: absolute;
        top: -4px;
        right: 4px;
        width: 28px;
        height: 8px;
        border-radius: 999px 999px 6px 6px;
        background:
          linear-gradient(
            to bottom,
            rgba(255,255,255,0.16) 0%,
            rgba(255,255,255,0.05) 45%,
            rgba(0,0,0,0.10) 100%
          );
        box-shadow:
          0 1px 0 rgba(255,255,255,0.05) inset,
          0 2px 4px rgba(0,0,0,0.10);
        pointer-events: none;
        opacity: 0.95;
      }

      /* Moving satin light */
      .news-section--deals .deal-card .deals-corner-ribbon-gloss {
        position: absolute;
        top: 14px;
        left: -40px;
        width: 126px;
        height: 32px;
        transform: rotate(-45deg);
        transform-origin: center;
        pointer-events: none;
        z-index: 10;
        opacity: 0.88;

        background:
          linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.18) 14%,
            rgba(255,255,255,0.04) 26%,
            rgba(255,255,255,0) 42%,
            rgba(0,0,0,0.08) 100%
          );
        border-radius: 0 8px 0 8px;
      }

      /* Rounded side flap / rolled side */
      .news-section--deals .deal-card.product-card::before {
        content: "";
        position: absolute;
        top: 33px;
        left: 0px;
        width: 16px;
        height: 54px;
        border-radius: 0 0 10px 0;
        background:
          linear-gradient(
            180deg,
            #0b1220 0%,
            #1a2435 30%,
            #273247 68%,
            #101827 100%
          );
        box-shadow:
          2px 6px 10px rgba(0,0,0,0.22),
          1px 0 0 rgba(255,255,255,0.04) inset;
        clip-path: polygon(0 0, 100% 0, 72% 100%, 0 100%);
        z-index: 8;
        pointer-events: none;
      }

      /* Small rounded lip at the very top end */
      .news-section--deals .deal-card.product-card::after {
        content: "";
        position: absolute;
        top: 13px;
        left: 43px;
        width: 26px;
        height: 10px;
        border-radius: 999px;
        background:
          linear-gradient(
            to bottom,
            rgba(255,255,255,0.12) 0%,
            rgba(255,255,255,0.03) 48%,
            rgba(0,0,0,0.10) 100%
          );
        transform: rotate(-45deg);
        transform-origin: center;
        z-index: 11;
        pointer-events: none;
        opacity: 0.95;
      }

      .news-section--deals .deal-card.product-card .favorite-toggle {
        z-index: 12;
      }

      .news-section--deals .deal-card.product-card .price-wrapper {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-top: 0.25rem;
        width: 100%;
      }

      .news-section--deals .deal-card.product-card .price-line {
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
        min-width: 0;
      }

      .news-section--deals .deal-card.product-card .discount-pill {
        flex: 0 0 auto;
        align-self: flex-end;
        white-space: nowrap;
        margin-left: 0;
        padding: 0.36rem 0.64rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 800;
        line-height: 1;
        color: #ffffff;
        background:
          linear-gradient(135deg, #0f172a 0%, #1f2937 100%);
        box-shadow:
          0 6px 14px rgba(15, 23, 42, 0.16),
          0 1px 0 rgba(255,255,255,0.08) inset;
      }
    `;

    document.head.appendChild(style);
  }

  // ---------- ELITE CARD ----------
  function buildEliteCard(prod, options = {}) {
    const {
      showExcerpt = false,
      excerpt = "",
      tag = "",
      extraClasses = "",
      onCardClick = null
    } = options;

    const pid = resolveProductIdSafe(prod);
    prod.id = pid;

    const ratingMarkup = buildRatingMarkup(prod.rating);
    const { newPriceNum, oldPriceNum, discountPct } = getPriceState(prod);

    const isDealCard = String(extraClasses || "").split(/\s+/).includes("deal-card");

    const isFav =
      typeof window.isProductFavorite === "function" && pid
        ? window.isProductFavorite(pid)
        : false;

    const priceMarkup = isDealCard && discountPct
      ? `
        <div class="price-wrapper">
          <div class="price-line">
            <span class="new-price">${newPriceNum != null ? formatPrice(newPriceNum) : ""}</span>
            ${oldPriceNum != null ? `<span class="old-price">${formatPrice(oldPriceNum)}</span>` : ""}
          </div>
          <span class="discount-pill">-${discountPct}%</span>
        </div>
      `
      : `
        <div class="price-line">
          <span class="new-price">${newPriceNum != null ? formatPrice(newPriceNum) : ""}</span>
          ${oldPriceNum != null ? `<span class="old-price">${formatPrice(oldPriceNum)}</span>` : ""}
        </div>
      `;

    const card = document.createElement("article");
    card.className = `product-card ${extraClasses}`.trim();
    card.setAttribute("data-product-id", pid || "");

    card.innerHTML = `
      ${isDealCard ? `<span class="deals-corner-ribbon">DEALS</span><span class="deals-corner-ribbon-gloss"></span>` : ""}
      ${!isDealCard && discountPct ? `<div class="discount-badge">-${discountPct}%</div>` : ""}

      <button
        type="button"
        class="favorite-toggle ${isFav ? "active" : ""}"
        aria-label="${isFav ? "Fjern fra favoritter" : "Legg til favoritt"}"
      >
        <svg viewBox="0 0 24 24" class="heart-icon" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
          14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
          3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>

      <img src="${escapeHtml(prod.image_url || "")}" alt="${escapeHtml(prod.title || "")}" loading="lazy">

      <div class="product-info">
        <p class="brand">${escapeHtml(prod.brand || "")}</p>
        <h3 class="product-name">${escapeHtml(prod.title || "")}</h3>

        ${showExcerpt && excerpt ? `<p class="tagline">${escapeHtml(excerpt)}</p>` : ""}
        ${tag ? `<p class="product-tag">${escapeHtml(tag)}</p>` : ""}

        ${ratingMarkup}
        ${priceMarkup}
      </div>
    `;

    const defaultNavigateToProduct = () => {
      if (!pid) return;
      window.location.href = `product.html?id=${encodeURIComponent(pid)}`;
    };

    card.addEventListener("click", (e) => {
      if (e.target.closest(".favorite-toggle")) return;

      if (typeof onCardClick === "function") {
        onCardClick(prod, card, e);
        return;
      }

      defaultNavigateToProduct();
    });

    const favButton = card.querySelector(".favorite-toggle");
    favButton?.addEventListener("click", (e) => {
      e.stopPropagation();

      if (typeof window.toggleFavorite !== "function" || !pid) return;

      const existsBefore =
        typeof window.isProductFavorite === "function"
          ? window.isProductFavorite(pid)
          : false;

      window.toggleFavorite(buildFavoritePayload(prod, pid), favButton);

      const existsAfter =
        typeof window.isProductFavorite === "function"
          ? window.isProductFavorite(pid)
          : !existsBefore;

      favButton.classList.toggle("active", existsAfter);
      favButton.setAttribute(
        "aria-label",
        existsAfter ? "Fjern fra favoritter" : "Legg til favoritt"
      );
    });

    return card;
  }

  // ---------- SPOTLIGHT CARD ----------
  function buildSpotlightCard(prod, options = {}) {
    const {
      excerpt = "",
      tag = "Spotlight",
      secondaryTag = "",
      ctaText = "Se produkt",
      extraClasses = "",
      onCardClick = null
    } = options;

    const pid = resolveProductIdSafe(prod);
    prod.id = pid;

    const images = getSpotlightImages(prod);
    const mainImage = images[0] || prod.image_url || "";
    const thumbImages = images.slice(0, 4);

    const { newPriceNum, oldPriceNum, discountPct } = getPriceState(prod);
    const ratingMarkup = buildRatingMarkup(prod.rating);

    const article = document.createElement("article");
    article.className = `spotlight-feature ${extraClasses}`.trim();
    article.setAttribute("data-product-id", pid || "");

    article.innerHTML = `
      <div class="spotlight-media">
        <span class="spotlight-overlay-badge">Spotlight</span>

        <div class="spotlight-main-image-wrap">
          <img
            src="${escapeHtml(mainImage)}"
            alt="${escapeHtml(prod.title || "")}"
            loading="lazy"
            class="spotlight-main-image"
          >
        </div>

        ${
          thumbImages.length
            ? `
          <div class="spotlight-thumbs">
            ${thumbImages
              .map(
                (img, index) => `
                  <button
                    type="button"
                    class="spotlight-thumb ${index === 0 ? "is-active" : ""}"
                    data-image="${escapeHtml(img)}"
                    aria-label="Vis bilde ${index + 1} av ${escapeHtml(prod.title || "produkt")}"
                  >
                    <img src="${escapeHtml(img)}" alt="" loading="lazy">
                  </button>
                `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>

      <div class="spotlight-content">
        <div class="spotlight-meta">
          ${tag ? `<span class="spotlight-chip">${escapeHtml(tag)}</span>` : ""}
          ${secondaryTag ? `<span class="spotlight-chip">${escapeHtml(secondaryTag)}</span>` : ""}
        </div>

        <h3>${escapeHtml(prod.title || "Ukens Spotlight")}</h3>

        ${
          excerpt
            ? `<p>${escapeHtml(excerpt)}</p>`
            : `<p>Et håndplukket produkt denne uken.</p>`
        }

        ${ratingMarkup ? `<div class="spotlight-rating">${ratingMarkup}</div>` : ""}

        <div class="spotlight-price-row">
          ${
            newPriceNum != null
              ? `<span class="spotlight-price">${formatPrice(newPriceNum)}</span>`
              : ""
          }
          ${
            oldPriceNum != null
              ? `<span class="spotlight-old-price">${formatPrice(oldPriceNum)}</span>`
              : ""
          }
          ${
            discountPct
              ? `<span class="spotlight-discount">-${discountPct}%</span>`
              : ""
          }
        </div>

        <div class="spotlight-actions">
          <button type="button" class="spotlight-btn spotlight-btn--primary js-spotlight-cta">
            ${escapeHtml(ctaText)}
          </button>
          ${
            prod.brand
              ? `<span class="spotlight-brand">${escapeHtml(prod.brand)}</span>`
              : ""
          }
        </div>
      </div>
    `;

    const triggerOpen = (event) => {
      if (typeof onCardClick === "function") {
        onCardClick(prod, article, event);
        return;
      }

      if (!pid) return;
      window.location.href = `product.html?id=${encodeURIComponent(pid)}`;
    };

    article.addEventListener("click", (e) => {
      if (e.target.closest(".spotlight-thumb")) return;
      if (e.target.closest(".js-spotlight-cta")) return;
      triggerOpen(e);
    });

    article.querySelector(".js-spotlight-cta")?.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerOpen(e);
    });

    const mainImgEl = article.querySelector(".spotlight-main-image");
    const thumbButtons = article.querySelectorAll(".spotlight-thumb");
    const defaultMainImage = mainImage;

    thumbButtons.forEach((btn) => {
      btn.addEventListener("mouseenter", (e) => {
        e.stopPropagation();

        const nextImage = btn.dataset.image;
        if (!nextImage || !mainImgEl) return;

        mainImgEl.src = nextImage;

        thumbButtons.forEach((thumb) => thumb.classList.remove("is-active"));
        btn.classList.add("is-active");
      });

      btn.addEventListener("focus", (e) => {
        e.stopPropagation();

        const nextImage = btn.dataset.image;
        if (!nextImage || !mainImgEl) return;

        mainImgEl.src = nextImage;

        thumbButtons.forEach((thumb) => thumb.classList.remove("is-active"));
        btn.classList.add("is-active");
      });

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    });

    const thumbsWrap = article.querySelector(".spotlight-thumbs");
    thumbsWrap?.addEventListener("mouseleave", () => {
      if (!mainImgEl) return;
      mainImgEl.src = defaultMainImage;

      thumbButtons.forEach((thumb, index) => {
        thumb.classList.toggle("is-active", index === 0);
      });
    });

    return article;
  }

  // ---------- ARROW SLIDER ----------
  function initArrowSlider(trackEl, options = {}) {
    if (!trackEl) return;

    const wrapper = trackEl.closest(".slider-wrapper");
    if (!wrapper) return;

    const btnPrev = wrapper.querySelector(".slider-btn.prev");
    const btnNext = wrapper.querySelector(".slider-btn.next");
    const stepOverride = options.step || null;

    function getFirstSlide() {
      return (
        trackEl.firstElementChild ||
        trackEl.querySelector(".product-card") ||
        trackEl.querySelector(".spotlight-feature")
      );
    }

    function getStep() {
      if (typeof stepOverride === "number" && stepOverride > 0) {
        return stepOverride;
      }

      const first = getFirstSlide();
      if (!first) return Math.max(280, Math.round(trackEl.clientWidth * 0.9));

      const rect = first.getBoundingClientRect();
      const styles = window.getComputedStyle(trackEl);
      const gap = parseFloat(styles.columnGap || styles.gap || "18") || 18;

      return Math.max(260, Math.round(rect.width + gap));
    }

    function updateButtons() {
      const canScroll = trackEl.scrollWidth > trackEl.clientWidth + 8;

      if (!btnPrev || !btnNext) return;

      if (!canScroll) {
        btnPrev.style.display = "none";
        btnNext.style.display = "none";
        return;
      }

      btnPrev.style.display = "";
      btnNext.style.display = "";
    }

    btnPrev?.addEventListener("click", () => {
      trackEl.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    btnNext?.addEventListener("click", () => {
      trackEl.scrollBy({ left: getStep(), behavior: "smooth" });
    });

    window.addEventListener("resize", updateButtons);
    setTimeout(updateButtons, 120);
    setTimeout(updateButtons, 350);
  }

         function initMobileFocusCarousel(trackEl) {
    if (!trackEl) return;
    if (window.innerWidth > 768) return;

    let ticking = false;

    function getCards() {
      return Array.from(trackEl.children).filter((el) =>
        el.classList.contains("product-card")
      );
    }

    function updateCards() {
      const cards = getCards();
      if (!cards.length) return;

      const trackRect = trackEl.getBoundingClientRect();
      const viewportCenter = trackRect.left + trackRect.width / 2;

      let closestCard = null;
      let closestDistance = Infinity;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestCard = card;
        }

        const maxDistance = Math.max(trackRect.width * 0.58, 1);
        const normalized = Math.min(distance / maxDistance, 1);
        const focus = 1 - normalized;

        const scale = 0.94 + focus * 0.06;
        const opacity = 0.72 + focus * 0.28;
        const saturate = 0.94 + focus * 0.06;
        const lift = focus * 4;

        card.style.setProperty("--deal-scale", scale.toFixed(3));
        card.style.setProperty("--deal-opacity", opacity.toFixed(3));
        card.style.setProperty("--deal-saturate", saturate.toFixed(3));
        card.style.setProperty("--deal-lift", `${lift.toFixed(2)}px`);
        card.style.setProperty("--deal-z", String(10 + Math.round(focus * 10)));
      });

      cards.forEach((card) => {
        card.classList.remove("is-active");
      });

      if (closestCard) {
        closestCard.classList.add("is-active");
      }
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        updateCards();
        ticking = false;
      });
    }

    trackEl.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    setTimeout(updateCards, 60);
    setTimeout(updateCards, 180);
    setTimeout(updateCards, 320);
  }
  
  // ======================================================
  // 1) PARTNER BANNER
  // ======================================================
  async function loadPartnerBanner() {
    if (!partnerBannerEl) return;

    try {
      const rows = await fetchJson(PARTNER_SHEET_ID, PARTNER_TAB);
      const row = rows?.[0];

      if (!row) {
        partnerBannerEl.classList.remove("loading");
        partnerBannerEl.textContent = "Ingen partnerkampanje akkurat nå.";
        return;
      }

      partnerBannerEl.classList.remove("loading");
      partnerBannerEl.innerHTML = `
        <div class="partner-banner-inner">
          <div class="partner-banner-text">
            <p class="partner-tag">${escapeHtml(row.campaign_name || "Ukens partner")}</p>
            <h2>${escapeHtml(row.description || "")}</h2>
            <p class="partner-sub">${escapeHtml(row.alt_text || "")}</p>
            ${
              row.link
                ? `<a href="${escapeHtml(row.link)}" target="_blank" rel="noopener noreferrer" class="partner-cta">
                    ${escapeHtml(row.cta_text || "Se kampanjen")}
                   </a>`
                : ""
            }
          </div>
          ${
            row.image_url
              ? `<div class="partner-banner-image">
                   <img src="${escapeHtml(row.image_url)}" alt="${escapeHtml(row.alt_text || row.campaign_name || "")}">
                 </div>`
              : ""
          }
        </div>
      `;
    } catch (err) {
      console.error("❌ Partner banner error:", err);
      partnerBannerEl.classList.remove("loading");
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
          oldPrice != null && newPrice != null && oldPrice > newPrice
            ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
            : null;

        const prod = {
          id: d.id || d.product_id || `deal_${index}`,
          title: d.product_name || d.title || "",
          brand: d.brand || "",
          price: oldPrice != null ? oldPrice : newPrice,
          old_price: oldPrice,
          new_price: newPrice,
          discount,
          image_url: d.image_url || "",
          product_url: d.link || d.product_url || "",
          rating: d.rating || "",
          luxury: false,
          category: d.category || ""
        };

        prod.id = resolveProductIdSafe(prod);

        const card = buildEliteCard(prod, {
          extraClasses: "deal-card",
          onCardClick: (product) => {
            if (product.product_url) {
              window.open(product.product_url, "_blank", "noopener");
              return;
            }
            if (product.id) {
              window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
            }
          }
        });

        dealsTrack.appendChild(card);
      });

           initArrowSlider(dealsTrack);
      initMobileFocusCarousel(dealsTrack);
    } catch (err) {
      console.error("❌ Deals error:", err);
      dealsTrack.classList.remove("loading");
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
          title: p.product_name || p.title || "",
          brand: p.brand || "",
          price: p.price || "",
          discount: p.discount || "",
          image_url: p.image_url || "",
          product_url: p.link || p.product_url || "",
          rating: p.rating || "",
          luxury: parseBool(p.luxury),
          category: p.category || ""
        };

        prod.id = resolveProductIdSafe(prod);

        const card = buildEliteCard(prod, {
          showExcerpt: false,
          tag: p.reason || "",
          extraClasses: "pick-card",
          onCardClick: (product) => {
            if (product.product_url) {
              window.open(product.product_url, "_blank", "noopener");
              return;
            }
            if (product.id) {
              window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
            }
          }
        });

        picksTrack.appendChild(card);
      });

      initArrowSlider(picksTrack);
    } catch (err) {
      console.error("❌ Picks error:", err);
      picksTrack.classList.remove("loading");
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

      const masterById = new Map(
        masterRows.map((row) => [String(row.id || "").trim(), row])
      );

      const merged = [];

      newsRows.forEach((row) => {
        const id = String(row.id || "").trim();
        if (!id) return;

        const master = masterById.get(id);
        if (!master) return;

        const base = createProductBaseFromMaster(master);
        if (!base) return;

        merged.push({
          product: base,
          spotlight: parseBool(row.spotlight),
          showInFeed: parseBool(row.show_in_feed),
          excerpt: row.excerpt || row.description || "",
          tag: row.tag || "",
          priority: row.priority ? parseInt(row.priority, 10) || 999 : 999
        });
      });

      const spotlightItems = merged
        .filter((m) => m.spotlight)
        .sort((a, b) => a.priority - b.priority);

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
            const spotlightCard = buildSpotlightCard(item.product, {
              excerpt: item.excerpt,
              tag: item.tag || "Spotlight",
              secondaryTag: item.product.brand || item.product.category || "",
              ctaText: "Utforsk produkt",
              onCardClick: (product) => {
                if (!product?.id) return;
                window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
              }
            });

            spotlightTrack.appendChild(spotlightCard);
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

      if (spotlightTrack) {
        spotlightTrack.classList.remove("loading");
        spotlightTrack.textContent = "Kunne ikke laste spotlight.";
      }

      if (newsGridEl) {
        newsGridEl.classList.remove("loading");
        newsGridEl.textContent = "Kunne ikke laste nyhetsfeed.";
      }
    }
  }

  // ======================================================
  // INIT
  // ======================================================
  document.addEventListener("DOMContentLoaded", () => {
    ensureDealsRibbonStyles();
    loadPartnerBanner();
    loadDeals();
    loadPicks();
    loadNewsSections();
  });
})();
