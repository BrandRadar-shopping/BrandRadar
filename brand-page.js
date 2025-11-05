// ==========================================
// ✅ BrandRadar – Brand Page
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  const brandName = new URLSearchParams(window.location.search).get("brand");
  if (!brandName) {
    document.querySelector(".brand-info h1").textContent = "Brand ikke funnet";
    return;
  }

  const productUrl = "https://opensheet.elk.sh/1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw/BrandRadarProdukter";
  const brandsUrl  = "https://docs.google.com/spreadsheets/d/1KqkpJpj0sGp3elTj8OXIPnyjYfu94BA9OrMk7dCkkdw/gviz/tq?tqx=out:json";

  const titleEl = document.getElementById("brand-title");
  const descEl = document.getElementById("brand-description");
  const logoEl = document.getElementById("brand-logo");
  const siteBtn = document.getElementById("brand-site-btn");
  const favBtn = document.getElementById("favorite-brand-btn");
  const grid = document.querySelector(".product-grid");
  const emptyMsg = document.querySelector(".empty-message");

  // ✅ FAVORITT-BRAND SYSTEM
  function getFavBrands() {
    return JSON.parse(localStorage.getItem("favoriteBrands") || "[]");
  }
  function toggleFavBrand(name) {
    let favs = getFavBrands();
    if (favs.includes(name)) {
      favs = favs.filter(b => b !== name);
    } else {
      favs.push(name);
    }
    localStorage.setItem("favoriteBrands", JSON.stringify(favs));
    updateUI();
  }
  function updateUI() {
    const favs = getFavBrands();
    favBtn.classList.toggle("active", favs.includes(brandName));
    favBtn.textContent = favs.includes(brandName) ? "✓ Favoritt-brand" : "♡ Favoritt-brand";
  }

  favBtn.addEventListener("click", () => toggleFavBrand(brandName));

  updateFavoriteCount();

  // ✅ Fetch brand info
  fetch(brandsUrl)
    .then(r => r.text())
    .then(text => {
      const json = JSON.parse(text.substr(47).slice(0, -2));
      const rows = json.table.rows.map(r => ({
        brand: r.c[0]?.v || "",
        logo: r.c[1]?.v || "",
        description: r.c[2]?.v || "",
        link: r.c[3]?.v || "#"
      }));

      const brand = rows.find(b => b.brand.toLowerCase() === brandName.toLowerCase());
      if (!brand) return;

      titleEl.textContent = brand.brand;
      descEl.textContent = brand.description || "Ingen beskrivelse tilgjengelig.";
      logoEl.src = brand.logo;
      siteBtn.href = brand.link;
    });

  // ✅ Fetch brand products
  fetch(productUrl)
    .then(r => r.json())
    .then(products => {
      const list = products.filter(p => p.brand.toLowerCase() === brandName.toLowerCase());
      
      if (!list.length) {
        emptyMsg.style.display = "block";
        return;
      }

      list.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <img src="${p.image_url}">
          <h3>${p.title}</h3>
          <p>${p.price} kr</p>
        `;
        card.addEventListener("click", () => {
          window.location.href = `product.html?id=${p.id}`;
        });
        grid.appendChild(card);
      });
    });

  updateUI();
});
