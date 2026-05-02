// assets/js/language-system.js

(function () {
  const STORAGE_KEY = "brandradar_lang";

  const translations = {
    no: {
      home: "Hjem",
      news: "Nyheter",
      brands: "Brands",
      favorites: "Favoritter",
      luxury: "Luxury Corner ✨",
      search_placeholder: "Søk etter produkter, brands...",
      see_all_deals: "Se alle deals",
      radar_picks: "Radar Picks",
      top_brands: "Top Brands",
      shop_now: "Shop nå",
      view_product: "Se produkt",
      add_favorite: "Legg til favoritt",
      remove_favorite: "Fjern favoritt",
      best_price: "Beste pris",
      updated_regularly: "Oppdatert jevnlig",

      // 🔥 NYE (fra product-card-engine)
      one_store: "1 butikk",
      stores: "butikker",
      from_price: "Fra",
      no_rating: "Ingen rating",
      rating: "Rating",
      out_of_5: "av 5",
      unnamed_product: "Uten navn"
    },

    en: {
      home: "Home",
      news: "News",
      brands: "Brands",
      favorites: "Favorites",
      luxury: "Luxury Corner ✨",
      search_placeholder: "Search products, brands...",
      see_all_deals: "See all deals",
      radar_picks: "Radar Picks",
      top_brands: "Top Brands",
      shop_now: "Shop now",
      view_product: "View product",
      add_favorite: "Add to favorites",
      remove_favorite: "Remove favorite",
      best_price: "Best price",
      updated_regularly: "Updated regularly",

      // 🔥 NYE (fra product-card-engine)
      one_store: "1 store",
      stores: "stores",
      from_price: "From",
      no_rating: "No rating",
      rating: "Rating",
      out_of_5: "out of 5",
      unnamed_product: "Unnamed product"
    }
  };

  function detectLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "no" || saved === "en") return saved;

    const languages = navigator.languages || [navigator.language || ""];
    const browserLang = languages.join(" ").toLowerCase();

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const looksNorwegian =
      browserLang.includes("no") ||
      browserLang.includes("nb") ||
      browserLang.includes("nn") ||
      timezone === "Europe/Oslo";

    return looksNorwegian ? "no" : "en";
  }

  let currentLang = detectLanguage();

  function t(key, fallback = "") {
    return translations[currentLang]?.[key] || translations.no?.[key] || fallback || key;
  }

  function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = t(key, el.textContent);
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      el.setAttribute("placeholder", t(key, el.getAttribute("placeholder") || ""));
    });

    root.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.dataset.i18nTitle;
      el.setAttribute("title", t(key, el.getAttribute("title") || ""));
    });

    document.documentElement.lang = currentLang === "no" ? "no" : "en";
  }

  function setLanguage(lang) {
    if (lang !== "no" && lang !== "en") return;

    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();

    window.dispatchEvent(
      new CustomEvent("brandradar:languagechange", {
        detail: { lang }
      })
    );
  }

  window.BrandRadarLang = {
    t,
    get: () => currentLang,
    set: setLanguage,
    apply: applyTranslations
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
  });
})();
