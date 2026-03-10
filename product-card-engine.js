// ======================================================
// ✅ BrandRadar – Product Card Engine
// Felles motor for produktkort på tvers av sider
// Støtter:
// - offer_summary
// - fallback-pris
// - favorittikon
// - luxury heart
// ======================================================

(function () {
  function cleanPrice(value) {
    return parseFloat(
      String(value ?? "").replace(/[^\d.,]/g, "").replace(",", ".")
    ) || 0;
  }

  function cleanRating(value) {
    return parseFloat(
      String(value ?? "").replace(",", ".").replace(/[^0-9.]/g, "")
    ) || 0;
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
    const ratingNum = cleanRating(product.rating);
    const ratingHTML =
      showRating && ratingNum
        ? `<p class="rating">⭐ ${ratingNum.toFixed(1)}</p>`
        : showRating
          ? `<p class="rating"><span style="color:#ccc;">–</span></p>`
          : "";

    const offerMarkup = buildOfferMarkup(product);
    const fallbackPriceMarkup = buildFallbackPriceMarkup(product);
    const priceMarkup = offerMarkup || fallbackPriceMarkup;

    const isFav = enableFavorite ? isFavorite(id) : false;
    const heartClass = isLuxury ? "heart-icon gold-heart" : "heart-icon";

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      ${!product.offer_summary?.hasOffers && getPriceInfo(product).discountText
        ? `<div class="discount-badge">${getPriceInfo(product).discountText.replace(" discount", "")}</div>`
        : ""}

      ${enableFavorite ? `
        <div class="fav-icon ${isFav ? "active" : ""}" aria-label="Legg til favoritt">
          <svg viewBox="0 0 24 24" class="${heartClass}">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
            14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4
            6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      ` : ""}

      <img src="${img}" alt="${name}">

      <div class="product-info">
        ${showBrand ? `<p class="brand">${brand}</p>` : ""}
        <h3 class="product-name">${name}</h3>
        ${ratingHTML}
        ${priceMarkup}
      </div>
    `;

    card.addEventListener("click", e => {
      if (enableFavorite && e.target.closest(".fav-icon")) return;

      if (typeof onNavigate === "function") {
        onNavigate(product, card);
      } else if (id) {
        window.location.href = `product.html?id=${encodeURIComponent(id)}`;
      }
    });

    if (enableFavorite) {
      const favIcon = card.querySelector(".fav-icon");
      favIcon?.addEventListener("click", e => {
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
        window.toggleFavorite(cleanProduct, favIcon);
        favIcon.classList.toggle("active", !existsBefore);
      });
    }

    return card;
  }

  window.BrandRadarProductCardEngine = {
    createCard
  };
})();
