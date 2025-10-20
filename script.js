// --- BrandRadar Product Loader v4 (tilpasset Google Sheet med "visuelt bilde") --- //
const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv";

async function loadProducts() {
  try {
    const response = await fetch(sheetURL);
    if (!response.ok) throw new Error("Kunne ikke hente data fra Google Sheet");

    const csvData = await response.text();
    const rows = csvData.trim().split("\n").slice(1);
    const container = document.getElementById("products-container");
    container.innerHTML = "";

    rows.forEach((row) => {
      // Split kolonner og hopp over "visuelt bilde"
      const cols = row.split(",");

    const brand = cols[0]?.trim();
const title = cols[1]?.trim();
const price = cols[2]?.trim();
const discount = cols[3]?.replace(/"/g, "").trim();
const image = cols[4]?.trim(); // <-- riktig kolonne
const link = cols[5]?.trim();
const category = cols[6]?.trim();
const gender = cols[7]?.trim();
const subcategory = cols[8]?.trim();



      if (!title || !image || !link) return;

      // Badge – f.eks. "Discount: 20%" eller "Nyhet!"
      let badge = "";
      if (discount && discount !== "") {
        const isNew = /nyhet|new/i.test(discount);
        badge = `<span class="badge ${isNew ? "new" : ""}">${
          isNew ? "Nyhet!" : "Discount: " + discount
        }</span>`;
      }

      const productCard = document.createElement("div");
      productCard.className = "product-card";

      productCard.innerHTML = `
        <div class="product-image">
          ${badge}
          <img src="${image}" alt="${title}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${brand} ${title}</h3>
          <p class="product-price">${price}</p>
          <p class="product-category">${category} • ${subcategory}</p>
        </div>
      `;

     productCard.addEventListener("click", () => {
 const productData = {
  brand,
  title,
  price,
  discount,
  image,       // Hovedbilde (fra "Image URL")
  image2: cols[9]?.trim(),  // ← Legg til
  image3: cols[10]?.trim(), // ← Legg til
  image4: cols[11]?.trim(), // ← Legg til
  link,
  category,
  gender,
  subcategory
};


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






