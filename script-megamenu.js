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
})();
