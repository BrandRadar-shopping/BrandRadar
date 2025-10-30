document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const product = {
    title: params.get("title") || "",
    brand: params.get("brand") || "",
    price: params.get("price") || "",
    discount: params.get("discount") || "",
    image: params.get("image_url") || "",
    image2: params.get("image2") || "",
    image3: params.get("image3") || "",
    image4: params.get("image4") || "",
    url: params.get("product_url") || "#",
    category: params.get("category") || "",
    gender: params.get("gender") || "",
    subcategory: params.get("subcategory") || "",
    description: params.get("description") || "",
    rating: params.get("rating") || ""
  };

  // ✅ Bilder i riktig rekkefølge uten duplikater
  const uniqueImages = [...new Set([
    product.image,
    product.image2,
    product.image3,
    product.image4
  ].filter(Boolean))];

  // ✅ Sett hoveddata i UI
  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-brand").textContent = product.brand;
  document.getElementById("product-price").textContent =
    product.price ? `Pris: ${product.price} kr` : "";
  document.getElementById("product-desc").textContent = product.description || "";
  document.getElementById("buy-link").href = product.url;

  const ratingEl = document.getElementById("product-rating");
  if (product.rating) {
    ratingEl.textContent = `⭐ ${product.rating}/5`;
  }

  // ✅ Rabatt
  const discountEl = document.getElementById("product-discount");
  const discountValue = parseFloat(product.discount);
  if (!isNaN(discountValue) && discountValue > 0) {
    const pct = discountValue <= 1 ? Math.round(discountValue * 100) : discountValue;
    discountEl.textContent = `-${pct}%`;
  }

  // ✅ Bildegalleri
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");

  if (uniqueImages.length) {
    mainImg.src = uniqueImages[0];

    uniqueImages.forEach((src, index) => {
      const thumb = document.createElement("img");
      thumb.src = src;
      thumb.classList.add("thumb");
      if (index === 0) thumb.classList.add("active");

      thumb.addEventListener("click", () => {
        mainImg.src = src;
        document.querySelectorAll(".thumb").forEach(el => el.classList.remove("active"));
        thumb.classList.add("active");
      });

      thumbs.appendChild(thumb);
    });

  } else {
    mainImg.src = "https://via.placeholder.com/600x700?text=No+Image";
  }
});

// ✅ Tilbake-knapp
document.getElementById("back-btn")?.addEventListener("click", () => {
  window.history.back();
});


