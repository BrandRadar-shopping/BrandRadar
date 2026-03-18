// partnerBanner.js – Index partner banner
// Desktop: behold dagens editorial banner
// Mobile: slim sponsor rail
// Dismiss gjelder kun i gjeldende nettleserøkt

const PARTNER_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT91mqXnviD2p5E34VkG_BJHcokhs1dNz3J_trDXjsPLjb4Q7wwjQbM8RaMubguVtzGgiBBVLavxsxU/pub?output=csv";

async function fetchPartnerBanner() {
  try {
    const res = await fetch(PARTNER_SHEET_URL);
    if (!res.ok) throw new Error(`Partner CSV fetch failed: ${res.status}`);
    const csvText = await res.text();
    const rows = parseCsv(csvText);
    if (!rows.length) return;
    renderPartnerBanner(rows[0]);
  } catch (err) {
    console.error("Feil ved henting av partnerbanner:", err);
  }
}

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
  if (item.campaign_name?.trim()) return item.campaign_name.trim();
  if (item.alt_text?.trim()) return item.alt_text.trim();

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
  const ctaText = item.cta_text || "Besøk siden";
  const link = item.link || "#";
  const img = item.image_url || "";
  const partnerName = getPartnerName(item);
  const partnerKey = buildPartnerKey(item);

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
      <div class="partner-mobile-rail">
        <button type="button" class="partner-mobile-close" aria-label="Lukk partnerbanner">×</button>

        <div class="partner-mobile-center">
          ${
            img
              ? `<div class="partner-mobile-logo-wrap">
                   <img src="${img}" alt="${escapeHtml(alt || partnerName)}" class="partner-mobile-logo" loading="lazy">
                 </div>`
              : ""
          }

          <div class="partner-mobile-copy">
            <span class="partner-mobile-pill">Ukens partner</span>
            <strong class="partner-mobile-name">${escapeHtml(partnerName)}</strong>
          </div>
        </div>

        ${
          link && link !== "#"
            ? `<a class="partner-mobile-cta" href="${link}" target="_blank" rel="noopener">${escapeHtml(ctaText || "Besøk siden")}</a>`
            : ""
        }
      </div>
    </div>
  `;

  setupMobilePartnerDismiss(bannerSection, partnerKey);
}

function setupMobilePartnerDismiss(section, partnerKey) {
  const storageKey = "br_partner_banner_dismissed_session";
  const closeBtn = section.querySelector(".partner-mobile-close");
  if (!closeBtn) return;

  function readDismissedKey() {
    try {
      return sessionStorage.getItem(storageKey);
    } catch (_) {
      return null;
    }
  }

  function writeDismissedKey() {
    try {
      sessionStorage.setItem(storageKey, partnerKey);
    } catch (_) {}
  }

  function clearIfPartnerChanged() {
    try {
      const existing = sessionStorage.getItem(storageKey);
      if (existing && existing !== partnerKey) {
        sessionStorage.removeItem(storageKey);
      }
    } catch (_) {}
  }

  function applyState() {
    if (!isMobileViewport()) {
      section.classList.remove("is-mobile-hidden");
      return;
    }

    clearIfPartnerChanged();
    const dismissedKey = readDismissedKey();
    section.classList.toggle("is-mobile-hidden", dismissedKey === partnerKey);
  }

  closeBtn.addEventListener("click", () => {
    writeDismissedKey();
    section.classList.add("is-mobile-hidden");
  });

  window.addEventListener("resize", applyState);
  applyState();
}

fetchPartnerBanner();
