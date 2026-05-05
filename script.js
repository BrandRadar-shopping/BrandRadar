document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js loaded");

  initMobileDrawer();
  initMobileBrowseMenu();
  initSearchMobilePageTriggers();

  if (window.innerWidth <= 768) {
    console.log("📱 Mobile detected — skipping desktop mega-menu init");
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
      initDesktopMegaMenuIcons();
      initDesktopMegaMenuHover();
      initDesktopMegaMenuRoutingSlugs();
    })
    .catch((err) => console.error(err));
});

/* =========================================================
   Felles slugify – matcher CategoryMapping bedre
   ========================================================= */
function slugifyBrandRadar(txt) {
  return (txt || "")
    .toLowerCase()
    .replace(/æ/g, "a")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/&/g, " ")
    .replace(/\//g, " ")
    .replace(/\bog\b/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/[^\w\d]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

function mapHeadingToGender(headerText) {
  const lower = String(headerText || "").trim().toLowerCase();
  if (lower === "herre") return "Men";
  if (lower === "dame") return "Women";
  if (lower === "barn") return "Kids";
  return null;
}

function getKidtypeFromLink(link, genderSlug) {
  if (genderSlug !== "Kids") return null;

  const ul = link.closest("ul");
  if (!ul) return null;

  let prev = ul.previousElementSibling;
  while (prev) {
    if (prev.classList && prev.classList.contains("menu-subtitle")) {
      const txt = prev.textContent.trim();
      if (txt === "Jente" || txt === "Gutt") return txt;
      return null;
    }
    prev = prev.previousElementSibling;
  }

  return null;
}

/* =========================================================
   BRANDRADAR MENU ICONS — desktop + mobile
   ========================================================= */
const BR_MENU_ICON_MAP = {
  "Gensere & hoodies": "hoodie",
  "Sweats & hettegensere": "hoodie",
  "T-skjorter": "tshirt",
  "T-skjorter & polo": "tshirt",
  "T-skjorter & topper": "tshirt",
  "Skjorter": "shirt",
  "Bukser": "pants",
  "Bukser & shorts": "pants",
  "Jeans": "jeans",
  "Jakker": "jacket",
  "Jakker & blazere": "jacket",
  "Kåper": "coat",
  "Frakker": "coat",
  "Cardigans": "knit",
  "Kjoler": "dress",
  "Skjørt": "skirt",
  "Gymwear": "dumbbell",
  "Sport": "sport",
  "Sport & trening": "sport",
  "Sportsklær": "sport",
  "Dress & pentøy": "tie",
  "Dresser": "tie",
  "Undertøy & sokker": "socks",
  "Onepiece": "onesie",

  "Sneakers": "shoe",
  "Boots & støvler": "boot",
  "Støvletter": "boot",
  "Boots": "boot",
  "Støvler": "boot",
  "Støvler & støvletter": "boot",
  "Snøresko / Pensko": "dressshoe",
  "Høye hæler / Pumps": "heel",
  "Flate sko": "flatshoe",
  "Slip-ins": "slipon",
  "Sandaler / Åpne sko": "sandal",
  "Sandaler / Badesko": "sandal",
  "Tøfler": "slipper",
  "Sportssko": "runningshoe",
  "Tursko": "hiking",

  "Proteinpulver": "supplement",
  "Proteinbarer": "bar",
  "Kreatin": "powder",
  "PWO (preworkout)": "bolt",
  "Vitaminer & Mineraler": "pill",
  "Drikke": "bottle",
  "Aminosyrer": "capsule",
  "Elektronikk": "watch",
  "Strikker": "band",
  "Hjemmetrening": "homegym",
  "Kampsport": "glove",
  "Massasjeverktøy": "massage",
  "Vannflasker & shakers": "bottle",
  "Vekter & apparater": "dumbbell",
  "Treningsbag": "bag",
  "Vektvest": "vest",

  "Luer & caps": "cap",
  "Tørklær & skjerf": "scarf",
  "Hansker & votter": "glove",
  "Vesker & kofferter": "bag",
  "Vesker": "bag",
  "Smykker": "jewelry",
  "Solbriller": "sunglasses",
  "Klokker": "watch",
  "Belter": "belt",
  "Lommebøker": "wallet",
  "Slips & Tilbehør": "tie",
  "Hatter & hodeskjerf": "hat",
  "Skjerf & sjal": "scarf",
  "Hårpynt": "sparkle",
  "Bag charms": "sparkle",
  "Bager & sekker": "backpack",
  "Klokker & smykker": "jewelry",
  "Alle accessories": "grid",

  "Ansikt": "face",
  "Kroppspleie": "bodycare",
  "Deodorant": "deodorant",
  "Aktiv hudpleie": "drop",
  "K-Beauty": "sparkle",
  "Solprodukter": "sun",
  "Beauty Tech": "device",
  "Mamma & Barn": "heart",
  "Hudpleiesett": "bottle",
  "Reisestørrelser": "travel",
  "Hudpleietilbehør": "brush",
  "Munnhygiene": "tooth",
  "Parfyme": "perfume",
  "Barbering": "razor",
  "Skjegg & Bart": "beard",
  "Hudpleie": "drop",
  "Hår": "hair",
  "Gavesett": "gift",

  "Alle kategorier": "grid",
  "Yttertøy": "jacket",
  "Gensere & cardigans": "knit",
  "Barn 98-134": "kids",
  "Ungdom 140-176": "kids"
};

function getMenuIconKey(label) {
  return BR_MENU_ICON_MAP[String(label || "").trim()] || "grid";
}

function brMenuIcon(label) {
  const key = getMenuIconKey(label);

  const icons = {
    grid: `<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>`,

    tshirt: `<path d="M8 4l-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3-2.2 1.4a3.4 3.4 0 0 1-3.6 0z"/><path d="M9.5 4.7c.5 1 1.3 1.5 2.5 1.5s2-.5 2.5-1.5"/>`,
    shirt: `<path d="M8 4h8l3 4-2.5 2.2V20h-9V10.2L5 8z"/><path d="M10 4l2 3 2-3M12 7v13M10 11h4"/>`,
    hoodie: `<path d="M8 9V8a4 4 0 0 1 8 0v1"/><path d="M6.5 9h11L20 20H4z"/><path d="M9 13v7M15 13v7M10 9c.5 1 1.2 1.5 2 1.5s1.5-.5 2-1.5"/>`,
    jacket: `<path d="M8 4l-3.5 4.2V20h6.2v-7.5h2.6V20h6.2V8.2L16 4"/><path d="M9 4c.7 1.2 1.7 1.8 3 1.8s2.3-.6 3-1.8"/><path d="M8 9.5h3M13 9.5h3M10.7 12.5v7.5M13.3 12.5v7.5"/>`,
    pants: `<path d="M8 4h8l1 16h-4.5L12 10l-.5 10H7z"/><path d="M8 8h8M12 4v6"/>`,
    jeans: `<path d="M7 4h10l1 16h-4.5L12 10.5 10.5 20H6z"/><path d="M7 8h10M10 4v4M14 4v4M8 11h3M13 11h3"/>`,
    coat: `<path d="M8 4h8l3 5v11H5V9z"/><path d="M12 5v15M8 12h3M13 12h3M9 4l3 4 3-4"/>`,
    knit: `<path d="M8 5l-3 3 2 3v9h10v-9l2-3-3-3"/><path d="M9 9h6M8 13h8M8 17h8"/><path d="M10 5c.5.8 1.1 1.2 2 1.2s1.5-.4 2-1.2"/>`,
    dress: `<path d="M9 4h6l1 5 4 11H4L8 9z"/><path d="M9 4c.8 1 1.8 1.5 3 1.5S14.2 5 15 4"/>`,
    skirt: `<path d="M8 4h8l3 16H5z"/><path d="M8 8h8M11 8l-2 12M13 8l2 12"/>`,
    socks: `<path d="M7 4h5v9l4 2c2 1 1 4-1 5H8c-2 0-3-2-2-4l1-3z"/><path d="M14 4h4v8"/>`,
    tie: `<path d="M10 4h4l1 3-3 3-3-3z"/><path d="M12 10 8 20h8z"/>`,
    onesie: `<path d="M8 4h8l3 4-2 2v10h-4v-6h-2v6H7V10L5 8z"/><path d="M10 4c.5.8 1.1 1.2 2 1.2s1.5-.4 2-1.2"/><path d="M11 14h2"/>`,
    sport: `<path d="M5 17c2.5-5 11.5-5 14 0"/><path d="M8 14l-2-4M16 14l2-4"/><path d="M12 12V5"/><circle cx="12" cy="5" r="1.5"/>`,
    dumbbell: `<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>`,

    shoe: `<path d="M3 16c4 2 10 2 18 1v3H5c-2 0-3-1-3-3z"/><path d="M8 12l3-2 4 3"/>`,

boot: `<path d="M8 4h6v8l4 3v4H5v-4l3-2z"/>`,

sneaker: `<path d="M3 16c4 2 10 2 18 1v3H5c-2 0-3-1-3-3z"/><path d="M9 13l2-2M12 13l2-2"/>`,
    
dressshoe: `<path d="M3 16c5 2 11 2 18 1v3H5c-2 0-3-1-3-3z"/>`,

heel: `<path d="M3 16.2c3.8 1.6 8.5 1.8 14.2.4l2.3 2.9H6c-2.2 0-4-1.4-4-3.1z"/><path d="M15.5 17l2.1 5"/><path d="M8 14c2.4.5 4.5.4 6.5-.3"/>`,

flatshoe: `<path d="M3 16.4c4 1.4 9.7 1.4 17.5-.1V20H5.5C3.6 20 2 18.4 2 16.5z"/><path d="M7.5 15c3.5.5 6.7.3 9.5-.6"/>`,

slipon: `<path d="M3 16.3c4.2 1.7 10 1.7 17.5 0V20H5.5C3.6 20 2 18.4 2 16.5z"/><path d="M7.5 14.7c2.4-2.2 6.7-2.2 9.2 0"/>`,

sandal: `<path d="M3 16.4c4.2 1 10 1 17.5-.2V20H5.5C3.6 20 2 18.4 2 16.5z"/><path d="M8 10.5l4 5.8M16 10.5l-4 5.8M8.5 10.5h7"/>`,

slipper: `<path d="M4 16c4-2 10-2 16 0v4H5c-2 0-3-1-3-3z"/>`,

runningshoe: `<path d="M3 16c4 2 10 2 18 1v3H5c-2 0-3-1-3-3z"/><path d="M10 12l3 3"/>`,

hiking: `<path d="M3 16c4 2 10 2 18 1v3H5c-2 0-3-1-3-3z"/><path d="M6 18h12"/>`,

jacket: `<path d="M8 4l-3.5 4.2V20h6.2v-7.5h2.6V20h6.2V8.2L16 4"/><path d="M9 4c.7 1.2 1.7 1.8 3 1.8s2.3-.6 3-1.8"/><path d="M8 9.5h3M13 9.5h3M10.7 12.5v7.5M13.3 12.5v7.5"/>`,

    supplement: `<path d="M8 4h8v4H8z"/><path d="M7 8h10l1 12H6z"/><path d="M9 13h6"/>`,
    bar: `<path d="M5 7h14v10H5z"/><path d="M8 7v10M16 7v10"/>`,
    powder: `<path d="M8 4h8v5H8z"/><path d="M6 9h12l-1 11H7z"/><path d="M10 14h4"/>`,
    bolt: `<path d="M13 2 4 14h7l-1 8 10-13h-7z"/>`,
    pill: `<path d="M10 21a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7z"/><path d="M8 9l7 7"/>`,
    capsule: `<path d="M10 21a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7z"/><path d="M8 9l7 7"/>`,
    bottle: `<path d="M9 3h6v4H9z"/><path d="M8 7h8l1 13H7z"/><path d="M9 12h6"/>`,
    watch: `<path d="M9 2h6l1 5a7 7 0 0 1 0 10l-1 5H9l-1-5a7 7 0 0 1 0-10z"/><circle cx="12" cy="12" r="4"/>`,
    band: `<path d="M4 12c4-6 12-6 16 0M4 12c4 6 12 6 16 0"/>`,
    homegym: `<path d="M4 11 12 4l8 7v9H4z"/><path d="M8 17h8M9 14h6"/>`,
    glove: `<path d="M7 6c0-1 .8-2 1.8-2S10.5 5 10.5 6v5"/><path d="M10.5 6c0-1 .8-2 1.8-2S14 5 14 6v5"/><path d="M14 7c0-1 .8-2 1.8-2S17.5 6 17.5 7v6l2 2-2 5H8l-3-7 2-1z"/>`,
    massage: `<path d="M6 18h12M8 14h8M10 10h4M12 4v6"/>`,
    bag: `<path d="M6 8h12l1 12H5z"/><path d="M9 8a3 3 0 0 1 6 0"/>`,
    vest: `<path d="M8 4h8l2 16h-5v-8h-2v8H6z"/>`,

    cap: `<path d="M4 14c2-5 12-7 16 0"/><path d="M4 14c3 2 9 2 16 0"/><path d="M15 14h6"/>`,
    scarf: `<path d="M9 4h6v10H9z"/><path d="M9 14l-2 6M15 14l2 6"/>`,
    jewelry: `<path d="M6 8a6 6 0 0 0 12 0"/><path d="M9 8a3 3 0 0 1 6 0"/><circle cx="12" cy="17" r="2"/>`,
    sunglasses: `<path d="M3 10h6l2 2h2l2-2h6"/><path d="M3 10l1 5h5l2-3M21 10l-1 5h-5l-2-3"/>`,
    belt: `<path d="M4 10h16v4H4z"/><path d="M8 10v4M12 10v4"/>`,
    wallet: `<path d="M4 7h16v11H4z"/><path d="M16 12h4"/>`,
    hat: `<path d="M5 14h14M8 14l2-8h4l2 8"/>`,
    backpack: `<path d="M7 8h10l1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0M8 13h8"/>`,
    sparkle: `<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>`,

    face: `<circle cx="12" cy="12" r="8"/><path d="M9 10h.01M15 10h.01M9 15c2 1 4 1 6 0"/>`,
    bodycare: `<path d="M9 3h6v4H9z"/><path d="M8 7h8l1 13H7z"/>`,
    deodorant: `<path d="M9 5h6v4H9z"/><path d="M8 9h8l1 11H7z"/><path d="M10 13h4"/>`,
    drop: `<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>`,
    sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>`,
    device: `<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>`,
    heart: `<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 8-6 5 5 0 0 1 8 6c-2 4.5-9 9-9 9z"/>`,
    travel: `<path d="M7 7h10v13H7z"/><path d="M9 7V5h6v2M10 10h4"/>`,
    brush: `<path d="M8 3h8v5H8z"/><path d="M10 8v13M14 8v13"/>`,
    tooth: `<path d="M8 3c2 0 2 1 4 1s2-1 4-1c2 0 3 2 2 5l-2 10c-.3 1.4-2 1.4-2.3 0L12 12l-1.7 6c-.3 1.4-2 1.4-2.3 0L6 8c-1-3 0-5 2-5z"/>`,
    perfume: `<path d="M9 3h6v4H9z"/><path d="M8 7h8l2 13H6z"/><path d="M10 12h4"/>`,
    razor: `<path d="M5 6h14M12 6v15M9 21h6"/>`,
    beard: `<path d="M7 9c0 7 10 7 10 0"/><path d="M9 14c1 2 5 2 6 0"/>`,
    hair: `<path d="M6 20c0-8 2-16 10-16 3 0 4 2 4 5 0 5-3 8-8 8"/>`,
    gift: `<path d="M4 10h16v10H4z"/><path d="M12 10v10M4 14h16M7 6c0-2 4-2 5 4M17 6c0-2-4-2-5 4"/>`,
    kids: `<circle cx="12" cy="7" r="3"/><path d="M6 21c1-5 11-5 12 0"/>`
  };

  return `
    <svg class="br-menu-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      ${icons[key] || icons.grid}
    </svg>
  `;
}

/* =========================================================
   DESKTOP: Add icons to loaded mega-menu links
   ========================================================= */
function initDesktopMegaMenuIcons() {
  document.querySelectorAll("nav.mega-menu .menu-section:not(.brands) li a").forEach((link) => {
    if (link.querySelector(".desktop-menu-icon")) return;

    const label = link.textContent.trim();

    link.innerHTML = `
      <span class="desktop-menu-icon" aria-hidden="true">${brMenuIcon(label)}</span>
      <span class="desktop-menu-label">${label}</span>
    `;
  });
}

/* =========================================================
   DESKTOP: Mega-menu hover/click (category-bar -> panels)
   ========================================================= */
function initDesktopMegaMenuHover() {
  const barItems = document.querySelectorAll(".category-bar .category-item");
  const panels = document.querySelectorAll("nav.mega-menu .menu-panel");
  const navWrap = document.querySelector("nav.mega-menu");

  if (!barItems.length || !panels.length || !navWrap) {
    console.warn("⚠️ Desktop mega-menu: triggers/panels not found");
    return;
  }

  const hideAll = () => panels.forEach((p) => (p.style.display = "none"));

  const showPanel = (key) => {
    hideAll();
    const id = String(key || "").toLowerCase();
    const panel = document.getElementById(id);
    if (panel) panel.style.display = "flex";
  };

  barItems.forEach((li) => {
    li.addEventListener("mouseenter", () => showPanel(li.dataset.category));
    li.addEventListener("click", () => showPanel(li.dataset.category));
  });

  navWrap.addEventListener("mouseleave", hideAll);

  document.addEventListener("click", (e) => {
    if (!navWrap.contains(e.target) && !e.target.closest(".category-bar")) hideAll();
  });

  console.log("✅ Desktop mega-menu hover ready");
}

/* =========================================================
   DESKTOP: Routing for mega-menu links
   - Kategorier -> category.html
   - Toppmerker -> brand-page.html
   ========================================================= */
function initDesktopMegaMenuRoutingSlugs() {
  document.querySelectorAll("nav.mega-menu .menu-panel").forEach((panel) => {
    const panelId = panel.id;
    const categorySlug = slugifyBrandRadar(panelId);

    panel.querySelectorAll("li a").forEach((link) => {
      const text = link.textContent.trim();
      const textSlug = slugifyBrandRadar(text);

      const section = link.closest(".menu-section");
      const headerText = section?.querySelector("h4")?.textContent.trim() || "";
      const genderSlug = mapHeadingToGender(headerText);
      const isBrandLink = section?.classList.contains("brands");
      const kidtype = getKidtypeFromLink(link, genderSlug);

      if (isBrandLink) {
        link.href = `brand-page.html?brand=${encodeURIComponent(text)}`;
        return;
      }

      let url = `category.html?category=${encodeURIComponent(categorySlug)}`;

      if (genderSlug) {
        url += `&gender=${encodeURIComponent(genderSlug)}`;
      }

      if (kidtype) {
        url += `&kidtype=${encodeURIComponent(kidtype)}`;
      }

      if (textSlug && textSlug !== categorySlug) {
        url += `&subcategory=${encodeURIComponent(textSlug)}`;
      }

      link.href = url;
    });
  });

  console.log("✅ Desktop mega-menu routing fixed");
}

/* =========================
   MOBILE DRAWER
   ========================= */
function initMobileDrawer() {
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileOverlay");

  function openMenu(cat = null) {
    if (!drawer || !overlay) {
      console.error("❌ Drawer elements missing");
      return;
    }

    drawer.hidden = false;
    overlay.hidden = false;

    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.classList.add("is-locked");

    if (cat) {
      document.dispatchEvent(
        new CustomEvent("brandradar:drawer:set-category", {
          detail: { cat }
        })
      );
    }
  }

  function closeMenu() {
    if (!drawer || !overlay) return;

    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("is-locked");

    setTimeout(() => {
      drawer.hidden = true;
      overlay.hidden = true;
    }, 220);
  }

  window.BrandRadarDrawerAPI = {
    open: (cat = null) => openMenu(cat),
    close: closeMenu
  };

  if (!drawer || !overlay) {
    console.warn("⚠️ Drawer initialized without DOM");
    return;
  }

  const openBtn = document.querySelector(".mobile-menu-btn");
  const closeBtn = drawer.querySelector(".mobile-drawer-close");
  const backBtn = drawer.querySelector(".mobile-drawer-back");
  const drawerSearchInput = document.getElementById("mobileDrawerSearchInput");

  if (openBtn) {
    openBtn.addEventListener("click", () => openMenu());
  }

  overlay.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (backBtn) backBtn.addEventListener("click", closeMenu);

  if (drawerSearchInput) {
    drawerSearchInput.setAttribute("readonly", "readonly");

    const routeToMainSearch = () => {
      const mainSearchInput = document.getElementById("search-input");
      if (!mainSearchInput) return;

      closeMenu();

      setTimeout(() => {
        mainSearchInput.focus({ preventScroll: true });
        mainSearchInput.dispatchEvent(new Event("focus", { bubbles: true }));
      }, 240);
    };

    drawerSearchInput.addEventListener("click", routeToMainSearch);
    drawerSearchInput.addEventListener("focus", (e) => {
      e.preventDefault();
      routeToMainSearch();
    });
  }
}

/* =========================
   SEARCH PAGE TRIGGERS
   Én stabil triggerkilde for search-mobile
   ========================= */
function initSearchMobilePageTriggers() {
  if (!document.body.classList.contains("is-search-page")) return;

  const backBtn = document.querySelector(".m-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (history.length > 1) history.back();
      else location.href = "index.html";
    });
  }

  document.addEventListener("click", (e) => {
    const openAllBtn = e.target.closest(".m-allcats-btn");
    if (openAllBtn) {
      e.preventDefault();
      window.BrandRadarDrawerAPI?.open();
      return;
    }

    const quickOpenBtn = e.target.closest("[data-open-drawer-cat]");
    if (quickOpenBtn) {
      e.preventDefault();
      const cat = quickOpenBtn.getAttribute("data-open-drawer-cat");
      window.BrandRadarDrawerAPI?.open(cat);
    }
  });
}

