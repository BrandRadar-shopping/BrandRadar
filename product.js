document.addEventListener("DOMContentLoaded", () => {
  // Midlertidige testdata – senere hentes fra Sheets eller URL-param
  const product = {
    title: "Nike Air Max 270",
    brand: "Nike",
    price: "1 399,-",
    discount: "20%",
    images: [
      "https://via.placeholder.com/500x500",
      "https://via.placeholder.com/500x500/aaa",
      "https://via.placeholder.com/500x500/bbb"
    ],
    desc: "Lett og komfortabel løpesko med responsiv demping.",
    url: "https://nike.com"
  };

  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-brand").textContent = product.brand;
  document.getElementById("product-price").textContent = `Pris: ${product.price}`;
  document.getElementById("product-discount").textContent = `Rabatt: ${product.discount}`;
  document.getElementById("product-desc").textContent = product.desc;
  document.getElementById("buy-link").href = product.url;

  // Bildegalleri
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");

  product.images.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.classList.add("thumb");
    img.addEventListener("click", () => (mainImg.src = src));
    thumbs.appendChild(img);
  });

  mainImg.src = product.images[0];
});
