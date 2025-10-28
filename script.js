document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script.js loaded");

  const menuContainer = document.querySelector("nav.mega-menu");
  if (!menuContainer) {
    console.error("❌ Nav container .mega-menu ikke funnet");
    return;
  }

  fetch("mega-menu.html")
    .then(response => {
      if (!response.ok) {
        throw new Error("❌ Failed to load mega-menu.html: " + response.status);
      }
      return response.text();
    })
    .then(html => {
      menuContainer.innerHTML = html;
      console.log("✅ Mega-menu loaded into DOM");
      activateMegaMenu();
    })
    .catch(err => console.error(err));
});

function activateMegaMenu() {
  const topLinks = document.querySelectorAll(".menu-top li");
  const panels = document.querySelectorAll(".menu-panel");

  if (!topLinks.length || !panels.length) {
    console.error("❌ Mega-menu elements not found after load");
    return;
  }

  topLinks.forEach(link => {
    link.addEventListener("mouseenter", () => {
      const target = link.getAttribute("data-menu");

      panels.forEach(p => p.style.display = "none");
      const activePanel = document.getElementById(target);
      if (activePanel) activePanel.style.display = "flex";
    });
  });

  document.querySelector("nav.mega-menu").addEventListener("mouseleave", () => {
    panels.forEach(p => p.style.display = "none");
  });

  console.log("✅ Mega-menu interaction initialized");
}






