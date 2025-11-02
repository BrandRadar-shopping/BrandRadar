// ======================================================
// ✅ BrandRadar – Mega-meny controller + korrekt routing
// ======================================================

(function () {

  // ✅ Ensure mega-menu HTML is fully injected before hooking events
  function onMenuReady(cb, tries = 0) {
    const nav = document.querySelector("nav.mega-menu");
    if (!nav) return;
    const hasPanels = nav.querySelectorAll(".menu-panel").length > 0;
    if (hasPanels) {
      cb();
      return;
    }
    if (tries > 50) {
      console.error("❌ Mega-beny ikke funnet i tide");
      return;
    }
    setTimeout(() => onMenuReady(cb, tries + 1), 100);
  }

  // ✅ Mega-menu hover interaction
  function initMenuHover() {
    const barItems = document.querySelectorAll(".category-bar .category-item");
    const panels = document.querySelectorAll("nav.mega-menu .menu-panel");
    const navWrap = document.querySelector("nav.mega-menu");
    if (!barItems.length || !panels.length || !navWrap) return;

    const hideAll = () => panels.forEach(p => p.style.display = "none");

    const showPanel = key => {
      hideAll();
      const id = key.toLowerCase();
      const panel = document.getElementById(id);
      if (panel) panel.style.display = "flex";
    };

    barItems.forEach(li => {
      li.addEventListener("mouseenter", () => {
        const key = li.getAttribute("data-category");
        if (key) showPanel(key);
      });

      li.addEventListener("click", () => {
        const key = li.getAttribute("data-category");
        if (key) showPanel(key);
      });
    });

    navWrap.addEventListener("mouseleave", hideAll);

    document.addEventListener("click", (e) => {
      const inside = navWrap.contains(e.target) || (e.target.closest(".category-bar") !== null);
      if (!inside) hideAll();
    });

    console.log("✅ Mega-menu hover ready");
  }

  // ======================================================
  // ✅ Routing: Slugify alt korrekt til category.html
  // ======================================================
  function initRoutingSlugs() {

    function normalizeSlug(slug) {
      return slug
        ?.toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^\w\d]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .trim();
    }

    document.querySelectorAll(".menu-panel").forEach(panel => {

      const genderLabel = panel.querySelector("h4")?.textContent.trim();
      const genderSlug =
        genderLabel === "Herre" ? "Men" :
        genderLabel === "Dame" ? "Women" :
        genderLabel === "Barn" ? "Kids" : genderLabel;

      const categorySlug = normalizeSlug(panel.id);

      panel.querySelectorAll("li a").forEach(link => {
        const subName = link.textContent.trim();
        const subSlug = normalizeSlug(subName);

        const hasSub = subSlug && subSlug !== categorySlug;

        link.href = hasSub
          ? `category.html?gender=${genderSlug}&category=${categorySlug}&subcategory=${subSlug}`
          : `category.html?gender=${genderSlug}&category=${categorySlug}`;
      });

    });

    console.log("✅ Routing: Gender + Category + Subcategory OK!");
  }

  // ✅ Init all functional parts
  document.addEventListener("DOMContentLoaded", () => {
    onMenuReady(() => {
      initMenuHover();
      initRoutingSlugs();
    });
  });

})();
