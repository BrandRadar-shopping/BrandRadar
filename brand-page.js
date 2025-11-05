// ======================================================
// ✅ BrandRadar – Brand Page (Kombinert & Fixet)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const brandName = new URLSearchParams(window.location.search).get("brand");

  if (!brandName) {
    document.querySelector(".brand-info h1").textContent = "Brand ikke funnet";
    return;
  }

  const brandInfoUrl =
    "https://opensheet.elk.sh/1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw/Ark 1";
  const productUrl =
    "https://opensheet.elk.sh/1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw/BrandRadarProdukter";

  const titleEl = document.getElementById("brand-title");
  const descEl = document.getElementById("brand-description");
  const logoEl = document.getElementById("brand-logo");
  const siteBtn = document.getElementById("brand-site-btn");
  const favBtn = document.getElementById("favorite-brand-btn");

  const grid = document.querySelector(".product-grid");
  const emptyMsg = document.querySelector(".empty-message");
  const resultCount = document.querySelector(".result-count");

  const categorySelect = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");

  // ✅ Favoritt-brand system
  function getFavBrands() {
    return JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
  }

  function toggleFavBrand(name) {
    let favs = getFavBrands();
    if (favs.includes(name)) {
      favs = favs.filter((b) => b !== name);
    } else {
      favs.push(name);
    }
    localStorage.setItem("favoriteBrands", JSON.stringify(favs));
    updateFavUI();
    updateFavoriteCount();
  }

  function updateFavUI() {
    const isFav = getFavBrands().includes(brandName);
    favBtn.classList.toggle("active", isFav);
    favBtn.textContent = isFav ? "✓ Favoritt-brand" : "♡ Favoritt-brand";
  }

  favBtn.addEventListener("click", () => toggleFavBrand(brandName));

  updateFavoriteCount?.();

  // ✅ Hent brand info
  fetch(brandInfoUrl)
    .then((r) => r.json())
    .then((rows) => {
      const brand = rows.find(
        (b) => b.brand?.toLowerCase().trim() === brandName.toLowerCase().trim()
      );
      if (!brand) return;

      titleEl.textContent = brand.brand;
      descEl.textContent = brand.about || "Ingen informasjon tilgjengelig.";
      logoEl.src = brand.logo;
      siteBtn.href = brand.homepage_url;

      if (brand.categories) {
        brand.categories.split(",")
          .map((c) => c.trim())
          .forEach((cat) => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
          });
      }
      updateFavUI();
    });

  // ✅ Hent produkter
  let brandProducts = [];

  fetch(productUrl)
    .then((r) => r.json())
    .then((products) => {
      brandProducts = products.filter(
        (p) =>
          p.brand &&
          p.brand.toLowerCase().trim() === brandName.toLowerCase().trim()
      );

      if (!brandProducts.length) {
        emptyMsg.style.display = "block";
        return;
      }

      applyFiltersAndSort();
      updateFavoriteCount?.();
    });

  // ✅ Filtering & sorting
  function applyFiltersAndSort() {
    let list = [...brandProducts];

    const cleanPrice = (v) =>
      parseFloat(String(v).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    const cleanRating = (v) =>
      parseFloat(String(v).replace(",", ".").replace(/[^0-9.]/g, "")) || 0;

    // ✅ Filter kategori
    if (categorySelect.value !== "all") {
      list = list.filter((p) => p.category === categorySelect.value);
    }

    // ✅ Sortering
    switch (sortSelect.value) {
      case "price-asc":
        list.sort((a, b) => cleanPrice(a.price) - cleanPrice(b.price));
        break;
      case "price-desc":
        list.sort((a, b) => cleanPrice(b.price) - cleanPrice(a.price));
        break;
      case "rating-desc":
        list.sort((a, b) => cleanRating(b.rating) - cleanRating(a.rating));
        break;
    }

    renderProducts(list);
  }

  function renderProducts(list) {
    grid.innerHTML = "";

    if (!list.length) {
      emptyMsg.style.display = "block";
      resultCount.textContent = "0 produkter";
      return;
    }

    emptyMsg.style.display = "none";
    resultCount.textContent = `${list.length} produkter`;

    list.forEach((p) => {
      const rating = p.rating
        ? parseFloat(
            String(p.rating).replace(",", ".").replace(/[^0-9.]/g, "")
          ).toFixed(1)
        : null;

      const card = document.createElement("div");
      card.classList.add("product-card");
      card.innerHTML = `
        <img src="${p.image_url}" alt="${p.title}">
        <div class="product-info">
          <h3>${p.title}</h3>
          ${rating ? `<p class="rating">⭐ ${rating}</p>` : ""}
          <p class="price">${p.price} kr</p>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.href = `product.html?id=${p.id}`;
      });

      grid.appendChild(card);
    });
  }

  // ✅ Event listeners
  categorySelect.addEventListener("change", applyFiltersAndSort);
  sortSelect.addEventListener("change", applyFiltersAndSort);
});

