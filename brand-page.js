// ======================================================
// BrandRadar – Brand Page Supabase version
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const t = window.BrandRadarLang?.t || ((key, fallback) => fallback || key);

  const SUPABASE_URL = window.BRANDRADAR_SUPABASE_URL;
  const SUPABASE_KEY = window.BRANDRADAR_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY || !window.supabase) {
    console.error("Brand page: Supabase config mangler.");
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const brandParam = new URLSearchParams(window.location.search).get("brand");
  if (!brandParam) return;

  const titleEl = document.getElementById("brand-title");
  const descEl = document.getElementById("brand-description");
  const logoEl = document.getElementById("brand-logo");
  const siteBtn = document.getElementById("brand-site-btn");
  const favBtn = document.getElementById("favorite-brand-btn");
  const grid = document.querySelector(".product-grid");
  const emptyMsg = document.querySelector(".empty-message");
  const resultCount = document.querySelector(".result-count");
  const categorySelect = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");

  let brand = null;
  let brandProducts = [];

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .trim();
  }

  function cleanPrice(value) {
    if (value === null || value === undefined || value === "") return 0;

    const n = Number(
      String(value)
        .replace(/\s/g, "")
        .replace(/[^\d.,-]/g, "")
        .replace(",", ".")
    );

    if (!Number.isFinite(n)) return 0;
    if (n < 0 || n > 1000000) return 0;

    return n;
  }

  function cleanRating(value) {
    const n = Number(
      String(value ?? "")
        .replace(",", ".")
        .replace(/[^0-9.]/g, "")
    );

    return Number.isFinite(n) ? n : 0;
  }

  function getEffectivePrice(product) {
    return cleanPrice(product.price);
  }

  function getProductTitle(product) {
    return (
      product.title ||
      product.product_name ||
      product.name ||
      t("unnamed_product", "Uten navn")
    );
  }

  function getProductId(product) {
    return (
      product.external_id ||
      product.original_id ||
      product.id ||
      ""
    );
  }

  function getFavBrands() {
    return JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
  }

  function updateFavUI() {
    if (!favBtn) return;

    const currentName = brand?.name || brandParam;
    const isFav = getFavBrands().includes(currentName);

    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav
      ? "♥ I dine favoritter"
      : "♡ Favoritt-brand";
  }

  function toggleFavBrand() {
    const currentName = brand?.name || brandParam;
    let favs = getFavBrands();

    if (favs.includes(currentName)) {
      favs = favs.filter((name) => name !== currentName);
    } else {
      favs.push(currentName);
    }

    localStorage.setItem("favoriteBrands", JSON.stringify(favs));
    updateFavUI();

    if (window.updateFavoriteCounter) {
      window.updateFavoriteCounter();
    }
  }

  async function loadBrand() {
    const normalizedParam = normalize(brandParam);

    const { data, error } = await client
      .from("brands")
      .select("*")
      .or(`name.ilike.${brandParam},slug.eq.${normalizedParam}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Could not load brand:", error);
      return null;
    }

    return data;
  }

  async function loadBrandProducts(brandData) {
    if (!brandData) return [];

    let query = client
      .from("products")
      .select("*")
      .eq("active", true)
      .order("updated_at", { ascending: false });

    if (brandData.slug) {
      query = query.eq("brand_slug", brandData.slug);
    } else {
      query = query.ilike("brand_name", brandData.name);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Could not load brand products:", error);
      return [];
    }

    return data || [];
  }

  function renderBrandInfo() {
    const brandName = brand?.name || brandParam;

    document.title = `${brandName} – BrandRadar`;

    if (titleEl) {
      titleEl.textContent = brandName;
    }

    if (descEl) {
      descEl.textContent =
        brand?.description ||
        brand?.featured_intro ||
        `${brandName} produkter samlet på BrandRadar.`;
    }

    if (logoEl) {
      if (brand?.logo_url) {
        logoEl.src = brand.logo_url;
        logoEl.alt = `${brandName} logo`;
        logoEl.style.display = "";
      } else {
        logoEl.style.display = "none";
      }
    }

    if (siteBtn) {
      siteBtn.href =
        brand?.website_url ||
        brandProducts.find((product) => product.product_url)?.product_url ||
        "#";
    }

    updateFavUI();
  }

  function setupCategoryFilter() {
    if (!categorySelect) return;

    const currentValue = categorySelect.value || "all";

    categorySelect.innerHTML = `
      <option value="all">${t("all", "Alle")}</option>
    `;

    const categories = [
      ...new Set(
        brandProducts
          .map((product) => String(product.category || "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "nb"));

    categories.forEach((category) => {
      const opt = document.createElement("option");
      opt.value = category;
      opt.textContent = category;
      categorySelect.appendChild(opt);
    });

    if ([...categorySelect.options].some((opt) => opt.value === currentValue)) {
      categorySelect.value = currentValue;
    }
  }

  function applyFiltersAndSort() {
    let list = [...brandProducts];

    if (categorySelect && categorySelect.value !== "all") {
      list = list.filter(
        (product) =>
          String(product.category || "").trim() === categorySelect.value
      );
    }

    if (sortSelect) {
      switch (sortSelect.value) {
        case "price-asc":
          list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
          break;

        case "price-desc":
          list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
          break;

        case "rating-desc":
          list.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
          break;

        case "featured":
        default:
          list.sort((a, b) => {
            const au = new Date(a.updated_at || a.imported_at || 0).getTime();
            const bu = new Date(b.updated_at || b.imported_at || 0).getTime();
            return bu - au;
          });
          break;
      }
    }

    renderProducts(list);
  }

  function renderProducts(list) {
    if (!grid) return;

    grid.innerHTML = "";

    if (!list.length) {
      if (emptyMsg) {
        emptyMsg.style.display = "block";
        emptyMsg.textContent = t("no_products_found", "Ingen produkter funnet.");
      }

      if (resultCount) {
        resultCount.textContent = "0 produkter";
      }

      return;
    }

    if (emptyMsg) {
      emptyMsg.style.display = "none";
    }

    if (resultCount) {
      resultCount.textContent = `${list.length} ${t("products", "produkter")}`;
    }

    list.forEach((product) => {
      const normalizedProduct = {
        ...product,
        id: getProductId(product),
        product_id: getProductId(product),
        title: getProductTitle(product),
        product_name: getProductTitle(product),
        brand: product.brand_name || brand?.name || "",
        image_url: product.image_url || "",
        price: product.price,
        old_price: product.old_price,
        discount: product.discount,
        category: product.category || "",
        subcategory: product.subcategory || "",
        rating: product.rating,
        product_url: product.product_url || "",
        affiliate_url: product.affiliate_url || "",
        sheet_source: product.source || "supabase",
      };

      const card = window.BrandRadarProductCardEngine.createCard(
        normalizedProduct,
        {
          isLuxury: !!brand?.is_luxury,
          showBrand: true,
          showRating: true,
          enableFavorite: true,

          onNavigate: (productData) => {
            const id =
              productData.external_id ||
              productData.original_id ||
              productData.id ||
              productData.product_id;

            if (id) {
              window.location.href =
                `product.html?id=${encodeURIComponent(id)}`;
            }
          },

          favoriteProductFactory: (productData) => ({
            id:
              productData.external_id ||
              productData.original_id ||
              productData.id ||
              productData.product_id,
            title:
              productData.title ||
              productData.product_name ||
              productData.name ||
              t("unnamed_product", "Uten navn"),
            product_name:
              productData.title ||
              productData.product_name ||
              productData.name ||
              t("unnamed_product", "Uten navn"),
            brand: productData.brand || "",
            price: productData.price,
            discount: productData.discount || "",
            image_url: productData.image_url || "",
            product_url:
              productData.product_url ||
              productData.affiliate_url ||
              productData.link ||
              "",
            category: productData.category || "",
            rating: productData.rating,
            luxury: !!brand?.is_luxury,
          }),
        }
      );

      grid.appendChild(card);
    });
  }

  try {
    if (grid) {
      grid.innerHTML = "";
    }

    brand = await loadBrand();

    if (!brand) {
      if (titleEl) titleEl.textContent = brandParam;
      if (descEl) descEl.textContent = "Brandet ble ikke funnet.";
      if (emptyMsg) {
        emptyMsg.style.display = "block";
        emptyMsg.textContent = "Ingen produkter funnet.";
      }
      return;
    }

    brandProducts = await loadBrandProducts(brand);

    // Supabase feed products already contain the correct live imported price.
// Do not enrich with old offers-engine data here, because it can override
// the correct product price with stale/incorrect offer_summary prices.

    renderBrandInfo();
    setupCategoryFilter();
    applyFiltersAndSort();

    favBtn?.addEventListener("click", toggleFavBrand);
    categorySelect?.addEventListener("change", applyFiltersAndSort);
    sortSelect?.addEventListener("change", applyFiltersAndSort);
  } catch (error) {
    console.error("Brand page failed:", error);

    if (emptyMsg) {
      emptyMsg.style.display = "block";
      emptyMsg.textContent = "Kunne ikke laste brandet akkurat nå.";
    }
  }
});
