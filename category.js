// ======================================================
// ✅ BrandRadar – Category Page
// Bruker Product Card Engine + Offers Engine
// - Fra X kr
// - Y butikker
// - korrekt prisfilter + sortering basert på laveste offer-pris
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Google Sheets config
  const SHEET_PRODUCTS = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_MAPPING = "1e3tvfatBmnwDVs5nuR-OvSaQl0lIF-JUhuQtfvACo3g";
  const productUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/BrandRadarProdukter`;
  const mappingUrl = `https://opensheet.elk.sh/${SHEET_MAPPING}/CategoryMapping`;

  // ✅ DOM Elements
  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");
  const breadcrumbEl = document.querySelector(".breadcrumb");

  const brandFilter = document.getElementById("brand-filter");
  const priceFilter = document.getElementById("price-filter");
  const discountFilter = document.getElementById("discount-filter");
  const sortSelect = document.getElementById("sort-select");
  const filterTagsContainer = document.querySelector(".filter-tags");

  // ✅ URL Params
  const params = new URLSearchParams(window.location.search);
  const genderParam = params.get("gender");
  const categoryParam = params.get("category");
  const subParam = params.get("subcategory");

  if (!genderParam || !categoryParam) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  // ✅ Slug Normalization
  const normalize = txt =>
    (txt || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "and")
      .replace(/[^\w\d]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const categorySlug = normalize(categoryParam);
  let genderSlug = normalize(genderParam);
  if (genderSlug === "herre") genderSlug = "men";
  if (genderSlug === "dame") genderSlug = "women";
  if (genderSlug === "barn") genderSlug = "kids";
  const subSlug = normalize(subParam);

  // ======================================================
  // ✅ PRICE / SORT HELPERS
  // ======================================================

  function parseNumber(val) {
    if (val == null) return null;
    const s = String(val)
      .replace(/\s/g, "")
      .replace(/[^\d,.\-]/g, "")
      .replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function cleanRating(v) {
    return parseFloat(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
  }

  function getFallbackPrice(product) {
    let price = parseNumber(product.price);
    let oldPrice = parseNumber(product.old_price);
    let discount = parseNumber(product.discount);

    if (!price && oldPrice && discount) price = oldPrice * (1 - discount / 100);
    if (price && !oldPrice && discount) oldPrice = price / (1 - discount / 100);
    if (price && oldPrice && !discount && oldPrice > price) {
      discount = ((oldPrice - price) / oldPrice) * 100;
    }

    return price ?? 0;
  }

  function getEffectivePrice(product) {
    if (product?.offer_summary?.hasOffers && product.offer_summary.lowestPrice != null) {
      return Number(product.offer_summary.lowestPrice);
    }
    return getFallbackPrice(product);
  }

  function hasDiscountFallback(product) {
    const price = parseNumber(product.price);
    const oldPrice = parseNumber(product.old_price);
    const discount = parseNumber(product.discount);

    if (discount && discount > 0) return true;
    if (price && oldPrice && oldPrice > price) return true;

    return false;
  }

  try {
    // ✅ Fetch data
    const [mapRows, products] = await Promise.all([
      fetch(mappingUrl).then(r => r.json()),
      fetch(productUrl).then(r => r.json())
    ]);

    // ✅ Mapping match
    const match = mapRows.find(row =>
      normalize(row.main_category) === categorySlug &&
      (!row.gender || normalize(row.gender) === genderSlug)
    );

    if (!match) {
      emptyMessage.style.display = "block";
      return;
    }

    const norskGender =
      genderSlug === "men" ? "Herre" :
      genderSlug === "women" ? "Dame" :
      genderSlug === "kids" ? "Barn" : genderParam;

    let subNameNo = null;
    if (subSlug) {
      const subMatch = mapRows.find(row =>
        normalize(row.url_slug) === subSlug &&
        normalize(row.main_category) === categorySlug
      );
      if (subMatch) subNameNo = subMatch.display_name;
    }

    // ✅ Update title + breadcrumb
    titleEl.textContent = subNameNo
      ? `${subNameNo} – ${norskGender}`
      : `${match.display_name} – ${norskGender}`;

    document.title = `${titleEl.textContent} | BrandRadar`;

    breadcrumbEl.innerHTML = `
      <a href="index.html">Hjem</a> ›
      <a href="category.html?gender=${genderParam}&category=${categoryParam}">
        ${norskGender}
      </a> ›
      ${subNameNo || match.display_name}
    `;

    // ✅ Base filtered products
    const filteredBase = products.filter(p => {
      const pGender = normalize(p.gender);
      return (
        normalize(p.category) === categorySlug &&
        (!subSlug || normalize(p.subcategory) === subSlug) &&
        (pGender === genderSlug || pGender === "unisex" || pGender === "")
      );
    });

    const filtered = window.BrandRadarOffersEngine
      ? await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(filteredBase)
      : filteredBase;

    if (!filtered.length) {
      emptyMessage.style.display = "block";
      return;
    }

    emptyMessage.style.display = "none";

    // ✅ Populate Brand dropdown
    [...new Set(filtered.map(p => p.brand).filter(Boolean))]
      .sort()
      .forEach(b => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        brandFilter.appendChild(opt);
      });

    // ======================================================
    // ✅ Render products – via Product Card Engine
    // ======================================================
    function renderProducts(list) {
      productGrid.innerHTML = "";

      list.forEach(product => {
        const pid = typeof resolveProductId === "function"
          ? resolveProductId(product)
          : (product.id || product.product_id || "");

        const card = window.BrandRadarProductCardEngine.createCard(product, {
          isLuxury: false,
          showBrand: true,
          showRating: true,
          enableFavorite: true,
          onNavigate: (p) => {
            const id = typeof resolveProductId === "function"
              ? resolveProductId(p)
              : (p.id || p.product_id || "");
            if (id) {
              window.location.href = `product.html?id=${encodeURIComponent(id)}`;
            }
          },
          favoriteProductFactory: (p) => ({
            id: pid,
            product_name: p.title || p.product_name || p.name || "Uten navn",
            title: p.title || p.product_name || p.name || "Uten navn",
            brand: p.brand || "",
            price: p.price,
            discount: p.discount,
            image_url: p.image_url,
            product_url: p.product_url,
            category: p.category || p.main_category || "",
            rating: p.rating,
            luxury: false
          })
        });

        productGrid.appendChild(card);
      });

      const resultEl = document.querySelector(".filter-bar .result-count");
      if (resultEl) resultEl.textContent = `${list.length} produkter`;
    }

    // ✅ Create filter tags dynamically
    function updateFilterTags() {
      filterTagsContainer.innerHTML = "";
      const tags = [];

      if (brandFilter.value !== "all") {
        tags.push({
          label: brandFilter.value,
          remove: () => {
            brandFilter.value = "all";
            applyFiltersAndSort();
          }
        });
      }

      if (priceFilter.value !== "all") {
        tags.push({
          label: `Pris: ${priceFilter.options[priceFilter.selectedIndex].text}`,
          remove: () => {
            priceFilter.value = "all";
            applyFiltersAndSort();
          }
        });
      }

      if (discountFilter.checked) {
        tags.push({
          label: "Kun tilbud",
          remove: () => {
            discountFilter.checked = false;
            applyFiltersAndSort();
          }
        });
      }

      filterTagsContainer.classList.toggle("hidden", tags.length === 0);

      tags.forEach(tag => {
        const el = document.createElement("div");
        el.classList.add("filter-tag");
        el.innerHTML = `${tag.label} <span class="close-tag">×</span>`;
        el.addEventListener("click", tag.remove);
        filterTagsContainer.appendChild(el);
      });
    }

    // ✅ Filters & sorting combined
    function applyFiltersAndSort() {
      let result = [...filtered];

      if (brandFilter.value !== "all") {
        result = result.filter(p => p.brand === brandFilter.value);
      }

      if (priceFilter.value !== "all") {
        if (priceFilter.value === "1000+") {
          result = result.filter(p => getEffectivePrice(p) >= 1000);
        } else {
          const [min, max] = priceFilter.value.split("-").map(Number);
          result = result.filter(p => {
            const price = getEffectivePrice(p);
            return price >= min && price <= max;
          });
        }
      }

      if (discountFilter.checked) {
        result = result.filter(p => {
          if (p.offer_summary?.hasOffers) return true;
          return hasDiscountFallback(p);
        });
      }

      switch (sortSelect.value) {
        case "price-asc":
          result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
          break;
        case "price-desc":
          result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
          break;
        case "rating-desc":
          result.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
          break;
      }

      renderProducts(result);
      updateFilterTags();
    }

    // ✅ Hook up change events
    brandFilter.addEventListener("change", applyFiltersAndSort);
    priceFilter.addEventListener("change", applyFiltersAndSort);
    discountFilter.addEventListener("change", applyFiltersAndSort);
    sortSelect.addEventListener("change", applyFiltersAndSort);

    // ✅ First render
    applyFiltersAndSort();

    // ✅ Oppdater global teller etter render
    setTimeout(() => {
      if (typeof updateFavoriteCounter === "function") {
        updateFavoriteCounter();
      }
    }, 50);

  } catch (err) {
    console.error("❌ Category error:", err);
  }
});