/* =========================
   MOBILE BROWSE MENU
   Kategori -> dynamiske tabs -> underkategoriliste
   ========================= */
function initMobileBrowseMenu() {
  const drawer = document.getElementById("mobileDrawer");
  if (!drawer) return;

  const topcatButtons = drawer.querySelectorAll(".m-chip[data-cat]");
  const levelTwoWrap = document.getElementById("mDrawerLevelTwo");
  const subcatGrid = document.getElementById("mSubcatGrid");
  const brandRow = document.getElementById("mBrandRow");
  const resultsWrap = document.getElementById("mDrawerResults");
  const brandsWrap = document.getElementById("mBrandsWrap");
  const subcatTitleEl = document.getElementById("mSubcatTitle");
  const drawerSearchInput = document.getElementById("mobileDrawerSearchInput");

  if (!topcatButtons.length || !levelTwoWrap || !subcatGrid || !brandRow || !resultsWrap || !brandsWrap || !subcatTitleEl) {
    return;
  }

  let megaDoc = null;
  let currentCat = "clothing";
  let currentGroupIndex = 0;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setActiveTopcat(cat) {
    topcatButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.cat === cat);
    });

    if (drawerSearchInput) {
      drawerSearchInput.placeholder = "Søk produkter eller merker";
    }
  }

  function rowHTML(label, href) {
    return `
      <a class="m-row" href="${href}">
        <span class="m-row-icon" aria-hidden="true">${brMenuIcon(label)}</span>
        <span class="m-row-label">${escapeHtml(label)}</span>
        <span class="m-row-arrow" aria-hidden="true">›</span>
      </a>
    `;
  }

  function levelButtonHTML(label, index, isActive) {
    return `
      <button
        class="m-level-btn ${isActive ? "is-active" : ""}"
        type="button"
        data-group-index="${index}"
        aria-pressed="${isActive ? "true" : "false"}"
      >
        <span class="m-level-btn-label">${escapeHtml(label)}</span>
      </button>
    `;
  }

  function getPrimarySection(block) {
    const nonBrand = block.querySelector(".menu-section:not(.brands)");
    return nonBrand || block.querySelector(".menu-section");
  }

  function collectGroups(panel) {
    const blocks = [...panel.querySelectorAll(".menu-block")];

    if (blocks.length) {
      return blocks
        .map((block, index) => {
          const section = getPrimarySection(block);
          const label = section?.querySelector("h4")?.textContent.trim() || `Valg ${index + 1}`;
          return { index, label, block };
        })
        .filter((g) => g.label);
    }

    const sections = [...panel.querySelectorAll(".menu-section:not(.brands)")];
    return sections
      .map((section, index) => ({
        index,
        label: section.querySelector("h4")?.textContent.trim() || `Valg ${index + 1}`,
        block: section.parentElement || section
      }))
      .filter((g) => g.label);
  }

  function collectSubLinks(group) {
    const section = getPrimarySection(group.block);
    if (!section) return [];

    const links = [...section.querySelectorAll("ul li a")];
    const genderSlug = mapHeadingToGender(group.label);

    const seen = new Set();
    const unique = [];

    for (const a of links) {
      const label = a.textContent.trim();
      if (!label) continue;

      const kidtype = getKidtypeFromLink(a, genderSlug);
      const key = `${label}__${kidtype || ""}`;

      if (seen.has(key)) continue;
      seen.add(key);

      unique.push({ label, kidtype });
    }

    return unique;
  }

  function collectBrandLinks(group) {
    return [...group.block.querySelectorAll(".menu-section.brands ul li a")]
      .map((a) => a.textContent.trim())
      .filter(Boolean)
      .filter((brand, i, arr) => arr.indexOf(brand) === i);
  }

  function buildCategoryHref(cat, groupLabel, label, kidtype) {
    let href = `category.html?category=${encodeURIComponent(cat)}`;

    const genderSlug = mapHeadingToGender(groupLabel);
    if (genderSlug) {
      href += `&gender=${encodeURIComponent(genderSlug)}`;
    }

    if (kidtype) {
      href += `&kidtype=${encodeURIComponent(kidtype)}`;
    }

    href += `&subcategory=${encodeURIComponent(slugifyBrandRadar(label))}`;
    return href;
  }

  function renderLevelTwo(groups) {
    if (!groups.length) {
      levelTwoWrap.innerHTML = "";
      levelTwoWrap.hidden = true;
      return;
    }

    levelTwoWrap.hidden = groups.length <= 1;

    levelTwoWrap.innerHTML = groups
      .map((group, index) =>
        levelButtonHTML(group.label, index, index === currentGroupIndex)
      )
      .join("");
  }

  function renderFallback(cat) {
    const labelMap = {
      clothing: "Klær",
      shoes: "Sko",
      gymcorner: "Gymcorner",
      accessories: "Tilbehør",
      selfcare: "Selfcare"
    };

    setActiveTopcat(cat);
    resultsWrap.hidden = false;
    levelTwoWrap.innerHTML = "";
    levelTwoWrap.hidden = true;
    subcatTitleEl.textContent = labelMap[cat] || "Kategorier";

    subcatGrid.innerHTML = rowHTML(
      `Se alle i ${labelMap[cat] || cat}`,
      `category.html?category=${encodeURIComponent(cat)}`
    );

    brandsWrap.hidden = true;
    brandRow.innerHTML = "";
  }

  function render() {
    if (!megaDoc) {
      renderFallback(currentCat);
      return;
    }

    const panel = megaDoc.querySelector(`.menu-panel#${currentCat}`);
    if (!panel) {
      renderFallback(currentCat);
      return;
    }

    const groups = collectGroups(panel);
    if (!groups.length) {
      renderFallback(currentCat);
      return;
    }

    if (currentGroupIndex == null || currentGroupIndex >= groups.length) {
      currentGroupIndex = 0;
    }

    setActiveTopcat(currentCat);
    renderLevelTwo(groups);

    const group = groups[currentGroupIndex];
    const subcats = collectSubLinks(group);
    const brands = collectBrandLinks(group);

    subcatTitleEl.textContent = group.label;
    resultsWrap.hidden = false;

    subcatGrid.innerHTML = subcats.length
      ? subcats
          .map(({ label, kidtype }) => {
            const href = buildCategoryHref(currentCat, group.label, label, kidtype);
            return rowHTML(label, href);
          })
          .join("")
      : rowHTML(
          `Se alle i ${group.label}`,
          `category.html?category=${encodeURIComponent(currentCat)}`
        );

    brandsWrap.hidden = !brands.length;
    brandRow.innerHTML = brands
      .slice(0, 12)
      .map((brand) => {
        const href = `brand-page.html?brand=${encodeURIComponent(brand)}`;
        return `<a class="m-brand-pill" href="${href}">${escapeHtml(brand)}</a>`;
      })
      .join("");
  }

  function loadMegaOnce() {
    if (megaDoc) return Promise.resolve();

    return fetch("mega-menu.html", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load mega-menu.html");
        return r.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        megaDoc = parser.parseFromString(html, "text/html");
      });
  }

  function setCategory(cat) {
    const nextCat = String(cat || "").toLowerCase().trim();
    if (!nextCat) return;

    currentCat = nextCat;
    currentGroupIndex = 0;

    loadMegaOnce()
      .then(() => render())
      .catch((err) => {
        console.error("❌ Mobile browse menu render failed:", err);
        renderFallback(currentCat);
      });
  }

  topcatButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setCategory(btn.dataset.cat);
    });
  });

  levelTwoWrap.addEventListener("click", async (e) => {
    const btn = e.target.closest(".m-level-btn[data-group-index]");
    if (!btn) return;

    const index = Number(btn.dataset.groupIndex);
    if (Number.isNaN(index)) return;

    currentGroupIndex = index;

    try {
      await loadMegaOnce();
      render();
    } catch (err) {
      console.error("❌ Failed to render level two:", err);
      renderFallback(currentCat);
    }
  });

  document.addEventListener("brandradar:drawer:set-category", (e) => {
    setCategory(e.detail?.cat);
  });

  const activeCatBtn = drawer.querySelector(".m-chip.is-active[data-cat]");
  if (activeCatBtn) currentCat = activeCatBtn.dataset.cat;

  loadMegaOnce()
    .then(() => {
      currentGroupIndex = 0;
      render();
    })
    .catch((err) => {
      console.error("❌ Initial mobile browse menu load failed:", err);
      renderFallback(currentCat);
    });
}

/* =========================
   MOBILE BOTTOM NAV ACTIVE
   ========================= */
(function () {
  const mq = window.matchMedia("(max-width: 768px)");
  if (!mq.matches) return;

  const nav = document.querySelector(".m-bottom-nav");
  if (!nav) return;

  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  nav.querySelectorAll("[data-route]").forEach(a => {
    const route = a.getAttribute("data-route");
    const hit =
      (route === "index" && (path === "" || path === "index.html")) ||
      (route === "favoritter" && path.includes("favoritter")) ||
      (route === "brands" && path.includes("brands")) ||
      (route === "search" && path.includes("search-mobile"));
    if (hit) a.classList.add("is-active");
  });

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");

    if (action === "focus-search") {
      const input = document.getElementById("search-input");
      if (input) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => input.focus({ preventScroll: true }), 250);
      }
    }

    if (action === "open-menu") {
      document.querySelector(".mobile-menu-btn")?.click();
    }
  });
})();
