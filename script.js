// ======================================================
// BRANDRADAR.SHOP – FINAL MEGA MENU SCRIPT
// ======================================================
// Formål: Håndterer hover, aktivering og deaktivering
//         av mega-menyen på tvers av alle kategorier.
// ------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Mega menu script loaded and ready");

  // ==========================
  // 1. HENT ELEMENTER
  // ==========================
  const navItems = document.querySelectorAll(".nav-item");
  const megaMenu = document.getElementById("mega-menu");
  const megaContents = document.querySelectorAll(".mega-content");

  if (!navItems.length || !megaMenu) {
    console.warn("⚠️ Mega menu elements not found in DOM");
    return;
  }

  let hideTimer = null;

  // ==========================
  // 2. VIS / SKJUL MEGA-MENY
  // ==========================

  // Når bruker holder musen over kategori-knappen
  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      const target = item.dataset.target;

      // Vis selve menyboksen
      megaMenu.classList.add("active");

      // Vis riktig innhold for valgt kategori
      megaContents.forEach((content) => {
        content.classList.toggle("active", content.id === target);
      });

      // Marker aktiv kategori i topp-linja
      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
    });

    // Når musen forlater knapp – start liten timer før menyen forsvinner
    item.addEventListener("mouseleave", () => {
      hideTimer = setTimeout(() => closeMegaMenu(), 200);
    });
  });

  // ==========================
  // 3. INTERAKSJON INNE I MENYEN
  // ==========================
  megaMenu.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  megaMenu.addEventListener("mouseleave", () => {
    hideTimer = setTimeout(() => closeMegaMenu(), 200);
  });

  // ==========================
  // 4. LUKKEFUNKSJON
  // ==========================
  function closeMegaMenu() {
    megaMenu.classList.remove("active");
    navItems.forEach((n) => n.classList.remove("active"));
    megaContents.forEach((c) => c.classList.remove("active"));
  }
});




