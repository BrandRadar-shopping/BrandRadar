// ======================================================
// BrandRadar.shop – Produktvisning (Complete + FIXED)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const product = {
    title: params.get("title") || "",
    brand: params.get("brand") || "",
    price: params.get("price") || "",
    discount: params.get("discount") || "",
    url: params.get("url") || "#",
    category: params.get("category") || "",
    gender: params.get("gender") || "",
    subcategory: params.get("subcategory") || "",
    description: params.get("description") || "",
    rating: params.get("rating") || "",
    image: params.get("image") || "",
    image2: params.get("image2") || "",
    image3: params.get("image3") || "",
    image4: params.get("image4") || ""
  };

  const images = [
    product.image, product.image2, product.image3, product.image4
  ].filter(Boolean);

  // ✅ Fyll inn produktinfo
  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-brand").textContent = product.brand;
  document.getElementById("product-desc").textContent = product.description || "";
  document.getElementById("product-price").textContent = product.price ? `${product.price} kr` : "";
  document.getElementById("buy-link").href = product.url;

  // ✅ Rating – rens tall
  const ratingEl = document.getElementById("product-rating");
  const n = parseFloat(String(product.rating).replace(",", ".").replace(/[^0-9.]/g, ""));
  ratingEl.textContent = !isNaN(n) ? `⭐ ${n} / 5` : "";

  // ✅ Rabatt
  const discountEl = document.getElementById("product-discount");
  const v = parseFloat(product.discount);
  discountEl.textContent = (!isNaN(v) && v > 0)
    ? `-${(v <= 1 ? v * 100 : v).toFixed(0)}%`
    : "";

  // ✅ Bildegalleri
  const mainImg = document.getElementById("main-image");
  const thumbs = document.getElementById("thumbnails");

  if (!images.length) {
    mainImg.src = "https://via.placeholder.com/600x700?text=No+Image";
  } else {
    mainImg.src = images[0];

    images.forEach((src, index) => {
      const img = document.createElement("img");
      img.src = src;
      img.classList.add("thumb");
      if (index === 0) img.classList.add("active");

      img.addEventListener("click", () => {
        document.querySelectorAll(".thumb").forEach(el => el.classList.remove("active"));
        img.classList.add("active");
        mainImg.src = src;
      });

      thumbs.appendChild(img);
    });
  }
});

// ======================================================
// Related Products Loader ✅
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "BrandRadarProdukter";
  const relatedGrid = document.getElementById("related-slider");
  if (!relatedGrid) return;

  const products = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`).then(r => r.json());

  const currentTitle = params.get("title") || "";
  const currentCategory = (params.get("category") || "").toLowerCase();
  const currentBrand = (params.get("brand") || "").toLowerCase();

  let matches = products.filter(p =>
    p.image_url &&
    p.title !== currentTitle &&
    (p.category || "").trim().toLowerCase() === currentCategory
  );

  if (matches.length < 4) {
    matches = matches.concat(products.filter(p =>
      p.image_url &&
      p.title !== currentTitle &&
      (p.brand || "").trim().toLowerCase() === currentBrand
    ));
  }

  matches = [...new Map(matches.map(p => [p.title, p])).values()].slice(0, 8);

  if (!matches.length) {
    relatedGrid.innerHTML = "<p>Ingen anbefalinger tilgjengelig.</p>";
    return;
  }

  relatedGrid.innerHTML = "";
  matches.forEach(p => {
    const paramsObj = new URLSearchParams({
      title: p.title, brand: p.brand, price: p.price,
      discount: p.discount, image: p.image_url,
      image2: p.image2, image3: p.image3, image4: p.image4,
      url: p.product_url, category: p.category,
      gender: p.gender, subcategory: p.subcategory,
      description: p.description, rating: p.rating
    });

    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      ${p.discount ? `<div class="discount-badge">${p.discount}% OFF</div>` : ""}
      <img src="${p.image_url}" alt="${p.title}" />
      <div class="product-info">
        <h3>${p.title}</h3>
        <p class="price">${p.price} kr</p>
        <button class="buy-btn">Se produkt</button>
      </div>
    `;

    card.addEventListener("click", () => {
      window.location.href = `product.html?${paramsObj.toString()}`;
    });

    relatedGrid.appendChild(card);
  });
});

// ✅ Favoritt-knapp
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("favorite-btn");
  if (!btn) return;

  const params = new URLSearchParams(window.location.search);
  const product = Object.fromEntries(params.entries());

  const updateBtn = () => {
    const isFav = getFavorites().some(f => f.title === product.title);
    btn.textContent = isFav ? "💔 Fjern fra favoritter" : "🤍 Legg til favoritter";
  };

  btn.addEventListener("click", () => {
    toggleFavorite(product);
    updateBtn();
  });

  updateBtn();
});


// ✅ Tilbake-knapp
document.getElementById("back-btn")?.addEventListener("click", () => {
  window.history.back();
});




