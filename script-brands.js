// ======================================================
// ✅ BrandRadar – Brands Page FINAL (with Brand Detail Routing)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const SHEET_NAME = "Ark 1";

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");

  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  fetch(url)
    .then(res => res.json())
    .then(rows => {
      const brands = rows.map(r => ({
        brand: r.brand || "",
        logo: r.logo || "",
        description: r.description || "",
        homepage: r.homepage_url || "#",
        about: r.about || "",
        highlight: (r.highlight || "").toLowerCase() === "yes",
        categories: r.categories ? r.categories.split(",").map(c => c.trim()) : []
      }));

      initAlphabetFilter(brands);
      renderBrands(brands);

      searchInput.addEventListener("input", e => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = brands.filter(b =>
          b.brand.toLowerCase().includes(searchTerm)
        );
        renderBrands(filtered);
      });
    })
    .catch(err => console.error("❌ FEIL ved lasting av brands:", err));

  function renderBrands(brands) {
    highlightGrid.innerHTML = "";
    brandGrid.innerHTML = "";

    brands.forEach(b => {
      const card = document.createElement("div");
      card.classList.add("brand-card");
      if (b.highlight) card.classList.add("highlighted");

      card.innerHTML = `
        <img src="${b.logo}" alt="${b.brand}" class="brand-logo">
        <h3>${b.brand}</h3>
        <p>${b.description}</p>
        <a class="brand-btn" data-brand="${encodeURIComponent(b.brand)}">
          Se produkter →
        </a>
      `;

      // ✅ Klikk sender til brand-page.html
      card.querySelector(".brand-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `brand-page.html?brand=${encodeURIComponent(b.brand)}`;
      });

      if (b.highlight) highlightGrid.appendChild(card);
      else brandGrid.appendChild(card);
    });
  }

  // ✅ Alphabet filter
  function initAlphabetFilter(allBrands) {
    document.querySelectorAll(".brand-alphabet span").forEach(letterEl => {
      letterEl.addEventListener("click", () => {
        document.querySelectorAll(".brand-alphabet span")
          .forEach(x => x.classList.remove("active"));
        letterEl.classList.add("active");

        const letter = letterEl.dataset.letter;

        const filtered =
          letter === "all"
            ? allBrands
            : allBrands.filter(b => b.brand.toUpperCase().startsWith(letter.toUpperCase()));

        renderBrands(filtered);
      });
    });
  }
});

