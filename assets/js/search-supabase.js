(function () {
  const SUPABASE_URL = window.BRANDRADAR_SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.BRANDRADAR_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !window.supabase) {
    console.warn("BrandRadar search: Supabase config mangler.");
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const escapeHTML = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const normalize = (value) =>
    String(value || "").toLowerCase().trim();

  const formatPrice = (value, currency = "NOK") => {
    if (value === null || value === undefined || value === "") return "";
    const number = Number(value);
    if (Number.isNaN(number)) return String(value);

    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const getTitle = (p) => p.title || p.product_name || p.name || "Produkt";
  const getBrand = (p) => p.brand_name || p.brand_slug || p.merchant_name || p.merchant_slug || "";
  const getImage = (p) => p.image_url || p.image || p.main_image || "";
  const getPrice = (p) => formatPrice(p.price || p.lowest_price || p.new_price, p.currency || "NOK");
  const getId = (p) => p.id || p.external_id || p.original_id;

  async function searchProducts(query, limit = 12) {
    const cleanQuery = normalize(query);

    if (!cleanQuery || cleanQuery.length < 2) return [];

    const { data, error } = await client.rpc("search_products", {
      search_query: cleanQuery,
      limit_count: limit,
    });

    if (error) {
      console.error("Supabase search error:", error);
      return [];
    }

    return data || [];
  }

  function renderProducts(products, prodWrap) {
    if (!prodWrap) return;

    if (!products.length) {
      prodWrap.innerHTML = `<div class="search-empty">Ingen produkter funnet.</div>`;
      return;
    }

    prodWrap.innerHTML = products
      .map((p) => {
        const id = getId(p);
        const title = getTitle(p);
        const brand = getBrand(p);
        const image = getImage(p);
        const price = getPrice(p);

        return `
          <button class="search-item" type="button" data-id="${escapeHTML(id)}">
            <span class="search-thumb">
              ${image ? `<img src="${escapeHTML(image)}" alt="">` : "🛍️"}
            </span>

            <span class="search-meta">
              <span class="search-title">${escapeHTML(title)}</span>
              ${brand ? `<span class="search-sub">${escapeHTML(brand)}</span>` : ""}
              ${price ? `<span class="search-price"><span class="sp-new">${escapeHTML(price)}</span></span>` : ""}
            </span>
          </button>
        `;
      })
      .join("");

    prodWrap.querySelectorAll(".search-item[data-id]").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.id;
        if (id) window.location.href = `product.html?id=${encodeURIComponent(id)}`;
      });
    });
  }

  function renderBrands(brandWrap) {
    if (!brandWrap) return;
    brandWrap.innerHTML = `<div class="search-empty">Brands flyttes til Supabase senere.</div>`;
  }

  function initSupabaseSearch() {
    const root = document.getElementById("site-search");
    const input = document.getElementById("search-input");
    const dropdown = document.getElementById("search-dropdown");
    const prodWrap = document.getElementById("search-results-products");
    const brandWrap = document.getElementById("search-results-brands");
    const clearBtn = root ? root.querySelector(".search-clear") : null;

    if (!root || !input || !dropdown || !prodWrap) {
      console.warn("BrandRadar Supabase search: mangler DOM-elementer.");
      return;
    }

    root.dataset.searchReady = "supabase";

    let debounceTimer = null;

    function openDropdown() {
      dropdown.hidden = false;
      dropdown.style.zIndex = "99999";
    }

    function closeDropdown() {
      dropdown.hidden = true;
    }

    function setHasValue() {
      root.classList.toggle("has-value", !!input.value.trim());
    }

    async function runSearch() {
      const query = input.value.trim();

      setHasValue();

      if (query.length < 2) {
        prodWrap.innerHTML = `<div class="search-empty">Skriv for å søke…</div>`;
        if (brandWrap) brandWrap.innerHTML = "";
        return;
      }

      prodWrap.innerHTML = `<div class="search-empty">Søker…</div>`;
      if (brandWrap) brandWrap.innerHTML = "";

      const products = await searchProducts(query, 12);

      renderProducts(products, prodWrap);
      renderBrands(brandWrap);
    }

    input.addEventListener("focus", () => {
      openDropdown();
      runSearch();
    });

    input.addEventListener("input", () => {
      openDropdown();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runSearch, 180);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdown();
        input.blur();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        const firstProduct = prodWrap.querySelector(".search-item[data-id]");
        if (firstProduct) {
          const id = firstProduct.dataset.id;
          window.location.href = `product.html?id=${encodeURIComponent(id)}`;
        }
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        setHasValue();
        openDropdown();
        runSearch();
        input.focus({ preventScroll: true });
      });
    }

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) closeDropdown();
    });

    runSearch();
  }

  window.BrandRadarSearch = {
    searchProducts,
    initSupabaseSearch,
  };

  document.addEventListener("DOMContentLoaded", initSupabaseSearch);
})();
