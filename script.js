// ======================================================
// BrandRadar.shop – Clean Mega Menu System (final version)
// ======================================================

console.log("✅ script.js loaded");
document.addEventListener("DOMContentLoaded", initMegaMenu);

function initMegaMenu() {
  // --- alt det du allerede har i script.js her ---
}


document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Mega menu script running...");

  const navItems = document.querySelectorAll(".nav-item");
  const megaMenu = document.getElementById("mega-menu");
  const megaContents = document.querySelectorAll(".mega-content");

  if (!navItems.length || !megaMenu) {
    console.warn("⚠️ Mega menu elements not found in DOM");
    return;
  }

  let hideTimer = null;

  // ------------------------------------------------------
  // Når du holder musen over et element i kategorilinja
  // ------------------------------------------------------
  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      const target = item.dataset.target;

      // Vis menyen
      megaMenu.classList.add("active");

      // Vis kun riktig innhold
      megaContents.forEach((content) => {
        content.classList.toggle("active", content.id === target);
      });

      // Marker aktiv knapp
      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
    });

    // Når musen forlater knappen, start "skjul-timer"
    item.addEventListener("mouseleave", () => {
      hideTimer = setTimeout(() => {
        megaMenu.classList.remove("active");
        navItems.forEach((n) => n.classList.remove("active"));
        megaContents.forEach((c) => c.classList.remove("active"));
      }, 200); // 0.2 sek forsinkelse
    });
  });

  // ------------------------------------------------------
  // Når musen beveger seg over selve menyen
  // ------------------------------------------------------
  megaMenu.addEventListener("mouseenter", () => {
    clearTimeout(hideTimer);
  });

  // Når musen forlater menyen helt
  megaMenu.addEventListener("mouseleave", () => {
    hideTimer = setTimeout(() => {
      megaMenu.classList.remove("active");
      navItems.forEach((n) => n.classList.remove("active"));
      megaContents.forEach((c) => c.classList.remove("active"));
    }, 200);
  });
});




