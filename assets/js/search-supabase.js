(function () {
  const SUPABASE_URL =
    window.BRANDRADAR_SUPABASE_URL ||
    window.SUPABASE_CONFIG?.url;

  const SUPABASE_ANON_KEY =
    window.BRANDRADAR_SUPABASE_ANON_KEY ||
    window.SUPABASE_CONFIG?.anonKey;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !window.supabase) {
    console.warn("BrandRadar search: Supabase config mangler.");
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  const escapeHTML = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const normalize = (value) =>
    String(value || "").toLowerCase().trim();

  function cleanPrice(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const number = Number(
      String(value)
        .replace(/\s/g, "")
        .replace(/[^\d.,-]/g, "")
        .replace(",", ".")
    );

    if (!Number.isFinite(number)) return null;
    if (number <= 0 || number > 1000000) return null;

    return number;
  }

  function formatPrice(value, currency = "NOK") {
    const number = cleanPrice(value);
    if (number === null) return "";

    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency,
      minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
      maximumFractionDigits: Number.isInteger(number) ? 0 : 2,
    }).format(number);
  }

  const getTitle = (p) =>
    p.title ||
    p.product_name ||
    p.name ||
    "Produkt";

  const getBrand = (p) =>
    p.brand_name ||
    p.brand ||
    p.brand_slug ||
    p.merchant_name ||
    p.merchant_slug ||
    "";

  const getImage = (p) =>
    p.image_url ||
    p.image ||
    p.main_image ||
    "";

  const getPrice = (p) => {
    return formatPrice(
      p.price,
      p.currency || "NOK"
    );
  };

  const getId = (p) =>
    p.external_id ||
    p.product_id ||
    p.original_id ||
    p.id ||
    "";

  async function searchProducts(query, limit = 6) {
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

    return (data || []).filter((p) => p.active !== false);
  }

  async function searchBrands(query, limit = 5) {
    const cleanQuery = normalize(query);

    if (!cleanQuery || cleanQuery.length < 2) {
      return [];
    }

    const { data, error } = await client.rpc("search_brands", {
      search_query: cleanQuery,
      limit_count: limit,
    });

    if (error) {
      console.error("Supabase brand search error:", error);
      return [];
    }

    return (data || []).filter((b) => b.active !== false);
  }

  function renderProducts(products, prodWrap) {
    if (!prodWrap) return;

    if (!products.length) {
      prodWrap.innerHTML = `
        <div class="search-empty">
          Ingen produkter funnet.
        </div>
      `;
      return;
    }

    prodWrap.innerHTML = products
      .slice(0, 6)
      .map((p) => {
        const id = getId(p);
        const title = getTitle(p);
        const brand = getBrand(p);
        const image = getImage(p);
        const price = getPrice(p);

        return `
          <button class="search-item" type="button" data-id="${escapeHTML(id)}">
            <span class="search-thumb">
              ${
                image
                  ? `<img src="${escapeHTML(image)}" alt="">`
                  : "🛍️"
              }
            </span>

            <span class="search-meta">
              <span class="search-title">
                ${escapeHTML(title)}
              </span>

              ${
                brand
                  ? `
                    <span class="search-sub">
                      ${escapeHTML(brand)}
                    </span>
                  `
                  : ""
              }

              ${
                price
                  ? `
                    <span class="search-price">
                      <span class="sp-new">
                        ${escapeHTML(price)}
                      </span>
                    </span>
                  `
                  : ""
              }
            </span>
          </button>
        `;
      })
      .join("");

    prodWrap
      .querySelectorAll(".search-item[data-id]")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const id = item.dataset.id;

          if (id) {
            window.location.href =
              `product.html?id=${encodeURIComponent(id)}`;
          }
        });
      });
  }

  function renderBrands(brands, brandWrap) {
    if (!brandWrap) return;

    if (!brands.length) {
      brandWrap.innerHTML = `
        <div class="search-empty">
          Ingen brands funnet.
        </div>
      `;
      return;
    }

    brandWrap.innerHTML = brands
      .slice(0, 5)
      .map((brand) => {
        const logo = brand.logo_url || "";
        const name = brand.name || brand.brand_name || "";
        const productCount = brand.product_count || 0;

        return `
          <button
            class="search-item search-brand-item"
            type="button"
            data-brand="${escapeHTML(name)}"
          >
            <span class="search-thumb">
              ${
                logo
                  ? `<img src="${escapeHTML(logo)}" alt="">`
                  : "🏷️"
              }
            </span>

            <span class="search-meta">
              <span class="search-title">
                ${escapeHTML(name)}
              </span>

              <span class="search-sub">
                ${productCount} produkter
              </span>
            </span>
          </button>
        `;
      })
      .join("");

    brandWrap
      .querySelectorAll(".search-brand-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const brand = item.dataset.brand;

          if (brand) {
            window.location.href =
              `brand-page.html?brand=${encodeURIComponent(brand)}`;
          }
        });
      });
  }

  function initSupabaseSearch() {
    const root = document.getElementById("site-search");
    const input = document.getElementById("search-input");
    const dropdown = document.getElementById("search-dropdown");
    const prodWrap = document.getElementById("search-results-products");
    const brandWrap = document.getElementById("search-results-brands");
    const clearBtn = root
      ? root.querySelector(".search-clear")
      : null;

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
      root.classList.toggle(
        "has-value",
        !!input.value.trim()
      );
    }

    async function runSearch() {
      const query = input.value.trim();

      setHasValue();

      if (query.length < 2) {
        prodWrap.innerHTML = `
          <div class="search-empty">
            Skriv for å søke…
          </div>
        `;

        if (brandWrap) {
          brandWrap.innerHTML = "";
        }

        return;
      }

      prodWrap.innerHTML = `
        <div class="search-empty">
          Søker…
        </div>
      `;

      if (brandWrap) {
        brandWrap.innerHTML = "";
      }

      const [products, brands] = await Promise.all([
        searchProducts(query, 6),
        searchBrands(query, 5),
      ]);

      renderProducts(products, prodWrap);
      renderBrands(brands, brandWrap);
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

        const firstProduct =
          prodWrap.querySelector(".search-item[data-id]");

        if (firstProduct) {
          const id = firstProduct.dataset.id;

          window.location.href =
            `product.html?id=${encodeURIComponent(id)}`;
        }
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        setHasValue();
        openDropdown();
        runSearch();

        input.focus({
          preventScroll: true,
        });
      });
    }

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) {
        closeDropdown();
      }
    });

    runSearch();
  }

  window.BrandRadarSearch = {
    searchProducts,
    searchBrands,
    initSupabaseSearch,
  };

  document.addEventListener(
    "DOMContentLoaded",
    initSupabaseSearch
  );
})();
