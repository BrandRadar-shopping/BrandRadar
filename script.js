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
      initDesktopMegaMenuRoutingSlugs();
      brApplyMegaMenuLanguage(menuContainer);
      initDesktopMegaMenuHover();
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

/* =========================================================
   MEGA MENU LANGUAGE HELPERS
   - Bruker norsk originaltekst til routing/icons
   - Viser oversatt tekst i UI
   ========================================================= */
const BR_MEGA_MENU_TRANSLATIONS = {
  en: {
    "Herre": "Men",
    "Dame": "Women",
    "Barn": "Kids",
    "Jente": "Girls",
    "Gutt": "Boys",
    "Størrelser": "Sizes",
    "Toppmerker": "Top brands",
    "Kategorier": "Categories",
    "Kosttilskudd": "Supplements",
    "Utstyr": "Equipment",

    "Klær": "Clothing",
    "Sko": "Shoes",
    "Tilbehør": "Accessories",
    "Selfcare": "Selfcare",
    "Gymcorner": "Gymcorner",

    "Se alle i Klær": "See all in Clothing",
    "Se alle i Sko": "See all in Shoes",
    "Se alle i Gymcorner": "See all in Gymcorner",
    "Se alle i Tilbehør": "See all in Accessories",
    "Se alle i Selfcare": "See all in Selfcare",

    "Gensere & hoodies": "Sweaters & hoodies",
    "Sweats & hettegensere": "Sweats & hoodies",
    "T-skjorter": "T-shirts",
    "T-skjorter & polo": "T-shirts & polos",
    "T-skjorter & topper": "T-shirts & tops",
    "Skjorter": "Shirts",
    "Bukser": "Pants",
    "Bukser & shorts": "Pants & shorts",
    "Jeans": "Jeans",
    "Jakker": "Jackets",
    "Jakker & blazere": "Jackets & blazers",
    "Yttertøy": "Outerwear",
    "Kåper": "Coats",
    "Frakker": "Coats",
    "Cardigans": "Cardigans",
    "Gensere & cardigans": "Sweaters & cardigans",
    "Kjoler": "Dresses",
    "Skjørt": "Skirts",
    "Gymwear": "Gymwear",
    "Dress & pentøy": "Suits & formalwear",
    "Dresser": "Suits",
    "Undertøy & sokker": "Underwear & socks",
    "Sport": "Sport",
    "Sport & trening": "Sport & training",
    "Sportsklær": "Sportswear",
    "Onepiece": "Onepiece",

    "Sneakers": "Sneakers",
    "Boots & støvler": "Boots",
    "Støvletter": "Ankle boots",
    "Boots": "Boots",
    "Støvler": "Boots",
    "Støvler & støvletter": "Boots & ankle boots",
    "Snøresko / Pensko": "Lace-ups / dress shoes",
    "Høye hæler / Pumps": "High heels / pumps",
    "Flate sko": "Flat shoes",
    "Slip-ins": "Slip-ons",
    "Sandaler / Åpne sko": "Sandals / open shoes",
    "Sandaler / Badesko": "Sandals / pool slides",
    "Tøfler": "Slippers",
    "Sportssko": "Sports shoes",
    "Tursko": "Hiking shoes",

    "Proteinpulver": "Protein powder",
    "Proteinbarer": "Protein bars",
    "Kreatin": "Creatine",
    "PWO (preworkout)": "Pre-workout",
    "Vitaminer & Mineraler": "Vitamins & minerals",
    "Drikke": "Drinks",
    "Aminosyrer": "Amino acids",

    "Elektronikk": "Electronics",
    "Strikker": "Resistance bands",
    "Hjemmetrening": "Home training",
    "Kampsport": "Martial arts",
    "Massasjeverktøy": "Massage tools",
    "Vannflasker & shakers": "Water bottles & shakers",
    "Vekter & apparater": "Weights & machines",
    "Treningsbag": "Gym bag",
    "Vektvest": "Weight vest",

    "Luer & caps": "Beanies & caps",
    "Luer & capser": "Beanies & caps",
    "Tørklær & skjerf": "Scarves",
    "Skjerf & sjal": "Scarves & shawls",
    "Hansker & votter": "Gloves & mittens",
    "Hansker": "Gloves",
    "Vesker & kofferter": "Bags & luggage",
    "Vesker": "Bags",
    "Bager & sekker": "Bags & backpacks",
    "Smykker": "Jewelry",
    "Solbriller": "Sunglasses",
    "Klokker": "Watches",
    "Belter": "Belts",
    "Lommebøker": "Wallets",
    "Slips & Tilbehør": "Ties & accessories",
    "Hatter & hodeskjerf": "Hats & headscarves",
    "Hårpynt": "Hair accessories",
    "Bag charms": "Bag charms",
    "Klokker & smykker": "Watches & jewelry",
    "Alle accessories": "All accessories",
    "Vannflasker & mer": "Water bottles & more",

    "Ansikt": "Face",
    "Kroppspleie": "Body care",
    "Deodorant": "Deodorant",
    "Aktiv hudpleie": "Active skincare",
    "K-Beauty": "K-Beauty",
    "Solprodukter": "Sun care",
    "Beauty Tech": "Beauty tech",
    "Mamma & Barn": "Mom & baby",
    "Hudpleiesett": "Skincare sets",
    "Reisestørrelser": "Travel sizes",
    "Hudpleietilbehør": "Skincare accessories",
    "Munnhygiene": "Oral care",
    "Parfyme": "Fragrance",
    "Barbering": "Shaving",
    "Skjegg & Bart": "Beard & moustache",
    "Hudpleie": "Skincare",
    "Hår": "Hair",
    "Gavesett": "Gift sets",

    "Barn 98-134": "Kids 98-134",
    "Ungdom 140-176": "Youth 140-176",
    "Barn (21-34)": "Kids (21-34)",
    "Ungdom (35-42)": "Youth (35-42)"
  }
};

