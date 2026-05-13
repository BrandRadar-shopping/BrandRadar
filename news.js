// ======================================================
// 📰 BrandRadar – News page SUPABASE CONTROLLED
//  - Kun Supabase
//  - Ingen Google Sheets
//  - Ingen auto-fallback fra products
//  - Seksjoner styres av egne tabeller:
//    news_spotlight, partner_campaigns, news_deals,
//    news_picks, news_trending
// ======================================================

const t = window.BrandRadarLang?.t || ((key, fallback) => fallback || key);

(function () {
  console.log("✅ news.js loaded – Supabase controlled version");

  const supabase = window.BrandRadarSupabase;

  const partnerBannerEl = document.querySelector(".partner-banner");
  const dealsTrack = document.getElementById("deals-track");
  const picksTrack = document.getElementById("picks-track");
  const spotlightTrack = document.getElementById("spotlight-track");
  const newsGridEl = document.getElementById("news-grid");

  const nb = new Intl.NumberFormat("nb-NO");

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

  function parseBool(v) {
    if (v === true) return true;
    if (v === false) return false;
    if (!v && v !== 0) return false;
    const s = String(v).trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "ja";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatPrice(value) {
    const n = parseNum(value);
    if (n == null || n <= 0 || n > 999999) return "";
    return `${nb.format(Math.round(n))} kr`;
  }

  function currentLang() {
    return window.BrandRadarLang?.get?.() || "no";
  }

  function langField(row, key, fallback = "") {
    if (!row) return fallback;

    if (currentLang() === "en") {
      const enValue = row[`${key}_en`];
      if (enValue != null && String(enValue).trim() !== "") return enValue;
    }

    const value = row[key];
    if (value != null && String(value).trim() !== "") return value;

    return fallback;
  }

  function resolveProductId(product) {
    return String(
      product?.external_id ||
      product?.id ||
      product?.product_id ||
      product?.original_id ||
      ""
    ).trim();
  }

  function normalizeProduct(row) {
    if (!row) return null;

    const id = resolveProductId(row);
    if (!id) return null;

    return {
      ...row,
      id,
      external_id: row.external_id || id,
      title: row.title || row.product_name || row.name || "",
      product_name: row.product_name || row.title || row.name || "",
      brand: row.brand || row.brand_name || "",
      image_url: row.image_url || row.image || row.main_image || row.thumbnail_url || "",
      image_2: row.image_2 || row.image2 || row.thumbnail_1 || "",
      image_3: row.image_3 || row.image3 || row.thumbnail_2 || "",
      image_4: row.image_4 || row.image4 || row.thumbnail_3 || "",
      image_5: row.image_5 || row.image5 || row.thumbnail_4 || "",
      price: row.price || row.new_price || "",
      old_price: row.old_price || "",
      discount: row.discount || "",
      product_url: row.product_url || row.affiliate_url || row.store_url || "",
      category: row.category || row.main_category || "",
      subcategory: row.subcategory || "",
      rating: row.rating || "",
      luxury: parseBool(row.luxury)
    };
  }

  function getPriceState(product) {
    const price = parseNum(product.price || product.new_price);
    const oldPrice = parseNum(product.old_price);
    const discountRaw = parseNum(product.discount);

    let newPriceNum = price;
    let oldPriceNum = null;
    let discountPct = null;

    if (oldPrice != null && price != null && oldPrice > price) {
      oldPriceNum = oldPrice;
      discountPct = Math.round(((oldPrice - price) / oldPrice) * 100);
    } else if (price != null && discountRaw != null && discountRaw > 0) {
      const percent = discountRaw > 1 ? discountRaw : discountRaw * 100;
      oldPriceNum = price;
      newPriceNum = Math.round(price * (1 - percent / 100));
      discountPct = Math.round(percent);
    }

    return { newPriceNum, oldPriceNum, discountPct };
  }

  function getDescription(product) {
    return (
      langField(product, "description", "") ||
      langField(product, "short_description", "") ||
      langField(product, "excerpt", "") ||
      ""
    );
  }

  function buildFavoritePayload(product, pid) {
    return {
      id: pid,
      title: product.title || product.product_name || "",
      product_name: product.product_name || product.title || "",
      brand: product.brand || "",
      price: product.price || "",
      discount: product.discount || "",
      image_url: product.image_url || "",
      product_url: product.product_url || "",
      category: product.category || "",
      rating: product.rating || "",
      luxury: !!product.luxury
    };
  }

  async function fetchControlRows(tableName) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("active", true)
      .order("rank", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function fetchProductsByIds(ids) {
    const cleanIds = [...new Set(ids.map(String).map((id) => id.trim()).filter(Boolean))];

    if (!cleanIds.length) return new Map();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("external_id", cleanIds);

    if (error) throw error;

    const map = new Map();

    (data || []).forEach((row) => {
      const product = normalizeProduct(row);
      if (!product) return;
      map.set(product.external_id, product);
    });

    return map;
  }

  async function fetchControlledSection(tableName) {
    const rows = await fetchControlRows(tableName);
    const productIds = rows.map((row) => row.product_id).filter(Boolean);
    const productsById = await fetchProductsByIds(productIds);

    return rows
      .map((row) => {
        const product = productsById.get(String(row.product_id || "").trim());
        if (!product) {
          console.warn(`⚠️ ${tableName}: Fant ikke produkt for product_id`, row.product_id);
          return null;
        }

        return {
          control: row,
          product: {
            ...product,
            ...row,
            id: product.external_id,
            external_id: product.external_id,
            title: product.title || product.product_name || "",
            product_name: product.product_name || product.title || ""
          }
        };
      })
      .filter(Boolean);
  }

  function buildRatingMarkup(ratingValue) {
    const rating = parseNum(ratingValue);
    if (rating == null || rating <= 0) return "";

    const safe = Math.max(0, Math.min(5, rating));

    return `
      <div class="rating-stars" aria-label="${escapeHtml(t("rating", "Rating"))} ${safe.toFixed(1)}">
        <span>★</span>
        <span class="rating-value">${safe.toFixed(1)}</span>
      </div>
    `;
  }

  function buildDealsCornerRibbon() {
    return `
      <span class="deals-corner-ribbon">${escapeHtml(t("deals_label", "DEALS"))}</span>
      <span class="deals-corner-ribbon-gloss"></span>
    `;
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
        top: 18px;
        left: -44px;
        width: 132px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #111827 0%, #1f2937 42%, #0f172a 100%);
        color: #fff;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        transform: rotate(-45deg);
        z-index: 8;
        pointer-events: none;
      }

      .news-section--deals .deal-card .deals-corner-ribbon-gloss {
        position: absolute;
        top: 18px;
        left: -44px;
        width: 132px;
        height: 32px;
        transform: rotate(-45deg);
        background: linear-gradient(to bottom, rgba(255,255,255,.08), rgba(0,0,0,.08));
        z-index: 7;
        pointer-events: none;
      }

      .news-section--deals .deal-card.product-card .favorite-toggle {
        z-index: 10;
      }
    `;

    document.head.appendChild(style);
  }

  function buildEliteCard(product, options = {}) {
    const {
      showExcerpt = false,
      excerpt = "",
      tag = "",
      extraClasses = ""
    } = options;

    const pid = resolveProductId(product);
    const isDealCard = String(extraClasses || "").split(/\s+/).includes("deal-card");
    const { newPriceNum, oldPriceNum, discountPct } = getPriceState(product);

    const isFav =
      typeof window.isProductFavorite === "function" && pid
        ? window.isProductFavorite(pid)
        : false;

    const card = document.createElement("article");
    card.className = `product-card ${extraClasses}`.trim();
    card.setAttribute("data-product-id", pid);

    card.innerHTML = `
      ${isDealCard ? buildDealsCornerRibbon() : ""}
      ${!isDealCard && discountPct ? `<div class="discount-badge">-${discountPct}%</div>` : ""}

      <button type="button" class="favorite-toggle ${isFav ? "active" : ""}" aria-label="Favoritt">
        <svg viewBox="0 0 24 24" class="heart-icon" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
          14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
          3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>

      <img src="${escapeHtml(product.image_url || "")}" alt="${escapeHtml(product.title || product.product_name || "")}" loading="lazy">

      <div class="product-info">
        <p class="brand">${escapeHtml(product.brand || "")}</p>
        <h3 class="product-name">${escapeHtml(product.title || product.product_name || "")}</h3>

        ${showExcerpt && excerpt ? `<p class="tagline">${escapeHtml(excerpt)}</p>` : ""}
        ${tag ? `<p class="product-tag">${escapeHtml(tag)}</p>` : ""}

        ${buildRatingMarkup(product.rating)}

        <div class="price-line">
          ${newPriceNum != null ? `<span class="new-price">${formatPrice(newPriceNum)}</span>` : ""}
          ${oldPriceNum != null ? `<span class="old-price">${formatPrice(oldPriceNum)}</span>` : ""}
          ${isDealCard && discountPct ? `<span class="discount-pill">-${discountPct}%</span>` : ""}
        </div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".favorite-toggle")) return;
      if (pid) window.location.href = `product.html?id=${encodeURIComponent(pid)}`;
    });

    const favButton = card.querySelector(".favorite-toggle");
    favButton?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof window.toggleFavorite !== "function" || !pid) return;

      window.toggleFavorite(buildFavoritePayload(product, pid), favButton);

      const active =
        typeof window.isProductFavorite === "function"
          ? window.isProductFavorite(pid)
          : favButton.classList.toggle("active");

      favButton.classList.toggle("active", active);
    });

    return card;
  }

  function buildRadarPickCard(product, control) {
    const pid = resolveProductId(product);
    const { newPriceNum, oldPriceNum, discountPct } = getPriceState(product);

    const isFav =
      typeof window.isProductFavorite === "function" && pid
        ? window.isProductFavorite(pid)
        : false;

    const reason =
      langField(control, "reason", "") ||
      getDescription(product);

    const badgeText =
      langField(control, "badge", "") ||
      "EDITOR'S PICK";

    const labelText =
      langField(control, "label", "") ||
      product.subcategory ||
      product.category ||
      "";

    const card = document.createElement("article");
    card.className = "radar-pick-card";
    card.setAttribute("data-product-id", pid);

    card.innerHTML = `
      <button type="button" class="radar-pick-fav ${isFav ? "active" : ""}" aria-label="Favoritt">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
          14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
          3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>

      ${discountPct ? `<span class="radar-pick-discount">-${discountPct}%</span>` : ""}
      <span class="radar-pick-badge">${escapeHtml(badgeText)}</span>

      <div class="radar-pick-media">
        <img src="${escapeHtml(product.image_url || "")}" alt="${escapeHtml(product.title || product.product_name || "")}" loading="lazy">
      </div>

      <div class="radar-pick-body">
        <p class="radar-pick-brand">${escapeHtml(product.brand || "")}</p>
        <h3>${escapeHtml(product.title || product.product_name || "")}</h3>

        ${reason ? `<p class="radar-pick-reason">${escapeHtml(reason)}</p>` : ""}
        ${labelText ? `<span class="radar-pick-label">${escapeHtml(labelText)}</span>` : ""}

        <div class="radar-pick-bottom">
          <div class="radar-pick-price">
            ${newPriceNum != null ? `<span>${formatPrice(newPriceNum)}</span>` : ""}
            ${oldPriceNum != null ? `<del>${formatPrice(oldPriceNum)}</del>` : ""}
          </div>
          <span class="radar-pick-arrow">→</span>
        </div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".radar-pick-fav")) return;
      if (pid) window.location.href = `product.html?id=${encodeURIComponent(pid)}`;
    });

    const favBtn = card.querySelector(".radar-pick-fav");
    favBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof window.toggleFavorite !== "function" || !pid) return;

      window.toggleFavorite(buildFavoritePayload(product, pid), favBtn);

      const active =
        typeof window.isProductFavorite === "function"
          ? window.isProductFavorite(pid)
          : favBtn.classList.toggle("active");

      favBtn.classList.toggle("active", active);
    });

    return card;
  }

  function getSpotlightImages(product) {
    return [
      product.image_url,
      product.image_2,
      product.image_3,
      product.image_4,
      product.image_5
    ]
      .map((img) => String(img || "").trim())
      .filter(Boolean)
      .filter((img, index, arr) => arr.indexOf(img) === index)
      .slice(0, 5);
  }

  function buildSpotlightCard(product, control) {
    const pid = resolveProductId(product);
    const images = getSpotlightImages(product);
    const mainImage = images[0] || product.image_url || "";
    const thumbs = images.slice(0, 4);

    const { newPriceNum, oldPriceNum, discountPct } = getPriceState(product);

    const excerpt =
      langField(control, "excerpt", "") ||
      getDescription(product);

    const tag =
      langField(control, "tag", "") ||
      t("spotlight", "Spotlight");

    const article = document.createElement("article");
    article.className = "spotlight-feature";
    article.setAttribute("data-product-id", pid);

    article.innerHTML = `
      <div class="spotlight-media">
        <span class="spotlight-overlay-badge">${escapeHtml(tag)}</span>

        <div class="spotlight-main-image-wrap">
          <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(product.title || product.product_name || "")}" loading="lazy" class="spotlight-main-image">
        </div>

        ${
          thumbs.length
            ? `
              <div class="spotlight-thumbs">
                ${thumbs.map((img, index) => `
                  <button type="button" class="spotlight-thumb ${index === 0 ? "is-active" : ""}" data-image="${escapeHtml(img)}">
                    <img src="${escapeHtml(img)}" alt="" loading="lazy">
                  </button>
                `).join("")}
              </div>
            `
            : ""
        }
      </div>

      <div class="spotlight-content">
        <div class="spotlight-meta">
          <span class="spotlight-chip">${escapeHtml(tag)}</span>
          ${product.brand ? `<span class="spotlight-chip">${escapeHtml(product.brand)}</span>` : ""}
        </div>

        <h3>${escapeHtml(product.title || product.product_name || "")}</h3>
        ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ""}

        ${buildRatingMarkup(product.rating)}

        <div class="spotlight-price-row">
          ${newPriceNum != null ? `<span class="spotlight-price">${formatPrice(newPriceNum)}</span>` : ""}
          ${oldPriceNum != null ? `<span class="spotlight-old-price">${formatPrice(oldPriceNum)}</span>` : ""}
          ${discountPct ? `<span class="spotlight-discount">-${discountPct}%</span>` : ""}
        </div>

        <div class="spotlight-actions">
          <button type="button" class="spotlight-btn spotlight-btn--primary js-spotlight-cta">
            ${escapeHtml(t("explore_product", "Utforsk produkt"))}
          </button>
          ${product.brand ? `<span class="spotlight-brand">${escapeHtml(product.brand)}</span>` : ""}
        </div>
      </div>
    `;

    function openProduct() {
      if (pid) window.location.href = `product.html?id=${encodeURIComponent(pid)}`;
    }

    article.addEventListener("click", (e) => {
      if (e.target.closest(".spotlight-thumb")) return;
      if (e.target.closest(".js-spotlight-cta")) return;
      openProduct();
    });

    article.querySelector(".js-spotlight-cta")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openProduct();
    });

    const mainImgEl = article.querySelector(".spotlight-main-image");
    const thumbButtons = article.querySelectorAll(".spotlight-thumb");

    thumbButtons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        const nextImage = btn.dataset.image;
        if (!nextImage || !mainImgEl) return;

        mainImgEl.src = nextImage;
        thumbButtons.forEach((thumb) => thumb.classList.remove("is-active"));
        btn.classList.add("is-active");
      });

      btn.addEventListener("click", (e) => e.stopPropagation());
    });

    return article;
  }

  function initArrowSlider(trackEl) {
    if (!trackEl) return;

    const wrapper = trackEl.closest(".slider-wrapper");
    if (!wrapper) return;

    const btnPrev = wrapper.querySelector(".slider-btn.prev");
    const btnNext = wrapper.querySelector(".slider-btn.next");

    function getStep() {
      const first = trackEl.firstElementChild;
      if (!first) return 320;

      const rect = first.getBoundingClientRect();
      const styles = window.getComputedStyle(trackEl);
      const gap = parseFloat(styles.columnGap || styles.gap || "18") || 18;

      return Math.max(260, Math.round(rect.width + gap));
    }

    function updateButtons() {
      const canScroll = trackEl.scrollWidth > trackEl.clientWidth + 8;

      if (!btnPrev || !btnNext) return;

      btnPrev.style.display = canScroll ? "" : "none";
      btnNext.style.display = canScroll ? "" : "none";
    }

    btnPrev?.addEventListener("click", () => {
      trackEl.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    btnNext?.addEventListener("click", () => {
      trackEl.scrollBy({ left: getStep(), behavior: "smooth" });
    });

    setTimeout(updateButtons, 100);
    setTimeout(updateButtons, 350);
    window.addEventListener("resize", updateButtons);
  }

  function clearSection(el, emptyText) {
    if (!el) return;
    el.classList.remove("loading");
    el.innerHTML = "";
    el.textContent = emptyText;
  }

  async function renderSpotlight() {
    if (!spotlightTrack) return;

    const items = await fetchControlledSection("news_spotlight");

    spotlightTrack.classList.remove("loading");
    spotlightTrack.innerHTML = "";

    if (!items.length) {
      clearSection(spotlightTrack, t("no_spotlight_now", "Ingen spotlight-produkter akkurat nå."));
      return;
    }

    items.forEach(({ product, control }) => {
      spotlightTrack.appendChild(buildSpotlightCard(product, control));
    });

    initArrowSlider(spotlightTrack);
  }

  async function renderPartnerCampaign() {
    if (!partnerBannerEl) return;

    const rows = await fetchControlRows("partner_campaigns");
    partnerBannerEl.classList.remove("loading");
    partnerBannerEl.innerHTML = "";

    if (!rows.length) {
      partnerBannerEl.textContent = t("no_partner_campaign_now", "Ingen partnerkampanje akkurat nå.");
      return;
    }

    const row = rows[0];
    let product = null;

    if (row.product_id) {
      const map = await fetchProductsByIds([row.product_id]);
      product = map.get(String(row.product_id).trim());
    }

    const campaignName =
      langField(row, "campaign_name", "") ||
      product?.brand ||
      t("weekly_partner", "Ukens partner");

    const description =
      langField(row, "description", "") ||
      product?.title ||
      product?.product_name ||
      "";

    const ctaText =
      langField(row, "cta_text", "") ||
      t("see_campaign", "Se kampanjen");

    const imageUrl = row.image_url || product?.image_url || "";
    const link =
      row.link ||
      (product ? `product.html?id=${encodeURIComponent(resolveProductId(product))}` : "#");

    partnerBannerEl.innerHTML = `
      <div class="partner-banner-inner">
        <div class="partner-banner-text">
          <p class="partner-tag">${escapeHtml(campaignName)}</p>
          <h2>${escapeHtml(description)}</h2>
          ${product ? `<p class="partner-sub">${escapeHtml(getDescription(product))}</p>` : ""}
          <a href="${escapeHtml(link)}" class="partner-cta">
            ${escapeHtml(ctaText)}
          </a>
        </div>

        ${
          imageUrl
            ? `
              <div class="partner-banner-image">
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(description || campaignName)}">
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  async function renderDeals() {
    if (!dealsTrack) return;

    const items = await fetchControlledSection("news_deals");

    dealsTrack.classList.remove("loading");
    dealsTrack.innerHTML = "";

    if (!items.length) {
      clearSection(dealsTrack, t("no_deals_now", "Ingen deals akkurat nå."));
      return;
    }

    items.forEach(({ product, control }) => {
      const card = buildEliteCard(product, {
        extraClasses: "deal-card",
        tag: langField(control, "highlight_reason", "")
      });

      dealsTrack.appendChild(card);
    });

    initArrowSlider(dealsTrack);
  }

  async function renderPicks() {
    if (!picksTrack) return;

    const items = await fetchControlledSection("news_picks");

    picksTrack.classList.remove("loading");
    picksTrack.innerHTML = "";

    if (!items.length) {
      clearSection(picksTrack, t("no_picks_now", "Ingen picks akkurat nå."));
      return;
    }

    items.forEach(({ product, control }) => {
      picksTrack.appendChild(buildRadarPickCard(product, control));
    });

    initArrowSlider(picksTrack);
  }

  async function renderTrending() {
    if (!newsGridEl) return;

    const items = await fetchControlledSection("news_trending");

    newsGridEl.classList.remove("loading");
    newsGridEl.innerHTML = "";

    if (!items.length) {
      clearSection(newsGridEl, t("no_new_products_now", "Ingen nye produkter akkurat nå."));
      return;
    }

    items.forEach(({ product, control }) => {
      const card = buildEliteCard(product, {
        showExcerpt: true,
        excerpt: langField(control, "excerpt", "") || getDescription(product),
        tag: langField(control, "tag", "") || product.subcategory || product.category || "",
        extraClasses: "news-card"
      });

      newsGridEl.appendChild(card);
    });
  }

  async function renderNewsPage() {
    try {
      if (!supabase?.from) {
        throw new Error("Supabase client mangler. Sjekk supabase-config.js og script-rekkefølgen.");
      }

      ensureDealsRibbonStyles();

      await Promise.all([
        renderSpotlight(),
        renderPartnerCampaign(),
        renderDeals(),
        renderPicks(),
        renderTrending()
      ]);
    } catch (err) {
      console.error("❌ News page error:", err);

      [partnerBannerEl, dealsTrack, picksTrack, spotlightTrack, newsGridEl].forEach((el) => {
        if (!el) return;
        el.classList.remove("loading");
        el.textContent = t("could_not_load_newsfeed", "Kunne ikke laste nyhetssiden.");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", renderNewsPage);
  window.addEventListener("brandradar:languagechange", renderNewsPage);
})();
