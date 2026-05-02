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

      products_title: "Produkter",
search: "Søk",
menu: "Meny",
explore_categories: "Utforsk kategorier",
gymcorner: "Gymcorner",
selfcare: "Selfcare",
home_hero_title: "Oppdag trender. Følg radarene. Finn din stil.",
home_hero_text: "BrandRadar samler de mest ettertraktede produktene fra toppmerker, alt på ett sted.",
explore_luxury: "Utforsk Luxury Corner ✨",
see_collaboration: "Se samarbeid",
what_is_brandradar: "Hva er BrandRadar?",
intro_find_title: "Vi finner",
intro_find_text: "De mest spennende trendene og produktene akkurat nå.",
intro_filter_title: "Vi filtrerer",
intro_filter_text: "Kvalitet uten støy. Vi håndplukker det beste.",
intro_discover_title: "Du oppdager",
intro_discover_text: "Alt samlet på ett sted — fra klær til selfcare.",
explore_universe_title: "Utforsk BrandRadar-universet",
explore_universe_text: "Velg hvor du vil starte reisen – fra eksklusive univers og sterke brands til deals og aktuelle kampanjer.",
discover: "Oppdag",
current_now: "Aktuelt nå",
premium: "Premium",
universe_brands_text: "Utforsk merkeuniverset og oppdag favorittbrandene dine.",
universe_deals_text: "De beste tilbudene akkurat nå – valgt for raskere oversikt.",
universe_luxury_text: "Eksklusive merker og håndplukkede premium-produkter i øverste sjikt.",
trends_campaigns: "Trender & kampanjer",
universe_trends_text: "Oppdag nye drops, aktuelle kampanjer og det som beveger seg nå.",
trending_now: "Trending Right Now",
trending_now_text: "Det som beveger seg mest akkurat nå på radaren",
top_brands_this_week: "Top Brands This Week",
top_brands_text: "Merker som trender på radaren akkurat nå.",
giveaway_title: "Vinn utvalgte produkter",
giveaway_text: "Se aktive giveaways samlet på ett sted og følg konkurransene som er live nå.",
see_giveaways: "Se giveaways",
giveaway_meta: "Aktive giveaways · samlet oversikt",
active_now: "Aktivt nå",
giveaways_one_place: "Giveaways samlet ett sted",
weekly_radar_picks: "Ukens Radar Picks",
weekly_radar_picks_text: "Håndplukket inspirasjon – rett fra radaren vår.",
stay_on_radar: "Hold deg på radaren",
newsletter_text: "Få ukens radar picks og eksklusive nyheter først.",
email_placeholder: "Din e-postadresse",
newsletter_signup: "Meld meg på",
luxury_short: "Luxury",

      could_not_load_radar_picks: "Klarte ikke laste Radar Picks:",
arrows_not_found: "Pilene ble ikke funnet i DOM",
no_featured_brands_now: "Ingen fremhevede brands akkurat nå.",
explore_brand: "Utforsk brand",

      no_product_id: "Ingen produkt-ID i URL",
product_not_found: "Produktet ble ikke funnet!",
product_description_fallback: "Dette premiumproduktet kombinerer kvalitet og stil.",
no_image: "No Image",
lowest_price: "Laveste pris",
one_store_active: "1 butikk aktiv",
stores_active: "butikker aktive",
from_brand: "Fra",
discount: "rabatt",
price_from_one_store: "Pris fra 1 butikk",
price_from: "Pris fra",
product_data_available: "Produktdata tilgjengelig",
active_offers: "Aktive offers",
price_compared_live: "Pris sammenlignes live",
why_product_stands_out: "Hvorfor dette produktet skiller seg ut",
found_one_store_price: "Vi fant 1 butikk med aktiv pris akkurat nå.",
found: "Vi fant",
stores_with_active_prices: "butikker med aktive priser akkurat nå.",
store: "Butikk",
active_store: "Aktiv butikk",
color: "Farge",
size: "Størrelse",
variant: "Variant",
view_offer: "Se tilbud",
buy_best_price: "Kjøp til beste pris",
same_category: "samme kategori",
more_deals_in: "Flere deals i",
no_recommendations: "Ingen anbefalinger tilgjengelig.",

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
      spotlight_fallback_text: "Et håndplukket produkt denne uken.",

      invalid_category: "Ugyldig kategori",
