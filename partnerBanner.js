// partnerBanner.js – henter ukens partner fra Google Sheet
const PARTNER_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT91mqXnviD2p5E34VkG_BJHcokhs1dNz3J_trDXjsPLjb4Q7wwjQbM8RaMubguVtzGgiBBVLavxsxU/pub?output=csv";

async function fetchPartnerBanner() {
  try {
    const response = await fetch(PARTNER_SHEET_URL);
    const csvText = await response.text();

    const [headers, ...rows] = csvText.trim().split("\n").map(r => r.split(","));
    const data = rows.map(row => Object.fromEntries(row.map((v, i) => [headers[i].trim(), v.trim()])));

    if (!data.length) return;

    const banner = data[0]; // vi antar kun én aktiv partner
    renderPartnerBanner(banner);

  } catch (error) {
    console.error("Feil ved henting av partnerbanner:", error);
  }
}

function renderPartnerBanner(item) {
  const bannerSection = document.querySelector(".partner-banner");
  if (!bannerSection) return;

  bannerSection.innerHTML = `
    <div class="partner-inner fade-in">
      <img src="${item.image_url}" alt="${item.alt_text}">
      <div class="partner-text">
        <h3>${item.campaign_name}</h3>
        <p>${item.description}</p>
        <a href="${item.link}" target="_blank" class="partner-btn">${item.cta_text}</a>
      </div>
    </div>
  `;
}

fetchPartnerBanner();
