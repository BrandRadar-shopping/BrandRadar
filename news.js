// ======================================================
// ✅ BrandRadar – News Page v10 (Partner + Spotlight + Picks + Deals + Feed)
// ======================================================

// -----------------------------
// Konstanter / Sheets
// -----------------------------

// 1) Hovedfeed (CSV – allerede publisert)
const NEWS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

// 2) Partnerbanner (opensheet)
const PARTNER_SHEET_ID = "166anlag430W7KlUKCrkVGd585PldREW7fC8JQ5g7WK4";
const PARTNER_TAB = "Ark 1";

// 3) Ukens Deals (opensheet)
const DEALS_SHEET_ID = "1GZH_z1dSV40X9GYRKWNV_F1Oe8JwapRBYy9nnDP0KmY";
const DEALS_TAB = "Ark 1";

// 4) Radar Picks (opensheet)
const RADAR_SHEET_ID = "18eu0oOvtxuteHRf7wR0WEkmQMfNYet2qHtQSCgrpbYI";
const RADAR_TAB = "Ark 1";

// -----------------------------
// Felles helpers
// -----------------------------

const nbFormatter = new Intl.NumberFormat("nb-NO");

function parseNumber(val) {
  if (val == null) return null;
  const s = String(val)
    .replace(/\s/g, "")
    .replace(/[^\d,.\-]/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function formatPrice(val) {
  const n = parseNumber(val);
  if (!n && n !== 0) return "";
  return `${nbFormatter.format(Math.round(n))} kr`;
}

// Enkel CSV-parser for NEWS_SHEET_URL
async function fetchCsvSheet(url) {
  const res = await fetch(url);
  const text = await res.text();

  const rows = text.trim().split("\n").map(r => r.split(","));
  const headers = rows[0].map(h => h.trim());

  return rows.slice(1).map(row => {
    const obj = {};
    row.forEach((val, i) => {
      obj[headers[i]] = (val || "").trim();
    });
    return obj;
  });
}

// Generic opensheet fetch
async function fetchJsonSheet(sheetId, tabName) {
  const url = `https://opensheet.elk.sh/${sheetId}/${encodeURIComponent(
    tabName
  )}`;
  const res = await fetch(url);
  return await res.json();
}

// -----------------------------
// 1) Partnerbanner
// -----------------------------

async function loadPartnerBanner() {
  const container = document.getElementById("partner-banner");
  if (!container) return;

  try {
    const rows = await fetchJsonSheet(PARTNER_SHEET_ID, PARTNER_TAB);
    if (!rows || !rows.length) {
      container.style.display = "none";
      return;
    }

    const row = rows[0]; // vi bruker bare første rad
    const imageUrl = row.image_url || "";
    const link = row.link || "#";
    const alt = row.alt_text || row.campaign_name || "Ukens partner";
    const title = row.campaign_name || "Ukens partner";
    const desc = row.description || "";
    const cta = row.cta_text || "Se kampanjen";

    container.innerHTML = `
      <a href="${link}" target="_blank" class="partner-banner-card">
        <div class="partner-banner-image">
          <img src="${imageUrl}" alt="${alt}">
        </div>
        <div class="partner-banner-content">
          <p class="partner-tag">${title}</p>
          <p class="partner-desc">${desc}</p>
          <span class="partner-cta">${cta}</span>
        </div>
      </a>
    `;
  } catch (err) {
    console.error("❌ Klarte ikke laste partnerbanner:", err);
    container.style.display = "none";
  }
}

// -----------------------------
// 2) Radar Picks
// -----------------------------

async function loadRadarPicks() {
  const container = document.getElementById("radar-picks-grid");
  if (!container) return;

  try {
    const rows = await fetchJsonSheet(RADAR_SHEET_ID, RADAR_TAB);
    if (!rows || !rows.length) {
      container.innerHTML = "<p>Ingen radar-picks tilgjengelig akkurat nå.</p>";
      return;
    }

    // featured først
    const featured = rows.filter(
      r => String(r.featured || "").toLowerCase() === "true"
    );
    const regular = rows.filter(
      r => String(r.featured || "").toLowerCase() !== "true"
    );

    const ordered = [...featured, ...regular];

    container.innerHTML = "";

    ordered.forEach(item => {
      const priceText = formatPrice(item.price);
      const reason = item.reason || "";
      const rating = parseNumber(item.rating);
      const discount = parseNumber(item.discount);

      const card = document.createElement("article");
      card.className = "news-card radar-card";
      if (featured.includes(item)) card.classList.add("featured");

      card.innerHTML = `
        ${
          discount
            ? `<div class="discount-badge">-${discount}%</div>`
            : ""
        }
        <img src="${item.image_url || ""}" alt="${item.product_name || ""}">
        <div class="news-info">
          <h3>${item.brand || ""}</h3>
          <p class="product">${item.product_name || ""}</p>
          ${
            rating
              ? `<p class="rating">⭐ ${rating.toFixed(1)}</p>`
              : `<p class="rating"><span style="color:#ccc;">–</span></p>`
          }
          <div class="price-line">
            ${
              priceText
                ? `<span class="new-price">${priceText}</span>`
                : ""
            }
          </div>
          ${
            reason
              ? `<p class="tagline">${reason}</p>`
              : ""
          }
          ${
            item.link
              ? `<a href="${item.link}" target="_blank" class="read-more">Se produkt</a>`
              : ""
          }
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Klarte ikke laste Radar Picks:", err);
  }
}

// -----------------------------
// 3) Ukens Deals
// -----------------------------

async function loadDeals() {
  const container = document.getElementById("deals-grid");
  if (!container) return;

  try {
    const rows = await fetchJsonSheet(DEALS_SHEET_ID, DEALS_TAB);
    if (!rows || !rows.length) {
      container.innerHTML = "<p>Ingen aktive deals akkurat nå.</p>";
      return;
    }

    // highlight først
    const highlighted = rows.filter(
      r => String(r.highlight || "").toLowerCase() === "true"
    );
    const others = rows.filter(
      r => String(r.highlight || "").toLowerCase() !== "true"
    );

    const ordered = [...highlighted, ...others];

    container.innerHTML = "";

    ordered.forEach(deal => {
      const oldPrice = formatPrice(deal.old_price);
      const newPrice = formatPrice(deal.new_price);

      let discount = null;
      const oldVal = parseNumber(deal.old_price);
      const newVal = parseNumber(deal.new_price);
      if (oldVal && newVal && oldVal > newVal) {
        discount = Math.round(((oldVal - newVal) / oldVal) * 100);
      }

      const card = document.createElement("article");
      card.className = "news-card deal-card";
      if (highlighted.includes(deal)) card.classList.add("highlight");

      card.innerHTML = `
        ${
          discount
            ? `<div class="discount-badge">-${discount}%</div>`
            : ""
        }
        <img src="${deal.image_url || ""}" alt="${deal.product_name || ""}">
        <div class="news-info">
          <h3>${deal.brand || ""}</h3>
          <p class="product">${deal.product_name || ""}</p>
          <div class="price-line">
            ${
              newPrice
                ? `<span class="new-price">${newPrice}</span>`
                : ""
            }
            ${
              oldPrice
                ? `<span class="old-price">${oldPrice}</span>`
                : ""
            }
          </div>
          ${
            deal.valid_until
              ? `<p class="tagline">Gjelder til ${deal.valid_until}</p>`
              : ""
          }
          ${
            deal.link
              ? `<a href="${deal.link}" target="_blank" class="read-more">Se tilbud</a>`
              : ""
          }
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Klarte ikke laste Ukens deals:", err);
  }
}

// -----------------------------
// 4) Spotlight + Nyhetsfeed (CSV)
// -----------------------------

const featuredContainer = document.querySelector("#featured-news");
const newsGrid = document.querySelector("#news-grid");

async function loadNewsFeed() {
  if (!featuredContainer && !newsGrid) return;

  try {
    const items = await fetchCsvSheet(NEWS_SHEET_URL);

    const featured = items.filter(
      p => String(p.featured || "").toLowerCase() === "true"
    );
    const regular = items.filter(
      p => String(p.featured || "").toLowerCase() !== "true"
    );

    // 🌟 Ukens Spotlight
    if (featuredContainer) {
      if (!featured.length) {
        featuredContainer.innerHTML = "";
      } else {
        featuredContainer.innerHTML = `
          <h2>Ukens Spotlight ✨</h2>
          ${featured
            .map(item => {
              const priceText = formatPrice(item.price);
              return `
                <article class="featured-card fade-in">
                  <img src="${item.image_url || ""}" alt="${
                item.product_name || ""
              }">
                  <div class="featured-content">
                    <h3>${item.brand || ""} – ${item.product_name || ""}</h3>
                    <p>${item.excerpt || ""}</p>
                    ${
                      priceText
                        ? `<p class="price">${priceText}</p>`
                        : ""
                    }
                    ${
                      item.link
                        ? `<a href="${item.link}" target="_blank" class="product-btn">Se produkt</a>`
                        : ""
                    }
                  </div>
                </article>
              `;
            })
            .join("")}
        `;
      }
    }

    // 🛍️ Flere produkter (news feed)
    if (newsGrid) {
      newsGrid.innerHTML = `
        ${regular
          .map(item => {
            const priceText = formatPrice(item.price);
            return `
              <article class="news-card fade-in">
                <img src="${item.image_url || ""}" alt="${
              item.product_name || ""
            }">
                <div class="news-info">
                  <h3>${item.brand || ""}</h3>
                  <p class="product">${item.product_name || ""}</p>
                  ${
                    priceText
                      ? `<p class="price">${priceText}</p>`
                      : ""
                  }
                  <p class="tagline">${item.excerpt || ""}</p>
                  ${
                    item.link
                      ? `<a href="${item.link}" target="_blank" class="read-more">Se produkt</a>`
                      : ""
                  }
                </div>
              </article>
            `;
          })
          .join("")}
      `;
    }
  } catch (error) {
    console.error("❌ Feil ved henting av produktdata til news-feed:", error);
  }
}

// -----------------------------
// INIT – kjør alt når DOM er klar
// -----------------------------

document.addEventListener("DOMContentLoaded", () => {
  loadPartnerBanner();
  loadRadarPicks();
  loadDeals();
  loadNewsFeed();
});

