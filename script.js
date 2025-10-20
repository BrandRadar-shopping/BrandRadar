// --- BrandRadar Product Loader v2 --- //
const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv";

async function loadProducts() {
  try {
    const response = await fetch(sheetURL);
    if (!response.ok) throw new Error("Kunne ikke hente data fra Google Sheet");

    const csvData = await response.text();
    const rows = csvData.split("\n").slice(1);
    const container = document.getElementById("products-container");
    container.innerHTML = ""; // rydder først

    rows.forEach((row) => {
      const [name, image, price, category, link, tag] = row.split(",");
      if (!name || !link) return;

      const productCard = document.createElement("div");
      productCard.className = "product-card";

      // Badge for "Nyhet" eller "Rabatt"
      const badge =
        tag && tag.trim() !== ""
          ? `<span class="badge">Discount:${tag.trim()}</span>`
          : "";

      productCard.innerHTML = `
        <div class="product-image">
          ${badge}
          <img src="${image || "https://via.placeholder.com/400x400?text=No+Image"}" alt="${name.trim()}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${name.trim()}</h3>
          <p class="product-price">${price ? price.trim() + " kr" : ""}</p>
          <p class="product-category">${category ? category.trim() : ""}</p>
        </div>
      `;

      // Klikk fører til produktside (for fremtidig oppgradering)
      productCard.addEventListener("click", () => {
        window.open(link, "_blank");
      });

      container.appendChild(productCard);
    });

    if (container.innerHTML.trim() === "") {
      container.innerHTML = `<p>Ingen produkter funnet akkurat nå.</p>`;
    }
  } catch (error) {
    console.error("Feil ved lasting av produkter:", error);
    document.getElementById("products-container").innerHTML =
      "<p>Kunne ikke laste produkter. Prøv igjen senere.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);


