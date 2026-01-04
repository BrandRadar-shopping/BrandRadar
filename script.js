document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js loaded");

  // 1) Mobile drawer (global)
  initMobileDrawer();

  // 2) Mega menu (desktop only)
  if (window.innerWidth <= 768) {
    console.log("📱 Mobile detected — skipping mega-menu init");
    return;
  }

  const menuContainer = document.querySelector("nav.mega-menu");
  if (!menuContainer) {
    console.warn("⚠️ nav.mega-menu ikke funnet (ok på sider uten mega-menu)");
    return;
  }

  fetch("mega-menu.html")
    .then((response) => {
      if (!response.ok) throw new Error("❌ Failed to load mega-menu.html: " + response.status);
      return response.text();
    })
    .then((html) => {
      menuContainer.innerHTML = html;
      console.log("✅ Mega-menu loaded into DOM");
      activateMegaMenu();
    })
    .catch((err) => console.error(err));
});

function activateMegaMenu() {
  const topLinks = document.querySelectorAll(".menu-top li");
  const panels = document.querySelectorAll(".menu-panel");

  if (!topLinks.length || !panels.length) {
    console.error("❌ Mega-menu elements not found after load");
    return;
  }

  topLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      const target = link.getAttribute("data-menu");

      panels.forEach((p) => (p.style.display = "none"));
      const activePanel = document.getElementById(target);
      if (activePanel) activePanel.style.display = "flex";
    });
  });

  const mega = document.querySelector("nav.mega-menu");
  if (mega) {
    mega.addEventListener("mouseleave", () => {
      panels.forEach((p) => (p.style.display = "none"));
    });
  }

  console.log("✅ Mega-menu interaction initialized");
}

function initMobileDrawer() {
  const btn = document.querySelector(".mobile-menu-btn");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileOverlay");
  const closeBtn = drawer ? drawer.querySelector(".mobile-drawer-close") : null;

  if (!btn || !drawer || !overlay) {
    // Ikke alle sider må ha drawer — det er ok.
    return;
  }

  function openMenu() {
    drawer.hidden = false;
    overlay.hidden = false;

    // Trigger reflow for smooth transition
    drawer.offsetHeight;

    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.classList.add("is-locked");

    btn.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("is-locked");

    btn.setAttribute("aria-expanded", "false");

    setTimeout(() => {
      drawer.hidden = true;
      overlay.hidden = true;
    }, 220);
  }

  btn.addEventListener("click", () => {
    drawer.classList.contains("is-open") ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  drawer.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && drawer.classList.contains("is-open")) closeMenu();
  });
}








