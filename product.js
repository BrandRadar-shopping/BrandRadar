document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const product = Object.fromEntries(params.entries());

  const images = [
    product.image_url || product.image || "",
    product.image2 || "",
    product.image3 || "",
    product.image4 || "",
  ].filter(Boolean);

  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");

  if (images.length) {
    mainImg.src = images[0];
    thumbs.innerHTML = "";
    images.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.className = "thumb" + (i === 0 ? " active" : "");
      img.addEventListener("click", () => {
        mainImg.src = src;
        thumbs.querySelectorAll(".thumb").forEach(el => el.classList.remove("active"));
        img.classList.add("active");
      });
      thumbs.appendChild(img);
    });
  }

  const backBtn = document.getElementById("back-btn");
  if (backBtn) backBtn.addEventListener("click", e => {
    e.preventDefault();
    history.back();
  });
});


