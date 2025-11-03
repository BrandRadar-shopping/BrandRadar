// ======================================================
// ✅ Product page — Single source of truth: Google Sheets
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get("id"));

  if (!productId) {
    console.error("❌ Ingen produkt-ID i URL");
    return;
  }

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";

  const products = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`)
    .then(r => r.json())
    .catch(err => console.error("❌ Klarte ikke hente produkter", err));

  const product = products.find(p => Number(p.id) === productId);
  if (!product) return alert("Produktet ble ikke funnet!");

  // ✅ Sett produktinfo
  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-brand").textContent = product.brand;
  document.getElementById("product-desc").textContent = product.description || "";
  document.getElementById("product-price").textContent = product.price ? `${product.price} kr` : "";
  document.getElementById("buy-link").href = product.product_url;

  const ratingEl = document.getElementById("product-rating");
  const ratingNum = parseFloat(String(product.rating).replace(",", "."));
  ratingEl.textContent = !isNaN(ratingNum) ? `⭐ ${ratingNum} / 5` : "";

  const discountEl = document.getElementById("product-discount");
  const discountNum = parseFloat(product.discount);
  discountEl.textContent =
    (!isNaN(discountNum) && discountNum > 0)
      ? `-${(discountNum <= 1 ? discountNum * 100 : discountNum).toFixed(0)}%`
      : "";

  // ✅ Bilder – ALLTID høy kvalitet
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");
  const images = [
    product.image_url,
    product.image2,
    product.image3,
    product.image4
  ].filter(Boolean);

  mainImg.src = images[0] || "https://via.placeholder.com/600x700?text=No+Image";

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
});


// ======================================================
// ✅ Related Products Loader
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

    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${p.id}`;
    });

    slider.appendChild(card);
  });

  updateSliderNav();
}


// ======================================================
// ✅ Favoritt-knapp – ID-basert, stabil
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
// ✅ Slider arrows
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
