// ======================================================
// BrandRadar – Category System ✅
// Norsk slug matching + kjønn/kidtype logikk
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  const SHEET_PRODUCTS = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
  const SHEET_MAPPING = "1e3tvfatBmnwDVs5nuR-OvSaQl0lIF-JUhuQtfvACo3g";

  const productUrl = `https://opensheet.elk.sh/${SHEET_PRODUCTS}/BrandRadarProdukter`;
  const mappingUrl = `https://opensheet.elk.sh/${SHEET_MAPPING}/CategoryMapping`;

  const params = new URLSearchParams(window.location.search);

  const categorySlug = params.get("category");
  const subSlug = params.get("subcategory");
  const genderSlug = params.get("gender");

  const titleEl = document.getElementById("category-title");
  const grid = document.querySelector(".product-grid");
  const emptyMsg = document.querySelector(".empty-message");

  const slugify = (txt) =>
    (txt || "")
      .toLowerCase()
      .replace(/æ/g, "a")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/&/g, "og")
      .replace(/[^\w\d]+/g, "-")
      .replace(/-+/g, "-");

  if (!categorySlug) {
    titleEl.textContent = "Ugyldig kategori";
    emptyMsg.style.display = "block";
    return;
  }

  Promise.all([
    fetch(mappingUrl).then(r => r.json()),
    fetch(productUrl).then(r => r.json())
  ])
    .then(([mapping, products]) => {

      const mainCat = mapping.find(r =>
        slugify(r.url_slug) === slugify(categorySlug)
      );

      if (!mainCat) {
        titleEl.textContent = "Kategori ikke funnet";
        emptyMsg.style.display = "block";
        return;
      }

      let subCat = null;
      if (subSlug) {
        subCat = mapping.find(r => slugify(r.url_slug) === slugify(subSlug));
      }

      const norskGender =
        genderSlug === "herre" ? "Herre" :
        genderSlug === "dame" ? "Dame" :
        genderSlug === "barn" ? "Barn" : "";

      const norskTitle = subCat
        ? `${subCat.display_name} – ${norskGender}`
        : `${mainCat.display_name} – ${norskGender}`;

      titleEl.textContent = norskTitle;

      const filtered = products.filter(item => {

        if (!item.category) return false;
        if (slugify(item.category) !== slugify(categorySlug)) return false;

        if (genderSlug && slugify(item.gender) !== slugify(genderSlug)) return false;

        if (genderSlug === "barn") {
          const kidtype = subCat?.kidtype;
          if (kidtype && slugify(item.kidtype) !== slugify(kidtype)) return false;
        }

        if (subSlug && slugify(item.subcategory) !== slugify(subSlug)) return false;

        return true;
      });

      console.log("🎯 Filtered:", filtered.length);

      if (!filtered.length) {
        emptyMsg.style.display = "block";
        return;
      }

      emptyMsg.style.display = "none";
      grid.innerHTML = "";

      filtered.forEach(p => {
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          ${p.discount ? `<div class="discount-badge">${p.discount}%</div>` : ""}
          <img src="${p.image_url}" alt="${p.title}">
          <div class="product-info">
            <h3>${p.title}</h3>
            <p class="brand">${p.brand || ""}</p>
            <p class="price">${p.price} kr</p>
          </div>
        `;
        card.addEventListener("click", () => {
          window.location.href = `product.html?id=${p.id}`;
        });
        grid.appendChild(card);
      });

    })
    .catch(err => console.error("❌ Category error:", err));

});






