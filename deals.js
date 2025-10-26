/* ================================
   DEALS SECTION (Ukens Deals)
   ================================ */

const DEALS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTaqDWMlCoMetnsCJ_x09Yhnj1m_o0bhQX18gCgGLs9MH6huFR5DQkE5fNiLTZ8g-Z3B6JeYT5cj7B/pub?output=csv";

// Hent data fra Google Sheet og render
async function fetchDeals() {
  try {
    const response = await fetch(DEALS_SHEET_URL);
    const csvText = await response.text();

    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());
    const items = rows.slice(1).map(row => {
      const obj = {};
      row.forEach((val, i) => (obj[headers[i]] = val.trim()));
      return obj;
    });

    renderDeals(items);
  } catch (error) {
    console.error("Klarte ikke hente deals:", error);
  }
}

function renderDeals(deals) {
  const container = document.querySelector("#deals-section");
  if (!container) return;

  container.innerHTML = `
    <h2>Ukens Deals 🔥</h2>
    <div class="deals-grid">
      ${deals.map(deal => `
        <div class="deal-card fade-in ${deal.highlight?.toLowerCase() === "true" ? "highlight" : ""}">
          ${deal.image_url ? `<img src="${deal.image_url}" alt="${deal.product_name}">` : ""}
          <div class="deal-info">
            <h3>${deal.brand}</h3>
            <p class="product">${deal.product_name}</p>
            
            ${deal.old_price && deal.new_price ? `
              <p class="price">
                <span class="old-price">${deal.old_price} kr</span>
                <span class="new-price">${deal.new_price} kr</span>
              </p>
            ` : deal.new_price ? `
              <p class="price"><span class="new-price">${deal.new_price} kr</span></p>
            ` : ""}
            
            ${deal.valid_until ? `<p class="valid-until">Gyldig til ${deal.valid_until}</p>` : ""}
            
            <a href="${deal.link}" target="_blank" class="deal-btn">Se tilbud</a>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

fetchDeals();


fetchDeals();
