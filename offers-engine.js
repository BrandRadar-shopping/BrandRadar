// ======================================================
// 💸 BrandRadar – Offers Engine
// Leser offers + merchants fra Google Sheets / OpenSheet
// og gir oss:
// - billigste pris per produkt
// - antall butikker per produkt
// - full offer-liste til productsiden
//
// Oppgradert versjon:
// - affiliate_url er ikke lenger påkrevd
// - fallback til store_url og merchant_url
// - mer robust cache-håndtering
// - mer fleksibel shipping-logikk
// - bedre brukeropplevelse selv uten affiliate-lenker
// ======================================================

(function () {
  const SHEET_ID = "1FL8gBj-S_D4JlW02u7ZbPokQet1zLO5VBNYvT-74HX8";
  const OFFERS_TAB = "BrandRadarOffers";
  const MERCHANTS_TAB = "BrandRadarMerchants";

  const OFFERS_URL = `https://opensheet.elk.sh/${SHEET_ID}/${OFFERS_TAB}`;
  const MERCHANTS_URL = `https://opensheet.elk.sh/${SHEET_ID}/${MERCHANTS_TAB}`;

  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
  const CACHE_VERSION = "v2"; // øk denne hvis du vil tvinge ny cache etter kodeendringer

  const CACHE_KEYS = {
    offers: `brandradar_offers_cache_${CACHE_VERSION}`,
    merchants: `brandradar_merchants_cache_${CACHE_VERSION}`
  };

  const state = {
    offers: [],
    merchants: [],
    initialized: false,
    initPromise: null
  };

  // ===============================
  // Helpers
  // ===============================

  function toBool(value) {
    return String(value).trim().toLowerCase() === "true";
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;

    const parsed = parseFloat(
      String(value)
        .replace(",", ".")
        .replace(/[^0-9.\-]/g, "")
    );

    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeSlug(value) {
    return normalizeText(value).toLowerCase();
  }

  function formatPrice(price, currency = "NOK") {
    const n = toNumber(price);
    if (n === null) return "";

    if (currency === "NOK") {
      return `${Math.round(n)} kr`;
    }

    return `${Math.round(n)} ${currency}`;
  }

  function getCache(key) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.timestamp || !Array.isArray(parsed.data)) return null;

      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function setCache(key, data) {
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          timestamp: Date.now(),
          data
        })
      );
    } catch {
      // ignore cache errors
    }
  }

  function clearOffersEngineCache() {
    try {
      Object.values(CACHE_KEYS).forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // ignore
    }
  }

  function buildMerchantMap(merchants) {
    const map = new Map();

    merchants.forEach((merchant) => {
      const slug = normalizeSlug(merchant.merchant_slug);
      if (!slug) return;

      map.set(slug, {
        merchant_slug: slug,
        merchant_name: normalizeText(merchant.merchant_name),
        logo_url: normalizeText(merchant.logo_url),
        trusted: toBool(merchant.trusted),
        worldwide_shipping: toBool(merchant.worldwide_shipping),
        affiliate_network: normalizeText(merchant.affiliate_network),
        merchant_url: normalizeText(merchant.merchant_url),
        active: toBool(merchant.active)
      });
    });

    return map;
  }

  function resolveBuyUrl({ affiliate_url, store_url, merchant_url }) {
    return (
      normalizeText(affiliate_url) ||
      normalizeText(store_url) ||
      normalizeText(merchant_url) ||
      ""
    );
  }

  function normalizeOffers(rawOffers, merchantMap) {
    return rawOffers
      .map((offer) => {
        const merchantSlug = normalizeSlug(offer.merchant_slug);
        const merchant = merchantMap.get(merchantSlug) || null;

        const affiliateUrl = normalizeText(offer.affiliate_url);
        const storeUrl = normalizeText(offer.store_url);
        const merchantUrl = merchant?.merchant_url || "";
        const buyUrl = resolveBuyUrl({
          affiliate_url: affiliateUrl,
          store_url: storeUrl,
          merchant_url: merchantUrl
        });

        return {
          offer_id: normalizeText(offer.offer_id),
          product_id: normalizeText(offer.product_id),
          merchant_slug: merchantSlug,
          merchant_name: merchant?.merchant_name || merchantSlug,
          merchant_logo: merchant?.logo_url || "",
          merchant_url: merchantUrl,
          trusted: merchant ? merchant.trusted : false,
          worldwide_shipping: merchant ? merchant.worldwide_shipping : false,
          merchant_active: merchant ? merchant.active : false,
          affiliate_network: merchant?.affiliate_network || "",

          price: toNumber(offer.price),
          old_price: toNumber(offer.old_price),
          currency: normalizeText(offer.currency || "NOK") || "NOK",

          affiliate_url: affiliateUrl,
          store_url: storeUrl,
          buy_url: buyUrl,

          availability: normalizeText(offer.availability || "in_stock").toLowerCase(),
          shipping_scope: normalizeText(offer.shipping_scope || "").toLowerCase(),

          source: normalizeText(offer.source),
          source_program: normalizeText(offer.source_program),
          last_updated: normalizeText(offer.last_updated),

offer_name: normalizeText(offer.offer_name),
variant_type: normalizeText(offer.variant_type).toLowerCase(),
variant_value: normalizeText(offer.variant_value),

active: toBool(offer.active)
        };
      })
      .filter((offer) => offer.product_id && offer.price !== null);
  }

  function isOfferEligible(offer) {
    if (!offer) return false;
    if (!offer.active) return false;
    if (!offer.merchant_active) return false;
    if (!offer.buy_url) return false;
    if (offer.availability === "out_of_stock") return false;

    // Ikke vær for streng på shipping_scope nå.
    // Tomt felt skal være OK.
    // Vi filtrerer bare bort helt eksplisitt utilgjengelige offers senere hvis ønskelig.
    return true;
  }

  function sortByLowestPrice(a, b) {
    return (a.price ?? Infinity) - (b.price ?? Infinity);
  }

  async function fetchJsonWithCache(url, cacheKey) {
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Kunne ikke hente ${url} (${res.status})`);
    }

    const data = await res.json();
    const safeArray = Array.isArray(data) ? data : [];
    setCache(cacheKey, safeArray);
    return safeArray;
  }

  // ===============================
  // Init
  // ===============================

  async function initOffersEngine(options = {}) {
    const { forceRefresh = false } = options;

    if (forceRefresh) {
      clearOffersEngineCache();
      state.initialized = false;
      state.initPromise = null;
      state.offers = [];
      state.merchants = [];
    }

    if (state.initialized) return state;
    if (state.initPromise) return state.initPromise;

    state.initPromise = (async () => {
      try {
        const [rawOffers, rawMerchants] = await Promise.all([
          fetchJsonWithCache(OFFERS_URL, CACHE_KEYS.offers),
          fetchJsonWithCache(MERCHANTS_URL, CACHE_KEYS.merchants)
        ]);

        state.merchants = Array.isArray(rawMerchants) ? rawMerchants : [];
        const merchantMap = buildMerchantMap(state.merchants);

        state.offers = normalizeOffers(
          Array.isArray(rawOffers) ? rawOffers : [],
          merchantMap
        );

        state.initialized = true;
        return state;
      } catch (error) {
        console.error("❌ Offers Engine init feilet:", error);
        state.offers = [];
        state.merchants = [];
        state.initialized = true;
        return state;
      }
    })();

    return state.initPromise;
  }

  // ===============================
  // Public API
  // ===============================

  async function getOffersForProduct(productId) {
    await initOffersEngine();

    const id = normalizeText(productId);

    return state.offers
      .filter((offer) => offer.product_id === id)
      .filter(isOfferEligible)
      .sort(sortByLowestPrice);
  }

  async function getOfferSummaryForProduct(productId) {
    const offers = await getOffersForProduct(productId);

    if (!offers.length) {
      return {
        hasOffers: false,
        lowestPrice: null,
        lowestPriceFormatted: "",
        storeCount: 0,
        offers: []
      };
    }

    const lowest = offers[0];

    return {
      hasOffers: true,
      lowestPrice: lowest.price,
      lowestPriceFormatted: formatPrice(lowest.price, lowest.currency),
      storeCount: offers.length,
      offers
    };
  }

  async function enrichProductsWithOfferSummary(products) {
    await initOffersEngine();

    const safeProducts = Array.isArray(products) ? products : [];

    const enriched = await Promise.all(
      safeProducts.map(async (product) => {
        const id = normalizeText(product.id);
        const summary = await getOfferSummaryForProduct(id);

        return {
          ...product,
          offer_summary: summary
        };
      })
    );

    return enriched;
  }

  window.BrandRadarOffersEngine = {
    init: initOffersEngine,
    getOffersForProduct,
    getOfferSummaryForProduct,
    enrichProductsWithOfferSummary,
    formatPrice,
    clearCache: clearOffersEngineCache
  };
})();
