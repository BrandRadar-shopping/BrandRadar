// ======================================================
// BrandRadar – Brands Page Supabase version
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");

  if (!highlightGrid || !brandGrid) return;

  const SUPABASE_URL = window.BRANDRADAR_SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.BRANDRADAR_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !window.supabase) {
    console.error("Brands page: Supabase config mangler.");
    brandGrid.innerHTML = `<p>Kunne ikke laste brands akkurat nå.</p>`;
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let allBrands = [];
  let activeLetter = "all";

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .trim();

  function createLogoFallback(name) {
    return `
      <div class="brand-logo-placeholder" aria-hidden="true">
        ${escapeHtml(String(name || "?").slice(0, 1).toUpperCase())}
      </div>
    `;
  }

  function syncBrandHearts(brandKey, isActive) {
    document.querySelectorAll(".fav-icon[data-brand]").forEach((el) => {
      if (String(el.dataset.brand || "").trim() === brandKey) {
        el.classList.toggle("active", isActive);
      }
    });
  }

  function createBrandCard(brandObj, isFav) {
    const brandName = String(brandObj.name || "").trim();
    const logo = String(brandObj.logo_url || "").trim();
    const productCount = Number(brandObj.product_count || 0);

    const card = document.createElement("div");
    card.className = "brand-card";

    card.innerHTML = `
      <span class="fav-icon always-visible ${isFav ? "active" : ""}" data-brand="${escapeHtml(brandName)}">
        <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
        </svg>
      </span>

      ${
        logo
          ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(brandName)}" class="brand-logo" loading="lazy">`
          : createLogoFallback(brandName)
      }

      <h3>${escapeHtml(brandName)}</h3>

      <p class="brand-product-count">
        ${productCount} produkter
      </p>

      <a class="brand-btn">Se produkter →</a>
    `;

    card.querySelector(".brand-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brandName)}`;
    });

    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-icon")) return;
      if (e.target.closest(".brand-btn")) return;
      window.location.href = `brand-page.html?brand=${encodeURIComponent(brandName)}`;
    });

    const heart = card.querySelector(".fav-icon");

    heart?.addEventListener("click", (e) => {
      e.stopPropagation();

      if (window.toggleBrandFavorite) {
        window.toggleBrandFavorite(brandName);
      }

      const updatedFavs = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
      const isNowFav = updatedFavs.includes(brandName);

      syncBrandHearts(brandName, isNowFav);

      if (window.updateFavoriteCounter) {
        window.updateFavoriteCounter();
      }
    });

    return card;
  }

  function getFilteredBrands() {
    const search = normalize(searchInput?.value || "");

    return allBrands.filter((brand) => {
      const name = String(brand.name || "");
      const normalizedName = normalize(name);

      const matchesSearch = !search || normalizedName.includes(search);

      const matchesLetter =
        activeLetter === "all" ||
        name.toUpperCase().startsWith(activeLetter);

      return matchesSearch && matchesLetter;
    });
  }

  function renderBrands() {
    highlightGrid.innerHTML = "";
    brandGrid.innerHTML = "";

    const favList = window.getFavoriteBrands ? window.getFavoriteBrands() : [];
    const filteredBrands = getFilteredBrands();

    if (!filteredBrands.length) {
      brandGrid.innerHTML = `<p class="brand-empty">Ingen brands funnet.</p>`;
      return;
    }

    filteredBrands.forEach((brandObj) => {
      const brandName = String(brandObj.name || "").trim();
      const isFav = favList.includes(brandName);
      const card = createBrandCard(brandObj, isFav);
      brandGrid.appendChild(card);
    });
  }

  function initAlphabetFilter() {
    document.querySelectorAll(".brand-alphabet span").forEach((letterEl) => {
      letterEl.addEventListener("click", () => {
        document.querySelectorAll(".brand-alphabet span").forEach((x) => {
          x.classList.remove("active");
        });

        letterEl.classList.add("active");

        activeLetter = letterEl.dataset.letter === "all"
          ? "all"
          : letterEl.textContent.trim().toUpperCase();

        renderBrands();
      });
    });
  }

  function setupMobileAlphabetToggle() {
    const toggleBtn = document.getElementById("brandAlphabetToggle");
    const alphabet = document.getElementById("brandAlphabet");

    if (!toggleBtn || !alphabet) return;

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    function applyState() {
      if (isMobile()) {
        alphabet.hidden = true;
        toggleBtn.hidden = false;
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.classList.remove("is-open");
      } else {
        alphabet.hidden = false;
        toggleBtn.hidden = true;
        toggleBtn.setAttribute("aria-expanded", "true");
        toggleBtn.classList.remove("is-open");
      }
    }

    toggleBtn.onclick = () => {
      const willOpen = alphabet.hidden;
      alphabet.hidden = !willOpen;
      toggleBtn.setAttribute("aria-expanded", String(willOpen));
      toggleBtn.classList.toggle("is-open", willOpen);
    };

    applyState();
    window.addEventListener("resize", applyState);
  }

  async function loadBrands() {
    brandGrid.innerHTML = `<p class="brand-empty">Laster brands…</p>`;

    const { data, error } = await client
      .from("brands")
      .select("*")
      .eq("active", true)
      .order("product_count", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Brands page Supabase error:", error);
      brandGrid.innerHTML = `<p class="brand-empty">Kunne ikke laste brands akkurat nå.</p>`;
      return;
    }

    allBrands = data || [];

    localStorage.setItem(
      "allBrandsData",
      JSON.stringify(
        allBrands.map((brand) => ({
          name: brand.name,
          logo: brand.logo_url,
          description: brand.description || "",
        }))
      )
    );

    renderBrands();
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderBrands);
  }

  initAlphabetFilter();
  setupMobileAlphabetToggle();
  await loadBrands();
});
