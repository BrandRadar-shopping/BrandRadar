// ======================================================
// BrandRadar.shop – Google Sheets Product Loader (GVIZ stable version)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product script running with favorites...");

  const SHEET_ID = "2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-";
const SHEET_NAME = "BrandRadarProdukter";
const url = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  const productGrid = document.querySelector(".product-grid");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

 //=== const url = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`; //===

  fetch(url)
    .then((res) => res.text())
    .then((text) => {
      const json = JSON.parse(text.substring(47, text.length - 2));
      const rows = json.table.rows.map((r) => ({
        brand: r.c[0]?.v || "",
        title: r.c[1]?.v || "",
        price: r.c[2]?.v || "",
        discount: r.c[3]?.v || "",
        image_url: r.c[4]?.v || "",
        product_url: r.c[5]?.v || "",
        category: r.c[6]?.v || "",
        gender: r.c[7]?.v || "",
        subcategory: r.c[8]?.v || "",
        description: r.c[9]?.v || "",
        rating: r.c[10]?.v || "",
        image2: r.c[11]?.v || "",
        image3: r.c[12]?.v || "",
        image4: r.c[13]?.v || "",
      }));

      console.log("✅ Produkter hentet:", rows.length);

      productGrid.innerHTML = "";

      rows.forEach((row) => {
        const {
          brand,
          title,
          price,
          discount,
          image_url,
          product_url,
          gender,
          rating,
          category,
          subcategory,
          image2,
          image3,
          image4,
          description,
        } = row;

        if (!title || !image_url) return;

        const favorites = getFavorites();
        const isFav = favorites.some((fav) => fav.title === title);

        let discountDisplay = "";
        if (discount) {
          const cleanValue = parseFloat(discount.toString().replace("%", "").trim());
          if (!isNaN(cleanValue)) {
            const displayValue = cleanValue < 1 ? cleanValue * 100 : cleanValue;
            discountDisplay = `${displayValue}% OFF`;
          }
        }

        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          ${discountDisplay ? `<div class="discount-badge">${discountDisplay}</div>` : ""}
          <div class="fav-icon ${isFav ? "active" : ""}">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
              2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
              14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
              6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <img src="${image_url}" alt="${title}">
          <div class="product-info">
            <h3>${title}</h3>
            ${brand ? `<p class="brand">${brand}</p>` : ""}
            ${price ? `<p class="price">${price} kr</p>` : ""}
            ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
            ${gender ? `<p class="gender">${gender}</p>` : ""}
            <a href="${product_url}" target="_blank" class="buy-btn">Se produkt</a>
          </div>
        `;

        // Klikk på kort → product.html
        card.addEventListener("click", (e) => {
          if (e.target.classList.contains("fav-icon")) return;
          const params = new URLSearchParams({
            brand,
            title,
            price,
            discount,
            image_url,
            image2,
            image3,
            image4,
            url: product_url,
            gender,
            category,
            subcategory,
            description,
            rating,
          });
          window.location.href = `product.html?${params.toString()}`;
        });

        // ❤️ Favorittknapp
        const heart = card.querySelector(".fav-icon");
        heart.addEventListener("click", (e) => {
          e.stopPropagation();
          const product = {
            brand, title, price, discount, image_url,
            image2, image3, image4, url: product_url,
            gender, category, subcategory, description, rating,
          };
          const favorites = getFavorites();
          const isAlreadyFav = favorites.some((f) => f.title === title);

          if (isAlreadyFav) {
            const updated = favorites.filter((f) => f.title !== title);
            saveFavorites(updated);
            heart.classList.remove("active", "pop");
            heart.classList.add("unfav");
            showToast("❌ Fjernet fra favoritter", false);
          } else {
            favorites.push(product);
            saveFavorites(favorites);
            heart.classList.remove("unfav");
            heart.classList.add("active", "pop");
            showToast("❤️ Lagt til som favoritt", true);
          }

          updateFavoriteCount();
        });

        const buyBtn = card.querySelector(".buy-btn");
        if (buyBtn) buyBtn.addEventListener("click", (e) => e.stopPropagation());

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML = `<p>Kunne ikke laste produkter akkurat nå. Prøv igjen senere.</p>`;
    });
});