function brCurrentLang() {
  return window.BrandRadarLang?.get?.() || "no";
}

function brTranslateMenuLabel(label) {
  const clean = String(label || "").trim();
  const lang = brCurrentLang();

  if (lang === "no") return clean;
  return BR_MEGA_MENU_TRANSLATIONS[lang]?.[clean] || clean;
}

function brStoreOriginalLabel(el) {
  if (!el) return "";
  if (!el.dataset.brOriginalLabel) {
    el.dataset.brOriginalLabel = el.textContent.trim();
  }
  return el.dataset.brOriginalLabel;
}

function brApplyMegaMenuLanguage(root = document) {
  const scope = root || document;

  scope.querySelectorAll(
    "nav.mega-menu h4, nav.mega-menu .menu-subtitle, nav.mega-menu .desktop-menu-label, .mobile-drawer .m-level-btn-label, .mobile-drawer .m-row-label, .mobile-drawer #mSubcatTitle"
  ).forEach((el) => {
    const original = brStoreOriginalLabel(el);
    el.textContent = brTranslateMenuLabel(original);
  });
}

window.addEventListener("brandradar:languagechange", () => {
  brApplyMegaMenuLanguage(document);
});

function mapHeadingToGender(headerText) {
  const original = String(headerText || "").trim();
  const lower = original.toLowerCase();

  if (lower === "herre" || lower === "men") return "Men";
  if (lower === "dame" || lower === "women") return "Women";
  if (lower === "barn" || lower === "kids") return "Kids";

  return null;
}

function getKidtypeFromLink(link, genderSlug) {
  if (genderSlug !== "Kids") return null;

  const ul = link.closest("ul");
  if (!ul) return null;

  let prev = ul.previousElementSibling;
  while (prev) {
    if (prev.classList && prev.classList.contains("menu-subtitle")) {
      const txt = prev.dataset.brOriginalLabel || prev.textContent.trim();
      if (txt === "Jente" || txt === "Gutt") return txt;
      return null;
    }
    prev = prev.previousElementSibling;
  }

  return null;
}

