// ======================================================
// BrandRadar.shop – Produktvisning (FIXED + Thumbnails Correct)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const product = {
    title: params.get("title") || "",
    brand: params.get("brand") || "",
    price: params.get("price") || "",
    discount: params.get("discount") || "",
    url: params.get("url") || "#",
    category: params.get("category") || "",
    gender: params.get("gender") || "",
    subcategory: params.get("subcategory") || "",
    description: params.get("description") || "",
    rating: params.get("rating") || "",
    image: params.get("image") || "",
    image2: params.get("image2") || "",
    image3: params.get("image3") || "",
    image4: params.get("image4") || ""
  };

  const images = [
    product.image, product.image2, product.image3, product.image4
  ].filter(Boolean);

  // Sett inn tekstdata
  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-brand").textContent = product.brand;
  document.getElementById("product-price").textContent =
    product.price ? `${product.price} kr` : "";
  document.getElementById("product-desc").textContent = product.description || "";
  document.getElementById("buy-link").href = product.url;

  const ratingEl = document.getElementById("product-rating");
  ratingEl.textContent = product.rating ? `⭐ ${product.rating}/5` : "";

  // Rabatt
  const discountEl = document.getElementById("product-discount");
  const v = parseFloat(product.discount);
  if (!isNaN(v) && v > 0) {
    const pct = v <= 1 ? Math.round(v * 100) : Math.round(v);
    discountEl.textContent = `-${pct}%`;
  }

  // Bildegalleri
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");

  // ✅ fallback
  if (!images.length) {
    mainImg.src = "https://via.placeholder.com/600x700?text=No+Image";
    return;
  }

  mainImg.src = images[0];

  images.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    img.classList.add("thumb");
    if (index === 0) img.classList.add("active");

    img.addEventListener("click", () => {
      document.querySelectorAll(".thumb").forEach(el => el.classList.remove("active"));
      img.classList.add("active");
      mainImg.src = src;
    });

    thumbs.appendChild(img);
  });
});

// ======================================================
// Related Products Loader
// ======================================================

(async function loadRelated() {
  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const relatedGrid = document.getElementById("related-grid");

  if (!relatedGrid) return;

  const res = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`);
  const products = await res.json();

  const matches = products
    .filter(p =>
      (p.category === params.get("category") ||
      p.brand === params.get("brand")) &&
      p.title !== params.get("title") // Ikke vis samme produkt
    )
    .slice(0, 8); // Maks 8 stk

  if (matches.length === 0) {
    relatedGrid.innerHTML = "<p>Ingen lignende produkter funnet.</p>";
    return;
  }

  relatedGrid.innerHTML = "";

  matches.forEach(p => {
    const paramsObj = new URLSearchParams({
      title: p.title,
      brand: p.brand,
      price: p.price,
      discount: p.discount,
      image: p.image_url,
      image2: p.image2,
      image3: p.image3,
      image4: p.image4,
      url: p.product_url,
      category: p.category,
      gender: p.gender,
      subcategory: p.subcategory,
      description: p.description,
      rating: p.rating
    });

    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      ${p.discount ? `<div class="discount-badge">${p.discount}% OFF</div>` : ""}
      <img src="${p.image_url}" alt="${p.title}" />
      <div class="product-info">
        <h3>${p.title}</h3>
        <p class="price">${p.price} kr</p>
        <a class="buy-btn">Se produkt</a>
      </div>
    `;

    card.addEventListener("click", () => {
      window.location.href = `product.html?${paramsObj.toString()}`;
    });

    relatedGrid.appendChild(card);
  });
})();


// ✅ Tilbake-knapp
document.getElementById("back-btn")?.addEventListener("click", () => {
  window.history.back();
});



