/* ================================
   RADAR PICKS SECTION
   ================================ */

const PICKS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7ok8qKUbRPrtW8EJdBnhsoN2c8iZL8zAGAjWlNqHPPADXpIF0nCh0sjR79jqbC3aZycHKYHcXIbfW/pub?output=csv";

// Hent data fra Google Sheet
async function fetchPicks() {
  try {
    const response = await fetch(PICKS_SHEET_URL);
    const csvText = await response.text();

    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());
    const items = rows.slice(1).map(row => {
      const obj = {};
      row.forEach((val, i) => (obj[headers[i]] = val.trim()));
      return obj;
    });

    renderPicks(items);
  } catch (error) {
    console.error("Feil ved henting av picks:", error);
  }
}

function renderPicks(picks) {
  const container = document.querySelector("#picks-section");
  if (!container) return;

  container.innerHTML = `
    <h2>Radar Picks 🛰️</h2>
    <div class="picks-grid">
      ${picks.map(item => `
        <div class="pick-card fade-in ${item.featured?.toLowerCase() === "true" ? "featured-pick" : ""}">
          <img src="${item.image_url}" alt="${item.product_name}">
          <div class="pick-info">
            <h3>${item.brand}</h3>
            <p class="product">${item.product_name}</p>
            ${item.price ? `<p class="price">${item.price} kr</p>` : ""}
            <p class="reason">${item.reason}</p>
            <a href="${item.link}" target="_blank" class="pick-btn">Se produkt</a>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

fetchPicks();
