(function () {
  const SUPABASE_URL = window.BRANDRADAR_SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.BRANDRADAR_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("BrandRadar search: Supabase config mangler.");
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .trim();

  const escapeHTML = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const getProductTitle = (product) =>
    product.title ||
    product.product_name ||
    product.name ||
    "Produkt";

  const getProductBrand = (product) =>
    product.brand_name ||
    product.brand_slug ||
    product.merchant_name ||
    product.merchant_slug ||
    "";

  const getProductImage = (product) =>
    product.image_url ||
    product.image ||
    product.main_image ||
    "assets/img/placeholder.png";

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

  const getProductPrice = (product) =>
    formatPrice(product.price || product.lowest_price || product.new_price, product.currency || "NOK");

  async function searchProducts(query, limit = 20) {
    const cleanQuery = normalize(query);

    if (!cleanQuery || cleanQuery.length < 2) {
      return [];
    }

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

  function renderSearchResults(products, container) {
    if (!container) return;

    if (!products.length) {
      container.innerHTML = `
        <div class="search-empty">
          Ingen produkter funnet.
        </div>
      `;
      return;
    }

    container.innerHTML = products
      .map((product) => {
        const id = product.id || product.external_id || product.original_id;
        const title = getProductTitle(product);
        const brand = getProductBrand(product);
        const image = getProductImage(product);
        const price = getProductPrice(product);

        return `
          <a class="search-result-item" href="product.html?id=${encodeURIComponent(id)}">
            <div class="search-result-image">
              <img src="${escapeHTML(image)}" alt="${escapeHTML(title)}" loading="lazy">
            </div>

            <div class="search-result-info">
              ${brand ? `<p class="search-result-brand">${escapeHTML(brand)}</p>` : ""}
              <h4 class="search-result-title">${escapeHTML(title)}</h4>
              ${price ? `<p class="search-result-price">${escapeHTML(price)}</p>` : ""}
            </div>
          </a>
        `;
      })
      .join("");
  }

  function initSupabaseSearch() {
    const inputs = document.querySelectorAll("[data-search-input], .search-input, #search-input");

    inputs.forEach((input) => {
      const wrapper =
        input.closest(".search-wrapper") ||
        input.closest(".header-search") ||
        input.parentElement;

      let resultsContainer =
        wrapper?.querySelector(".search-results") ||
        document.querySelector("[data-search-results]");

      if (!resultsContainer && wrapper) {
        resultsContainer = document.createElement("div");
        resultsContainer.className = "search-results";
        wrapper.appendChild(resultsContainer);
      }

      let debounceTimer;

      input.addEventListener("input", () => {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(async () => {
          const query = input.value.trim();

          if (query.length < 2) {
            if (resultsContainer) resultsContainer.innerHTML = "";
            return;
          }

          const products = await searchProducts(query, 12);
          renderSearchResults(products, resultsContainer);
        }, 180);
      });

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          const query = input.value.trim();

          if (query.length >= 2) {
            window.location.href = `search-mobile.html?q=${encodeURIComponent(query)}`;
          }
        }
      });
    });
  }

  window.BrandRadarSearch = {
    searchProducts,
    renderSearchResults,
    initSupabaseSearch,
  };

  document.addEventListener("DOMContentLoaded", initSupabaseSearch);
})();
