// ======================================================
// ✅ Product page — Felles for vanlige + Luxury produkter
// Bruker Offers Engine + Product Card Engine
// Inkluderer dynamisk BrandRadar Product Insights
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

function normalizeCategory(value) {
  return normalizeText(value).toLowerCase();
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

function buildInsightHighlights(product, offerSummary) {
  const highlights = [];

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

  if (product.category) {
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

  if (offerSummary?.storeCount) {
    parts.push(
      offerSummary.storeCount === 1
        ? "Pris fra 1 butikk"
        : `Pris fra ${offerSummary.storeCount} butikker`
    );
  } else {
    parts.push("Produktdata tilgjengelig");
  }

  const offers = Array.isArray(offerSummary?.offers) ? offerSummary.offers : [];
  const hasWorldwide = offers.some((offer) =>
    ["worldwide", "global", "international"].includes(
      String(offer.shipping_scope || "").toLowerCase()
    )
  );

  if (hasWorldwide) {
    parts.push("Worldwide shipping");
  } else if (offers.length) {
    parts.push("Aktive offers");
  }

  parts.push("Pris sammenlignes live");

  return parts;
}

function buildRuleBasedSummary(product, offerSummary) {
  const category = normalizeCategory(product.category);
  const brand = normalizeText(product.brand);
  const storeCount = offerSummary?.storeCount || 0;
  const hasDiscount = !!getDiscountPercent(product, offerSummary);
  const ratingNum = parseFloat(
    String(product.rating || "").replace(",", ".").replace(/[^0-9.]/g, "")
  );
  const hasStrongRating = Number.isFinite(ratingNum) && ratingNum >= 4.3;

  if (category === "shoes") {
    if (hasDiscount && storeCount >= 2) {
      return `Et sterkt valg innen footwear akkurat nå, med aktiv prissammenligning${brand ? ` fra ${brand}` : ""} og flere butikker tilgjengelig.`;
    }
    if (hasStrongRating) {
      return `Et solid shoe-valg${brand ? ` fra ${brand}` : ""} for deg som vil ha en modell som kombinerer tydelig uttrykk med god bruk i hverdagen.`;
    }
    return `Et aktuelt shoe-valg${brand ? ` fra ${brand}` : ""} med aktiv prisoversikt og flere tilgjengelige kjøpsmuligheter akkurat nå.`;
  }

  if (category === "clothing") {
    if (hasDiscount) {
      return `Et aktuelt plagg${brand ? ` fra ${brand}` : ""} med god verdi akkurat nå, støttet av aktiv prissammenligning på tvers av butikker.`;
    }
    return `Et sterkt plagg${brand ? ` fra ${brand}` : ""} for deg som vil ha en modell med tydelig stil og flere aktive kjøpsmuligheter samlet på ett sted.`;
  }

  if (category === "accessories") {
    return `Et gjennomført accessory-valg${brand ? ` fra ${brand}` : ""} som fungerer godt som detaljprodukt, med aktiv prisoversikt og tilgjengelige butikker akkurat nå.`;
  }

  if (category === "selfcare") {
    return `Et relevant selfcare-produkt${brand ? ` fra ${brand}` : ""} med aktiv prisinnhenting og flere tilgjengelige kjøpspunkter akkurat nå.`;
  }

  if (category === "gymcorner") {
    return `Et aktuelt gym-produkt${brand ? ` fra ${brand}` : ""} med aktiv prisoversikt og flere butikker tilgjengelig for rask sammenligning.`;
  }

  return `Et interessant produkt${brand ? ` fra ${brand}` : ""} med aktiv prissammenligning og flere tilgjengelige kjøpsmuligheter akkurat nå.`;
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
