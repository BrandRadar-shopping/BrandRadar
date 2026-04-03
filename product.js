// ======================================================
// ✅ Product page — Felles for vanlige + Luxury produkter
// Bruker Offers Engine + Product Card Engine
// Inkluderer dynamisk BrandRadar Product Insights
// Oppgradert med smartere product-family / summary engine
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  const productId = String(params.get("id"));
  const isLuxuryParam = params.get("luxury") === "true";

  if (!productId) {
    console.error("❌ Ingen produkt-ID i URL");
    return;
  }

  const MAIN_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const MAIN_SHEET_NAME = "BrandRadarProdukter";

  const LUXURY_SHEET_ID = "1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU";
  const LUXURY_SHEET_NAME = "LuxuryProducts";

  let products = await fetch(`https://opensheet.elk.sh/${MAIN_SHEET_ID}/${MAIN_SHEET_NAME}`)
    .then(r => r.json())
    .catch(() => []);

  let product = products.find(p => String(p.id).trim() === productId);

  if (!product) {
    const luxuryProducts = await fetch(`https://opensheet.elk.sh/${LUXURY_SHEET_ID}/${LUXURY_SHEET_NAME}`)
      .then(r => r.json())
      .catch(() => []);

    const found = luxuryProducts.find(p => String(p.id).trim() === productId);
    if (found) {
      product = { ...found, sheet_source: "luxury" };
      products = luxuryProducts;
    }
  }

  if (!product) {
    alert("Produktet ble ikke funnet!");
    return;
  }

  const isLuxury = isLuxuryParam || product.sheet_source === "luxury";

  document.getElementById("product-title").textContent = product.title || "";
  document.getElementById("product-brand").textContent = product.brand || "";
  document.getElementById("product-desc").textContent =
    product.info || product.description || "Dette premiumproduktet kombinerer kvalitet og stil.";

  const newPriceEl = document.getElementById("new-price");
  const oldPriceEl = document.getElementById("old-price");
  const discountTagEl = document.getElementById("discount-tag");
  const buyLinkEl = document.getElementById("buy-link");

  const rawPrice = product.price
    ? String(product.price).replace(/[^\d.,]/g, "").replace(",", ".")
    : null;
  const numericPrice = rawPrice ? parseFloat(rawPrice) : null;

  let discount = parseFloat(String(product.discount || "").replace(",", "."));
  if (discount && discount < 1) discount *= 100;

  if (numericPrice && discount > 0) {
    const newPrice = Math.round(numericPrice * (1 - discount / 100));
    newPriceEl.textContent = `${newPrice} kr`;
    oldPriceEl.textContent = `${numericPrice} kr`;
    discountTagEl.textContent = `-${discount.toFixed(0)}%`;
  } else {
    newPriceEl.textContent = product.price ? `${product.price} kr` : "";
    oldPriceEl.textContent = "";
    discountTagEl.textContent = "";
  }

  buyLinkEl.href = product.product_url || "#";

  renderProductRating(product);

  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");

  const images = [
    product.image_url,
    product.image2,
    product.image3,
    product.image4
  ].filter(Boolean);

  mainImg.src = images[0] || "https://via.placeholder.com/600x700?text=No+Image";
  thumbs.innerHTML = "";

  images.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.classList.add("thumb");
    if (i === 0) img.classList.add("active");

    img.addEventListener("click", () => {
      document.querySelectorAll(".thumb").forEach(el => el.classList.remove("active"));
      img.classList.add("active");
      mainImg.src = src;
    });

    thumbs.appendChild(img);
  });

  const offerSummary = await renderPriceComparison(product);
  renderProductInsights(product, offerSummary);

  await loadRecommendations(products, product);
  setupFavoriteButton(product);

  if (isLuxury) {
    document.body.classList.add("luxury-mode");
    newPriceEl.style.color = "#d4af37";
  }
});

