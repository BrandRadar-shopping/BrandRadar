document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const product = {
    title: params.get("title") || "",
    brand: params.get("brand") || "",
    price: params.get("price") || "",
    discount: params.get("discount") || "",
    url: params.get("product_url") || "#",
    category: params.get("category") || "",
    gender: params.get("gender") || "",
    subcategory: params.get("subcategory") || "",
    description: params.get("description") || "",
    rating: params.get("rating") || "",

    images: [
      params.get("image_url"),
      params.get("image2"),
      params.get("image3"),
      params.get("image4")
    ].filter(Boolean)
  };

  // Sett tekstdata
  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-brand").textContent = product.brand;
  document.getElementById("product-price").textContent = product.price ? `Pris: ${product.price} kr` : "";
  document.getElementById("product-desc").textContent = product.description || "";
  document.getElementById("buy-link").href = product.url;

  const ratingEl = document.getElementById("product-rating");
  if (product.rating) {
    ratingEl.textContent = `⭐ ${product.rating}/5`;
  }

  // Rabatt
  const discountEl = document.getElementById("product-discount");
  const discountValue = parseFloat(product.discount);
  if (!isNaN(discountValue) && discountValue > 0) {
    const pct = discountValue <= 1 ? Math.round(discountValue * 100) : discountValue;
    discountEl.textContent = `${pct}%`;
  } else {
    discountEl.textContent = "";
  }

  // Bildegalleri
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");
  const container = document.querySelector(".product-detail");

  if (product.images.length > 0) {
    mainImg.src = product.images[0];
// Plasser main image som thumbnail igjen dersom > 1 bilde
if (product.images.length > 1) {
  const firstThumb = document.createElement("img");
  firstThumb.src = product.images[0];
  firstThumb.classList.add("thumb", "active");
  thumbs.insertBefore(firstThumb, thumbs.firstChild);
}

    product.images.forEach((src, index) => {
      const t = document.createElement("img");
      t.src = src;
      t.classList.add("thumb");
      if (index === 0) t.classList.add("active");

      t.addEventListener("click", () => {
        mainImg.src = src;
        document.querySelectorAll(".thumb").forEach(el => el.classList.remove("active"));
        t.classList.add("active");
      });

      thumbs.appendChild(t);
    });

    container.classList.add("has-thumbnails");

  } else {
    mainImg.src = "https://via.placeholder.com/600x700?text=No+Image";
    container.classList.add("no-thumbnails");
  }
});

// Tilbake-knapp
document.getElementById("back-btn")?.addEventListener("click", () => {
  window.history.back();
});


