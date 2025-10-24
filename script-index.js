// ======================================================
// BrandRadar.shop – Google Sheets Product Loader (with thumbs, favorites + details)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Product script running with favorites...");

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const productGrid = document.querySelector(".product-grid");

  if (!productGrid) {
    console.error("⚠️ Ingen .product-grid funnet på siden!");
    return;
  }

  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

fetch(url)
  .then(res => {
    console.log("🟢 Response status:", res.status);
    return res.text();
  })
  .then(data => {
    console.log("🟢 RAW RESPONSE START:", data.slice(0, 200));

    let rows;
    try {
      rows = JSON.parse(data);
      console.log("✅ Parsed rows:", rows);
    } catch (err) {
      console.error("❌ JSON parsing feilet:", err, data);
      throw new Error("Ugyldig JSON-data mottatt fra Sheets");
    }

    if (!rows || !rows.length) {
      throw new Error("Ingen rader funnet i Google Sheet");
    }

    productGrid.innerHTML = "";


      rows.forEach(row => {
  // direkte feltnavn fra JSON
  const brand = row.Brand || "";
  const title = row.Title || "";
  const price = row.Price || "";
  const discount = row.Discount || "";
  const image = row["Image URL"] || "";
  const productUrl = row["Product URL"] || "#";
  const category = row.Category || "";
  const gender = row.Gender || "";
  const subcategory = row.Subcategory || "";
  const image2 = row.image2 || "";
  const image3 = row.image3 || "";
  const image4 = row.image4 || "";
  const description = row.Description || "";
  const rating = row.Rating || "";

  if (!title || !image) return;

  const favorites = getFavorites();
  const isFav = favorites.some(fav => fav.title === title);

  const discountDisplay =
    discount && !isNaN(discount)
      ? `${Math.round(discount * 100)}% OFF`
      : discount || "";

  const card = document.createElement("div");
  card.classList.add("product-card");

  card.innerHTML = `
    ${discountDisplay ? `<div class="discount-badge">${discountDisplay}</div>` : ""}
    <div class="fav-icon ${isFav ? "active" : ""}">❤️</div>
    <img src="${image}" alt="${title}" />
    <div class="product-info">
      <h3>${title}</h3>
      ${brand ? `<p class="brand">${brand}</p>` : ""}
      ${price ? `<p class="price">${price}</p>` : ""}
      ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
      <p class="gender">${gender}</p>
      <a href="${productUrl}" target="_blank" class="buy-btn">Se produkt</a>
    </div>
  `;

  // klikk på kort → product.html
  card.addEventListener("click", e => {
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
      rating
    });
    window.location.href = `product.html?${params.toString()}`;
  });

  // ❤️ favoritt
  const heart = card.querySelector(".fav-icon");
  heart.addEventListener("click", e => {
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
      rating
    };
    const favorites = getFavorites();
    const isAlreadyFav = favorites.some(f => f.title === title);

    if (isAlreadyFav) {
      const updated = favorites.filter(f => f.title !== title);
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
    buyBtn.addEventListener("click", e => e.stopPropagation());
  }

  productGrid.appendChild(card);
});

    .catch((err) => {
      console.error("❌ Feil ved lasting av produkter:", err);
      productGrid.innerHTML =
        "<p>Kunne ikke laste produkter akkurat nå. Prøv igjen senere.</p>";
    });
});


