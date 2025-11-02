// ======================================================
// BrandRadar – Mega-meny: Category Bar controller
// Bruker .category-bar (Klær | Sko | Gymcorner | ...)
// til å åpne riktige .menu-panel (#clothing, #shoes, ...)
// Innholdet til panelene lastes via script.js (mega-menu.html)
// ======================================================

(function () {
  // Hjelper: vent til mega-menu.html er lastet inn i <nav.mega-menu>
  function onMenuReady(cb, tries = 0) {
    const nav = document.querySelector("nav.mega-menu");
    if (!nav) return;

    const hasPanels = nav.querySelectorAll(".menu-panel").length > 0;
    if (hasPanels) {
      cb();
      return;
    }
    if (tries > 50) { // ~5s totalt
      console.error("❌ Mega-meny paneler ble ikke funnet. Sjekk at script.js laster mega-menu.html.");
      return;
    }
    setTimeout(() => onMenuReady(cb, tries + 1), 100);
  }

  function initCategoryBar() {
    const barItems = document.querySelectorAll(".category-bar .category-item");
    const panels   = document.querySelectorAll("nav.mega-menu .menu-panel");
    const navWrap  = document.querySelector("nav.mega-menu");
    if (!barItems.length || !panels.length || !navWrap) {
      console.warn("⚠️ Fant ikke category bar eller panelfaner ennå.");
      return;
    }

    // Skjul alle paneler
    function hideAll() { panels.forEach(p => p.style.display = "none"); }

    // Vis spesifikt panel
    function showPanel(key) {
      hideAll();
      const id = key.toLowerCase(); // "Clothing" -> "clothing"
      const panel = document.getElementById(id);
      if (panel) panel.style.display = "flex";
    }

    // Hover på topp-kategorier
    barItems.forEach(li => {
      li.addEventListener("mouseenter", () => {
        const key = li.getAttribute("data-category");
        if (key) showPanel(key);
      });
      // Klikk fallback (mobil el. treg hover)
      li.addEventListener("click", () => {
        const key = li.getAttribute("data-category");
        if (key) showPanel(key);
      });
    });

    // Lukk når musepekeren forlater hele nav-området
    navWrap.addEventListener("mouseleave", hideAll);

    // Lukk ved klikk utenfor meny
    document.addEventListener("click", (e) => {
      const withinMenu = navWrap.contains(e.target) || (e.target.closest(".category-bar") !== null);
      if (!withinMenu) hideAll();
    });

    console.log("✅ Category bar koblet til mega-meny paneler");
  }

  // Start når mega-menu.html er på plass
  document.addEventListener("DOMContentLoaded", () => {
    onMenuReady(initCategoryBar);
  });

  // ======================================================
  // ✅ Legg til routing (dynamiske lenker)
  // ======================================================

  function activateMenuLinks() {
    console.log("✅ Mega-menu routing activated");

    const mapGender = {
      "Herre": "Men",
      "Dame": "Women",
      "Barn": "Kids"
    };

    const mapCategory = {
      "Klær": "Clothing",
      "Sko": "Shoes",
      "Gymcorner": "Gymcorner",
      "Tilbehør": "Accessories",
      "Selfcare": "Selfcare"
    };

    const mapSub = {
      "Gensere & hoodies": "Hoodies",
      "T-skjorter": "Tshirts",
      "Bukser": "Pants",
      "Jakker": "Jackets",
      "Jeans": "Jeans",
      "Sneakers": "Sneakers",
      "Proteinbarer": "Proteinbars"
    };

    document.querySelectorAll(".menu-panel").forEach(panel => {
      const genderHeading = panel.querySelector("h4");
      if (!genderHeading) return;

      const genderNorsk = genderHeading.textContent.trim();
      const gender = mapGender[genderNorsk];

      // Finn kategorien via panel-ID
      const categoryPanelID = panel.id;
      const categoryEl = document.querySelector(`ul.menu-top li[data-menu="${categoryPanelID}"]`);
      const categoryNorsk = categoryEl?.textContent.trim();
      const category = mapCategory[categoryNorsk];

      panel.querySelectorAll("li a").forEach(link => {
        const textNorsk = link.textContent.trim();
        const subcategory = mapSub[textNorsk] || null;

        link.href = `category.html?gender=${gender}&category=${category}` +
          (subcategory ? `&subcategory=${subcategory}` : "");
      });
    });
  }

  onMenuReady(activateMenuLinks);
  
// ======================================================
// ✅ Riktig routing med slug fra mapping-arket
// (alt lower-case slug-format)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  function normalizeSlug(slug) {
    return slug
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^\w\d-]/g, "-")
      .replace(/\s+/g, "-")
      .trim();
  }

  document.querySelectorAll(".menu-panel").forEach(panel => {
    const gender = panel.querySelector("h4")?.textContent.trim();
    const panelId = panel.id; // clothing / shoes etc.

    panel.querySelectorAll("li a").forEach(link => {
      const text = link.textContent.trim();

      const genderSlug =
        gender === "Herre" ? "Men" :
        gender === "Dame" ? "Women" :
        gender === "Barn" ? "Kids" : gender;

      const categorySlug = normalizeSlug(panelId);
      const subSlug = normalizeSlug(text);

      // KUN bruk subSlug hvis panelen har underkategori
      const href = subSlug && subSlug !== categorySlug
        ? `category.html?gender=${genderSlug}&category=${categorySlug}&subcategory=${subSlug}`
        : `category.html?gender=${genderSlug}&category=${categorySlug}`;

      link.href = href;
    });
  });

  console.log("✅ Routing slugs now fully normalized");
});

  
})();
