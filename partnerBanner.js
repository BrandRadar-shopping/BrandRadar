// partnerBanner.js – Index partner banner
// Desktop: editorial banner
// Mobile: slim sponsor rail
// Mobile dismiss varer kun i gjeldende nettleserøkt

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
    headers.forEach((h, i) => {
      obj[h] = (cols[i] ?? "").trim();
    });
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

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isGenericPartnerLabel(value) {
  const v = normalizeText(value);
  if (!v) return true;

  const genericLabels = [
    "ukens partner",
    "partner",
    "ukens partner 💎",
    "ukens partner ✨",
    "weekly partner",
    "campaign partner",
    "partner campaign"
  ];

  return genericLabels.includes(v);
}

function titleCaseDomainName(hostname) {
  const cleaned = String(hostname || "")
    .replace(/^www\./i, "")
    .replace(/\.(com|no|net|org|co|io|shop|store)$/i, "");

  if (!cleaned) return "Partner";

  return cleaned
    .split(/[-._]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDomainNameFromLink(link) {
  try {
    const url = new URL(link);
    return titleCaseDomainName(url.hostname);
  } catch (_) {
    return "";
  }
}

function getDesktopPartnerName(item) {
  const candidates = [
    item.campaign_name,
    item.alt_text,
    item.partner_name,
    item.brand,
    getDomainNameFromLink(item.link)
  ];

  for (const value of candidates) {
    if (String(value || "").trim()) return String(value).trim();
  }

  return "Partner";
}

function getMobilePartnerName(item) {
  const explicitCandidates = [
    item.partner_name,
    item.brand,
    item.sponsor_name,
    item.store_name
  ];

  for (const value of explicitCandidates) {
    if (String(value || "").trim() && !isGenericPartnerLabel(value)) {
      return String(value).trim();
    }
  }

  const domainName = getDomainNameFromLink(item.link);
  if (domainName) return domainName;

  const fallbackCandidates = [
    item.alt_text,
    item.campaign_name
  ];

  for (const value of fallbackCandidates) {
    if (String(value || "").trim() && !isGenericPartnerLabel(value)) {
      return String(value).trim();
    }
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
  const desktopCtaText = item.cta_text || "Se kampanjen";
  const mobileCtaText = "Shop";
  const link = item.link || "#";
  const img = item.image_url || "";

  const desktopPartnerName = getDesktopPartnerName(item);
  const mobilePartnerName = getMobilePartnerName(item);
  const partnerKey = buildPartnerKey(item);

  const parts = desc.split("!");
  const headline = parts[0] ? parts[0].trim() + "!" : desktopPartnerName;
  const sub = parts[1] ? parts[1].trim() : "";

  bannerSection.innerHTML = `
    <div class="partner-banner-desktop">
      <div class="partner-banner-inner">
        <div class="partner-banner-text">
          <p class="partner-tag">Ukens partner</p>
          <h2>${escapeHtml(headline || desktopPartnerName)}</h2>
          ${sub ? `<p class="partner-sub">${escapeHtml(sub)}</p>` : ""}
          ${
            link && link !== "#"
              ? `<a class="partner-cta" href="${link}" target="_blank" rel="noopener">${escapeHtml(desktopCtaText)}</a>`
              : ""
          }
        </div>

        ${
          img
            ? `<div class="partner-banner-image">
                 <img src="${img}" alt="${escapeHtml(alt)}" loading="lazy">
               </div>`
            : ""
        }
      </div>
    </div>

    <div class="partner-banner-mobile" data-partner-key="${escapeHtml(partnerKey)}">
      <div class="partner-mobile-rail">
        <button type="button" class="partner-mobile-close" aria-label="Lukk partnerbanner">×</button>

        ${
          img
            ? `<div class="partner-mobile-logo-wrap">
                 <img
                   src="${img}"
                   alt="${escapeHtml(alt || mobilePartnerName)}"
                   class="partner-mobile-logo"
                   loading="lazy"
                 >
               </div>`
            : ""
        }

        <div class="partner-mobile-copy">
          <span class="partner-mobile-label">Ukens partner er</span>
          <strong class="partner-mobile-name">${escapeHtml(mobilePartnerName)}</strong>
        </div>

        ${
          link && link !== "#"
            ? `<a class="partner-mobile-cta" href="${link}" target="_blank" rel="noopener">${escapeHtml(mobileCtaText)}</a>`
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
