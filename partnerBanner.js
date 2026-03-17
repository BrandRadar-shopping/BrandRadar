// partnerBanner.js – Index partner banner
// Desktop: editorial banner
// Mobile: kompakt toppbanner med close + sponsor-feel

const PARTNER_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT91mqXnviD2p5E34VkG_BJHcokhs1dNz3J_trDXjsPLjb4Q7wwjQbM8RaMubguVtzGgiBBVLavxsxU/pub?output=csv";

async function fetchPartnerBanner() {
  try {
    const res = await fetch(PARTNER_SHEET_URL);
    if (!res.ok) throw new Error(`Partner CSV fetch failed: ${res.status}`);
    const csvText = await res.text();

    const rows = parseCsv(csvText);
    if (!rows.length) return;

    const banner = rows[0];
    renderPartnerBanner(banner);
  } catch (err) {
    console.error("Feil ved henting av partnerbanner:", err);
  }
}

// Enkel CSV-parser
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = (cols[i] ?? "").trim()));
    return obj;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function getPartnerName(item) {
  if (item.campaign_name && item.campaign_name.trim()) {
    return item.campaign_name.trim();
  }

  if (item.alt_text && item.alt_text.trim()) {
    return item.alt_text.trim();
  }

  if (item.link) {
    try {
      const url = new URL(item.link);
      return url.hostname.replace(/^www\./, "");
    } catch (_) {}
  }

  return "Partner";
}

function buildPartnerKey(item) {
  return [
    item.campaign_name || "",
    item.link || "",
    item.image_url || "",
    item.cta_text || ""
  ].join("|");
}

function renderPartnerBanner(item) {
  const bannerSection = document.querySelector(".partner-banner");
  if (!bannerSection) return;

  const desc = item.description || "";
  const alt = item.alt_text || "Partner";
  const ctaText = item.cta_text || "Se kampanjen";
  const link = item.link || "#";
  const img = item.image_url || "";
  const partnerName = getPartnerName(item);
  const partnerKey = buildPartnerKey(item);

  // Desktop: del description i headline + subtekst
  const parts = desc.split("!");
  const headline = parts[0] ? parts[0].trim() + "!" : desc;
  const sub = parts[1] ? parts[1].trim() : "";

  bannerSection.innerHTML = `
    <div class="partner-banner-desktop">
      <div class="partner-banner-inner">
        <div class="partner-banner-text">
          <p class="partner-tag">Ukens partner</p>
          <h2>${escapeHtml(headline || partnerName)}</h2>
          ${sub ? `<p class="partner-sub">${escapeHtml(sub)}</p>` : ""}
          ${link && link !== "#"
            ? `<a class="partner-cta" href="${link}" target="_blank" rel="noopener">${escapeHtml(ctaText)}</a>`
            : ""}
        </div>

        ${img
          ? `<div class="partner-banner-image">
               <img src="${img}" alt="${escapeHtml(alt)}" loading="lazy">
             </div>`
          : ""}
      </div>
    </div>

    <div class="partner-banner-mobile" data-partner-key="${escapeHtml(partnerKey)}">
      <div class="partner-mobile-inner">
        <div class="partner-mobile-top">
          <span class="partner-mobile-pill">Ukens partner</span>
          <button type="button" class="partner-mobile-close" aria-label="Lukk partnerbanner">×</button>
        </div>

        <div class="partner-mobile-main">
          <div class="partner-mobile-brand">
            ${
              img
                ? `<img src="${img}" alt="${escapeHtml(alt || partnerName)}" loading="lazy">`
                : `<span class="partner-mobile-brand-text">${escapeHtml(partnerName)}</span>`
            }
          </div>

          ${
            link && link !== "#"
              ? `<a class="partner-mobile-cta" href="${link}" target="_blank" rel="noopener">Besøk siden</a>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  setupMobilePartnerDismiss(bannerSection, partnerKey);
}

function setupMobilePartnerDismiss(section, partnerKey) {
  const mobileBanner = section.querySelector(".partner-banner-mobile");
  const closeBtn = section.querySelector(".partner-mobile-close");
  if (!mobileBanner || !closeBtn) return;

  const storageKey = "br_partner_banner_dismissed_key";

  function applyDismissState() {
    if (!isMobileViewport()) {
      section.classList.remove("is-mobile-hidden");
      return;
    }

    const dismissedKey = localStorage.getItem(storageKey);
    if (dismissedKey && dismissedKey === partnerKey) {
      section.classList.add("is-mobile-hidden");
    } else {
      section.classList.remove("is-mobile-hidden");
    }
  }

  closeBtn.addEventListener("click", () => {
    localStorage.setItem(storageKey, partnerKey);
    section.classList.add("is-mobile-hidden");
  });

  window.addEventListener("resize", applyDismissState);
  applyDismissState();
}

fetchPartnerBanner();