function renderProductRating(product) {
  const ratingEl = document.getElementById("product-rating");
  if (!ratingEl) return;

  if (
    window.BrandRadarProductCardEngine &&
    typeof window.BrandRadarProductCardEngine.buildRatingMarkup === "function"
  ) {
    ratingEl.innerHTML = window.BrandRadarProductCardEngine.buildRatingMarkup(product.rating, {
      showValue: true,
      emptyMode: "muted"
    });
    return;
  }

  const ratingNum = parseFloat(
    String(product.rating || "").replace(",", ".").replace(/[^0-9.]/g, "")
  );

  ratingEl.textContent = Number.isFinite(ratingNum)
    ? `${ratingNum.toFixed(1)} / 5`
    : "Ingen rating";
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeCategory(value) {
  return normalizeText(value).toLowerCase();
}

function getCombinedProductText(product) {
  return [
    product.title,
    product.brand,
    product.category,
    product.subcategory,
    product.gender,
    product.info,
    product.description
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasAnyKeyword(text, keywords = []) {
  return keywords.some(keyword => text.includes(keyword));
}

function getDiscountPercent(product, offerSummary) {
  const productDiscount = parseFloat(String(product?.discount || "").replace(",", "."));
  if (Number.isFinite(productDiscount) && productDiscount > 0) {
    return productDiscount < 1 ? Math.round(productDiscount * 100) : Math.round(productDiscount);
  }

  const bestOffer = offerSummary?.offers?.[0];
  if (bestOffer?.old_price && bestOffer?.price && bestOffer.old_price > bestOffer.price) {
    return Math.round(((bestOffer.old_price - bestOffer.price) / bestOffer.old_price) * 100);
  }

  return null;
}

function extractProductSignals(product, offerSummary) {
  const text = getCombinedProductText(product);
  const category = normalizeCategory(product.category);
  const brand = normalizeText(product.brand);

  const ratingNum = parseFloat(
    String(product.rating || "").replace(",", ".").replace(/[^0-9.]/g, "")
  );

  const storeCount = offerSummary?.storeCount || 0;
  const hasOffers = !!offerSummary?.hasOffers;
  const hasStrongRating = Number.isFinite(ratingNum) && ratingNum >= 4.5;
  const hasGoodRating = Number.isFinite(ratingNum) && ratingNum >= 4.0;
  const discountPercent = getDiscountPercent(product, offerSummary);
  const hasDiscount = !!discountPercent;

  const isFoodLike = hasAnyKeyword(text, [
    "proteinbar", "protein bar", "proteinbars", "bar", "snack",
    "hazelnut", "choco", "chocolate", "cookie", "caramel", "peanut", "soft bar"
  ]);

  const isSupplementLike = hasAnyKeyword(text, [
    "whey", "protein", "creatine", "pre workout", "pre-workout", "bcaa",
    "supplement", "mass gainer", "electrolyte", "isolate"
  ]);

  const isSneaker = hasAnyKeyword(text, [
    "sneaker", "air max", "air jordan", "trainer", "pulse", "rm", "shoe", "sko"
  ]);

  const isBoot = hasAnyKeyword(text, [
    "boot", "boots", "winter boot", "snow", "snowbae"
  ]);

  const isJacket = hasAnyKeyword(text, [
    "jacket", "jakke", "shell", "beta", "outerwear", "anorak"
  ]);

  const isTechnicalOuterwear = hasAnyKeyword(text, [
    "shell", "beta", "gore", "waterproof", "outdoor", "technical", "arc'teryx", "arcteryx"
  ]);

  const isLifestyleFootwear = hasAnyKeyword(text, [
    "air max", "air jordan", "lifestyle", "street", "pulse", "rm", "casual"
  ]);

  const isPerformanceFootwear = hasAnyKeyword(text, [
    "running",
    "training",
    "performance",
    "sport",
    "basketball",
    "court",
    "low basketball",
    "anthony edwards",
    "ae 1",
    "ae1"
  ]);

  const isWinterStyle = hasAnyKeyword(text, [
    "winter", "snow", "boot", "insulated"
  ]);

  const isFlavorFocused = hasAnyKeyword(text, [
    "hazelnut", "choco", "chocolate", "cookie", "caramel", "peanut", "vanilla", "salted"
  ]);

  return {
    text,
    category,
    brand,
    ratingNum,
    storeCount,
    hasOffers,
    hasStrongRating,
    hasGoodRating,
    discountPercent,
    hasDiscount,
    isFoodLike,
    isSupplementLike,
    isSneaker,
    isBoot,
    isJacket,
    isTechnicalOuterwear,
    isLifestyleFootwear,
    isPerformanceFootwear,
    isWinterStyle,
    isFlavorFocused
  };
}

function detectProductFamily(product, offerSummary) {
  const s = extractProductSignals(product, offerSummary);

  if (s.isFoodLike) return "food_protein_bar";
  if (s.isSupplementLike) return "supplement_general";

  if (s.category === "shoes" && s.isBoot) return "footwear_boot";
  if (s.category === "shoes" && s.isSneaker) return "footwear_sneaker";
  if (s.category === "shoes") return "footwear_general";

  if (s.category === "clothing" && s.isJacket && s.isTechnicalOuterwear) return "clothing_technical_jacket";
  if (s.category === "clothing" && s.isJacket) return "clothing_jacket";
  if (s.category === "clothing") return "clothing_general";

  if (s.category === "supplements") {
    return s.isFoodLike ? "food_protein_bar" : "supplement_general";
  }

  if (s.category === "selfcare") return "selfcare_general";
  if (s.category === "accessories") return "accessory_general";
  if (s.category === "gymcorner") return "gym_general";

  return "fallback_general";
}

function buildInsightHighlights(product, offerSummary) {
  const highlights = [];
  const family = detectProductFamily(product, offerSummary);

  if (offerSummary?.lowestPriceFormatted) {
    highlights.push(`Laveste pris ${offerSummary.lowestPriceFormatted}`);
  }

  if (offerSummary?.storeCount) {
    highlights.push(
      offerSummary.storeCount === 1
        ? "1 butikk aktiv"
        : `${offerSummary.storeCount} butikker aktive`
    );
  }

  if (product.brand) {
    highlights.push(`Fra ${product.brand}`);
  }

  if (family === "food_protein_bar") {
    highlights.push("Proteinbar");
  } else if (family === "supplement_general") {
    highlights.push("Supplements");
  } else if (family === "footwear_boot") {
    highlights.push("Boots");
  } else if (family === "footwear_sneaker") {
    highlights.push("Shoes");
  } else if (product.category) {
    highlights.push(product.category);
  }

  const discountPercent = getDiscountPercent(product, offerSummary);
  if (discountPercent && discountPercent > 0) {
    highlights.push(`${discountPercent}% rabatt`);
  }

  return highlights.slice(0, 4);
}

function buildInsightMeta(product, offerSummary) {
  const parts = [];
  const offers = Array.isArray(offerSummary?.offers) ? offerSummary.offers : [];
  const hasOffers = !!offerSummary?.hasOffers;

  if (hasOffers && offerSummary?.storeCount) {
    parts.push(
      offerSummary.storeCount === 1
        ? "Pris fra 1 butikk"
        : `Pris fra ${offerSummary.storeCount} butikker`
    );
  } else {
    parts.push("Produktdata tilgjengelig");
  }

  const hasWorldwide = offers.some((offer) =>
    ["worldwide", "global", "international"].includes(
      String(offer.shipping_scope || "").toLowerCase()
    )
  );

  if (hasWorldwide) {
    parts.push("Worldwide shipping");
  } else if (hasOffers) {
    parts.push("Aktive offers");
  }

  if (hasOffers) {
    parts.push("Pris sammenlignes live");
  }

  return parts;
}

function pickVariantByHash(seedText, variants) {
  if (!Array.isArray(variants) || !variants.length) return "";
  const text = normalizeLower(seedText);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return variants[hash % variants.length];
}

function buildSummaryContext(product, offerSummary) {
  const signals = extractProductSignals(product, offerSummary);

  return {
    ...signals,
    family: detectProductFamily(product, offerSummary),
    title: normalizeText(product.title),
    brand: normalizeText(product.brand),
    category: normalizeText(product.category),
    seed: `${product.id}-${product.title}-${product.brand}-${product.category}`
  };
}

function buildRuleBasedSummary(product, offerSummary) {
  const ctx = buildSummaryContext(product, offerSummary);

  const familyBuilders = {
    food_protein_bar: () => buildProteinBarSummary(ctx),
    supplement_general: () => buildSupplementSummary(ctx),
    footwear_boot: () => buildBootSummary(ctx),
    footwear_sneaker: () => buildSneakerSummary(ctx),
    footwear_general: () => buildFootwearGeneralSummary(ctx),
    clothing_technical_jacket: () => buildTechnicalJacketSummary(ctx),
    clothing_jacket: () => buildJacketSummary(ctx),
    clothing_general: () => buildClothingSummary(ctx),
    selfcare_general: () => buildSelfcareSummary(ctx),
    accessory_general: () => buildAccessorySummary(ctx),
    gym_general: () => buildGymSummary(ctx),
    fallback_general: () => buildFallbackSummary(ctx)
  };

  const builder = familyBuilders[ctx.family] || familyBuilders.fallback_general;
  return builder();
}

function buildProteinBarSummary(ctx) {
  const flavorLead = ctx.isFlavorFocused
    ? pickVariantByHash(ctx.seed, [
        "Et mer smakdrevet valg for deg som vil ha en proteinbar som også fungerer godt som enkel snack i løpet av dagen.",
        "En proteinbar med tydelig smak i fokus, godt egnet når du vil ha noe raskt og lett tilgjengelig mellom måltider.",
        "Et praktisk valg for deg som vil ha en proteinbar med mer snack-følelse og enkel bruk i en travel hverdag."
      ])
    : pickVariantByHash(ctx.seed, [
        "Et praktisk valg for deg som vil ha en proteinbar som er enkel å ta med seg og lett å bruke i en travel hverdag.",
        "En enkel og funksjonell proteinbar for deg som vil ha noe raskt tilgjengelig mellom økter, jobb eller andre planer."
      ]);

  const priceTail = ctx.hasOffers
    ? (
        ctx.hasDiscount
          ? " Aktiv prisoversikt gjør det også lettere å vurdere verdi akkurat nå."
          : ctx.storeCount >= 2
            ? " Flere tilgjengelige kjøpsmuligheter gjør den også lettere å sammenligne akkurat nå."
            : " Aktiv produktoversikt gjør det enkelt å vurdere tilgjengelighet akkurat nå."
      )
    : " Her er det først og fremst smak, format og enkel bruk som gjør produktet relevant.";

  return `${flavorLead}${priceTail}`;
}

function buildSupplementSummary(ctx) {
  const base = pickVariantByHash(ctx.seed, [
    "Et relevant supplementvalg for deg som vil ha enkel oversikt over produkt og tilgjengelighet før kjøp.",
    "Et aktuelt supplement for deg som vil vurdere produkt og tilgjengelighet uten å lete på tvers av flere butikker.",
    "Et ryddig supplementvalg der fokus ligger på produktprofil, tilgjengelighet og enkel vurdering."
  ]);

  if (!ctx.hasOffers) {
    return `${base} Her er det selve produktprofilen som er mest relevant akkurat nå.`;
  }

  const tail = ctx.hasDiscount
    ? " Rabatt gjør det også mer interessant akkurat nå."
    : ctx.storeCount >= 2
      ? " Flere aktive butikker gir bedre grunnlag for å vurdere verdi."
      : "";

  return `${base}${tail}`;
}

function buildSneakerSummary(ctx) {
  if (ctx.isPerformanceFootwear) {
    const performanceVariants = [
      `Et mer performance-rettet shoe-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, godt egnet for deg som vil ha en modell med tydelig sporty profil og mer aktiv bruk i fokus.`,
      `En modell med klarere sport-/performance-retning${ctx.brand ? ` fra ${ctx.brand}` : ""}, spesielt aktuell for deg som vil ha noe som føles mer retningsbestemt enn en vanlig everyday sneaker.`,
      `Et mer atletisk shoe-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} med tydeligere performance-profil, godt egnet når du vil ha noe mer sportslig og funksjonsrettet i uttrykket.`
    ];

    const base = pickVariantByHash(ctx.seed, performanceVariants);

    if (!ctx.hasOffers) {
      return `${base} Her er det først og fremst modellprofil, uttrykk og bruksretning som gjør produktet interessant.`;
    }

    return ctx.hasDiscount
      ? `${base} Aktiv rabatt gjør den også ekstra aktuell akkurat nå.`
      : base;
  }

  if (ctx.isLifestyleFootwear) {
    const variant = pickVariantByHash(ctx.seed, [
      `Et solid sneaker-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha en modell med tydelig uttrykk og god bruk i hverdagen.`,
      `En mer lifestyle-orientert sneaker${ctx.brand ? ` fra ${ctx.brand}` : ""} som passer godt når du vil kombinere komfort, profil og daglig bruk.`,
      `Et sterkt valg innen sneakers akkurat nå, spesielt for deg som vil ha en modell som fungerer godt både visuelt og i vanlig hverdagsbruk.`
    ]);

    if (!ctx.hasOffers) {
      return `${variant} Her er det særlig modellens uttrykk og helhetsprofil som gjør den relevant.`;
    }

    return ctx.hasDiscount ? `${variant} Aktiv rabatt gjør den ekstra aktuell akkurat nå.` : variant;
  }

  if (!ctx.hasOffers) {
    return pickVariantByHash(ctx.seed, [
      `En aktuell modell${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha et shoe-valg med tydelig profil og mer gjennomført uttrykk.`,
      `Et solid shoe-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, særlig for deg som vil ha en modell som fungerer godt visuelt og i vanlig bruk.`,
      `En modell${ctx.brand ? ` fra ${ctx.brand}` : ""} med tydelig shoe-profil, godt egnet når du vil ha noe som føles gjennomført og anvendelig.`
    ]);
  }

  return pickVariantByHash(ctx.seed, [
    `Et aktuelt shoe-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} med ryddig prisoversikt og flere tilgjengelige kjøpsmuligheter akkurat nå.`,
    `Et solid valg innen shoes${ctx.brand ? ` fra ${ctx.brand}` : ""}, med en modell som er enkel å vurdere takket være aktiv prisinnhenting.`,
    `En aktuell modell${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil sammenligne pris og tilgjengelighet uten ekstra friksjon.`
  ]);
}

function buildBootSummary(ctx) {
  const winterAngle = ctx.isWinterStyle
    ? pickVariantByHash(ctx.seed, [
        `Et sterkere boot-valg for deg som vil ha en modell med mer sesongpreg og tydeligere uttrykk i hverdagen.`,
        `Et aktuelt valg innen boots når du vil ha noe som føles mer robust, mer sesongriktig og mer markant i bruk.`,
        `En boot med mer statement-preget uttrykk, godt egnet for deg som vil ha noe som skiller seg litt mer ut visuelt.`
      ])
    : pickVariantByHash(ctx.seed, [
        `Et solid boot-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} med tydelig profil og aktiv produktoversikt akkurat nå.`,
        `Et aktuelt valg innen boots${ctx.brand ? ` fra ${ctx.brand}` : ""}, spesielt for deg som vil ha en modell med mer tyngde i uttrykket.`,
        `En modell som gir et tydeligere og mer robust uttrykk, samtidig som produktbildet er lett å vurdere akkurat nå.`
      ]);

  if (!ctx.hasOffers) {
    return `${winterAngle} Her er det særlig modellens uttrykk og sesongprofil som trekker opp.`;
  }

  const tail = ctx.storeCount >= 2
    ? " Flere butikker gjør den også enkel å vurdere på tvers av pris."
    : "";

  return `${winterAngle}${tail}`;
}

function buildFootwearGeneralSummary(ctx) {
  if (!ctx.hasOffers) {
    return pickVariantByHash(ctx.seed, [
      `Et aktuelt valg innen footwear${ctx.brand ? ` fra ${ctx.brand}` : ""}, med tydelig modellprofil og ryddig produktpresentasjon.`,
      `Et relevant footwear-produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha en enkel oversikt over modell og uttrykk før kjøp.`,
      `Et interessant footwear-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, presentert med fokus på produktprofil og anvendelighet.`
    ]);
  }

  return pickVariantByHash(ctx.seed, [
    `Et aktuelt valg innen footwear${ctx.brand ? ` fra ${ctx.brand}` : ""}, med aktiv prisoversikt og ryddig sammenligning akkurat nå.`,
    `Et relevant footwear-produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha enkel oversikt over pris og tilgjengelighet før kjøp.`,
    `Et interessant footwear-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, presentert med fokus på pris, tilgjengelighet og enkel vurdering.`
  ]);
}

function buildTechnicalJacketSummary(ctx) {
  const variant = pickVariantByHash(ctx.seed, [
    `Et mer technical outerwear-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, godt egnet for deg som vil ha en modell med renere funksjonsprofil og mer gjennomført uttrykk.`,
    `Et aktuelt technical jacket-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha noe som kombinerer mer funksjonell retning med tydelig design.`,
    `En mer teknisk orientert jakke${ctx.brand ? ` fra ${ctx.brand}` : ""}, godt egnet når du vil ha noe lett, anvendelig og visuelt ryddig.`
  ]);

  if (!ctx.hasOffers && ctx.hasStrongRating) {
    return `${variant} Den sterke ratingen trekker også helhetsinntrykket opp.`;
  }

  return variant;
}

function buildJacketSummary(ctx) {
  if (!ctx.hasOffers) {
    return pickVariantByHash(ctx.seed, [
      `Et sterkt plagg${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha en modell med tydelig stil og mer gjennomført outerwear-profil.`,
      `En aktuell jakke${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha en mer gjennomført modell med fokus på uttrykk og bruk.`,
      `Et godt jacket-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, spesielt når du vil ha noe som fungerer fint i hverdagen og samtidig ser gjennomført ut.`
    ]);
  }

  return pickVariantByHash(ctx.seed, [
    `Et sterkt plagg${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha en modell med tydelig stil og flere aktive kjøpsmuligheter samlet på ett sted.`,
    `En aktuell jakke${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha en mer gjennomført outerwear-modell med enkel prisoversikt.`,
    `Et godt jacket-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, spesielt når du vil ha noe som fungerer fint i hverdagen og samtidig er lett å sammenligne på pris.`
  ]);
}

function buildClothingSummary(ctx) {
  if (!ctx.hasOffers) {
    return pickVariantByHash(ctx.seed, [
      `Et aktuelt plagg${ctx.brand ? ` fra ${ctx.brand}` : ""} med tydelig stilprofil og ryddig produktpresentasjon.`,
      `Et relevant clothing-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha en modell med tydelig stil og enkel oversikt.`,
      `Et plagg som er lett å vurdere takket være samlet produktdata og et tydelig helhetsinntrykk.`
    ]);
  }

  return pickVariantByHash(ctx.seed, [
    `Et aktuelt plagg${ctx.brand ? ` fra ${ctx.brand}` : ""} med aktiv prisoversikt og enkel sammenligning på tvers av butikker.`,
    `Et relevant clothing-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha en modell med tydelig stil og ryddig prisbilde.`,
    `Et plagg som er lett å vurdere takket være samlet produktdata og enkel oversikt over pris og tilgjengelighet.`
  ]);
}

function buildAccessorySummary(ctx) {
  if (!ctx.hasOffers) {
    return pickVariantByHash(ctx.seed, [
      `Et gjennomført accessory-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} med fokus på produktprofil og enkel vurdering akkurat nå.`,
      `Et aktuelt accessory-produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} som fungerer godt når du vil få rask oversikt over modell og uttrykk.`,
      `Et relevant accessory-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, presentert med ryddig produktoversikt og enkel vurdering.`
    ]);
  }

  return pickVariantByHash(ctx.seed, [
    `Et gjennomført accessory-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} med fokus på enkel prisoversikt og tilgjengelighet akkurat nå.`,
    `Et aktuelt accessory-produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} som fungerer godt når du vil sammenligne pris uten ekstra friksjon.`,
    `Et relevant accessory-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, presentert med ryddig oversikt over tilgjengelighet og pris.`
  ]);
}

function buildSelfcareSummary(ctx) {
  if (!ctx.hasOffers) {
    return pickVariantByHash(ctx.seed, [
      `Et relevant selfcare-produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} med tydelig produktprofil og enkel vurdering akkurat nå.`,
      `Et aktuelt selfcare-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil få rask oversikt over produkt og bruk.`,
      `Et selfcare-produkt presentert med fokus på produktdata, tilgjengelighet og enkel vurdering.`
    ]);
  }

  return pickVariantByHash(ctx.seed, [
    `Et relevant selfcare-produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} med aktiv prisinnhenting og enkel oversikt akkurat nå.`,
    `Et aktuelt selfcare-valg${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil sammenligne pris og tilgjengelighet raskt og ryddig.`,
    `Et selfcare-produkt med fokus på enkel vurdering av pris, tilgjengelighet og kjøpsmuligheter.`
  ]);
}

function buildGymSummary(ctx) {
  if (!ctx.hasOffers) {
    return pickVariantByHash(ctx.seed, [
      `Et aktuelt gym-produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} med tydelig produktprofil og enkel oversikt akkurat nå.`,
      `Et relevant gym-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, særlig for deg som vil forstå produkt og bruksområde uten ekstra støy.`,
      `Et gym-relatert produkt presentert med fokus på produktdata, anvendelighet og enkel vurdering.`
    ]);
  }

  return pickVariantByHash(ctx.seed, [
    `Et aktuelt gym-produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} med samlet prisoversikt og enkel vurdering på tvers av butikker.`,
    `Et relevant gym-valg${ctx.brand ? ` fra ${ctx.brand}` : ""}, særlig for deg som vil sammenligne pris og tilgjengelighet uten ekstra arbeid.`,
    `Et gym-relatert produkt presentert med fokus på prisinnhenting, tilgjengelighet og enkel oversikt.`
  ]);
}

function buildFallbackSummary(ctx) {
  if (!ctx.hasOffers) {
    return pickVariantByHash(ctx.seed, [
      `Et interessant produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} med tydelig produktprofil og ryddig oversikt akkurat nå.`,
      `Et relevant produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha enkel oversikt over modell og tilgjengelighet før kjøp.`,
      `Et aktuelt produkt${ctx.brand ? ` fra ${ctx.brand}` : ""}, presentert med fokus på produktdata og enkel vurdering.`
    ]);
  }

  return pickVariantByHash(ctx.seed, [
    `Et interessant produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} med aktiv prissammenligning og ryddig oversikt over tilgjengelige kjøpsmuligheter akkurat nå.`,
    `Et relevant produkt${ctx.brand ? ` fra ${ctx.brand}` : ""} for deg som vil ha enkel oversikt over pris og tilgjengelighet før kjøp.`,
    `Et aktuelt produkt${ctx.brand ? ` fra ${ctx.brand}` : ""}, presentert med fokus på pris, tilgjengelighet og enkel sammenligning.`
  ]);
}

function renderProductInsights(product, offerSummary) {
  const container = document.getElementById("product-insights");
  if (!container) return;

  const manualNote = normalizeText(
    product.editor_note ||
    product.why_it_stands_out ||
    product.brandradar_note
  );

  const highlights = buildInsightHighlights(product, offerSummary);
  const metaParts = buildInsightMeta(product, offerSummary);

  const summary = manualNote || buildRuleBasedSummary(product, offerSummary);

  const highlightsHTML = highlights.length
    ? `
      <div class="product-insights-highlights">
        ${highlights.map(item => `<span class="product-insight-chip">${item}</span>`).join("")}
      </div>
    `
    : "";

  const metaHTML = metaParts.length
    ? `<div class="product-insight-meta">${metaParts.join(" • ")}</div>`
    : "";


container.innerHTML = `
    <div class="product-insights-title">Hvorfor dette produktet skiller seg ut</div>
    ${highlightsHTML}
    <div class="product-insight-summary">${summary}</div>
    ${metaHTML}
  `;
}

async function renderPriceComparison(product) {
  const section = document.getElementById("price-comparison");
  const subtitle = document.getElementById("price-comparison-subtitle");
  const list = document.getElementById("price-offers-list");
  const buyLinkEl = document.getElementById("buy-link");
  const newPriceEl = document.getElementById("new-price");
  const oldPriceEl = document.getElementById("old-price");
  const discountTagEl = document.getElementById("discount-tag");

  if (!section || !subtitle || !list) return null;
  if (!window.BrandRadarOffersEngine || product?.id == null) return null;

  try {
    const summary = await window.BrandRadarOffersEngine.getOfferSummaryForProduct(String(product.id));

    if (!summary?.hasOffers || !Array.isArray(summary.offers) || !summary.offers.length) {
      section.hidden = true;
      return {
        hasOffers: false,
        lowestPrice: null,
        lowestPriceFormatted: "",
        storeCount: 0,
        offers: []
      };
    }

    newPriceEl.textContent = `Fra ${summary.lowestPriceFormatted}`;
    oldPriceEl.textContent = "";
    discountTagEl.textContent = "";

    subtitle.textContent =
      summary.storeCount === 1
        ? "Vi fant 1 butikk med aktiv pris akkurat nå."
        : `Vi fant ${summary.storeCount} butikker med aktive priser akkurat nå.`;

    list.innerHTML = "";

    summary.offers.forEach((offer, index) => {
      const row = document.createElement("div");
      row.className = "price-offer-row";

      const left = document.createElement("div");
      left.className = "price-offer-left";

      const merchantName = document.createElement("div");
      merchantName.className = "price-offer-merchant";
      merchantName.textContent = offer.merchant_name || offer.merchant_slug || "Butikk";

      const meta = document.createElement("div");
      meta.className = "price-offer-meta";

      const shippingLabel = offer.shipping_scope
        ? offer.shipping_scope === "worldwide"
          ? "Worldwide shipping"
          : offer.shipping_scope
        : "";

      meta.textContent = shippingLabel || "Aktiv butikk";

      left.appendChild(merchantName);
      left.appendChild(meta);

      if (index === 0) {
        const badge = document.createElement("span");
        badge.className = "best-price-badge";
        badge.textContent = "Best price";
        left.appendChild(badge);
      }

      const right = document.createElement("div");
      right.className = "price-offer-right";

      const priceWrap = document.createElement("div");
      priceWrap.className = "price-offer-pricewrap";

      const price = document.createElement("div");
      price.className = "price-offer-price";
      price.textContent = window.BrandRadarOffersEngine.formatPrice(offer.price, offer.currency);

      priceWrap.appendChild(price);

      if (offer.old_price) {
        const oldPrice = document.createElement("div");
        oldPrice.className = "price-offer-oldprice";
        oldPrice.textContent = window.BrandRadarOffersEngine.formatPrice(offer.old_price, offer.currency);
        priceWrap.appendChild(oldPrice);
      }

      const cta = document.createElement("a");
      cta.className = "price-offer-cta";
      cta.href = offer.buy_url || offer.affiliate_url || offer.store_url || "#";
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      cta.textContent = "Se tilbud";

      right.appendChild(priceWrap);
      right.appendChild(cta);

      row.appendChild(left);
      row.appendChild(right);

      list.appendChild(row);
    });

    const bestOffer = summary.offers[0];
    if (bestOffer?.buy_url || bestOffer?.affiliate_url || bestOffer?.store_url) {
      buyLinkEl.href = bestOffer.buy_url || bestOffer.affiliate_url || bestOffer.store_url;
      buyLinkEl.textContent = "Kjøp til beste pris";
    }

    section.hidden = false;
    return summary;
  } catch (error) {
    console.warn("⚠️ Klarte ikke rendre price comparison:", error);
    section.hidden = true;
    return null;
  }
}

async function loadRecommendations(products, currentProduct) {
  const slider = document.getElementById("related-slider");
  if (!slider) return;

  const curCat = (currentProduct.category || "").toLowerCase();
  const curBrand = (currentProduct.brand || "").toLowerCase();

  let matches = products.filter(p =>
    String(p.id).trim() !== String(currentProduct.id).trim() &&
    p.image_url &&
    (p.category || "").toLowerCase() === curCat
  );

  if (matches.length < 4) {
    matches = matches.concat(
      products.filter(p =>
        String(p.id).trim() !== String(currentProduct.id).trim() &&
        p.image_url &&
        (p.brand || "").toLowerCase() === curBrand
      )
    );
  }

  matches = [...new Map(matches.map(p => [p.id, p])).values()].slice(0, 8);

  if (!matches.length) {
    slider.innerHTML = "<p>Ingen anbefalinger tilgjengelig.</p>";
    return;
  }

  if (window.BrandRadarOffersEngine) {
    matches = await window.BrandRadarOffersEngine.enrichProductsWithOfferSummary(matches);
  }

  slider.innerHTML = "";

  matches.forEach(p => {
    const card = window.BrandRadarProductCardEngine.createCard(p, {
      isLuxury: currentProduct.sheet_source === "luxury",
      showBrand: true,
      showRating: true,
      enableFavorite: true,
      onNavigate: (product) => {
        const luxuryParam = currentProduct.sheet_source === "luxury" ? "&luxury=true" : "";
        window.location.href = `product.html?id=${product.id}${luxuryParam}`;
      },
      favoriteProductFactory: (product) => ({
        id: product.id || "",
        title: product.title || product.product_name || product.name || "Uten navn",
        product_name: product.title || product.product_name || product.name || "Uten navn",
        brand: product.brand || "",
        price: product.price,
        discount: product.discount || "",
        image_url: product.image_url || "",
        product_url: product.product_url || "",
        category: product.category || "",
        rating: product.rating,
        luxury: currentProduct.sheet_source === "luxury"
      })
    });

    slider.appendChild(card);
  });

  updateSliderNav();
}

function setupFavoriteButton(product) {
  const btn = document.getElementById("favorite-btn");
  if (!btn) return;

  const id = String(product.id).trim();
  const exists = getFavorites().some(f => String(f.id) === id);

  btn.innerHTML = exists
    ? `<span class="heart active"></span> Fjern fra favoritter`
    : `<span class="heart"></span> Legg til favoritter`;

  btn.addEventListener("click", () => {
    toggleFavorite(product, btn.querySelector(".heart"));

    const nowExists = getFavorites().some(f => String(f.id) === id);

    btn.innerHTML = nowExists
      ? `<span class="heart active"></span> Fjern fra favoritter`
      : `<span class="heart"></span> Legg til favoritter`;
  });
}

const slider = document.getElementById("related-slider");
const btnPrev = document.querySelector(".slider-btn.prev");
const btnNext = document.querySelector(".slider-btn.next");

function updateSliderNav() {
  if (!slider) return;
  const canScrollMore = slider.scrollWidth > slider.clientWidth + 10;
  if (btnPrev) btnPrev.style.opacity = canScrollMore ? "1" : "0";
  if (btnNext) btnNext.style.opacity = canScrollMore ? "1" : "0";
}

btnPrev?.addEventListener("click", () => {
  slider.scrollBy({ left: -350, behavior: "smooth" });
  setTimeout(updateSliderNav, 200);
});

btnNext?.addEventListener("click", () => {
  slider.scrollBy({ left: 350, behavior: "smooth" });
  setTimeout(updateSliderNav, 200);
});

slider?.addEventListener("scroll", updateSliderNav);

document.getElementById("back-btn")?.addEventListener("click", () => {
  const ref = document.referrer;
  if (ref && !ref.includes("product.html")) window.history.back();
  else window.location.href = "index.html";
});

// ================================
// Mobile: Insights toggle
// ================================
function setupInsightsToggle() {
  const btn = document.querySelector(".insights-toggle");
  const content = document.getElementById("product-insights");

  if (!btn || !content) return;

  content.hidden = true;
  btn.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");

  const updateLabel = (isOpen) => {
    btn.setAttribute("aria-expanded", String(isOpen));
    btn.classList.toggle("open", isOpen);
  };

  btn.addEventListener("click", () => {
    const willOpen = content.hidden;
    content.hidden = !willOpen;
    updateLabel(willOpen);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupInsightsToggle();
});


