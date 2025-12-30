// partnerBanner.js – henter ukens partner fra Google Sheet (CSV)
// Render: samme markup som news-banner (slik at CSS blir identisk)

const PARTNER_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT91mqXnviD2p5E34VkG_BJHcokhs1dNz3J_trDXjsPLjb4Q7wwjQbM8RaMubguVtzGgiBBVLavxsxU/pub?output=csv";

async function fetchPartnerBanner() {
  try {
    const response = await fetch(PARTNER_SHEET_URL);
    const csvText = await response.text();

    const [headers, ...rows] = csvText.trim().split("\n").map(r => r.split(","));
    const data = rows.map(row =>
      Object.fromEntries(row.map((v, i) => [headers[i].trim(), (v || "").trim()]))
    );

    if (!data.length) return;

    renderPartnerBanner(data[0]);
  } catch (error) {
    console.error("Feil ved henting av partnerbanner:", error);
  }
}

function renderPartnerBanner(item) {
  const bannerSection = document.querySelector(".partner-banner");
  if (!bannerSection) return;

  const campaign = item.campaign_name || "Ukens partner";
  const desc = item.description || "";
  const alt = item.alt_text || campaign;
  const link = item.link || "";
  const cta = item.cta_text || "Se kampanjen";
  const img = item.image_url || "";

  bannerSection.innerHTML = `
    <div class="partner-banner-inner">
      <div class="partner-banner-text">
        <p class="partner-tag">Ukens partner</p>
        <h2>${campaign}</h2>
        <p class="partner-sub">${desc}</p>
        ${
          link
            ? `<a href="${link}" target="_blank" rel="noopener" class="partner-cta">${cta}</a>`
            : ""
        }
      </div>

      ${
        img
          ? `<div class="partner-banner-image">
               <img src="${img}" alt="${alt}">
             </div>`
          : ""
      }
    </div>
  `;
}

fetchPartnerBanner();
