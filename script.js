// ======================================================
// BRANDRADAR.SHOP – FINAL MEGA MENU SCRIPT (STABIL)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Mega menu script loaded and ready");

  const navItems = document.querySelectorAll(".nav-item");
  const megaMenu = document.getElementById("mega-menu");
  const megaContents = document.querySelectorAll(".mega-content");

  if (!navItems.length || !megaMenu) {
    console.warn("⚠️ Mega menu elements not found in DOM");
    return;
  }

  let hideTimer = null;

  // Når musen går over kategori
  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      const target = item.dataset.target;

      megaMenu.classList.add("active");
      megaContents.forEach((content) => {
        content.classList.toggle("active", content.id === target);
      });

      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
    });

    // Når musen forlater kategori
    item.addEventListener("mouseleave", () => {
      hideTimer = setTimeout(closeMegaMenu, 250);
    });
  });

  // Når musen er inne i menyen
  megaMenu.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  megaMenu.addEventListener("mouseleave", () => {
    hideTimer = setTimeout(closeMegaMenu, 250);
  });

  // Lukker menyen
  function closeMegaMenu() {
    megaMenu.classList.remove("active");
    navItems.forEach((n) => n.classList.remove("active"));
    megaContents.forEach((c) => c.classList.remove("active"));
  }
});






