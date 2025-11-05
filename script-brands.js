// ======================================================
// ✅ BrandRadar – Brands Page FINAL (with Favorites + Brand Detail Routing)
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

    const favList = getFavoriteBrands(); // ✅ Hent favoritter fra localStorage

    brands.forEach(b => {
      const isFav = favList.includes(b.brand);

      const card = document.createElement("div");
      card.classList.add("brand-card");
      if (b.highlight) card.classList.add("highlighted");

      card.innerHTML = `
        <span class="fav-icon ${isFav ? "active" : ""}" data-brand="${b.brand}">
          <svg class="heart-icon" viewBox="0 0 24 24">
            <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
          </svg>
        </span>

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

      // ✅ Håndter favoritt-brand klikk
      card.querySelector(".fav-icon").addEventListener("click", (e) => {
        e.stopPropagation(); 
        toggleBrandFavorite(b.brand);
        card.querySelector(".fav-icon").classList.toggle("active");
        updateFavoritesCount();
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

