// ======================================================
// ✅ Product page — Felles for vanlige + Luxury produkter
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get("id"));
  const isLuxuryParam = params.get("luxury") === "true";

  if (!productId) {
    console.error("❌ Ingen produkt-ID i URL");
    return;
  }

  // 🟦 Primære kilder
  const MAIN_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const MAIN_SHEET_NAME = "BrandRadarProdukter";
  const LUXURY_SHEET_ID = "1Chw-0MM_Cqy-T3e7AN4Zgm0iL57xPZoYzaTUUGtUxxU";
  const LUXURY_SHEET_NAME = "LuxuryProducts";

  // 🔹 Forsøk 1: BrandRadar (standard)
  let products = await fetch(`https://opensheet.elk.sh/${MAIN_SHEET_ID}/${MAIN_SHEET_NAME}`)
    .then(r => r.json())
    .catch(() => []);

  let product = products.find(p => Number(p.id) === productId);

  // 🔹 Forsøk 2: Luxury-arket
  if (!product) {
    const luxuryProducts = await fetch(`https://opensheet.elk.sh/${LUXURY_SHEET_ID}/${LUXURY_SHEET_NAME}`)
      .then(r => r.json())
      .catch(() => []);
    product = luxuryProducts.find(p => Number(p.id) === productId);
    if (product) {
      products = luxuryProducts;
      product.sheet_source = "luxury";
    }
  }

  if (!product) return alert("Produktet ble ikke funnet!");

  const isLuxury = isLuxuryParam || product.sheet_source === "luxury";

  // ======================================================
  // ✅ Sett inn produktinfo
  // ======================================================
  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-brand").textContent = product.brand;
  document.getElementById("product-desc").textContent =
    product.info || product.description || "Dette eksklusive produktet kombinerer kvalitet og eleganse.";
  document.getElementById("product-price").textContent = product.price ? `${product.price} kr` : "";
  document.getElementById("buy-link").href = product.product_url;

  // ✅ Rating
  const ratingNum = parseFloat(String(product.rating).replace(",", ".").replace(/[^0-9.]/g, ""));
  document.getElementById("product-rating").textContent =
    !isNaN(ratingNum) ? `⭐ ${ratingNum.toFixed(1)} / 5` : "⭐ Ingen rating";

  // ✅ Rabatt
  const discountEl = document.getElementById("product-discount");
  const discountNum = parseFloat(product.discount);
  discountEl.textContent =
    (!isNaN(discountNum) && discountNum > 0)
      ? `-${(discountNum <= 1 ? discountNum * 100 : discountNum).toFixed(0)}%`
      : "";

  // ✅ Bilder
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

  // ✅ Relaterte produkter
  loadRecommendations(products, product);

  // ✅ Favorittknapp
  setupFavoriteButton(product);

  // 💎 Luxury styling
  if (isLuxury) {
    document.body.classList.add("luxury-mode");
    document.getElementById("product-price").style.color = "#d4af37";
    document.getElementById("product-title").style.color = "#111";
  }
});

// ======================================================
// ✅ Relaterte produkter
// ======================================================
async function loadRecommendations(products, currentProduct) {
  const slider = document.getElementById("related-slider");
  if (!slider) return;

  const curCat = (currentProduct.category || "").toLowerCase();
  const curBrand = (currentProduct.brand || "").toLowerCase();

  let matches = products.filter(p =>
    Number(p.id) !== Number(currentProduct.id) &&
    p.image_url &&
    (p.category || "").toLowerCase() === curCat
  );

  if (matches.length < 4) {
    matches = matches.concat(products.filter(p =>
      Number(p.id) !== Number(currentProduct.id) &&
      p.image_url &&
      (p.brand || "").toLowerCase() === curBrand
    ));
  }

  matches = [...new Map(matches.map(p => [p.id, p])).values()].slice(0, 8);

  if (!matches.length) {
    slider.innerHTML = "<p>Ingen anbefalinger tilgjengelig.</p>";
    return;
  }

  slider.innerHTML = "";
  matches.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      ${p.discount ? `<div class="discount-badge">${p.discount}%</div>` : ""}
      <img src="${p.image_url}" alt="${p.title}" />
      <div class="product-info">
        <h3>${p.title}</h3>
        <p class="price">${p.price} kr</p>
      </div>
    `;

    // Behold luxury-param hvis aktuelt
    const luxuryParam = (currentProduct.sheet_source === "luxury") ? "&luxury=true" : "";
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${p.id}${luxuryParam}`;
    });

    slider.appendChild(card);
  });

  updateSliderNav();
}

// ======================================================
// ✅ Favoritt-knapp
// ======================================================
function setupFavoriteButton(product) {
  const btn = document.getElementById("favorite-btn");
  if (!btn) return;

  const id = Number(product.id);
  const exists = getFavorites().some(f => Number(f.id) === id);

  btn.innerHTML = exists
    ? `<span class="heart active"></span> Fjern fra favoritter`
    : `<span class="heart"></span> Legg til favoritter`;

  btn.addEventListener("click", () => {
    toggleFavorite(product);
    const nowExists = getFavorites().some(f => Number(f.id) === id);
    btn.innerHTML = nowExists
      ? `<span class="heart active"></span> Fjern fra favoritter`
      : `<span class="heart"></span> Legg til favoritter`;
  });
}

// ======================================================
// ✅ Slider navigation
// ======================================================
const slider = document.getElementById("related-slider");
const btnPrev = document.querySelector(".slider-btn.prev");
const btnNext = document.querySelector(".slider-btn.next");

function updateSliderNav() {
  if (!slider) return;
  const canScrollMore = slider.scrollWidth > slider.clientWidth + 10;
  btnPrev.style.opacity = btnNext.style.opacity = canScrollMore ? "1" : "0";
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
// ✅ Tilbake-knapp
// ======================================================
document.getElementById("back-btn")?.addEventListener("click", () => {
  const ref = document.referrer;
  if (ref && !ref.includes("product.html")) window.history.back();
  else window.location.href = "index.html";
});