/* =========================================================
   BRANDRADAR MENU ICONS — SVG asset based (UPDATED PATHS)
   ========================================================= */
const BR_MENU_ICON_ASSETS = {
  /* ================================
     CLOTHING
  ================================ */
  "Gensere & hoodies": "icons/menu/clothing/hoodie.svg",
  "Sweats & hettegensere": "icons/menu/clothing/hoodie.svg",

  "T-skjorter": "icons/menu/clothing/tshirt.svg",
  "T-skjorter & polo": "icons/menu/clothing/tshirt.svg",
  "T-skjorter & topper": "icons/menu/clothing/tshirt.svg",

  "Skjorter": "icons/menu/clothing/shirt.svg",

  "Bukser": "icons/menu/clothing/pants.svg",
  "Bukser & shorts": "icons/menu/clothing/pants.svg",

  "Jeans": "icons/menu/clothing/jeans.svg",

  "Jakker": "icons/menu/clothing/jacket.svg",
  "Jakker & blazere": "icons/menu/clothing/women-blazer.svg",
  "Yttertøy": "icons/menu/clothing/jacket.svg",

  "Kåper": "icons/menu/clothing/coat.svg",
  "Frakker": "icons/menu/clothing/coat.svg",

  "Cardigans": "icons/menu/clothing/cardigan.svg",
  "Gensere & cardigans": "icons/menu/clothing/cardigan.svg",

  "Kjoler": "icons/menu/clothing/dress.svg",
  "Skjørt": "icons/menu/clothing/skirt.svg",

  "Gymwear": "icons/menu/supplements/dumbbell.svg",

  "Sport": "icons/menu/clothing/sport.svg",
  "Sport & trening": "icons/menu/clothing/sport.svg",
  "Sportsklær": "icons/menu/clothing/sport.svg",

  "Dress & pentøy": "icons/menu/clothing/suit.svg",
  "Dresser": "icons/menu/clothing/suit.svg",

  "Undertøy & sokker": "icons/menu/clothing/socks.svg",
  "Onepiece": "icons/menu/clothing/onesie.svg",

  /* ================================
     SHOES
  ================================ */
  "Sneakers": "icons/menu/shoes/sneakers.svg",

  "Boots & støvler": "icons/menu/shoes/women-boots.svg",
  "Støvletter": "icons/menu/shoes/women-boots.svg",

  "Boots": "icons/menu/shoes/men-boots.svg",
  "Støvler": "icons/menu/shoes/men-boots.svg",
  "Støvler & støvletter": "icons/menu/shoes/men-boots.svg",

  "Snøresko / Pensko": "icons/menu/shoes/dress-shoes.svg",
  "Høye hæler / Pumps": "icons/menu/shoes/heels.svg",
  "Flate sko": "icons/menu/shoes/flat-shoes.svg",

  "Slip-ins": "icons/menu/shoes/woman-slip-in.svg",

  "Sandaler / Åpne sko": "icons/menu/shoes/sandals.svg",
  "Sandaler / Badesko": "icons/menu/shoes/womans-sandal.svg",

  "Tøfler": "icons/menu/shoes/slippers.svg",
  "Sportssko": "icons/menu/shoes/running-shoes.svg",
  "Tursko": "icons/menu/shoes/hiking-boot.svg",

  /* ================================
     SUPPLEMENTS / GYMCORNER
  ================================ */
  "Proteinpulver": "icons/menu/supplements/powder.svg",
  "Proteinbarer": "icons/menu/supplements/protein-bar.svg",
  "Kreatin": "icons/menu/supplements/powder.svg",
  "PWO (preworkout)": "icons/menu/supplements/bolt.svg",
  "Vitaminer & Mineraler": "icons/menu/supplements/pill.svg",
  "Drikke": "icons/menu/supplements/bottle.svg",
  "Aminosyrer": "icons/menu/supplements/capsule.svg",

  "Elektronikk": "icons/menu/accessories/watch.svg",
  "Strikker": "icons/menu/supplements/band.svg",
  "Hjemmetrening": "icons/menu/supplements/home-gym.svg",
  "Kampsport": "icons/menu/supplements/combat.svg",
  "Massasjeverktøy": "icons/menu/supplements/massage.svg",
  "Vannflasker & shakers": "icons/menu/supplements/bottle.svg",
  "Vekter & apparater": "icons/menu/supplements/dumbbell.svg",
  "Treningsbag": "icons/menu/supplements/gym-bag.svg",
  "Vektvest": "icons/menu/supplements/vest.svg",

  /* ================================
     ACCESSORIES
  ================================ */
  "Luer & caps": "icons/menu/accessories/cap.svg",

  "Tørklær & skjerf": "icons/menu/accessories/scarf.svg",
  "Skjerf & sjal": "icons/menu/accessories/scarf.svg",

  "Hansker & votter": "icons/menu/accessories/gloves.svg",

  "Vesker & kofferter": "icons/menu/accessories/bag.svg",
  "Vesker": "icons/menu/accessories/bag.svg",
  "Bager & sekker": "icons/menu/accessories/backpack.svg",

  "Smykker": "icons/menu/accessories/jewelry.svg",
  "Solbriller": "icons/menu/accessories/sunglasses.svg",

  "Klokker": "icons/menu/accessories/watch.svg",
  "Belter": "icons/menu/accessories/belt.svg",
  "Lommebøker": "icons/menu/accessories/wallet.svg",

  "Slips & Tilbehør": "icons/menu/accessories/tie.svg",
  "Hatter & hodeskjerf": "icons/menu/accessories/hat.svg",

  "Hårpynt": "icons/menu/accessories/sparkle.svg",
  "Bag charms": "icons/menu/accessories/sparkle.svg",

  "Klokker & smykker": "icons/menu/accessories/jewelry.svg",
  "Alle accessories": "icons/menu/general/grid.svg",

  /* ================================
     SELFCARE
  ================================ */
  "Ansikt": "icons/menu/selfcare/face.svg",
  "Kroppspleie": "icons/menu/selfcare/bodycare.svg",
  "Deodorant": "icons/menu/selfcare/deodorant.svg",
  "Aktiv hudpleie": "icons/menu/selfcare/drop.svg",
  "K-Beauty": "icons/menu/accessories/sparkle.svg",
  "Solprodukter": "icons/menu/selfcare/sun.svg",
  "Beauty Tech": "icons/menu/selfcare/device.svg",
  "Mamma & Barn": "icons/menu/selfcare/heart.svg",
  "Hudpleiesett": "icons/menu/selfcare/bodycare.svg",
  "Reisestørrelser": "icons/menu/selfcare/travel.svg",
  "Hudpleietilbehør": "icons/menu/selfcare/brush.svg",
  "Munnhygiene": "icons/menu/selfcare/tooth.svg",
  "Parfyme": "icons/menu/selfcare/perfume.svg",
  "Barbering": "icons/menu/selfcare/razor.svg",
  "Skjegg & Bart": "icons/menu/selfcare/beard.svg",
  "Hudpleie": "icons/menu/selfcare/drop.svg",
  "Hår": "icons/menu/selfcare/hair.svg",
  "Gavesett": "icons/menu/selfcare/gift.svg",

  /* ================================
     GENERAL
  ================================ */
  "Alle kategorier": "icons/menu/general/grid.svg",
  "Barn 98-134": "icons/menu/general/kids.svg",
  "Ungdom 140-176": "icons/menu/general/kids.svg"
};

