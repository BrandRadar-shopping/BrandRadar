// ======================================================
// ✅ BrandRadar – Category Page
// Bruker Product Card Engine + Offers Engine
// - støtter category uten gender
// - støtter kidtype for barn
// - korrekt prisfilter + sortering basert på laveste offer-pris
// - mer robust kategori/subkategori-mapping
// - støtter umbrella-kategorier som Gymcorner
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const SHEET_PRODUCTS = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_MAPPING = "1e3tvfatBmnwDVs5nuR-OvSaQl0lIF-JUhuQtfvACo3g";
  const productUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/BrandRadarProdukter`;
  const mappingUrl = `https://opensheet.elk.sh/${SHEET_MAPPING}/CategoryMapping`;

  const titleEl = document.getElementById("category-title");
  const productGrid = document.querySelector(".product-grid");
  const emptyMessage = document.querySelector(".empty-message");
  const breadcrumbEl = document.querySelector(".breadcrumb");

  const brandFilter = document.getElementById("brand-filter");
  const priceFilter = document.getElementById("price-filter");
  const discountFilter = document.getElementById("discount-filter");
  const sortSelect = document.getElementById("sort-select");
  const filterTagsContainer = document.querySelector(".filter-tags");

  const params = new URLSearchParams(window.location.search);
  const genderParam = params.get("gender");
  const categoryParam = params.get("category");
  const subParam = params.get("subcategory");
  const kidtypeParam = params.get("kidtype");

  if (!categoryParam) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMessage.style.display = "block";
    return;
  }

  const normalize = txt =>
    (txt || "")
      .toLowerCase()
      .replace(/æ/g, "a")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/&/g, " ")
      .replace(/\//g, " ")
      .replace(/\bog\b/g, " ")
      .replace(/\band\b/g, " ")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\d]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const CATEGORY_ALIAS_MAP = {
    gymcorner: [
      "gymcorner",
      "supplements",
      "supplement",
      "sportsnutrition",
      "nutrition"
    ],
    shoes: ["shoes", "sko"],
    clothing: ["clothing", "klaer"],
    accessories: ["accessories", "tilbehor"],
    selfcare: ["selfcare", "beauty", "hudpleie", "hygiene"]
  };

  const SUBCATEGORY_ALIAS_MAP = {
    proteinbarer: [
      "proteinbarer",
      "proteinbar",
      "proteinbars",
      "protein-bar",
      "protein-bars",
      "bars",
      "soft-bar",
      "soft-bars"
    ],
    proteinpulver: [
      "proteinpulver",
      "protein-pulver",
      "proteinpowder",
      "protein-powder",
      "whey",
      "whey-protein",
      "isolate"
    ],
    kreatin: [
      "kreatin",
      "creatine"
    ],
    pwo: [
      "pwo",
      "pre-workout",
      "pre-workout",
      "preworkout",
      "pre-workout-pwo"
    ],
    vitaminer-mineraler: [
      "vitaminer-mineraler",
      "vitaminer",
      "mineraler",
      "vitamins",
      "minerals",
      "vitamins-minerals"
    ],
    drikke: [
      "drikke",
      "drink",
      "drinks",
      "beverage",
      "beverages"
    ],
    aminosyrer: [
      "aminosyrer",
      "amino",
      "amino-acids",
      "aminoacids",
      "bcaa",
      "eaa"
    ]
  };

  const categorySlug = normalize(categoryParam);
  let genderSlug = genderParam ? normalize(genderParam) : "";
  if (genderSlug === "herre") genderSlug = "men";
  if (genderSlug === "dame") genderSlug = "women";
  if (genderSlug === "barn") genderSlug = "kids";

  const subSlug = normalize(subParam);
  const kidtypeSlug = normalize(kidtypeParam);

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

  function getAliases(slug, map) {
    return [...new Set([slug, ...(map[slug] || [])])];
  }

  function getProductSearchText(product) {
    return [
      product.category,
      product.main_category,
      product.subcategory,
      product.title,
      product.product_name,
      product.name,
      product.info,
      product.description,
      product.brand
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ");
  }

  function productMatchesCategory(product, targetCategorySlug) {
    const aliases = getAliases(targetCategorySlug, CATEGORY_ALIAS_MAP);
    const pCategory = normalize(product.category);
    const pMainCategory = normalize(product.main_category);
    const text = getProductSearchText(product);

    return aliases.some(alias =>
      pCategory === alias ||
      pMainCategory === alias ||
      text.includes(alias)
    );
  }

  function productMatchesSubcategory(product, targetSubSlug) {
    if (!targetSubSlug) return true;

    const aliases = getAliases(targetSubSlug, SUBCATEGORY_ALIAS_MAP);
    const pSub = normalize(product.subcategory);
    const pCategory = normalize(product.category);
    const text = getProductSearchText(product);

    return aliases.some(alias =>
      pSub === alias ||
      pCategory === alias ||
      text.includes(alias)
    );
  }

  try {
    const [mapRows, products] = await Promise.all([
      fetch(mappingUrl).then(r => r.json()),
      fetch(productUrl).then(r => r.json())
    ]);

    const match = mapRows.find(row => {
      const mainOk = normalize(row.main_category) === categorySlug;
      const genderOk = genderSlug
        ? normalize(row.gender) === genderSlug
        : !row.gender || normalize(row.gender) === "";
      const kidtypeOk = kidtypeSlug
        ? normalize(row.kidtype) === kidtypeSlug
        : true;

      return mainOk && genderOk && kidtypeOk;
    });

    if (!match) {
      titleEl.textContent = "Ugyldig kategori";
      emptyMessage.style.display = "block";
      return;
    }

    const norskGender =
      genderSlug === "men" ? "Herre" :
      genderSlug === "women" ? "Dame" :
      genderSlug === "kids" ? "Barn" : "";

    let subNameNo = null;

    if (subSlug) {
      const subMatch = mapRows.find(row => {
        const mainOk = normalize(row.main_category) === categorySlug;
        const subOk = normalize(row.url_slug) === subSlug;
        const genderOk = genderSlug
          ? normalize(row.gender) === genderSlug
          : !row.gender || normalize(row.gender) === "";
        const kidtypeOk = kidtypeSlug
          ? normalize(row.kidtype) === kidtypeSlug
          : true;

        return mainOk && subOk && genderOk && kidtypeOk;
      });

      if (subMatch) subNameNo = subMatch.display_name;
    }

    if (subNameNo && norskGender) {
      titleEl.textContent = `${subNameNo} – ${norskGender}`;
    } else if (subNameNo) {
      titleEl.textContent = subNameNo;
    } else if (match.display_name && norskGender) {
      titleEl.textContent = `${match.display_name} – ${norskGender}`;
    } else {
      titleEl.textContent = match.display_name || categoryParam;
    }

    document.title = `${titleEl.textContent} | BrandRadar`;

    let breadcrumbHtml = `<a href="index.html">Hjem</a> › `;

    if (norskGender) {
      breadcrumbHtml += `
        <a href="category.html?gender=${encodeURIComponent(genderParam || norskGender)}&category=${encodeURIComponent(categoryParam)}">
          ${norskGender}
        </a> ›
      `;
    } else {
      breadcrumbHtml += `
        <a href="category.html?category=${encodeURIComponent(categoryParam)}">
          ${match.display_name || categoryParam}
        </a> ›
      `;
    }

    breadcrumbHtml += `${subNameNo || match.display_name || categoryParam}`;
    breadcrumbEl.innerHTML = breadcrumbHtml;

    const filteredBase = products.filter(p => {
      const categoryOk = productMatchesCategory(p, categorySlug);
      const subOk = productMatchesSubcategory(p, subSlug);

      let genderOk = true;
      if (genderSlug) {
        const pGender = normalize(p.gender);
        genderOk = pGender === genderSlug || pGender === "unisex" || pGender === "";
      }

      return categoryOk && subOk && genderOk;
    });

    const filtered = window.BrandRadarOffersEngine
      ? await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(filteredBase)
      : filteredBase;

    if (!filtered.length) {
      emptyMessage.style.display = "block";
      return;
    }

    emptyMessage.style.display = "none";

    [...new Set(filtered.map(p => p.brand).filter(Boolean))]
      .sort()
      .forEach(b => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        brandFilter.appendChild(opt);
      });

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

    brandFilter.addEventListener("change", applyFiltersAndSort);
    priceFilter.addEventListener("change", applyFiltersAndSort);
    discountFilter.addEventListener("change", applyFiltersAndSort);
    sortSelect.addEventListener("change", applyFiltersAndSort);

    applyFiltersAndSort();

    setTimeout(() => {
      if (typeof updateFavoriteCounter === "function") {
        updateFavoriteCounter();
      }
    }, 50);
  } catch (err) {
    console.error("❌ Category error:", err);
  }
});
