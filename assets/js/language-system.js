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
      remove_favorite: "Fjern fra favoritter",
      best_price: "Beste pris",
      updated_regularly: "Oppdatert jevnlig",

      one_store: "1 butikk",
      stores: "butikker",
      from_price: "Fra",
      no_rating: "Ingen rating",
      rating: "Rating",
      out_of_5: "av 5",
      unnamed_product: "Uten navn",

      no_deals_now: "Ingen deals akkurat nå.",
      could_not_load_deals: "Kunne ikke laste deals.",
      popular_choice: "Populært valg",
      product: "Produkt",
      no_picks_now: "Ingen picks akkurat nå.",
      could_not_load_picks: "Kunne ikke laste picks.",
      no_spotlight_now: "Ingen spotlight-produkter akkurat nå.",
      explore_product: "Utforsk produkt",
      no_new_products_now: "Ingen nye produkter akkurat nå.",
      could_not_load_spotlight: "Kunne ikke laste spotlight.",
      could_not_load_newsfeed: "Kunne ikke laste nyhetsfeed.",

      fetch_error: "Feil ved henting av",
      deals_label: "DEALS",
      spotlight: "Spotlight",
      show_image: "Vis bilde",
      of: "av",
      weekly_spotlight: "Ukens Spotlight",
      spotlight_fallback_text: "Et håndplukket produkt denne uken."
      
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

      one_store: "1 store",
      stores: "stores",
      from_price: "From",
      no_rating: "No rating",
      rating: "Rating",
      out_of_5: "out of 5",
      unnamed_product: "Unnamed product",

      no_deals_now: "No deals right now.",
      could_not_load_deals: "Could not load deals.",
      popular_choice: "Popular choice",
      product: "Product",
      no_picks_now: "No picks right now.",
      could_not_load_picks: "Could not load picks.",
      no_spotlight_now: "No spotlight products right now.",
      explore_product: "Explore product",
      no_new_products_now: "No new products right now.",
      could_not_load_spotlight: "Could not load spotlight.",
      could_not_load_newsfeed: "Could not load news feed.",
  
      fetch_error: "Error fetching",
      deals_label: "DEALS",
      spotlight: "Spotlight",
      show_image: "Show image",
      of: "of",
      weekly_spotlight: "Weekly Spotlight",
      spotlight_fallback_text: "A selected product this week."
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
