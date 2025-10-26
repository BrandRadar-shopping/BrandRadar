// ======================================================
// BrandRadar.shop – Google Sheets Product Loader (fixed field mapping)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product script running with favorites...");

  const SHEET_ID = "2PACX-1vQWnu8IsFKWjitEI3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUUs_oF1737lGxAtAa2NGlRq0ThN-";
const SHEET_NAME = "BrandRadarProdukter";
const productGrid = document.querySelector(".product-grid");

if (!productGrid) {
  console.error("⚠️ Ingen .product-grid funnet på siden!");
  return;
}

const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

fetch(url)
  .then((res) => {
    console.log("🟢 Response status:", res.status);
    return res.json();
  })
  .then((rows) => {
    console.log("✅ Parsed rows:", rows);

    if (!rows || !rows.length) {
      throw new Error("Ingen rader funnet i Google Sheet");
    }

    productGrid.innerHTML = "";

    rows.forEach((item) => {
      // Sjekk at nødvendige felter finnes
      if (!item.title || !item.image_url) {
        console.warn("⚠️ Hopper over rad uten tittel/bilde:", item);
        return;
      }

      // Opprett produktkort
      const card = document.createElement("div");
      card.classList.add("product-card");

      card.innerHTML = `
        <img src="${item.image_url}" alt="${item.title}">
        <div class="product-info">
          <h3>${item.title}</h3>
          <p class="brand">${item.brand || ""}</p>
          <p class="price">${item.price ? item.price + " kr" : ""}</p>
          ${item.discount ? `<p class="discount">-${item.discount}</p>` : ""}
        </div>
      `;

      productGrid.appendChild(card);
    });
  })
  .catch((err) => {
    console.error("❌ Fetch-feil:", err);
    productGrid.innerHTML = `<p class="error">Kunne ikke laste produkter 😞</p>`;
  });


      rows.forEach((row) => {
        // Tilpasset faktiske kolonnenavn fra Google Sheets
        const brand = row.brand || row.Brand || "";
        const title = row.title || row.Title || "";
        const price = row.price || row.Price || "";
        const discount = row.discount || row.Discount || "";
        const image = row.image_url || row["Image URL"] || "";
        const productUrl = row.product_url || row["Product URL"] || "#";
        const category = row.category || row.Category || "";
        const gender = row.gender || row.Gender || "";
        const subcategory = row.subcategory || row.Subcategory || "";
        const image2 = row.image2 || "";
        const image3 = row.image3 || "";
        const image4 = row.image4 || "";
        const description = row.description || row.Description || "";
        const rating = row.rating || row.Rating || "";

        if (!title || !image) return;

        const favorites = getFavorites();
        const isFav = favorites.some((fav) => fav.title === title);

        const discountDisplay =
          discount && !isNaN(parseFloat(discount))
            ? `${discount}% OFF`
            : discount || "";

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

          <img src="${image}" alt="${title}" />
          <div class="product-info">
            <h3>${title}</h3>
            ${brand ? `<p class="brand">${brand}</p>` : ""}
            ${price ? `<p class="price">${price}</p>` : ""}
            ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
            ${gender ? `<p class="gender">${gender}</p>` : ""}
            <a href="${productUrl}" target="_blank" class="buy-btn">Se produkt</a>
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
            image,
            image2,
            image3,
            image4,
            url: productUrl,
            gender,
            category,
            subcategory,
            description,
            rating,
          });
          window.location.href = `product.html?${params.toString()}`;
        });

        // ❤️ Favoritt-knapp
        const heart = card.querySelector(".fav-icon");
        heart.addEventListener("click", (e) => {
          e.stopPropagation();
          const product = {
            brand,
            title,
            price,
            discount,
            image,
            image2,
            image3,
            image4,
            url: productUrl,
            gender,
            category,
            subcategory,
            description,
            rating,
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
        if (buyBtn) {
          buyBtn.addEventListener("click", (e) => e.stopPropagation());
        }

        productGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML =
        "<p>Kunne ikke laste produkter akkurat nå. Prøv igjen senere.</p>";
    });
});


