document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script.js loaded");

  const megaNav = document.querySelector("nav.mega-menu");

  fetch("mega-menu.html")
    .then(res => res.text())
    .then(html => {
      megaNav.innerHTML = html;
      activateMegaMenu();
      console.log("✅ Mega-menu loaded globally");
    });
});

function activateMegaMenu() {
  const topLinks = document.querySelectorAll(".menu-top li");
  const panels = document.querySelectorAll(".menu-panel");

  topLinks.forEach(link => {
    link.addEventListener("mouseenter", () => {
      const target = link.getAttribute("data-menu");
      panels.forEach(p => p.style.display = "none");
      document.getElementById(target).style.display = "flex";
    });
  });

  const navArea = document.querySelector("nav.mega-menu");
  navArea.addEventListener("mouseleave", () => {
    panels.forEach(p => p.style.display = "none");
  });
}





