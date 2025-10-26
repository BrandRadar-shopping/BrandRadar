/* ================================
   DEALS SECTION (Ukens Deals)
   ================================ */

const DEALS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTaqDWMlCoMetnsCJ_x09Yhnj1m_o0bhQX18gCgGLs9MH6huFR5DQkE5fNiLTZ8g-Z3B6JeYT5cj7B/pub?output=csv";

/* ---------------------------------------------------
   CSV HJELPEFUNKSJONER (robust mot anførselstegn/komma)
   --------------------------------------------------- */
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') { cell += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (cell.length || row.length) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      }
      if (c === '\r' && next === '\n') i++;
    } else {
      cell += c;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const clean = (s) => (s ?? '').replace(/^"+|"+$/g, '').trim();
const cleanNumber = (s) => {
  const n = clean(s).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
  return n ? Number(n) : null;
};

/* ---------------------------------------------------
   HENT OG BYGG DEALS
   --------------------------------------------------- */
async function fetchDeals() {
  try {
    const response = await fetch(DEALS_SHEET_URL);
    const csvText = await response.text();

    const rows = parseCSV(csvText);
    const headers = rows[0].map(h => clean(h));
    const items = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = clean(r[i]));
      obj.old_price_raw = cleanNumber(obj.old_price);
      obj.new_price_raw = cleanNumber(obj.new_price);
      return obj;
    });

    renderDeals(items);
  } catch (error) {
    console.error("Klarte ikke hente deals:", error);
  }
}

/* ---------------------------------------------------
   RENDER DEALS
   --------------------------------------------------- */
function renderDeals(deals) {
  const container = document.querySelector("#deals-section");
  if (!container) return;

  container.innerHTML = `
    <h2>Ukens Deals 🔥</h2>
    <div class="deals-grid">
      ${deals.map(deal => {
        const hasOld = deal.old_price_raw != null;
        const hasNew = deal.new_price_raw != null;

        const discount = (hasOld && hasNew && deal.old_price_raw > 0)
          ? Math.round((1 - (deal.new_price_raw / deal.old_price_raw)) * 100)
          : null;

        return `
          <div class="deal-card fade-in ${deal.highlight?.toLowerCase() === "true" ? "highlight" : ""}">
            ${deal.image_url ? `<img src="${deal.image_url}" alt="${deal.product_name}">` : ""}
            <div class="deal-info">
              <h3>${deal.brand}</h3>
              <p class="product">${deal.product_name}</p>

              ${(hasOld || hasNew) ? `
                <p class="price">
                  ${hasOld ? `<span class="old-price">${deal.old_price}</span>` : ``}
                  ${hasNew ? `<span class="new-price">${deal.new_price}</span>` : ``}
                  ${discount != null ? `<span class="discount-badge">−${discount}%</span>` : ``}
                </p>
              ` : ``}

              ${deal.valid_until ? `<p class="valid-until">Gyldig til ${deal.valid_until}</p>` : ``}

              <a href="${deal.link}" target="_blank" class="deal-btn">Se tilbud</a>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ---------------------------------------------------
   KJØR
   --------------------------------------------------- */
fetchDeals();
