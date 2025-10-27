// ======================================================
// BRANDRADAR.SHOP – PRODUCT DETAIL PAGE SCRIPT (STABIL)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ product.js loaded");

  const params = new URLSearchParams(window.location.search);
  const product = Object.fromEntries(params.entries());

  // --- Fyll inn informasjon ---
  document.getElementById("product-title").textContent = product.title || "";
  document.getElementById("product-brand").textContent = product.brand || "";
  document.getElementById("product-price").textContent = product.price
    ? `Pris: ${product.price} kr`
    : "";
  document.getElementById("product-discount").textContent = product.discount
    ? `Rabatt: ${product.discount}`
    : "";
  document.getElementById("product-desc").textContent =
    product.description || "";
  document.getElementById("buy-link").href = product.url || "#";

  // --- Rating ---
  const ratingEl = document.getElementById("product-rating");
  if (product.rating) {
    const val = parseFloat(product.rating);
    ratingEl.textContent = isNaN(val) ? product.rating : `⭐ ${val}/5`;
  } else {
    ratingEl.textContent = "";
  }

  // --- Bildegalleri ---
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");

  // Samle bilder (inkl. hovedbilde først)
  const images = [
    product.image_url || product.image,
    product.image2,
    product.image3,
    product.image4,
  ].filter((src) => src && src.trim() !== "");

  if (images.length > 0) {
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

  // --- Favoritt-knapp ---
  const btn = document.getElementById("favorite-btn");
  if (btn) {
    const updateState = () => {
      const favs = getFavorites();
      const isFav = favs.some((f) => f.title === product.title);
      btn.textContent = isFav
        ? "💔 Fjern fra favoritter"
        : "❤️ Legg til favoritt";
    };

    btn.addEventListener("click", () => {
      toggleFavorite(product);
      updateState();
    });

    updateState();
  }

  // --- Tilbake-knapp ---
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  }
});



