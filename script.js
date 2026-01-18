document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js loaded");

  // 1) Mobile drawer (global)
  initMobileDrawer();

  // 1b) Mobile browse menu (Zalando-style) - safe on pages without the markup
  initMobileBrowseMenu();

  // 2) Mega menu (desktop only)
  if (window.innerWidth <= 768) {
    console.log("📱 Mobile detected — skipping mega-menu init");
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
      activateMegaMenu();
    })
    .catch((err) => console.error(err));
});

function activateMegaMenu() {
  const topLinks = document.querySelectorAll(".menu-top li");
  const panels = document.querySelectorAll(".menu-panel");

  if (!topLinks.length || !panels.length) {
    console.error("❌ Mega-menu elements not found after load");
    return;
  }

  topLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      const target = link.getAttribute("data-menu");

      panels.forEach((p) => (p.style.display = "none"));
      const activePanel = document.getElementById(target);
      if (activePanel) activePanel.style.display = "flex";
    });
  });

  const mega = document.querySelector("nav.mega-menu");
  if (mega) {
    mega.addEventListener("mouseleave", () => {
      panels.forEach((p) => (p.style.display = "none"));
    });
  }

  console.log("✅ Mega-menu interaction initialized");
}

function initMobileDrawer() {
  const btn = document.querySelector(".mobile-menu-btn");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileOverlay");
  const closeBtn = drawer ? drawer.querySelector(".mobile-drawer-close") : null;

  if (!btn || !drawer || !overlay) {
    // Ikke alle sider må ha drawer — det er ok.
    return;
  }

  function openMenu() {
    drawer.hidden = false;
    overlay.hidden = false;

    // Trigger reflow for smooth transition
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
   Renders subcategories + brands based on:
   - Selected top category (clothing/shoes/gymcorner/accessories/selfcare)
   - Selected segment (Dame/Herre/Barn)
   Data source: mega-menu.html
   ========================= */
function initMobileBrowseMenu() {
  const drawer = document.getElementById("mobileDrawer");
  if (!drawer) return;

  const subcatGrid = document.getElementById("mSubcatGrid");
  const brandRow = document.getElementById("mBrandRow");
  if (!subcatGrid || !brandRow) {
    // Page may still be using old drawer markup — safe exit.
    return;
  }

  const catButtons = drawer.querySelectorAll(".m-chip[data-cat]");
  const segButtons = drawer.querySelectorAll(".m-seg[data-seg]");
  if (!catButtons.length || !segButtons.length) return;

  let megaDoc = null;
  let currentCat = "clothing";
  let currentSeg = "Dame";

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
    return `
      <a class="m-tile" href="${href}">
        <div class="m-tile-img" aria-hidden="true"></div>
        <div class="m-tile-label">${escapeHtml(label)}</div>
      </a>
    `;
  }

  function getBestSectionForSegment(panel, segment) {
    // Normal case: each segment is a menu-block with a .menu-section h4 = Dame/Herre/Barn
    const blocks = [...panel.querySelectorAll(".menu-block")];

    for (const b of blocks) {
      const h4 = b.querySelector(".menu-section h4");
      if (h4 && h4.textContent.trim() === segment) return b;
    }

    // Fallback (gymcorner/selfcare etc.): use first block
    return blocks[0] || panel;
  }

  function collectSubLinks(segmentBlock) {
    // Non-brand sections: everything in .menu-section:not(.brands)
    const nonBrandSections = [...segmentBlock.querySelectorAll(".menu-section:not(.brands)")];

    // If no sections found (edge case), fallback to any ul links
    const sectionsToUse = nonBrandSections.length ? nonBrandSections : [segmentBlock];

    const links = sectionsToUse.flatMap((sec) => [...sec.querySelectorAll("ul li a")]);

    // Deduplicate by text
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

    // Render subcategory tiles
    subcatGrid.innerHTML = subcats
      .slice(0, 20) // safety cap for mobile
      .map((label) => {
        // Foreløpig: route til category.html med query (enkelt og stabilt).
        // Senere kan vi mappe dette til din faktiske filtrering/URL-struktur.
        const href =
          `category.html?category=${encodeURIComponent(currentCat)}` +
          `&segment=${encodeURIComponent(currentSeg)}` +
          `&sub=${encodeURIComponent(label)}`;
        return tileHTML(label, href);
      })
      .join("");

    // Render brands row
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

  // Bind category buttons
  catButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setActive(catButtons, btn);
      currentCat = btn.dataset.cat;

      await loadMegaOnce();
      render();
    });
  });

  // Bind segment buttons
  segButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setActive(segButtons, btn);
      currentSeg = btn.dataset.seg;

      await loadMegaOnce();
      render();
    });
  });

  // Init defaults (match initial .is-active in HTML if present)
  const activeCatBtn = drawer.querySelector(".m-chip.is-active[data-cat]");
  const activeSegBtn = drawer.querySelector(".m-seg.is-active[data-seg]");
  if (activeCatBtn) currentCat = activeCatBtn.dataset.cat;
  if (activeSegBtn) currentSeg = activeSegBtn.dataset.seg;

  loadMegaOnce().then(render).catch(console.error);
}








