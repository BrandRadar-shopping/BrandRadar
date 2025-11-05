// ======================================================
// ✅ BrandRadar – Brands Page with Search + Alphabet Filter
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  const SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const SHEET_NAME = "Ark 1";

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");
  const alphabetContainer = document.querySelector(".brand-alphabet");

  let allBrands = [];

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  fetch(url)
    .then(res => res.text())
    .then(data => {
      const json = JSON.parse(data.substr(47).slice(0, -2));
      allBrands = json.table.rows.map(r => ({
        brand: r.c[0]?.v || "",
        logo: r.c[1]?.v || "",
        description: r.c[2]?.v || "",
        link: r.c[3]?.v || "#",
        highlight: (r.c[4]?.v || "").toLowerCase() === "yes"
      }));

      renderBrands(allBrands);
    })
    .catch(err => {
      console.error("❌ Feil ved lasting av brands:", err);
      brandGrid.innerHTML = "<p>Kunne ikke laste brands akkurat nå.</p>";
    });


  // ✅ Filtering Logic (Search + Alphabet)
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeLetter =
      alphabetContainer.querySelector(".active")?.dataset.letter || "all";

    let result = [...allBrands];

    // 🔹 Filter by alphabet
    if (activeLetter !== "all") {
      result = result.filter(b =>
        b.brand
          .toLowerCase()
          .startsWith(activeLetter.toLowerCase())
      );
    }

    // 🔹 Search filter
    if (searchTerm.trim() !== "") {
      result = result.filter(b =>
        b.brand.toLowerCase().includes(searchTerm)
      );
    }

    renderBrands(result);
  }


  // ✅ Alphabet Click Event
  alphabetContainer.addEventListener("click", (e) => {
    if (e.target.tagName !== "SPAN") return;

    alphabetContainer.querySelectorAll("span")
      .forEach(s => s.classList.remove("active"));

    e.target.classList.add("active");
    applyFilters();
  });

  // ✅ Live Search Event
  searchInput.addEventListener("input", applyFilters);


  // ✅ Render Brands to Grid
  function renderBrands(list) {
    highlightGrid.innerHTML = "";
    brandGrid.innerHTML = "";

    list.forEach(brand => {
      const card = document.createElement("div");
      card.classList.add("brand-card");
      if (brand.highlight) card.classList.add("highlighted");

      card.innerHTML = `
        <img src="${brand.logo}" alt="${brand.brand}" />
        <h3>${brand.brand}</h3>
        <a href="${brand.link}" target="_blank" class="brand-btn">Besøk</a>
      `;

      if (brand.highlight) highlightGrid.appendChild(card);
      else brandGrid.appendChild(card);
    });
  }

});

