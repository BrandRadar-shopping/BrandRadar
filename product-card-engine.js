// ======================================================
// ✅ BrandRadar – Product Card Engine
// Felles motor for produktkort på tvers av sider
// Støtter:
// - offer_summary
// - fallback-pris
// - favorittikon
// - luxury heart
// - SVG rating stars
// - mer stabil markup for jevnere kort
// ======================================================

(function () {
  function cleanPrice(value) {
    return parseFloat(
      String(value ?? "").replace(/[^\d.,]/g, "").replace(",", ".")
    ) || 0;
  }

  function cleanRating(value) {
    const parsed = parseFloat(
      String(value ?? "").replace(",", ".").replace(/[^0-9.]/g, "")
    );
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(5, parsed));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatPrice(value) {
    const n = cleanPrice(value);
    return n ? `${Math.round(n)} kr` : "";
  }

  function getPriceInfo(product) {
    let price = cleanPrice(product.price);
    let oldPrice = cleanPrice(
      product.old_price || product.compare_at_price || product.before_price
    );
    let discount = String(product.discount ?? "").trim();

    if (!discount && oldPrice > 0 && price > 0 && price < oldPrice) {
      discount = String(Math.round(((oldPrice - price) / oldPrice) * 100));
    }

    if (discount && /^\d+$/.test(discount)) {
      discount = `-${discount}%`;
    } else if (discount && /^-\d+$/.test(discount)) {
      discount = `${discount}%`;
    }

    return {
      price,
      oldPrice,
      discountText: discount || "",
      priceText: price ? formatPrice(price) : "",
      oldPriceText: oldPrice ? formatPrice(oldPrice) : ""
    };
  }

  function getResolvedId(product) {
    if (typeof window.resolveProductId === "function") {
      return window.resolveProductId(product);
    }
    return product.id || product.product_id || "";
  }

  function isFavorite(productId) {
    if (typeof window.isProductFavorite === "function") {
      return window.isProductFavorite(productId);
    }
    if (typeof window.getFavorites === "function") {
      return window.getFavorites().some(f => String(f.id) === String(productId));
    }
    return false;
  }

  function buildOfferMarkup(product) {
    const summary = product.offer_summary;
    if (!summary?.hasOffers) return "";

    const storeLabel =
      summary.storeCount === 1 ? "1 butikk" : `${summary.storeCount} butikker`;

    return `
      <div class="offer-summary">
        <div class="offer-summary-price">Fra ${summary.lowestPriceFormatted}</div>
        <div class="offer-summary-count">${storeLabel}</div>
      </div>
    `;
  }

  function buildFallbackPriceMarkup(product) {
    const { priceText, oldPriceText, discountText } = getPriceInfo(product);

    if (!priceText) return "";

    if (discountText) {
      return `
        <div class="price-wrapper">
          <div class="price-line">
            <span class="new-price">${priceText}</span>
            ${oldPriceText ? `<span class="old-price">${oldPriceText}</span>` : ""}
          </div>
          <span class="discount-pill">${discountText}</span>
        </div>
      `;
    }

    return `
      <div class="price-line">
        <span class="new-price">${priceText}</span>
        ${oldPriceText ? `<span class="old-price">${oldPriceText}</span>` : ""}
      </div>
    `;
  }

  function buildStarIcon(fillPercent = 0) {
    const safeFill = Math.max(0, Math.min(100, fillPercent));

    return `
      <span class="rating-star" style="--fill:${safeFill}%;" aria-hidden="true">
        <svg class="rating-star-svg rating-star-outline" viewBox="0 0 24 24" focusable="false">
          <path d="M12 2.8l2.84 5.75 6.35.92-4.6 4.49 1.09 6.32L12 17.3 6.32 20.28l1.09-6.32-4.6-4.49 6.35-.92L12 2.8z"/>
        </svg>
        <span class="rating-star-fill-wrap">
          <svg class="rating-star-svg rating-star-fill" viewBox="0 0 24 24" focusable="false">
            <path d="M12 2.8l2.84 5.75 6.35.92-4.6 4.49 1.09 6.32L12 17.3 6.32 20.28l1.09-6.32-4.6-4.49 6.35-.92L12 2.8z"/>
          </svg>
        </span>
      </span>
    `;
  }

  function buildRatingMarkup(ratingValue, options = {}) {
    const {
      showValue = true,
      emptyMode = "hide"
    } = options;

    const rating = cleanRating(ratingValue);

    if (rating === null) {
      if (emptyMode === "muted") {
        return `
          <div class="rating-stars is-empty" aria-label="Ingen rating">
            <div class="rating-stars-row">
              ${Array.from({ length: 5 }, () => buildStarIcon(0)).join("")}
            </div>
            ${showValue ? `<span class="rating-value rating-value-empty">Ingen rating</span>` : ""}
          </div>
        `;
      }
      return "";
    }

    const stars = Array.from({ length: 5 }, (_, index) => {
      const fill = Math.max(0, Math.min(1, rating - index)) * 100;
      return buildStarIcon(fill);
    }).join("");

    return `
      <div class="rating-stars" aria-label="Rating ${rating.toFixed(1)} av 5">
        <div class="rating-stars-row">
          ${stars}
        </div>
        ${showValue ? `<span class="rating-value">${rating.toFixed(1)}</span>` : ""}
      </div>
    `;
  }

  function createCard(product, options = {}) {
    const {
      isLuxury = false,
      showBrand = true,
      showRating = true,
      enableFavorite = true,
      onNavigate = null,
      favoriteProductFactory = null
    } = options;

    const id = getResolvedId(product);
    const name = product.title || product.product_name || product.name || "Uten navn";
    const brand = product.brand || "";
    const img = product.image_url || product.image || product.img || "";
    const safeName = escapeHtml(name);
    const safeBrand = escapeHtml(brand);

    const ratingHTML = showRating
      ? buildRatingMarkup(product.rating, { showValue: true, emptyMode: "hide" })
      : "";

    const offerMarkup = buildOfferMarkup(product);
    const fallbackPriceMarkup = buildFallbackPriceMarkup(product);
    const priceMarkup = offerMarkup || fallbackPriceMarkup;

    const priceInfo = getPriceInfo(product);
    const hasDiscountBadge = !product.offer_summary?.hasOffers && priceInfo.discountText;
    const isFav = enableFavorite ? isFavorite(id) : false;

    const card = document.createElement("article");
    card.className = `product-card${isLuxury ? " is-luxury-card" : ""}`;
    card.setAttribute("data-product-id", id || "");

    card.innerHTML = `
      ${hasDiscountBadge
        ? `<div class="discount-badge">${escapeHtml(priceInfo.discountText.replace(" discount", ""))}</div>`
        : ""}

      ${enableFavorite ? `
        <button
          type="button"
          class="favorite-toggle ${isFav ? "active" : ""} ${isLuxury ? "is-luxury" : ""}"
          aria-label="${isFav ? "Fjern fra favoritter" : "Legg til favoritt"}"
        >
          <svg viewBox="0 0 24 24" class="heart-icon" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
            14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4
            6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      ` : ""}

      <div class="product-media">
        ${
          img
            ? `<img src="${escapeHtml(img)}" alt="${safeName}" class="product-image" loading="lazy">`
            : `<div class="product-image product-image--placeholder" aria-hidden="true"></div>`
        }
      </div>

      <div class="product-info">
        ${showBrand ? `<p class="brand">${safeBrand}</p>` : ""}
        <h3 class="product-name">${safeName}</h3>
        ${ratingHTML}
        <div class="product-meta-bottom">
          ${priceMarkup}
        </div>
      </div>
    `;

    card.addEventListener("click", e => {
      if (enableFavorite && e.target.closest(".favorite-toggle")) return;

      if (typeof onNavigate === "function") {
        onNavigate(product, card);
      } else if (id) {
        window.location.href = `product.html?id=${encodeURIComponent(id)}`;
      }
    });

    if (enableFavorite) {
      const favButton = card.querySelector(".favorite-toggle");

      favButton?.addEventListener("click", e => {
        e.stopPropagation();

        if (typeof window.toggleFavorite !== "function") return;

        const cleanProduct = typeof favoriteProductFactory === "function"
          ? favoriteProductFactory(product)
          : {
              id,
              title: name,
              product_name: name,
              brand,
              price: product.price,
              discount: product.discount || "",
              image_url: img,
              product_url: product.product_url || product.link || "",
              category: product.category || "",
              rating: product.rating,
              luxury: !!isLuxury
            };

        const existsBefore = isFavorite(id);
        window.toggleFavorite(cleanProduct, favButton);
        const existsAfter = !existsBefore;

        favButton.classList.toggle("active", existsAfter);
        favButton.setAttribute(
          "aria-label",
          existsAfter ? "Fjern fra favoritter" : "Legg til favoritt"
        );
      });
    }

    return card;
  }

  window.BrandRadarProductCardEngine = {
    createCard,
    buildRatingMarkup,
    cleanRating
  };
})();
