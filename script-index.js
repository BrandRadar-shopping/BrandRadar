// ======================================================
// ✅ BrandRadar – Forside (Picks fra News)
// Bruker eksisterende "picks"-ark (med liten p)
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Index script loaded (picks)");
  
  const SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_NAME = "picks"; // 🔥 liten p, matcher arket nøyaktig
  const grid = document.getElementById("featured-grid");

  if (!grid) return;

  const formatDiscount = (value) => {
    if (!value) return "";
    let n = parseFloat(String(value).replace("%", "").trim());
    if (!isNaN(n) && n > 0 && n < 1) n *= 100;
    return `${Math.round(n)}%`;
  };

  try {
    const rows = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`).then(r => r.json());
    grid.innerHTML = "";

    // 🔍 Filtrer kun featured produkter (TRUE/YES)
    const featured = rows.filter(r =>
      String(r.featured).toLowerCase() === "true" || String(r.featured).toLowerCase() === "yes"
    );

    if (!featured.length) {
      grid.innerHTML = "<p>Ingen utvalgte produkter akkurat nå.</p>";
      return;
    }

    featured.slice(0, 12).forEach(p => {
      // Hvis du ikke har id-kolonne enda → bruk tilfeldig ID
      const id = p.id ? Number(p.id) : Math.floor(Math.random() * 100000);
      const isFav = getFavorites().some(f => Number(f.id) === id);
      const discountTxt = formatDiscount(p.discount);
      const rating = p.rating ? parseFloat(p.rating.replace(",", ".")) : null;

      const card = document.createElement("div");
      card.classList.add("product-card");

      card.innerHTML = `
        ${discountTxt ? `<div class="discount-badge">-${discountTxt}</div>` : ""}
        <div class="fav-icon ${isFav ? "active" : ""}" title="Favoritt">
          <svg viewBox="0 0 24 24" class="heart-icon">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
            14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
            6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>

        <img src="${p.image_url}" alt="${p.product_name}">
        <div class="product-info">
          <h3>${p.product_name}</h3>
          ${p.brand ? `<p class="brand">${p.brand}</p>` : ""}
          ${rating ? `<p class="rating">⭐ ${rating.toFixed(1)}</p>` : ""}
          ${p.price ? `<p class="price">${p.price} kr</p>` : ""}
        </div>
      `;

      // Klikk = produktdetalj
      card.addEventListener("click", (e) => {
        if (e.target.closest(".fav-icon")) return;
        window.location.href = `product.html?id=${id}`;
      });

      // Favoritt
      card.querySelector(".fav-icon").addEventListener("click", (e) => {
        e.stopPropagation();
        const cleanProduct = {
          id,
          title: p.product_name,
          brand: p.brand,
          price: p.price,
          discount: p.discount,
          image_url: p.image_url,
          product_url: p.link,
          description: p.reason,
          rating: p.rating,
        };
        const exists = getFavorites().some(f => Number(f.id) === id);
        toggleFavorite(cleanProduct);
        e.currentTarget.classList.toggle("active", !exists);
      });

      grid.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Klarte ikke laste Picks:", err);
    grid.innerHTML = "<p>Kunne ikke laste produktene akkurat nå.</p>";
  }
});





