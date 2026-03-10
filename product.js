// ======================================================
// ✅ Product page — Felles for vanlige + Luxury produkter
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  // ❗ ID MÅ være string – hele systemet bruker string-ID
  const productId = String(params.get("id"));
  const isLuxuryParam = params.get("luxury") === "true";

  if (!productId) {
    console.error("❌ Ingen produkt-ID i URL");
    return;
  }

  // 🟦 Google Sheets
  const MAIN_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const MAIN_SHEET_NAME = "BrandRadarProdukter";

  const LUXURY_SHEET_ID = "1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU";
  const LUXURY_SHEET_NAME = "LuxuryProducts";

  // ======================================================
  // 🔍 Finn produkt (string-sammenligning, ikke Number)
  // ======================================================

  let products = await fetch(`https://opensheet.elk.sh/${MAIN_SHEET_ID}/${MAIN_SHEET_NAME}`)
    .then(r => r.json())
    .catch(() => []);

  let product = products.find(p => String(p.id).trim() === productId);

  // Prøv luxury-arket hvis ikke funnet
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

  // ======================================================
  // ⭐ Sett inn produktinfo
  // ======================================================
  document.getElementById("product-title").textContent = product.title || "";
  document.getElementById("product-brand").textContent = product.brand || "";
  document.getElementById("product-desc").textContent =
    product.info || product.description || "Dette premiumproduktet kombinerer kvalitet og stil.";

  // ======================================================
  // ⭐ Prisvisning (fallback / produktark)
  // ======================================================
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

  // Default kjøpslink fra produktarket
  buyLinkEl.href = product.product_url || "#";

  // ======================================================
  // ⭐ Rating
  // ======================================================
  const ratingNum = parseFloat(
    String(product.rating || "").replace(",", ".").replace(/[^0-9.]/g, "")
  );

  document.getElementById("product-rating").textContent =
    !isNaN(ratingNum) ? `⭐ ${ratingNum.toFixed(1)} / 5` : "⭐ Ingen rating";

  // ======================================================
  // ⭐ Bilder
  // ======================================================
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

  // ======================================================
  // ⭐ Pris-sammenligning (offers engine)
  // ======================================================
  await renderPriceComparison(product);

  // ======================================================
  // ⭐ Relaterte produkter
  // ======================================================
  loadRecommendations(products, product);

  // ======================================================
  // ⭐ Favorittknapp — string-basert ID
  // ======================================================
  setupFavoriteButton(product);

  // ======================================================
  // ⭐ Luxury styling
  // ======================================================
  if (isLuxury) {
    document.body.classList.add("luxury-mode");
    newPriceEl.style.color = "#d4af37";
  }
});

// ======================================================
// 💸 Price comparison renderer
// ======================================================
async function renderPriceComparison(product) {
  const section = document.getElementById("price-comparison");
  const subtitle = document.getElementById("price-comparison-subtitle");
  const list = document.getElementById("price-offers-list");
  const buyLinkEl = document.getElementById("buy-link");
  const newPriceEl = document.getElementById("new-price");
  const oldPriceEl = document.getElementById("old-price");
  const discountTagEl = document.getElementById("discount-tag");

  if (!section || !subtitle || !list) return;
  if (!window.BrandRadarOffersEngine || product?.id == null) return;

  try {
    const summary = await window.BrandRadarOffersEngine.getOfferSummaryForProduct(String(product.id));

    if (!summary?.hasOffers || !Array.isArray(summary.offers) || !summary.offers.length) {
      section.hidden = true;
      return;
    }

    // Oppdater hovedpris til beste pris
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
      cta.href = offer.affiliate_url || offer.store_url || "#";
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      cta.textContent = "Se tilbud";

      right.appendChild(priceWrap);
      right.appendChild(cta);

      row.appendChild(left);
      row.appendChild(right);

      list.appendChild(row);
    });

    // Oppdater hoved CTA til billigste tilbud
    const bestOffer = summary.offers[0];
    if (bestOffer?.affiliate_url || bestOffer?.store_url) {
      buyLinkEl.href = bestOffer.affiliate_url || bestOffer.store_url;
      buyLinkEl.textContent = "Kjøp til beste pris";
    }

    section.hidden = false;
  } catch (error) {
    console.warn("⚠️ Klarte ikke rendre price comparison:", error);
    section.hidden = true;
  }
}

// ======================================================
// ⭐ Relaterte produkter – Premium Cards
// ======================================================
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

  slider.innerHTML = "";

  matches.forEach(p => {
    const ratingValue = cleanRating(p.rating);

    let newPriceValue = p.price;
    let oldPriceValue = "";

    const discountNum = parseFloat(String(p.discount || "").replace(",", "."));
    const hasDiscount = !isNaN(discountNum) && discountNum > 0;

    if (hasDiscount && p.price) {
      const numericPrice = parseFloat(String(p.price).replace(/[^\d.,]/g, "").replace(",", "."));
      if (!isNaN(numericPrice)) {
        newPriceValue = (numericPrice * (1 - discountNum / 100)).toFixed(0);
        oldPriceValue = `${numericPrice} kr`;
      }
    }

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      ${hasDiscount ? `<div class="discount-badge">-${discountNum.toFixed(0)}%</div>` : ""}
      <img src="${p.image_url}" alt="${p.title}" loading="lazy">
      <div class="product-info">
        <p class="brand">${p.brand || ""}</p>
        <h3 class="product-name">${p.title || ""}</h3>
        <p class="rating">
          ${ratingValue ? `⭐ ${ratingValue.toFixed(1)}` : `<span style="color:#ccc;">–</span>`}
        </p>
        <div class="price-line">
          <span class="new-price">${newPriceValue ? `${newPriceValue} kr` : ""}</span>
          ${hasDiscount && p.price ? `<span class="old-price">${p.price} kr</span>` : ""}
        </div>
      </div>
    `;

    const luxuryParam = currentProduct.sheet_source === "luxury" ? "&luxury=true" : "";

    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${p.id}${luxuryParam}`;
    });

    slider.appendChild(card);
  });

  updateSliderNav();
}

// ======================================================
// ⭐ Favoritt-knapp — bruker global toggleFavorite()
// ======================================================
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

// ======================================================
// ⭐ Slider navigation
// ======================================================
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

// ======================================================
// ⭐ Tilbake-knapp
// ======================================================
document.getElementById("back-btn")?.addEventListener("click", () => {
  const ref = document.referrer;
  if (ref && !ref.includes("product.html")) window.history.back();
  else window.location.href = "index.html";
});

