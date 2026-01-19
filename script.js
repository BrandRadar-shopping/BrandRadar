document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js loaded");

  // 1) Mobile drawer + browse UI (safe on pages without markup)
  initMobileDrawer();
  initMobileBrowseMenu();

  // 2) Desktop mega-menu only
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

      // Desktop behaviors
      initDesktopMegaMenuHover();
      initDesktopMegaMenuRoutingSlugs();
    })
    .catch((err) => console.error(err));
});

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
    const id = String(key || "").toLowerCase(); // Clothing -> clothing
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
   DESKTOP: Slug routing for mega-menu links
   ========================================================= */
function initDesktopMegaMenuRoutingSlugs() {
  function slugify(txt) {
    return (txt || "")
      .toLowerCase()
      .replace(/æ/g, "a")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/&/g, "og")
      .replace(/[^\w\d]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .trim();
  }

  document.querySelectorAll("nav.mega-menu .menu-panel").forEach((panel) => {
    const panelId = panel.id; // clothing/shoes/...
    const categorySlug = slugify(panelId);

    panel.querySelectorAll("li a").forEach((link) => {
      const sub = link.textContent.trim();
      const subSlug = slugify(sub);

      const section = link.closest(".menu-section");
      const headerText = section?.querySelector("h4")?.textContent.trim() || "";
      const lower = headerText.toLowerCase();

      let genderSlug = null;
      if (lower === "herre") genderSlug = "Men";
      else if (lower === "dame") genderSlug = "Women";
      else if (lower === "barn") genderSlug = "Kids";

      let url = `category.html?category=${encodeURIComponent(categorySlug)}`;
      if (genderSlug) url += `&gender=${encodeURIComponent(genderSlug)}`;
      if (subSlug && subSlug !== categorySlug) url += `&subcategory=${encodeURIComponent(subSlug)}`;

      link.href = url;
    });
  });

  console.log("✅ Desktop mega-menu routing slugs enabled");
}

/* =========================
   MOBILE DRAWER
   ========================= */
function initMobileDrawer() {
  const btn = document.querySelector(".mobile-menu-btn");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileOverlay");
  const closeBtn = drawer ? drawer.querySelector(".mobile-drawer-close") : null;

  if (!btn || !drawer || !overlay) return;

  function openMenu() {
    drawer.hidden = false;
    overlay.hidden = false;

    drawer.offsetHeight;

    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.classList.add("is-locked");

    btn.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("is-locked");

    btn.setAttribute("aria-expanded", "false");

    setTimeout(() => {
      drawer.hidden = true;
      overlay.hidden = true;
    }, 220);
  }

  btn.addEventListener("click", () => {
    drawer.classList.contains("is-open") ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
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
   MOBILE BROWSE MENU (Zalando-style)
   + Static tile images (default per main category)
   ========================= */
function initMobileBrowseMenu() {
  const drawer = document.getElementById("mobileDrawer");
  if (!drawer) return;

  const subcatGrid = document.getElementById("mSubcatGrid");
  const brandRow = document.getElementById("mBrandRow");
  if (!subcatGrid || !brandRow) return;

  const catButtons = drawer.querySelectorAll(".m-chip[data-cat]");
  const segButtons = drawer.querySelectorAll(".m-seg[data-seg]");
  if (!catButtons.length || !segButtons.length) return;

  let megaDoc = null;
  let currentCat = "clothing";
  let currentSeg = "Dame";

  // ✅ Static images (one per main category) — fast + stable + cache-friendly
  const DEFAULT_CAT_IMAGE = {
    clothing: "assets/img/tiles/default-clothing.jpg",
    shoes: "assets/img/tiles/default-shoes.jpg",
    gymcorner: "assets/img/tiles/default-gymcorner.jpg",
    accessories: "assets/img/tiles/default-accessories.jpg",
    selfcare: "assets/img/tiles/default-selfcare.jpg"
  };

  function getTileImage(cat) {
    return DEFAULT_CAT_IMAGE[cat] || "";
  }

  function setActive(nodeList, el) {
    nodeList.forEach((b) => b.classList.remove("is-active"));
    el.classList.add("is-active");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function tileHTML(label, href) {
    const img = getTileImage(currentCat);
    const bg = img ? ` style="background-image:url('${img}');"` : "";

    return `
      <a class="m-tile" href="${href}">
        <div class="m-tile-img"${bg} aria-hidden="true"></div>
        <div class="m-tile-label">${escapeHtml(label)}</div>
      </a>
    `;
  }

  function getBestSectionForSegment(panel, segment) {
    const blocks = [...panel.querySelectorAll(".menu-block")];
    for (const b of blocks) {
      const h4 = b.querySelector(".menu-section h4");
      if (h4 && h4.textContent.trim() === segment) return b;
    }
    return blocks[0] || panel;
  }

  function collectSubLinks(segmentBlock) {
    const nonBrandSections = [...segmentBlock.querySelectorAll(".menu-section:not(.brands)")];
    const sectionsToUse = nonBrandSections.length ? nonBrandSections : [segmentBlock];
    const links = sectionsToUse.flatMap((sec) => [...sec.querySelectorAll("ul li a")]);

    const seen = new Set();
    const unique = [];
    for (const a of links) {
      const t = a.textContent.trim();
      if (!t) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      unique.push(t);
    }
    return unique;
  }

  function collectBrandLinks(segmentBlock) {
    const links = [...segmentBlock.querySelectorAll(".menu-section.brands ul li a")].map((a) =>
      a.textContent.trim()
    );

    const seen = new Set();
    const unique = [];
    for (const t of links) {
      if (!t) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      unique.push(t);
    }
    return unique;
  }

  function render() {
    if (!megaDoc) return;

    const panel = megaDoc.querySelector(`.menu-panel#${currentCat}`);
    if (!panel) return;

    const segmentBlock = getBestSectionForSegment(panel, currentSeg);
    const subcats = collectSubLinks(segmentBlock);
    const brands = collectBrandLinks(segmentBlock);

    subcatGrid.innerHTML = subcats
      .slice(0, 20)
      .map((label) => {
        const href =
          `category.html?category=${encodeURIComponent(currentCat)}` +
          `&segment=${encodeURIComponent(currentSeg)}` +
          `&sub=${encodeURIComponent(label)}`;
        return tileHTML(label, href);
      })
      .join("");

    brandRow.innerHTML = brands
      .slice(0, 12)
      .map((brand) => {
        const href = `brands.html?brand=${encodeURIComponent(brand)}`;
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

  catButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setActive(catButtons, btn);
      currentCat = btn.dataset.cat;
      await loadMegaOnce();
      render();
    });
  });

  segButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setActive(segButtons, btn);
      currentSeg = btn.dataset.seg;
      await loadMegaOnce();
      render();
    });
  });

  const activeCatBtn = drawer.querySelector(".m-chip.is-active[data-cat]");
  const activeSegBtn = drawer.querySelector(".m-seg.is-active[data-seg]");
  if (activeCatBtn) currentCat = activeCatBtn.dataset.cat;
  if (activeSegBtn) currentSeg = activeSegBtn.dataset.seg;

  loadMegaOnce().then(render).catch(console.error);
}
