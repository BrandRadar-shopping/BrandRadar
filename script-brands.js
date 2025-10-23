// ======================================================
// BrandRadar – Brands from Google Sheets
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const SHEET_NAME = "Ark 1";

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      const json = JSON.parse(data.substr(47).slice(0, -2));
      const rows = json.table.rows.map(r => ({
        brand: r.c[0]?.v || "",
        logo: r.c[1]?.v || "",
        description: r.c[2]?.v || "",
        link: r.c[3]?.v || "#",
        highlight: (r.c[4]?.v || "").toLowerCase() === "yes"
      }));

      renderBrands(rows);

      // --- Live søkefunksjon ---
      searchInput.addEventListener("input", e => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = rows.filter(b => b.brand.toLowerCase().includes(searchTerm));
        renderBrands(filtered);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av brands:", err);
      brandGrid.innerHTML = "<p>Kunne ikke laste brands akkurat nå.</p>";
    });

  function renderBrands(brands) {
    highlightGrid.innerHTML = "";
    brandGrid.innerHTML = "";

    brands.forEach(brand => {
      const card = document.createElement("div");
      card.classList.add("brand-card");
      if (brand.highlight) card.classList.add("highlighted");

      card.innerHTML = `
        <img src="${brand.logo}" alt="${brand.brand}" />
        <h3>${brand.brand}</h3>
        <p>${brand.description}</p>
        <a href="${brand.link}" target="_blank">Besøk</a>
      `;

      if (brand.highlight) highlightGrid.appendChild(card);
      else brandGrid.appendChild(card);
    });
  }
});
