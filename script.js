if (window.__MEGA_INIT__) {
  console.log("⏩ Mega menu already initialized");
} else {
  window.__MEGA_INIT__ = true;

  document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Mega menu script loaded and ready");

    const navItems = document.querySelectorAll(".nav-item");
    const megaMenu = document.getElementById("mega-menu");
    const megaContents = document.querySelectorAll(".mega-content");

    if (!megaMenu) return;

    let hideTimer = null;

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

      item.addEventListener("mouseleave", () => {
        hideTimer = setTimeout(closeMegaMenu, 200);
      });
    });

    megaMenu.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    megaMenu.addEventListener("mouseleave", () => {
      hideTimer = setTimeout(closeMegaMenu, 200);
    });

    function closeMegaMenu() {
      megaMenu.classList.remove("active");
      navItems.forEach((n) => n.classList.remove("active"));
      megaContents.forEach((c) => c.classList.remove("active"));
    }
  });
}








