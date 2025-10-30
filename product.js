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

// ✅ Tilbake-knapp
document.getElementById("back-btn")?.addEventListener("click", () => {
  window.history.back();
});



