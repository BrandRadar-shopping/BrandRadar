// ======================================================
// 📰 BrandRadar – News page (partner + deals + picks + spotlight + feed)
// ======================================================

(function () {
  console.log("✅ news.js loaded");

  // ---------- SHEET-KONFIG (100% RIKTIGE) ----------
  const NEWS_SHEET_ID = "1CSJjHvL7VytKfCd61IQf-53g3nAl9GrnC1Vmz7ZGF54";
  const NEWS_TAB = "news";

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

  function parseNumber(val) {
    if (val == null) return null;
    const s = String(val).replace(/\s/g, "").replace(/[^\d,.\-]/g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function formatPrice(n) {
    if (n == null) return "";
    return `${nb.format(Math.round(n))} kr`;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}.${m}.${y}`;
  }

  async function fetchSheetJson(sheetId, tab) {
    const url = `https://opensheet.elk.sh/${sheetId}/${tab}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Feil ved henting av ${tab}: ${res.status}`);
    return res.json();
  }

  // ======================================================
  // 1) PARTNER BANNER
  // ======================================================
  async function loadPartnerBanner() {
    if (!partnerBannerEl) return;

    try {
      const rows = await fetchSheetJson(PARTNER_SHEET_ID, PARTNER_TAB);
      const row = rows[0];
      if (!row) {
        partnerBannerEl.style.display = "none";
        return;
      }

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
                   <img src="${row.image_url}" alt="${row.alt_text || row.campaign_name || "Partner"}">
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
    if (!dealsGridEl) return;

    try {
      const rows = await fetchSheetJson(DEALS_SHEET_ID, DEALS_TAB);
      dealsGridEl.classList.remove("loading");
      dealsGridEl.innerHTML = "";

      if (!rows.length) {
        dealsGridEl.textContent = "Ingen deals akkurat nå.";
        return;
      }

      rows.forEach(d => {
        const oldPrice = parseNumber(d.old_price);
        const newPrice = parseNumber(d.new_price);
        let discount = null;

        if (oldPrice && newPrice && oldPrice > newPrice) {
          discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
        }

        const validText = d.valid_until
          ? `Gjelder til ${formatDate(d.valid_until)}`
          : "";

        const card = document.createElement("article");
        card.className = "deal-card";

        card.innerHTML = `
          ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}
          <div class="deal-image">
            <img src="${d.image_url || ""}" alt="${d.product_name || ""}">
          </div>
          <div class="deal-info">
            <p class="brand">${d.brand || ""}</p>
            <h3 class="product-name">${d.product_name || ""}</h3>
            <div class="price-line">
              <span class="new-price">${newPrice ? formatPrice(newPrice) : ""}</span>
              ${oldPrice ? `<span class="old-price">${formatPrice(oldPrice)}</span>` : ""}
            </div>
            ${validText ? `<p class="valid-until">${validText}</p>` : ""}
            ${
              d.link
                ? `<a href="${d.link}" target="_blank" class="deal-btn">Se deal</a>`
                : ""
            }
          </div>
        `;

        dealsGridEl.appendChild(card);
      });
    } catch (err) {
      console.error("❌ Deals error:", err);
      dealsGridEl.textContent = "Kunne ikke laste deals.";
    }
  }

  // ======================================================
  // 3) RADAR PICKS
  // ======================================================
  async function loadPicks() {
    if (!picksGridEl) return;

    try {
      const rows = await fetchSheetJson(PICKS_SHEET_ID, PICKS_TAB);
      picksGridEl.classList.remove("loading");
      picksGridEl.innerHTML = "";

      if (!rows.length) {
        picksGridEl.textContent = "Ingen picks akkurat nå.";
        return;
      }

      rows.forEach(p => {
        const price = parseNumber(p.price);
        const rating = parseNumber(p.rating);
        const discount = parseNumber(p.discount);

        const card = document.createElement("article");
        card.className = "pick-card";

        card.innerHTML = `
          ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}
          <div class="pick-image">
            <img src="${p.image_url || ""}" alt="${p.product_name || ""}">
          </div>
          <div class="pick-info">
            <p class="brand">${p.brand || ""}</p>
            <h3 class="product-name">${p.product_name || ""}</h3>
            ${
              rating
                ? `<p class="rating">⭐ ${rating.toFixed(1)}</p>`
                : `<p class="rating"><span style="color:#ccc;">–</span></p>`
            }
            ${price ? `<p class="price">${formatPrice(price)}</p>` : ""}
            ${p.reason ? `<p class="reason">${p.reason}</p>` : ""}
            ${
              p.link
                ? `<a href="${p.link}" target="_blank" class="pick-btn">Se produkt</a>`
                : ""
            }
          </div>
        `;

        picksGridEl.appendChild(card);
      });
    } catch (err) {
      console.error("❌ Picks error:", err);
      picksGridEl.textContent = "Kunne ikke laste picks.";
    }
  }

  // ======================================================
  // 4) SPOTLIGHT + NEWS FEED
  // ======================================================
  async function loadNewsFeed() {
    if (!spotlightWrapper && !newsGridEl) return;

    try {
      const rows = await fetchSheetJson(NEWS_SHEET_ID, NEWS_TAB);

      const featured = rows.filter(
        r => String(r.featured || "").toLowerCase() === "true"
      );
      const regular = rows.filter(
        r => String(r.featured || "").toLowerCase() !== "true"
      );

      // ----- Spotlight -----
      if (spotlightWrapper) {
        spotlightWrapper.classList.remove("loading");
        spotlightWrapper.innerHTML = "";

        if (!featured.length) {
          spotlightWrapper.textContent = "Ingen spotlight-produkter akkurat nå.";
        } else {
          featured.forEach(item => {
            const price = parseNumber(item.price);

            const article = document.createElement("article");
            article.className = "featured-card";

            article.innerHTML = `
              <div class="featured-image">
                <img src="${item.image_url || ""}" alt="${item.product_name || ""}">
              </div>
              <div class="featured-content">
                <p class="badge">Spotlight</p>
                <h3>${item.brand || ""} – ${item.product_name || ""}</h3>
                ${item.excerpt ? `<p class="excerpt">${item.excerpt}</p>` : ""}
                ${price ? `<p class="price">${formatPrice(price)}</p>` : ""}
                ${
                  item.link
                    ? `<a href="${item.link}" target="_blank" class="product-btn">Se produkt</a>`
                    : ""
                }
              </div>
            `;

            spotlightWrapper.appendChild(article);
          });
        }
      }

      // ----- News feed -----
      if (newsGridEl) {
        newsGridEl.classList.remove("loading");
        newsGridEl.innerHTML = "";

        if (!regular.length) {
          newsGridEl.textContent = "Ingen nye produkter akkurat nå.";
          return;
        }

        regular.forEach(item => {
          const price = parseNumber(item.price);

          const article = document.createElement("article");
          article.className = "news-card";

          article.innerHTML = `
            <div class="news-image">
              <img src="${item.image_url || ""}" alt="${item.product_name || ""}">
            </div>
            <div class="news-info">
              <p class="brand">${item.brand || ""}</p>
              <p class="product">${item.product_name || ""}</p>
              ${item.excerpt ? `<p class="tagline">${item.excerpt}</p>` : ""}
              ${price ? `<p class="price">${formatPrice(price)}</p>` : ""}
              ${
                item.link
                  ? `<a href="${item.link}" target="_blank" class="read-more">Se produkt</a>`
                  : ""
              }
            </div>
          `;

          newsGridEl.appendChild(article);
        });
      }
    } catch (err) {
      console.error("❌ News feed error:", err);
      if (newsGridEl) newsGridEl.textContent = "Kunne ikke laste nyhetsfeed.";
      if (spotlightWrapper) spotlightWrapper.textContent = "Kunne ikke laste spotlight.";
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


