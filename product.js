document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const product = {
    title: params.get("title") || "",
    brand: params.get("brand") || "",
    price: params.get("price") || "",
    discount: params.get("discount") || "",
    image: params.get("image") || "",
    images: [
      params.get("image") || "",
      params.get("image2") || "",
      params.get("image3") || "",
      params.get("image4") || ""
    ].filter(Boolean),
    url: params.get("url") || "#",
    gender: params.get("gender") || "",
    category: params.get("category") || "",
    subcategory: params.get("subcategory") || "",
    description: params.get("description") || "",
    rating: params.get("rating") || ""
  };

  // Fyll inn felt
  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-brand").textContent = product.brand;
  document.getElementById("product-price").textContent =
    product.price ? `Pris: ${product.price}` : "";
  document.getElementById("product-discount").textContent =
    product.discount ? `Rabatt: ${product.discount}` : "";
  document.getElementById("product-desc").textContent = product.description || "";
  document.getElementById("buy-link").href = product.url;

  // Rating (enkel visning, f.eks. "⭐ 4.3/5")
  const ratingEl = document.getElementById("product-rating");
  if (product.rating) {
    const value = Number(product.rating);
    ratingEl.textContent = isNaN(value) ? product.rating : `⭐ ${value}/5`;
  } else {
    ratingEl.textContent = "";
  }

  // Bildegalleri
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");

  if (product.images.length) {
    mainImg.src = product.images[0];
    product.images.forEach((src, idx) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Thumbnail ${idx + 1}`;
      img.classList.add("thumb");
      img.addEventListener("click", () => (mainImg.src = src));
      thumbs.appendChild(img);
    });
  } else if (product.image) {
    mainImg.src = product.image;
  }
});

// Tilbake-knapp
document.getElementById("back-btn")?.addEventListener("click", () => {
  window.history.back();
});

