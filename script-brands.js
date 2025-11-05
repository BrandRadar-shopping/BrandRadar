// ======================================================
// ✅ BrandRadar – Brands Page FINAL + Alphabet Filter
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  const SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const SHEET_NAME = "Ark 1";
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");
  const alphabetBar = document.querySelector(".brand-alphabet");

  let allBrands = [];

  fetch(url)
    .then(res => res.text())
    .then(data => {
      const json = JSON.parse(data.substr(47).slice(0, -2));
      allBrands = json.table.rows.map(r => ({
        brand: r.c[0]?.v || "",
        logo: r.c[1]?.v || "",
        desc: r.c[2]?.v || "",
        link: r.c[3]?.v || "#",
        highlight: (r.c[4]?.v || "").toLowerCase() === "yes"
      }));

      renderBrands(allBrands);
    })
    .catch(err => {
      console.error("❌ Brands error:", err);
      brandGrid.innerHTML = "<p>Kunne ikke laste brands.</p>";
    });


  // ✅ UI Update
  function renderBrands(list) {
    highlightGrid.innerHTML = "";
    brandGrid.innerHTML = "";

    list.forEach(b => {
      const card = document.createElement("div");
      card.classList.add("brand-card");

      card.innerHTML = `
        <img src="${b.logo}" alt="${b.brand}">
        <h3>${b.brand}</h3>
        <a href="${b.link}" target="_blank" class="brand-btn">Besøk</a>
      `;

      if (b.highlight) highlightGrid.appendChild(card);
      else brandGrid.appendChild(card);
    });
  }


  // ✅ Søkefilter
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();

    alphabetBar.querySelectorAll("span").forEach(el => el.classList.remove("active"));
    alphabetBar.querySelector('[data-letter="all"]').classList.add("active");

    const filtered = allBrands.filter(b =>
      b.brand.toLowerCase().includes(q)
    );
    renderBrands(filtered);
  });


  // ✅ Alfabet-filter
  alphabetBar.addEventListener("click", e => {
    if (!e.target.dataset.letter) return;

    const letter = e.target.dataset.letter;

    alphabetBar.querySelectorAll("span").forEach(el => el.classList.remove("active"));
    e.target.classList.add("active");

    searchInput.value = ""; // reset søk

    let filtered = allBrands;

    if (letter !== "all") {
      filtered = filtered.filter(b =>
        b.brand.toUpperCase().startsWith(letter.toUpperCase())
      );
    }

    renderBrands(filtered);
  });

});

