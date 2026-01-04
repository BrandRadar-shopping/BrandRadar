document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script.js loaded");

  // =========================
  // MOBILE DRAWER (<= 768px)
  // =========================
  initMobileDrawer();

  // =========================
  // MEGA MENU (desktop only)
  // =========================
  // På mobil gir hover/mega-meny ikke mening.
  if (window.innerWidth <= 768) {
    console.log("📱 Mobile width detected — skipping mega-menu init");
    return;
  }

  const menuContainer = document.querySelector("nav.mega-menu");
  if (!menuContainer) {
    console.warn("⚠️ nav.mega-menu ikke funnet (ok på sider uten mega-menu)");
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

  const mega = document.querySelector("nav.mega-menu");
  if (mega) {
    mega.addEventListener("mouseleave", () => {
      panels.forEach(p => p.style.display = "none");
    });
  }

  console.log("✅ Mega-menu interaction initialized");
}

// =========================
// MOBILE DRAWER INIT
// =========================
function initMobileDrawer() {
  const btn = document.querySelector(".mobile-menu-btn");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileOverlay");
  const closeBtn = drawer ? drawer.querySelector(".mobile-drawer-close") : null;

  // Hvis du ikke har lagt inn HTML hooks på denne siden, gjør vi ingenting.
  if (!btn || !drawer || !overlay) {
    console.log("ℹ️ Mobile drawer hooks not found on this page (ok).");
    return;
  }

  function openMenu() {
    drawer.hidden = false;
    overlay.hidden = false;

    // Force reflow for smooth transition (no flaky animation)
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
    const isOpen = drawer.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Lukk hvis man trykker en lenke i drawer
  drawer.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) closeMenu();
  });

  // Hvis man roterer/resize til desktop, lukk meny
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && drawer.classList.contains("is-open")) {
      closeMenu();
    }
  });
}







