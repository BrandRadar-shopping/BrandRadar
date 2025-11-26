// ======================================================
// ✅ BrandRadar – Brands Page (Stabil + Optimalisert)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const SHEET_NAME = "Ark 1";

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");

  // ------------------------------------------------------
  // 🩶 Favoritt-ikonet skal ALLTID være synlig
  // ------------------------------------------------------
  const forceHeartStyles = document.createElement("style");
  forceHeartStyles.textContent = `
    .brand-card { position: relative; }
    .brand-card .fav-icon.always-visible { 
      opacity: 1 !important; 
      visibility: visible !important; 
      pointer-events: auto !important; 
    }
    .brand-card:hover .fav-icon.always-visible { opacity: 1 !important; }
    .brand-card .fav-icon.always-visible .heart-icon {
      stroke: #222; fill: transparent; stroke-width: 1.4px; transition: .22s ease;
    }
    .brand-card .fav-icon.always-visible.active .heart-icon {
      fill: #ff1f3d; stroke: #ff1f3d;
    }
  `;
  document.head.appendChild(forceHeartStyles);

  // ------------------------------------------------------
  // 📡 Hent brands fra Google Sheet
  // ------------------------------------------------------
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  fetch(url)
    .then(res => res.json())
    .then(rows => {
      const brands = rows.map(r => ({
        brand: (r.brand || "").trim(),
        logo: (r.logo || "").trim(),
        description: (r.description || "").trim(),
        homepage: (r.homepage_url || "").trim() || "#",
        about: (r.about || "").trim(),
        highlight: (r.highlight || "").toLowerCase() === "yes",
        categories: r.categories ? r.categories.split(",").map(c => c.trim()) : []
      }));

      // Lagre for favoritter.html
      localStorage.setItem("allBrandsData", JSON.stringify(brands));

      // Init UI
      initAlphabetFilter(brands);
      renderBrands(brands);

      // 🔎 Søkefeltet
      if (searchInput) {
        searchInput.addEventListener("input", e => {
          const search = e.target.value.toLowerCase();
          const filtered = brands.filter(b =>
            b.brand.toLowerCase().includes(search)
          );
          renderBrands(filtered);
        });
      }
    })
    .catch(err => console.error("❌ FEIL ved lasting av brands:", err));

  // ------------------------------------------------------
  // 🔁 Render funksjon – Nå VISER highlightede brands i BEGGE grids
  // ------------------------------------------------------
  function renderBrands(brands) {
    highlightGrid.innerHTML = "";
    brandGrid.innerHTML = "";

    const favList = window.getFavoriteBrands ? window.getFavoriteBrands() : [];

    brands.forEach(b => {
      const isFav = favList.includes(b.brand);

      // 🧱 BYGG KORT
      const card = createBrandCard(b, isFav);

      // Legg ALTID til i "alle brands"
      brandGrid.appendChild(card);

      // Hvis highlight → legg også til i fremhevede
      if (b.highlight) {
        const clone = createBrandCard(b, isFav);
        highlightGrid.appendChild(clone);
      }
    });
  }

  // ------------------------------------------------------
  // 🧩 Funksjon som bygger et brand-card med events
  // ------------------------------------------------------
  function createBrandCard(b, isFav) {
    const card = document.createElement("div");
    card.classList.add("brand-card");

    card.innerHTML = `
      <span class="fav-icon always-visible ${isFav ? "active" : ""}" data-brand="${b.brand}">
        <svg class="heart-icon" viewBox="0 0 24 24">
          <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
        </svg>
      </span>

      <img src="${b.logo}" alt="${b.brand}" class="brand-logo">
      <h3>${b.brand}</h3>
      <p>${b.description || ""}</p>

      <a class="brand-btn">Se produkter →</a>
    `;

    // Navigasjon
    card.querySelector(".brand-btn").addEventListener("click", e => {
      e.stopPropagation();
      window.location.href = `brand-page.html?brand=${encodeURIComponent(b.brand)}`;
    });

    // Favoritt-click
    const heart = card.querySelector(".fav-icon");
    heart.addEventListener("click", e => {
      e.stopPropagation();
      if (window.toggleBrandFavorite) window.toggleBrandFavorite(b.brand);
      heart.classList.toggle("active");
      if (window.updateFavoriteCounter) window.updateFavoriteCounter();
    });

    return card;
  }

  // ------------------------------------------------------
  // 🔤 Alfabetfilter
  // ------------------------------------------------------
  function initAlphabetFilter(allBrands) {
    document.querySelectorAll(".brand-alphabet span").forEach(letterEl => {
      letterEl.addEventListener("click", () => {
        document
          .querySelectorAll(".brand-alphabet span")
          .forEach(x => x.classList.remove("active"));
        letterEl.classList.add("active");

        const letter = letterEl.dataset.letter;

        const filtered =
          letter === "all"
            ? allBrands
            : allBrands.filter(b =>
                b.brand.toUpperCase().startsWith(letter.toUpperCase())
              );

        renderBrands(filtered);
      });
    });
  }
});

