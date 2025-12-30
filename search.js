// search.js — global site search (products + brands)
(function () {
  const input = document.getElementById("search-input");
  const root = document.getElementById("site-search");
  const dropdown = document.getElementById("search-dropdown");
  const clearBtn = document.querySelector("#site-search .search-clear");

  if (!input || !root || !dropdown || !clearBtn) return;

  const prodWrap = document.getElementById("search-results-products");
  const brandWrap = document.getElementById("search-results-brands");

  // ---- Sources (samme master som resten av siden)
  const MASTER_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const MASTER_TAB = "BrandRadarProdukter";

  // Optional: brands sheet (hvis du heller vil søke i den)
  const BRANDS_SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const BRANDS_TAB = "Ark 1";

  const MAX_RESULTS = 6;

  let products = [];
  let brands = [];
  let activeIndex = -1;
  let flatItems = [];

  const fetchJson = async (sheetId, tab) => {
    const url = `https://opensheet.elk.sh/${sheetId}/${encodeURIComponent(tab)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  };

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  function openDropdown() {
    dropdown.hidden = false;
  }
  function closeDropdown() {
    dropdown.hidden = true;
    activeIndex = -1;
    syncActive();
  }

  function setHasValue(v) {
    root.classList.toggle("has-value", !!v);
  }

  function renderEmpty(el, msg) {
    el.innerHTML = `<div class="search-empty">${msg}</div>`;
  }

  function render() {
    prodWrap.innerHTML = "";
    brandWrap.innerHTML = "";

    const q = norm(input.value);
    if (!q) {
      renderEmpty(prodWrap, "Skriv for å søke…");
      renderEmpty(brandWrap, " ");
      flatItems = [];
      activeIndex = -1;
      return;
    }

    const prodMatches = products
      .map((p) => ({
        type: "product",
        id: String(p.id || "").trim(),
        title: p.title || p.product_name || p.name || "",
        brand: p.brand || "",
        image: p.image_url || "",
      }))
      .filter((p) => p.id && (norm(p.title).includes(q) || norm(p.brand).includes(q)))
      .slice(0, MAX_RESULTS);

    const brandMatches = brands
      .map((b) => ({
        type: "brand",
        brand: b.brand || b.name || "",
        logo: b.logo || b.logo_url || "",
        description: b.description || "",
      }))
      .filter((b) => b.brand && norm(b.brand).includes(q))
      .slice(0, MAX_RESULTS);

    if (!prodMatches.length) renderEmpty(prodWrap, "Ingen produkter funnet.");
    if (!brandMatches.length) renderEmpty(brandWrap, "Ingen brands funnet.");

    prodMatches.forEach((p) => {
      const el = document.createElement("div");
      el.className = "search-item";
      el.dataset.type = "product";
      el.dataset.id = p.id;

      el.innerHTML = `
        <div class="search-thumb">${p.image ? `<img src="${p.image}" alt="">` : "🛍️"}</div>
        <div class="search-meta">
          <p class="search-title">${p.title}</p>
          <p class="search-sub">${p.brand}</p>
        </div>
      `;

      el.addEventListener("mousedown", (e) => e.preventDefault());
      el.addEventListener("click", () => {
        window.location.href = `product.html?id=${encodeURIComponent(p.id)}`;
      });

      prodWrap.appendChild(el);
    });

    brandMatches.forEach((b) => {
      const el = document.createElement("div");
      el.className = "search-item";
      el.dataset.type = "brand";
      el.dataset.brand = b.brand;

      el.innerHTML = `
        <div class="search-thumb">${b.logo ? `<img src="${b.logo}" alt="">` : "🏷️"}</div>
        <div class="search-meta">
          <p class="search-title">${b.brand}</p>
          <p class="search-sub">${b.description || "Åpne brand"}</p>
        </div>
      `;

      el.addEventListener("mousedown", (e) => e.preventDefault());
      el.addEventListener("click", () => {
        window.location.href = `brand-page.html?brand=${encodeURIComponent(b.brand)}`;
      });

      brandWrap.appendChild(el);
    });

    // Flat list for keyboard navigation
    flatItems = Array.from(dropdown.querySelectorAll(".search-item"));
    activeIndex = -1;
    syncActive();
  }

  function syncActive() {
    flatItems.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
  }

  function clickActive() {
    const el = flatItems[activeIndex];
    if (el) el.click();
  }

  // Debounce
  let t = null;
  function debouncedRender() {
    clearTimeout(t);
    t = setTimeout(render, 120);
  }

  // Load data once (cache)
  (async function init() {
    try {
      const [master, brandRows] = await Promise.all([
        fetchJson(MASTER_SHEET_ID, MASTER_TAB),
        fetchJson(BRANDS_SHEET_ID, BRANDS_TAB).catch(() => []),
      ]);

      products = Array.isArray(master) ? master : [];
      brands = Array.isArray(brandRows) ? brandRows : [];

      // Build fallback brands from products if brands-sheet missing/empty
      if (!brands.length) {
        const set = new Set();
        brands = products
          .map((p) => String(p.brand || "").trim())
          .filter(Boolean)
          .filter((b) => (set.has(b) ? false : (set.add(b), true)))
          .map((b) => ({ brand: b, description: "" }));
      }

      render();
    } catch (e) {
      // If fetch fails, still allow typing without crashing
      renderEmpty(prodWrap, "Kunne ikke laste søkedata.");
      renderEmpty(brandWrap, " ");
    }
  })();

  // UI handlers
  input.addEventListener("focus", () => {
    openDropdown();
    render();
  });

  input.addEventListener("input", () => {
    setHasValue(input.value);
    openDropdown();
    debouncedRender();
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    setHasValue(false);
    openDropdown();
    render();
    input.focus();
  });

  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) closeDropdown();
  });

  input.addEventListener("keydown", (e) => {
    if (dropdown.hidden) openDropdown();

    if (e.key === "Escape") {
      closeDropdown();
      input.blur();
      return;
    }

    if (!flatItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, flatItems.length - 1);
      syncActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      syncActive();
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        clickActive();
      }
    }
  });
})();
