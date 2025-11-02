// ======================================================
// ✅ BrandRadar – Mega-meny hover + norsk slug-routing
// ======================================================

(function () {

  function onMenuReady(cb, tries = 0) {
    const nav = document.querySelector("nav.mega-menu");
    if (!nav) return;
    if (nav.querySelectorAll(".menu-panel").length > 0) return cb();
    if (tries > 50) return console.error("❌ Mega-meny ikke funnet i tide");
    setTimeout(() => onMenuReady(cb, tries + 1), 100);
  }

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
      li.addEventListener("mouseenter", () => showPanel(li.dataset.category));
      li.addEventListener("click", () => showPanel(li.dataset.category));
    });

    navWrap.addEventListener("mouseleave", hideAll);
    document.addEventListener("click", e => {
      if (!navWrap.contains(e.target) && !e.target.closest(".category-bar")) hideAll();
    });

    console.log("✅ Mega-menu hover ready");
  }

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

  function initRoutingSlugs() {
    document.querySelectorAll(".menu-panel").forEach(panel => {

      const panelId = panel.id;
      const categorySlug = slugify(panelId);

      const genderHeader = [...panel.querySelectorAll("h4")]
        .map(h => h.textContent.trim())
        .find(text => ["Herre", "Dame", "Barn"].includes(text));

      // ✅ Oversett norsk gender → english slug ✅
      let genderSlug =
        genderHeader === "Herre" ? "Men" :
        genderHeader === "Dame" ? "Women" :
        genderHeader === "Barn" ? "Kids" : null;

      panel.querySelectorAll("li a").forEach(link => {
        const sub = link.textContent.trim();
        const subSlug = slugify(sub);

        let url = `category.html?category=${categorySlug}`;
        
        // ✅ Bruk english gender slug istedenfor norsk ✅
        if (genderSlug) url += `&gender=${genderSlug}`;

        if (subSlug !== categorySlug) url += `&subcategory=${subSlug}`;

        link.href = url;
      });
    });

    console.log("✅ Norsk slug routing aktivert (med riktig gender!)");
  }

  document.addEventListener("DOMContentLoaded", () => {
    onMenuReady(() => {
      initMenuHover();
      initRoutingSlugs();
    });
  });

})();
