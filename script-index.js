// ======================================================
// BrandRadar.shop – Google Sheets Product Loader
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product script running...");

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadar-produkter"; // endre om du har gitt arket et annet navn
  const productGrid = document.querySelector(".product-grid");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      // Fjern unødvendig Google wrapper
      const json = JSON.parse(data.substr(47).slice(0, -2));
      const rows = json.table.rows;

      productGrid.innerHTML = ""; // tøm eksisterende produkter

      rows.forEach((row) => {
        // Kolonner i arket (A–I)
        const brand = row.c[0]?.v || "";
        const title = row.c[1]?.v || "";
        const price = row.c[2]?.v || "";
        const discount = row.c[3]?.v || "";
        const image = row.c[4]?.v || "";
        const productUrl = row.c[5]?.v || "#";
        const category = row.c[6]?.v || "";
        const gender = row.c[7]?.v || "";
        const subcategory = row.c[8]?.v || "";

        // Bygg HTML for produktkort
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          ${discount ? `<div class="discount-badge">-${discount}</div>` : ""}
          <img src="${image}" alt="${title}" />
          <h3>${title}</h3>
          <p><strong>${price}</strong></p>
          <p class="gender-tag">${gender || ""}</p>
          <a href="${productUrl}" target="_blank" class="buy-btn">Se produkt</a>
        `;

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML =
        "<p>Kunne ikke laste produkter akkurat nå. Prøv igjen senere.</p>";
    });
});
