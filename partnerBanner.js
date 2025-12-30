// partnerBanner.js – Index partner banner (news-style markup)
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

// Enkel CSV-parser som håndterer "..." med komma inni (good enough for sheets)
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
      // håndter "" inni quotes
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

function renderPartnerBanner(item) {
  const bannerSection = document.querySelector(".partner-banner");
  if (!bannerSection) return;

  const campaign = item.campaign_name || "Ukens partner";
  const desc = item.description || "";
  const alt = item.alt_text || campaign;
  const ctaText = item.cta_text || "Se kampanjen";
  const link = item.link || "#";
  const img = item.image_url || "";

  bannerSection.innerHTML = `
    <div class="partner-banner-inner">
      <div class="partner-banner-text">
        <p class="partner-tag">Ukens partner</p>
        <h2>${escapeHtml(campaign)}</h2>
        <p class="partner-sub">${escapeHtml(desc)}</p>
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
  `;
}

// Minimal HTML-escape for trygg rendering
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

fetchPartnerBanner();
