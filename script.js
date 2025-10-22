const products = [
  {
    name: "Nike Air Max 270",
    price: 1399,
    category: "Shoes • women • sneakers",
    discount: 0.2,
    image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7c4f0374-fad3-4202-bdf6-6929a3031dc7/air-max-270-herresko-KkLcGR.png"
  },
  {
    name: "Star Nutrition 12 x Soft Proteinbar 55 g Soft Choco Hazelnut",
    price: 278,
    category: "Supplements • Proteinbarer",
    discount: 0.2,
    image: "https://gymgrossisten.no/media/catalog/product/s/t/star_nutrition_soft_bar_choco_hazelnut_55g_12-pack.jpg"
  },
  {
    name: "Rhone Weekend Quilted Pullover",
    price: 1499,
    category: "Clothing • men • sweater",
    discount: 0.1,
    image: "https://cdn.shopify.com/s/files/1/0500/8437/9520/products/Weekend_Quilted_Pullover_Black.png"
  }
];

const grid = document.getElementById("productGrid");
const favCount = document.getElementById("favCount");
const favPopup = document.getElementById("favPopup");

let favorites = [];

products.forEach(product => {
  const card = document.createElement("div");
  card.className = "product-card";

  const discountPercent = Math.round(product.discount * 100);

  card.innerHTML = `
    <div class="product-image">
      <span class="badge">Discount: ${discountPercent}%</span>
      <button class="favorite-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
          C13.09 3.81 14.76 3 16.5 3
          19.58 3 22 5.42 22 8.5
          c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="product-info">
      <p class="product-name">${product.name}</p>
      <p class="product-price">${product.price} kr</p>
      <p class="product-category">${product.category}</p>
    </div>
  `;

  const favBtn = card.querySelector(".favorite-btn");
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    favBtn.classList.toggle("active");
    if (favBtn.classList.contains("active")) {
      favorites.push(product);
      favPopup.textContent = "Lagt til i favoritter ❤️";
    } else {
      favorites = favorites.filter(f => f.name !== product.name);
      favPopup.textContent = "Fjernet fra favoritter 💔";
    }
    favCount.textContent = favorites.length;
    favPopup.classList.add("show");
    setTimeout(() => favPopup.classList.remove("show"), 1600);
  });

  grid.appendChild(card);
});







