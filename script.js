document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js loaded");

  initMobileDrawer();
  initMobileBrowseMenu();

  if (window.innerWidth <= 768) {
    console.log("📱 Mobile detected — skipping desktop mega-menu init");
    return;
  }

  const menuContainer = document.querySelector("nav.mega-menu");
  if (!menuContainer) {
    console.warn("⚠️ nav.mega-menu ikke funnet (ok på sider uten mega-menu)");
    return;
  }

  fetch("mega-menu.html")
    .then((response) => {
      if (!response.ok) throw new Error("❌ Failed to load mega-menu.html: " + response.status);
      return response.text();
    })
    .then((html) => {
      menuContainer.innerHTML = html;
      console.log("✅ Mega-menu loaded into DOM");
      initDesktopMegaMenuHover();
      initDesktopMegaMenuRoutingSlugs();
    })
    .catch((err) => console.error(err));
});

/* =========================================================
   Felles slugify – matcher CategoryMapping bedre
   ========================================================= */
function slugifyBrandRadar(txt) {
  return (txt || "")
    .toLowerCase()
    .replace(/æ/g, "a")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/&/g, " ")
    .replace(/\//g, " ")
    .replace(/\bog\b/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/[^\w\d]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

function mapHeadingToGender(headerText) {
  const lower = String(headerText || "").trim().toLowerCase();
  if (lower === "herre") return "Men";
  if (lower === "dame") return "Women";
  if (lower === "barn") return "Kids";
  return null;
}

function getKidtypeFromLink(link, genderSlug) {
  if (genderSlug !== "Kids") return null;

  const ul = link.closest("ul");
  if (!ul) return null;

  let prev = ul.previousElementSibling;
  while (prev) {
    if (prev.classList && prev.classList.contains("menu-subtitle")) {
      const txt = prev.textContent.trim();
      if (txt === "Jente" || txt === "Gutt") return txt;
      return null;
    }
    prev = prev.previousElementSibling;
  }

  return null;
}

/* =========================================================
   DESKTOP: Mega-menu hover/click (category-bar -> panels)
   ========================================================= */
function initDesktopMegaMenuHover() {
  const barItems = document.querySelectorAll(".category-bar .category-item");
  const panels = document.querySelectorAll("nav.mega-menu .menu-panel");
  const navWrap = document.querySelector("nav.mega-menu");

  if (!barItems.length || !panels.length || !navWrap) {
    console.warn("⚠️ Desktop mega-menu: triggers/panels not found");
    return;
  }

  const hideAll = () => panels.forEach((p) => (p.style.display = "none"));

  const showPanel = (key) => {
    hideAll();
    const id = String(key || "").toLowerCase();
    const panel = document.getElementById(id);
    if (panel) panel.style.display = "flex";
  };

  barItems.forEach((li) => {
    li.addEventListener("mouseenter", () => showPanel(li.dataset.category));
    li.addEventListener("click", () => showPanel(li.dataset.category));
  });

  navWrap.addEventListener("mouseleave", hideAll);

  document.addEventListener("click", (e) => {
    if (!navWrap.contains(e.target) && !e.target.closest(".category-bar")) hideAll();
  });

  console.log("✅ Desktop mega-menu hover ready");
}

/* =========================================================
   DESKTOP: Routing for mega-menu links
   - Kategorier -> category.html
   - Toppmerker -> brand-page.html
   ========================================================= */
function initDesktopMegaMenuRoutingSlugs() {
  document.querySelectorAll("nav.mega-menu .menu-panel").forEach((panel) => {
    const panelId = panel.id;
    const categorySlug = slugifyBrandRadar(panelId);

    panel.querySelectorAll("li a").forEach((link) => {
      const text = link.textContent.trim();
      const textSlug = slugifyBrandRadar(text);

      const section = link.closest(".menu-section");
      const headerText = section?.querySelector("h4")?.textContent.trim() || "";
      const genderSlug = mapHeadingToGender(headerText);
      const isBrandLink = section?.classList.contains("brands");
      const kidtype = getKidtypeFromLink(link, genderSlug);

      if (isBrandLink) {
        link.href = `brand-page.html?brand=${encodeURIComponent(text)}`;
        return;
      }

      let url = `category.html?category=${encodeURIComponent(categorySlug)}`;

      if (genderSlug) {
        url += `&gender=${encodeURIComponent(genderSlug)}`;
      }

      if (kidtype) {
        url += `&kidtype=${encodeURIComponent(kidtype)}`;
      }

      if (textSlug && textSlug !== categorySlug) {
        url += `&subcategory=${encodeURIComponent(textSlug)}`;
      }

      link.href = url;
    });
  });

  console.log("✅ Desktop mega-menu routing fixed");
}

/* =========================
   MOBILE DRAWER
   ========================= */
function initMobileDrawer() {
  const btn = document.querySelector(".mobile-menu-btn");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileOverlay");
  const closeBtn = drawer ? drawer.querySelector(".mobile-drawer-close") : null;

  if (!drawer || !overlay) return;

  function openMenu(cat = null) {
    drawer.hidden = false;
    overlay.hidden = false;

    // Force reflow before animation classes
    drawer.offsetHeight;

    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.classList.add("is-locked");

    if (btn) btn.setAttribute("aria-expanded", "true");

    // Category set AFTER drawer is open, so the browse menu
    // always receives the state in a stable phase.
    if (cat) {
      requestAnimationFrame(() => {
        document.dispatchEvent(
          new CustomEvent("brandradar:drawer:set-category", {
            detail: { cat }
          })
        );
      });
    }
  }

  function closeMenu() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("is-locked");

    if (btn) btn.setAttribute("aria-expanded", "false");

    setTimeout(() => {
      drawer.hidden = true;
      overlay.hidden = true;
    }, 220);
  }

  window.BrandRadarDrawerAPI = {
    open: (cat = null) => openMenu(cat),
    close: closeMenu
  };

  if (btn) {
    btn.addEventListener("click", () => {
      drawer.classList.contains("is-open") ? closeMenu() : openMenu();
    });
  }

  overlay.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeMenu();
  });

  drawer.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && drawer.classList.contains("is-open")) closeMenu();
  });
}

