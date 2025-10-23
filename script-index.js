// ======================================================
// BrandRadar.shop – Google Sheets Product Loader (with thumbs + details)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product script running...");

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadar-produkter"; // navnet på fanen i arket
  const productGrid = document.querySelector(".product-grid");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    SHEET_NAME
  )}`;

  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      // Fjern Google "gviz" wrapper
      const json = JSON.parse(data.substr(47).slice(0, -2));
      const rows = json.table.rows;

      productGrid.innerHTML = ""; // tøm eksisterende

      rows.forEach((row) => {
        if (!row.c) return; // hopp over tomme rader

        // Kolonner (A–O)
        const brand = row.c[0]?.v || "";
        const title = row.c[1]?.v || "";
        const price = row.c[2]?.v || "";
        const discount = row.c[3]?.v || "";
        const image = row.c[4]?.v || ""; // E: Image URL (hovedbilde)
        const productUrl = row.c[5]?.v || "#"; // F: Product URL (affiliate)
        const category = row.c[6]?.v || "";
        const gender = row.c[7]?.v || "";
        const subcategory = row.c[8]?.v || "";
        // J (visuelt bilde) hoppes over
        const image2 = row.c[10]?.v || ""; // K: image2 (thumbnail)
        const image3 = row.c[11]?.v || ""; // L: image3 (thumbnail)
        const image4 = row.c[12]?.v || ""; // M: image4 (thumbnail)
        const description = row.c[13]?.v || ""; // N: Description
        const rating = row.c[14]?.v || ""; // O: Rating (for eksempel 4.3)

        // Hopp over rader uten tittel/bilde
        if (!title || !image) return;

        // Bygg produktkort
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          ${discount ? `<div class="discount-badge">${discount}</div>` : ""}
          <img src="${image}" alt="${title}" />
          <div class="product-info">
            <h3>${title}</h3>
            ${price ? `<p class="price">${price}</p>` : ""}
            <p class="gender">${gender || ""}</p>
            <a href="${productUrl}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;

        // Klikk på kortet -> product.html med alle data
        card.addEventListener("click", () => {
          const params = new URLSearchParams({
            brand,
            title,
            price,
            discount,
            image,
            image2,
            image3,
            image4,
            url: productUrl,
            gender,
            category,
            subcategory,
            description,
            rating
          });
          window.location.href = `product.html?${params.toString()}`;
        });

        // Viktig: når man klikker selve "Se produkt"-knappen (affiliate),
        // skal det IKKE trigge navigasjon til product.html
        const buyBtn = card.querySelector(".buy-btn");
        if (buyBtn) {
          buyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
          });
        }

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML =
        "<p>Kunne ikke laste produkter akkurat nå. Prøv igjen senere.</p>";
    });
});
