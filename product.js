// ======================================================
// BrandRadar.shop – Produktdetaljside (fullt fungerende versjon)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product page script running...");

  // Hent parametere fra URL
  const params = new URLSearchParams(window.location.search);
  const product = Object.fromEntries(params.entries());

  // Finn HTML-elementer
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");
  const title = document.getElementById("product-title");
  const brand = document.getElementById("product-brand");
  const price = document.getElementById("product-price");
  const discount = document.getElementById("product-discount");
  const rating = document.getElementById("product-rating");
  const desc = document.getElementById("product-desc");
  const buyLink = document.getElementById("buy-link");

  // Sett inn produktinfo
  title.textContent = product.title || "";
  brand.textContent = product.brand || "";
  price.textContent = product.price ? `${product.price} kr` : "";
  discount.textContent = product.discount
  ? `${parseFloat(product.discount)}% OFF`
  : "";

  desc.textContent = product.description || "";
  rating.textContent = product.rating ? `⭐ ${product.rating}` : "";
  buyLink.href = product.url || "#";

  // --------------------------------------------------
  // 🖼️ Bildegalleri – inkluderer hovedbilde som thumbnail
  // --------------------------------------------------
  const images = [
    product.image_url, // hovedbilde
    product.image2,
    product.image3,
    product.image4,
  ].filter((src) => src && src.trim() !== "");

  if (images.length > 0) {
    // Sett hovedbilde
    mainImg.src = images[0];
    thumbs.innerHTML = "";

    images.forEach((src, idx) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Thumbnail ${idx + 1}`;
      img.classList.add("thumb");
      if (idx === 0) img.classList.add("active");

      img.addEventListener("click", () => {
        mainImg.src = src;
        document
          .querySelectorAll(".thumb")
          .forEach((t) => t.classList.remove("active"));
        img.classList.add("active");
      });

      thumbs.appendChild(img);
    });
  } else {
    mainImg.src = "placeholder.jpg";
  }

  // 🔙 Tilbake-knapp
  document.getElementById("back-btn")?.addEventListener("click", () => {
    window.history.back();
  });
});


