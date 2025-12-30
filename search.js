// search.js — global site search (autosuggest + keyboard + price)
(function () {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(async function initSearch() {
    const root = document.getElementById("site-search");
    const input = document.getElementById("search-input");
    const dropdown = document.getElementById("search-dropdown");
    const clearBtn = root ? root.querySelector(".search-clear") : null;

    const prodWrap = document.getElementById("search-results-products");
    const brandWrap = document.getElementById("search-results-brands");

    // Hvis noe mangler: ikke krasj, men logg så du ser det i console
    if (!root || !input || !dropdown || !clearBtn || !prodWrap || !brandWrap) {
      console.warn("🔎 Search init failed: mangler elementer/ID-er i header.");
      return;
    }

    // ---- Sources
    const MASTER_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
    const MASTER_TAB = "BrandRadarProdukter";

    const BRANDS_SHEET_ID = "1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw";
    const BRANDS_TAB = "Ark 1";

    const MAX_RESULTS = 7;
    const nb = new Intl.NumberFormat("nb-NO");

    let products = [];
    let brands = [];
    let flatItems = [];
    let activeIndex = -1;

    const fetchJson = async (sheetId, tab) => {
      const url = `https://opensheet.elk.sh/${sheetId}/${encodeURIComponent(tab)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return res.json();
    };

    const norm = (s) =>
      String(s || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    function parseNum(v) {
      if (v == null || v === "") return null;
      const n = Number(String(v).replace(/\s/g, "").replace(/[^\d.,\-]/g, "").replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }

    function priceInfo(p) {
      const price = parseNum(p.price);
      const oldPrice = parseNum(p.old_price) ?? parseNum(p.oldPrice);
      const discount = parseNum(p.discount);

      // Hvis discount finnes men old_price ikke gjør det:
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

    function formatPrice(n) {
      if (n == null) return "";
      return `${nb.format(Math.round(n))} kr`;
    }

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

    function resolveId(p) {
      if (typeof window.resolveProductId === "function") return window.resolveProductId(p);
      return String(p.id || "").trim();
    }

    function scoreMatch(title, brand, q) {
      // enkel scoring: startsWith vinner over includes
      const t = norm(title);
      const b = norm(brand);
      let s = 0;
      if (t.startsWith(q)) s += 10;
      if (b.startsWith(q)) s += 8;
      if (t.includes(q)) s += 4;
      if (b.includes(q)) s += 3;
      return s;
    }

    function syncActive() {
      flatItems.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
    }

    function clickActive() {
      const el = flatItems[activeIndex];
      if (el) el.click();
    }

    function render() {
      prodWrap.innerHTML = "";
      brandWrap.innerHTML = "";

      const qRaw = input.value;
      const q = norm(qRaw);

      if (!q) {
        renderEmpty(prodWrap, "Skriv for å søke…");
        renderEmpty(brandWrap, " ");
        flatItems = [];
        activeIndex = -1;
        syncActive();
        return;
      }

      // Products
      const prodMatches = products
        .map((p) => {
          const title = p.title || p.product_name || p.name || "";
          const brand = p.brand || "";
          return {
            type: "product",
            id: resolveId(p),
            title,
            brand,
            image: p.image_url || "",
            raw: p,
            score: scoreMatch(title, brand, q),
          };
        })
        .filter((x) => x.id && x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RESULTS);

      // Brands
      const brandMatches = brands
        .map((b) => ({
          type: "brand",
          brand: (b.brand || b.name || "").trim(),
          logo: b.logo || b.logo_url || "",
          description: (b.description || "").trim(),
        }))
        .filter((x) => x.brand && norm(x.brand).includes(q))
        .slice(0, MAX_RESULTS);

      if (!prodMatches.length) renderEmpty(prodWrap, "Ingen produkter funnet.");
      if (!brandMatches.length) renderEmpty(brandWrap, "Ingen brands funnet.");

      prodMatches.forEach((p) => {
        const { newP, oldP, pct } = priceInfo(p.raw);

        const priceLine = newP != null
          ? `<div class="search-price">
              <span class="sp-new">${formatPrice(newP)}</span>
              ${oldP != null && oldP > newP ? `<span class="sp-old">${formatPrice(oldP)}</span>` : ""}
              ${pct ? `<span class="sp-pill">-${pct}%</span>` : ""}
            </div>`
          : "";

        const el = document.createElement("div");
        el.className = "search-item";
        el.dataset.type = "product";
        el.dataset.id = p.id;

        el.innerHTML = `
          <div class="search-thumb">${p.image ? `<img src="${p.image}" alt="">` : "🛍️"}</div>
          <div class="search-meta">
            <p class="search-title">${p.title}</p>
            <p class="search-sub">${p.brand || ""}</p>
            ${priceLine}
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

      flatItems = Array.from(dropdown.querySelectorAll(".search-item"));
      activeIndex = flatItems.length ? 0 : -1; // auto highlight første
      syncActive();
    }

    // Debounce
    let t = null;
    function debouncedRender() {
      clearTimeout(t);
      t = setTimeout(render, 120);
    }

    // Load data once
    try {
      const [master, brandRows] = await Promise.all([
        fetchJson(MASTER_SHEET_ID, MASTER_TAB),
        fetchJson(BRANDS_SHEET_ID, BRANDS_TAB).catch(() => []),
      ]);

      products = Array.isArray(master) ? master : [];
      brands = Array.isArray(brandRows) ? brandRows : [];

      // Fallback brands fra products hvis brands-sheet tom
      if (!brands.length) {
        const set = new Set();
        brands = products
          .map((p) => String(p.brand || "").trim())
          .filter(Boolean)
          .filter((b) => (set.has(b) ? false : (set.add(b), true)))
          .map((b) => ({ brand: b, description: "" }));
      }
    } catch (e) {
      console.warn("🔎 Search data load failed:", e);
    }

    // Initial UI
    render();

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

      if (e.key === "Enter") {
        // Enter åpner aktivt element – hvis ingen aktiv: render og åpne første
        if (!flatItems.length) {
          render();
        }
        if (activeIndex < 0 && flatItems.length) activeIndex = 0;
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
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        syncActive();
      }
    });
  });
})();

