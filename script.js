// --- BrandRadar Product Loader --- //
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

    rows.forEach((row, index) => {
      const [name, image, price, category, link] = row.split(",");

      // hopp over tomme rader
      if (!name || !link) return;

      const productCard = document.createElement("div");
      productCard.className = "card";

      productCard.innerHTML = `
        <img src="${image || "https://via.placeholder.com/300x300?text=No+Image"}" alt="${name}">
        <h3>${name}</h3>
        <p class="price">${price ? price.trim() : "Pris ikke oppgitt"}</p>
        <p class="meta">${category ? category.trim() : ""}</p>
        <a class="btn" href="${link}" target="_blank">Kjøp nå</a>
      `;

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

// --- Kjør når siden lastes --- //
document.addEventListener("DOMContentLoaded", loadProducts);
