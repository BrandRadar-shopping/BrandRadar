// partnerBanner.js – Index partnerbanner (matcher news.js markup 1:1)

// Din eksisterende publiserte CSV-URL:
const PARTNER_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT91mqXnviD2p5E34VkG_BJHcokhs1dNz3J_trDXjsPLjb4Q7wwjQbM8RaMubguVtzGgiBBVLavxsxU/pub?output=csv";

/**
 * Robust CSV-parser (støtter komma inni "quotes")
 * Returnerer array av rows (objects) basert på header-linje.
 */
function parseCSVToObjects(csvText) {
  const lines = csvText
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim().length);

  if (lines.length < 2) return [];

  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];

      if (ch === '"' && inQuotes && next === '"') {
        // escaped quote ""
        cur += '"';
        i++;
        continue;
      }

      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
        continue;
      }

      cur += ch;
    }

    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? "").trim();
    });
    rows.push(obj);
  }

  return rows;
}

function parseBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "ja" || s === "yes";
}

function normalizePartnerRow(row) {
  // Støtter litt ulike kolonnenavn uten at det knekker
  const campaign_name =
    row.campaign_name || row.campaign || row.title || row.name || "Ukens partner";

  const description =
    row.description || row.desc || row.text || "";

  const alt_text =
    row.alt_text || row.alt || campaign_name;

  const link =
    row.link || row.url || row.href || "";

  const cta_text =
    row.cta_text || row.cta || row.button || "Shop kampanjen";

  const image_url =
    row.image_url || row.image || row.logo || "";

  return { campaign_name, description, alt_text, link, cta_text, image_url };
}

function renderPartnerBannerNewsMarkup(data) {
  const bannerSection = document.querySelector("#partner-banner-section.partner-banner")
    || document.querySelector(".partner-banner");

  if (!bannerSection) return;

  bannerSection.classList.remove("loading");

  bannerSection.innerHTML = `
    <div class="partner-banner-inner">
      <div class="partner-banner-text">
        <p class="partner-tag">Ukens partner</p>
        <h2>${data.campaign_name || ""}</h2>
        <p class="partner-sub">${data.description || ""}</p>
        ${
          data.link
            ? `<a href="${data.link}" target="_blank" rel="noopener" class="partner-cta">
                 ${data.cta_text || "Shop kampanjen"}
               </a>`
            : ""
        }
      </div>

      ${
        data.image_url
          ? `<div class="partner-banner-image">
               <img src="${data.image_url}" alt="${data.alt_text || data.campaign_name || ""}">
             </div>`
          : ""
      }
    </div>
  `;
}

async function fetchPartnerBanner() {
  try {
    const res = await fetch(PARTNER_SHEET_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Partner CSV fetch failed: ${res.status}`);
    const csvText = await res.text();

    const rows = parseCSVToObjects(csvText);
    if (!rows.length) return;

    // Hvis arket har "active"-kolonne, bruk den. Hvis ikke: bruk første rad.
    const activeRow =
      rows.find((r) => parseBool(r.active)) || rows[0];

    const normalized = normalizePartnerRow(activeRow);
    renderPartnerBannerNewsMarkup(normalized);
  } catch (err) {
    console.error("❌ Partner banner error:", err);
  }
}

// Kjør
fetchPartnerBanner();