/* =========================
   MOBILE BROWSE MENU
   3 nivåer:
   1) Kategori
   2) Gruppe/segment
   3) Underkategorier
   ========================= */
function initMobileBrowseMenu() {
  const drawer = document.getElementById("mobileDrawer");
  if (!drawer) return;

  const topcatButtons = drawer.querySelectorAll(".m-chip[data-cat]");
  const levelTwoWrap = document.getElementById("mDrawerLevelTwo");
  const subcatGrid = document.getElementById("mSubcatGrid");
  const brandRow = document.getElementById("mBrandRow");
  const resultsWrap = document.getElementById("mDrawerResults");
  const brandsWrap = document.getElementById("mBrandsWrap");
  const titleEl = document.getElementById("mobileDrawerTitle");
  const subcatTitleEl = document.getElementById("mSubcatTitle");
  const backBtn = drawer.querySelector(".mobile-drawer-back");

  if (!topcatButtons.length || !levelTwoWrap || !subcatGrid || !brandRow || !resultsWrap || !brandsWrap || !titleEl || !subcatTitleEl || !backBtn) {
    return;
  }

  let megaDoc = null;
  let currentCat = "clothing";
  let currentGroupIndex = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCatLabel(cat) {
    const btn = [...topcatButtons].find((b) => b.dataset.cat === cat);
    return btn ? btn.textContent.trim() : cat;
  }

  function setActiveTopcat(cat) {
    topcatButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.cat === cat);
    });
  }

  function rowHTML(label, href) {
    return `
      <a class="m-row" href="${href}">
        <span class="m-row-label">${escapeHtml(label)}</span>
        <span class="m-row-arrow" aria-hidden="true">›</span>
      </a>
    `;
  }

  function levelButtonHTML(label, index, isActive, tabsMode) {
    return `
      <button
        class="m-level-btn ${isActive ? "is-active" : ""}"
        type="button"
        data-group-index="${index}"
        aria-pressed="${isActive ? "true" : "false"}"
      >
        <span class="m-level-btn-label">${escapeHtml(label)}</span>
        <span class="m-level-btn-arrow" aria-hidden="true">${tabsMode ? "" : "›"}</span>
      </button>
    `;
  }

  function getPrimarySection(block) {
    const nonBrand = block.querySelector(".menu-section:not(.brands)");
    return nonBrand || block.querySelector(".menu-section");
  }

  function collectGroups(panel) {
    return [...panel.querySelectorAll(".menu-block")]
      .map((block, index) => {
        const section = getPrimarySection(block);
        const label = section?.querySelector("h4")?.textContent.trim() || `Valg ${index + 1}`;
        return { index, label, block };
      })
      .filter((g) => g.label);
  }

  function collectSubLinks(group) {
    const section = getPrimarySection(group.block);
    if (!section) return [];

    const links = [...section.querySelectorAll("ul li a")];
    const genderSlug = mapHeadingToGender(group.label);

    const seen = new Set();
    const unique = [];

    for (const a of links) {
      const label = a.textContent.trim();
      if (!label) continue;

      const kidtype = getKidtypeFromLink(a, genderSlug);
      const key = `${label}__${kidtype || ""}`;

      if (seen.has(key)) continue;
      seen.add(key);

      unique.push({ label, kidtype });
    }

    return unique;
  }

  function collectBrandLinks(group) {
    return [...group.block.querySelectorAll(".menu-section.brands ul li a")]
      .map((a) => a.textContent.trim())
      .filter(Boolean)
      .filter((brand, i, arr) => arr.indexOf(brand) === i);
  }

  function buildCategoryHref(cat, groupLabel, label, kidtype) {
    let href = `category.html?category=${encodeURIComponent(cat)}`;

    const genderSlug = mapHeadingToGender(groupLabel);
    if (genderSlug) {
      href += `&gender=${encodeURIComponent(genderSlug)}`;
    }

    if (kidtype) {
      href += `&kidtype=${encodeURIComponent(kidtype)}`;
    }

    href += `&subcategory=${encodeURIComponent(slugifyBrandRadar(label))}`;
    return href;
  }

  function renderLevelTwo(groups) {
    const tabsMode = currentGroupIndex !== null;

    levelTwoWrap.classList.remove("is-pickers", "is-tabs");
    levelTwoWrap.classList.add(tabsMode ? "is-tabs" : "is-pickers");

    levelTwoWrap.innerHTML = groups
      .map((group, index) =>
        levelButtonHTML(group.label, index, index === currentGroupIndex, tabsMode)
      )
      .join("");
  }

  function render() {
    if (!megaDoc) return;

    const panel = megaDoc.querySelector(`.menu-panel#${currentCat}`);
    if (!panel) return;

    const groups = collectGroups(panel);
    if (!groups.length) return;

    if (currentGroupIndex != null && currentGroupIndex >= groups.length) {
      currentGroupIndex = null;
    }

    setActiveTopcat(currentCat);
    renderLevelTwo(groups);

    if (currentGroupIndex === null) {
      titleEl.textContent = getCatLabel(currentCat);
      backBtn.classList.remove("is-visible");
      resultsWrap.hidden = true;
      subcatGrid.innerHTML = "";
      brandRow.innerHTML = "";
      brandsWrap.hidden = true;
      return;
    }

    const group = groups[currentGroupIndex];
    const subcats = collectSubLinks(group);
    const brands = collectBrandLinks(group);

    titleEl.textContent = `${getCatLabel(currentCat)} · ${group.label}`;
    backBtn.classList.add("is-visible");
    subcatTitleEl.textContent = group.label;
    resultsWrap.hidden = false;

    subcatGrid.innerHTML = subcats.length
      ? subcats
          .map(({ label, kidtype }) => {
            const href = buildCategoryHref(currentCat, group.label, label, kidtype);
            return rowHTML(label, href);
          })
          .join("")
      : `<div class="m-empty">Ingen underkategorier tilgjengelig.</div>`;

    brandsWrap.hidden = !brands.length;
    brandRow.innerHTML = brands
      .slice(0, 12)
      .map((brand) => {
        const href = `brand-page.html?brand=${encodeURIComponent(brand)}`;
        return `<a class="m-brand-pill" href="${href}">${escapeHtml(brand)}</a>`;
      })
      .join("");
  }

  function loadMegaOnce() {
    if (megaDoc) return Promise.resolve();

    return fetch("mega-menu.html")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load mega-menu.html");
        return r.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        megaDoc = parser.parseFromString(html, "text/html");
      });
  }

  topcatButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      currentCat = btn.dataset.cat;
      currentGroupIndex = null;
      await loadMegaOnce();
      render();
    });
  });

  levelTwoWrap.addEventListener("click", async (e) => {
    const btn = e.target.closest(".m-level-btn[data-group-index]");
    if (!btn) return;

    const index = Number(btn.dataset.groupIndex);
    if (Number.isNaN(index)) return;

    currentGroupIndex = index;
    await loadMegaOnce();
    render();
  });

  backBtn.addEventListener("click", async () => {
    if (currentGroupIndex !== null) {
      currentGroupIndex = null;
      await loadMegaOnce();
      render();
      return;
    }

    window.BrandRadarDrawerAPI?.close();
  });

  document.addEventListener("brandradar:drawer:set-category", async (e) => {
    const nextCat = String(e.detail?.cat || "").toLowerCase().trim();
    if (!nextCat) return;

    currentCat = nextCat;
    currentGroupIndex = null;
    await loadMegaOnce();
    render();
  });

  const activeCatBtn = drawer.querySelector(".m-chip.is-active[data-cat]");
  if (activeCatBtn) currentCat = activeCatBtn.dataset.cat;

  loadMegaOnce().then(render).catch(console.error);
}

/* =========================
   MOBILE BOTTOM NAV ACTIVE
   ========================= */
(function () {
  const mq = window.matchMedia("(max-width: 768px)");
  if (!mq.matches) return;

  const nav = document.querySelector(".m-bottom-nav");
  if (!nav) return;

  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  nav.querySelectorAll("[data-route]").forEach(a => {
    const route = a.getAttribute("data-route");
    const hit =
      (route === "index" && (path === "" || path === "index.html")) ||
      (route === "favoritter" && path.includes("favoritter")) ||
      (route === "brands" && path.includes("brands")) ||
      (route === "search" && path.includes("search-mobile"));
    if (hit) a.classList.add("is-active");
  });

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");

    if (action === "focus-search") {
      const input = document.getElementById("search-input");
      if (input) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => input.focus({ preventScroll: true }), 250);
      }
    }

    if (action === "open-menu") {
      document.querySelector(".mobile-menu-btn")?.click();
    }
  });
})();