all_brands: "Alle brands",
products: "produkter",
price_label: "Pris",
only_deals: "Kun tilbud",
active_filter: "aktivt filter",
active_filters: "aktive filtre",
show_filters: "Vis filtre",
hide_filters: "Skjul filtre",
deal: "Deal",
buy_now: "Kjøp nå",
deal_may_change: "Tilbudet kan endres hos butikken.",
featured_deals: "Utvalgte deals",
see_all: "Se alle",
deals_hero_title: "De beste dealsene",
deals_hero_text: "Oppdag sesongens beste tilbud fra dine favorittbrands.",
exclusive_deals: "Eksklusive deals",
exclusive_deals_text: "Utvalgte tilbud samlet på ett sted",
new_deals_weekly: "Nye deals hver uke",
new_deals_weekly_text: "Friske tilbud kontinuerlig",
easy_overview: "Enkel oversikt",
easy_overview_text: "Sammenlign priser raskt",
browse_deals: "Browse deals",
all_deals: "Alle deals",
shoes: "Sko",
clothing: "Klær",
gym: "Gym",
accessories: "Tilbehør",
best_discount: "Best rabatt",
weekly_deals: "Ukens Deals",
deals: "Deals",
brandradar_deals: "BrandRadar Deals",
best_deals_now: "De beste dealene akkurat nå",
deals_collection_text: "Her finner du tilbud vi mener er verdt å få med seg — samlet på ett sted, så det blir enklere å finne gode kjøp.",
selected_deals: "Utvalgte deals",
updated_now: "Oppdatert nå",
easier_overview: "Enklere oversikt",
new_products_trends: "Nye Produkter & Trender",
no_products_found: "Ingen produkter funnet.",
all_deals_intro: "Browse hele utvalget, filtrer smart og finn tilbudene som faktisk er relevante.",
deal_feature_desc_primary: "Et sterkt tilbud valgt ut for deg.",
deal_feature_desc_secondary: "Populær deal akkurat nå.",
men: "Herre",
women: "Dame",
kids: "Barn"
      
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

      products_title: "Products",
search: "Search",
menu: "Menu",
explore_categories: "Explore categories",
gymcorner: "Gymcorner",
selfcare: "Selfcare",
home_hero_title: "Discover trends. Follow the radar. Find your style.",
home_hero_text: "BrandRadar brings together sought-after products from top brands, all in one place.",
explore_luxury: "Explore Luxury Corner ✨",
see_collaboration: "See collaboration",
what_is_brandradar: "What is BrandRadar?",
intro_find_title: "We find",
intro_find_text: "The most interesting trends and products right now.",
intro_filter_title: "We filter",
intro_filter_text: "Quality first. We highlight the best finds.",
intro_discover_title: "You discover",
intro_discover_text: "Everything in one place — from clothing to selfcare.",
explore_universe_title: "Explore the BrandRadar universe",
explore_universe_text: "Choose where to start — from premium sections and strong brands to deals and current campaigns.",
discover: "Discover",
current_now: "Current now",
premium: "Premium",
universe_brands_text: "Explore the brand universe and discover your favorite brands.",
universe_deals_text: "The best deals right now — selected for a faster overview.",
universe_luxury_text: "Exclusive brands and selected premium products at the top level.",
trends_campaigns: "Trends & campaigns",
universe_trends_text: "Discover new drops, current campaigns and what is moving right now.",
trending_now: "Trending Right Now",
trending_now_text: "What is moving most on the radar right now",
top_brands_this_week: "Top Brands This Week",
top_brands_text: "Brands trending on the radar right now.",
giveaway_title: "Win selected products",
giveaway_text: "See active giveaways in one place and follow the competitions live now.",
see_giveaways: "See giveaways",
giveaway_meta: "Active giveaways · full overview",
active_now: "Active now",
giveaways_one_place: "Giveaways in one place",
weekly_radar_picks: "Weekly Radar Picks",
weekly_radar_picks_text: "Selected inspiration — straight from our radar.",
stay_on_radar: "Stay on the radar",
newsletter_text: "Get weekly radar picks and exclusive news first.",
email_placeholder: "Your email address",
newsletter_signup: "Sign me up",
luxury_short: "Luxury",