function brMenuIcon(label) {
  const cleanLabel = String(label || "").trim();
  const src = BR_MENU_ICON_ASSETS[cleanLabel] || "icons/menu/general/grid.svg";

  return `
    <img
      class="br-menu-svg br-menu-img-icon"
      src="${src}"
      alt=""
      aria-hidden="true"
      loading="lazy"
    >
  `;
}

/* =========================================================
   DESKTOP: Add icons to loaded mega-menu links
   ========================================================= */
function initDesktopMegaMenuIcons() {
  document.querySelectorAll("nav.mega-menu .menu-section:not(.brands) li a").forEach((link) => {
    if (link.querySelector(".desktop-menu-icon")) return;

    const label = link.textContent.trim();
    link.dataset.brOriginalLabel = label;

    link.innerHTML = `
      <span class="desktop-menu-icon" aria-hidden="true">${brMenuIcon(label)}</span>
      <span class="desktop-menu-label" data-br-original-label="${label}">${label}</span>
    `;
  });

  document.querySelectorAll("nav.mega-menu h4, nav.mega-menu .menu-subtitle").forEach((el) => {
    brStoreOriginalLabel(el);
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
      const text = link.dataset.brOriginalLabel || link.textContent.trim();
      const textSlug = slugifyBrandRadar(text);

      const section = link.closest(".menu-section");
      const headerEl = section?.querySelector("h4");
      const headerText = headerEl?.dataset.brOriginalLabel || headerEl?.textContent.trim() || "";
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
    moveSearchIntoDrawer();

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
      moveSearchBack();
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

  const drawerSearchSlot = document.getElementById("mobileDrawerSearchSlot");
  const siteSearch = document.getElementById("site-search");

  let siteSearchHomeMarker = null;

  if (siteSearch && siteSearch.parentNode) {
    siteSearchHomeMarker = document.createComment("brandradar-site-search-home");
    siteSearch.parentNode.insertBefore(siteSearchHomeMarker, siteSearch);
  }

  function moveSearchIntoDrawer() {
    if (!document.body.classList.contains("is-search-page")) return;
    if (!drawerSearchSlot || !siteSearch) return;

    drawerSearchSlot.appendChild(siteSearch);
    siteSearch.classList.add("is-in-drawer");
  }

  function moveSearchBack() {
    if (!siteSearch || !siteSearchHomeMarker || !siteSearchHomeMarker.parentNode) return;

    siteSearchHomeMarker.parentNode.insertBefore(siteSearch, siteSearchHomeMarker.nextSibling);
    siteSearch.classList.remove("is-in-drawer");
  }

  if (openBtn) {
    openBtn.addEventListener("click", () => openMenu());
  }

  overlay.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (backBtn) backBtn.addEventListener("click", closeMenu);
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
      drawerSearchInput.placeholder = window.BrandRadarLang?.t?.("search_placeholder", "Søk produkter eller merker") || "Søk produkter eller merker";
    }
  }

  function rowHTML(label, href) {
    const displayLabel = brTranslateMenuLabel(label);

    return `
      <a class="m-row" href="${href}">
        <span class="m-row-icon" aria-hidden="true">${brMenuIcon(label)}</span>
        <span class="m-row-label" data-br-original-label="${escapeHtml(label)}">${escapeHtml(displayLabel)}</span>
        <span class="m-row-arrow" aria-hidden="true">›</span>
      </a>
    `;
  }

  function levelButtonHTML(label, index, isActive) {
    const displayLabel = brTranslateMenuLabel(label);

    return `
      <button
        class="m-level-btn ${isActive ? "is-active" : ""}"
        type="button"
        data-group-index="${index}"
        aria-pressed="${isActive ? "true" : "false"}"
      >
        <span class="m-level-btn-label" data-br-original-label="${escapeHtml(label)}">${escapeHtml(displayLabel)}</span>
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

    const fallbackLabel = labelMap[cat] || "Kategorier";

    setActiveTopcat(cat);
    resultsWrap.hidden = false;
    levelTwoWrap.innerHTML = "";
    levelTwoWrap.hidden = true;

    subcatTitleEl.dataset.brOriginalLabel = fallbackLabel;
    subcatTitleEl.textContent = brTranslateMenuLabel(fallbackLabel);

    subcatGrid.innerHTML = rowHTML(
      `Se alle i ${fallbackLabel}`,
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

    subcatTitleEl.dataset.brOriginalLabel = group.label;
    subcatTitleEl.textContent = brTranslateMenuLabel(group.label);
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

    brApplyMegaMenuLanguage(drawer);
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

  window.addEventListener("brandradar:languagechange", () => {
    render();
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
