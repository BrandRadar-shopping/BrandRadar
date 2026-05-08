// search.js — BrandRadar global search / mobile search page
(function () {
  const DEBUG = true;

  const MASTER_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const MASTER_TAB = "BrandRadarProdukter";

  const BRANDS_SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
  const BRANDS_TAB = "Ark 1";

  const MAX_RESULTS = 8;
  const nb = new Intl.NumberFormat("nb-NO");

  function log(...args) {
    if (DEBUG) console.log(...args);
  }

  function warn(...args) {
    console.warn(...args);
  }

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseNum(v) {
    if (v == null || v === "") return null;
    const n = Number(
      String(v)
        .replace(/\s/g, "")
        .replace(/[^\d.,\-]/g, "")
        .replace(",", ".")
    );
    return Number.isFinite(n) ? n : null;
  }

  function formatPrice(n) {
    if (n == null) return "";
    return `${nb.format(Math.round(n))} kr`;
  }

  function resolveId(p) {
    if (typeof window.resolveProductId === "function") {
      const id = window.resolveProductId(p);
      if (id) return String(id).trim();
    }

    return String(
      p.id ||
      p.product_id ||
      p.item_id ||
      p.sku ||
      ""
    ).trim();
  }

  function getTitle(p) {
    return p.title || p.product_name || p.name || p.product || "";
  }

  function getImage(p) {
    return p.image_url || p.image || p.img || p.thumbnail || "";
  }

  function priceInfo(p) {
    const offerLowest = p?.offer_summary?.hasOffers
      ? parseNum(p.offer_summary.lowestPrice)
      : null;

    const offerOld = p?.offer_summary?.hasOffers
      ? parseNum(p.offer_summary.highestOldPrice || p.offer_summary.oldPrice)
      : null;

    const price = offerLowest ?? parseNum(p.price);
    const oldPrice = offerOld ?? parseNum(p.old_price) ?? parseNum(p.oldPrice);
    const discount = parseNum(p.discount);

    let computedOld = oldPrice;
    let computedNew = price;

    if (computedNew != null && computedOld == null && discount != null && discount > 0) {
      computedOld = Math.round(computedNew / (1 - discount / 100));
    }

    let pct = null;

    if (computedOld != null && computedNew != null && computedOld > computedNew) {
      pct = Math.round(((computedOld - computedNew) / computedOld) * 100);
    } else if (discount != null && discount > 0) {
      pct = Math.round(discount > 1 ? discount : discount * 100);
    }

    return { newP: computedNew, oldP: computedOld, pct };
  }

  function scoreMatch(product, q) {
    const title = norm(getTitle(product));
    const brand = norm(product.brand);
    const category = norm(product.category);
    const subcategory = norm(product.subcategory);
    const tags = norm(product.tags || product.tag);

    let score = 0;

    if (title.startsWith(q)) score += 18;
    if (brand.startsWith(q)) score += 14;
    if (title.includes(q)) score += 9;
    if (brand.includes(q)) score += 7;
    if (category.includes(q)) score += 4;
    if (subcategory.includes(q)) score += 4;
    if (tags.includes(q)) score += 3;

    return score;
  }

  async function fetchJson(sheetId, tab) {
    const url = `https://opensheet.elk.sh/${sheetId}/${encodeURIComponent(tab)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} (${tab})`);
    return res.json();
  }

  function boot() {
    const root = document.getElementById("site-search");
    const input = document.getElementById("search-input");
    const dropdown = document.getElementById("search-dropdown");
    const prodWrap = document.getElementById("search-results-products");
    const brandWrap = document.getElementById("search-results-brands");
    const clearBtn = root ? root.querySelector(".search-clear") : null;

    const missing = [];
    if (!root) missing.push("#site-search");
    if (!input) missing.push("#search-input");
    if (!dropdown) missing.push("#search-dropdown");
    if (!prodWrap) missing.push("#search-results-products");
    if (!brandWrap) missing.push("#search-results-brands");

    if (missing.length) {
      warn("🔎 Search init blocked. Missing:", missing);
      return false;
    }

    initSearch({ root, input, dropdown, prodWrap, brandWrap, clearBtn });
    return true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    log("✅ search.js loaded");

    if (boot()) return;

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (boot() || tries > 30) clearInterval(timer);
    }, 100);
  });

  function initSearch({ root, input, dropdown, prodWrap, brandWrap, clearBtn }) {
    if (root.dataset.searchReady === "true") return;
    root.dataset.searchReady = "true";

    const isSearchPage = document.body.classList.contains("is-search-page");

    let products = [];
    let brands = [];
    let flatItems = [];
    let activeIndex = -1;
    let dataLoaded = false;

    function openDropdown() {
      dropdown.hidden = false;
      dropdown.style.zIndex = "99999";
    }

    function closeDropdown() {
      dropdown.hidden = true;
      activeIndex = -1;
      syncActive();
    }

    function setHasValue() {
      root.classList.toggle("has-value", !!input.value.trim());
    }

    function renderEmpty(el, msg) {
      el.innerHTML = `<div class="search-empty">${escapeHtml(msg)}</div>`;
    }

    function syncActive() {
      flatItems.forEach((el, i) => {
        el.classList.toggle("active", i === activeIndex);
      });
    }

    function clickActive() {
      const el = flatItems[activeIndex];
      if (el) el.click();
    }

    function render() {
      prodWrap.innerHTML = "";
      brandWrap.innerHTML = "";

      const q = norm(input.value);

      if (!dataLoaded) {
        renderEmpty(prodWrap, "Laster søk…");
        renderEmpty(brandWrap, "");
        flatItems = [];
        activeIndex = -1;
        return;
      }

      if (!q) {
        renderEmpty(prodWrap, "Skriv for å søke…");
        renderEmpty(brandWrap, "");
        flatItems = [];
        activeIndex = -1;
        return;
      }

      const prodMatches = products
        .map((p) => ({
          type: "product",
          id: resolveId(p),
          title: getTitle(p),
          brand: p.brand || "",
          image: getImage(p),
          raw: p,
          score: scoreMatch(p, q)
        }))
        .filter((x) => x.id && x.title && x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RESULTS);

      const brandMatches = brands
        .map((b) => ({
          type: "brand",
          brand: String(b.brand || b.name || "").trim(),
          logo: b.logo || b.logo_url || "",
          description: String(b.description || "").trim()
        }))
        .filter((x) => x.brand && norm(x.brand).includes(q))
        .slice(0, MAX_RESULTS);

      if (!prodMatches.length) renderEmpty(prodWrap, "Ingen produkter funnet.");
      if (!brandMatches.length) renderEmpty(brandWrap, "Ingen brands funnet.");

      prodMatches.forEach((p) => {
        const { newP, oldP, pct } = priceInfo(p.raw);

        const priceLine =
          newP != null
            ? `
              <div class="search-price">
                <span class="sp-new">${formatPrice(newP)}</span>
                ${oldP != null && oldP > newP ? `<span class="sp-old">${formatPrice(oldP)}</span>` : ""}
                ${pct ? `<span class="sp-pill">-${pct}%</span>` : ""}
              </div>
            `
            : "";

        const el = document.createElement("button");
        el.type = "button";
        el.className = "search-item";
        el.dataset.type = "product";
        el.dataset.id = p.id;

        el.innerHTML = `
          <span class="search-thumb">
            ${p.image ? `<img src="${escapeHtml(p.image)}" alt="">` : "🛍️"}
          </span>
          <span class="search-meta">
            <span class="search-title">${escapeHtml(p.title)}</span>
            <span class="search-sub">${escapeHtml(p.brand)}</span>
            ${priceLine}
          </span>
        `;

        el.addEventListener("click", () => {
          window.location.href = `product.html?id=${encodeURIComponent(p.id)}`;
        });

        prodWrap.appendChild(el);
      });

      brandMatches.forEach((b) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "search-item";
        el.dataset.type = "brand";
        el.dataset.brand = b.brand;

        el.innerHTML = `
          <span class="search-thumb">
            ${b.logo ? `<img src="${escapeHtml(b.logo)}" alt="">` : "🏷️"}
          </span>
          <span class="search-meta">
            <span class="search-title">${escapeHtml(b.brand)}</span>
            <span class="search-sub">${escapeHtml(b.description || "Åpne brand")}</span>
          </span>
        `;

        el.addEventListener("click", () => {
          window.location.href = `brand-page.html?brand=${encodeURIComponent(b.brand)}`;
        });

        brandWrap.appendChild(el);
      });

      flatItems = Array.from(dropdown.querySelectorAll(".search-item"));
      activeIndex = flatItems.length ? 0 : -1;
      syncActive();
    }

    let debounceTimer = null;

    function debouncedRender() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, 100);
    }

    async function loadData() {
      try {
        const [masterRows, brandRows] = await Promise.all([
          fetchJson(MASTER_SHEET_ID, MASTER_TAB),
          fetchJson(BRANDS_SHEET_ID, BRANDS_TAB).catch(() => [])
        ]);

        products = Array.isArray(masterRows) ? masterRows : [];

        if (window.BrandRadarOffersEngine) {
          products = await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(products);
        }

        brands = Array.isArray(brandRows) ? brandRows : [];

        if (!brands.length) {
          const seen = new Set();
          brands = products
            .map((p) => String(p.brand || "").trim())
            .filter(Boolean)
            .filter((brand) => {
              const key = norm(brand);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .map((brand) => ({ brand, description: "" }));
        }

        dataLoaded = true;

        log("🔎 Search data loaded:", {
          products: products.length,
          brands: brands.length
        });

        render();
      } catch (err) {
        warn("🔎 Search data load failed:", err);
        dataLoaded = true;
        products = [];
        brands = [];
        renderEmpty(prodWrap, "Kunne ikke laste søk akkurat nå.");
        renderEmpty(brandWrap, "");
      }
    }

    input.addEventListener("focus", () => {
      openDropdown();
      render();
    });

    input.addEventListener("input", () => {
      setHasValue();
      openDropdown();
      debouncedRender();
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        setHasValue();
        openDropdown();
        render();
        input.focus({ preventScroll: true });
      });
    }

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

      if (e.key === "Enter") {
        if (!flatItems.length) render();

        if (activeIndex < 0 && flatItems.length) {
          activeIndex = 0;
        }

        if (activeIndex >= 0) {
          e.preventDefault();
          clickActive();
        }

        return;
      }

      if (!flatItems.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, flatItems.length - 1);
        syncActive();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        syncActive();
      }
    });

    setHasValue();
    render();
    loadData();

    if (isSearchPage) {
      closeDropdown();

      setTimeout(() => {
        input.blur();
      }, 100);
    }
  }
})();