could_not_load_radar_picks: "Could not load Radar Picks:",
arrows_not_found: "Arrows were not found in the DOM",
no_featured_brands_now: "No featured brands right now.",
explore_brand: "Explore brand",
      
      no_product_id: "No product ID in URL",
product_not_found: "Product not found!",
product_description_fallback: "This premium product combines quality and style.",
no_image: "No Image",
lowest_price: "Lowest price",
one_store_active: "1 active store",
stores_active: "active stores",
from_brand: "From",
discount: "discount",
price_from_one_store: "Price from 1 store",
price_from: "Price from",
product_data_available: "Product data available",
active_offers: "Active offers",
price_compared_live: "Price is compared live",
why_product_stands_out: "Why this product stands out",
found_one_store_price: "We found 1 store with an active price right now.",
found: "We found",
stores_with_active_prices: "stores with active prices right now.",
store: "Store",
active_store: "Active store",
color: "Color",
size: "Size",
variant: "Variant",
view_offer: "View offer",
buy_best_price: "Buy at best price",
same_category: "same category",
more_deals_in: "More deals in",
no_recommendations: "No recommendations available.",
      
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
      spotlight_fallback_text: "A selected product this week.",

      invalid_category: "Invalid category",
all_brands: "All brands",
products: "products",
price_label: "Price",
only_deals: "Deals only",
active_filter: "active filter",
active_filters: "active filters",
show_filters: "Show filters",
hide_filters: "Hide filters",
deal: "Deal",
buy_now: "Buy now",
deal_may_change: "The offer may change at the store.",
featured_deals: "Featured deals",
see_all: "See all",
deals_hero_title: "The best deals",
deals_hero_text: "Discover this season’s best offers from your favorite brands.",
exclusive_deals: "Exclusive deals",
exclusive_deals_text: "Selected offers gathered in one place",
new_deals_weekly: "New deals every week",
new_deals_weekly_text: "Fresh offers added regularly",
easy_overview: "Easy overview",
easy_overview_text: "Compare prices quickly",
browse_deals: "Browse deals",
all_deals: "All deals",
shoes: "Shoes",
clothing: "Clothing",
gym: "Gym",
accessories: "Accessories",
best_discount: "Best discount",
weekly_deals: "Weekly Deals",
deals: "Deals",
brandradar_deals: "BrandRadar Deals",
best_deals_now: "The best deals right now",
deals_collection_text: "Find offers worth checking out — gathered in one place so it is easier to discover good buys.",
selected_deals: "Selected deals",
updated_now: "Updated now",
easier_overview: "Easier overview",
new_products_trends: "New Products & Trends",
no_products_found: "No products found.",
all_deals_intro: "Browse the full selection, filter smartly and find the offers that are actually relevant.",
deal_feature_desc_primary: "A strong offer selected for you.",
deal_feature_desc_secondary: "Popular deal right now.",
men: "Men",
women: "Women",
kids: "Kids"
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

  document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".lang-btn");

  function updateActive() {
    const current = window.BrandRadarLang.get();

    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === current);
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      window.BrandRadarLang.set(lang);
      updateActive();
    });
  });

  updateActive();

  window.addEventListener("brandradar:languagechange", updateActive);
});
})();
