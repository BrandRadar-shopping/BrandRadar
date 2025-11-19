// ======================================================
// ✅ BrandRadar – Forside (Picks + Trending Now + Top Brands)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Index script loaded");

  // ----------------------------------------------------
  // 🔧 HJELPERE: Pris-formattering + rabatt
  // ----------------------------------------------------

  function formatPriceString(val) {
    if (!val) return "";
    const str = String(val).trim();
    // Hvis det allerede står "kr" eller "€" osv – la det være
    if (/[a-zA-ZæøåÆØÅ]/.test(str)) return str;
    return `${str} kr`;
  }

  function buildPriceHtml(priceRaw, oldPriceRaw, discountRaw) {
    const price = (priceRaw || "").toString().trim();
    const oldPrice = (oldPriceRaw || "").toString().trim();
    let discountText = (discountRaw || "").toString().trim();

    if (!price && !oldPrice) return "";

    // Forsøk å regne ut %-rabatt om begge priser finnes
    if (!discountText && price && oldPrice) {
      const cleanNew = parseFloat(
        price.replace(/[^\d,\.]/g, "").replace(",", ".")
      );
      const cleanOld = parseFloat(
        oldPrice.replace(/[^\d,\.]/g, "").replace(",", ".")
      );
      if (!isNaN(cleanNew) && !isNaN(cleanOld) && cleanOld > cleanNew) {
        const pct = Math.round((1 - cleanNew / cleanOld) * 100);
        if (pct > 0 && pct < 90) {
          discountText = `-${pct}%`;
        }
      }
    }

    const newPriceStr = formatPriceString(price);
    const oldPriceStr = oldPrice ? formatPriceString(oldPrice) : "";

    // Kun ny pris
    if (!oldPriceStr && !discountText) {
      return `
        <div class="price-row">
          <span class="new-price">${newPriceStr}</span>
        </div>
      `;
    }

    return `
      <div class="price-row">
        <span class="new-price">${newPriceStr}</span>
        ${oldPriceStr ? `<span class="old-price">${oldPriceStr}</span>` : ""}
        ${discountText ? `<span class="discount-badge">${discountText}</span>` : ""}
      </div>
    `;
  }

  // ----------------------------------------------------
  // ⭐ FEATURED PICKS (CSV – fra Google Sheets)
  // ----------------------------------------------------

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bBCAqzJwCcyOfw5R5mAPtqkx8ISp_U_yaXaZU89J7G8V656GKvU0NzUK0UdGmEPk8m-vCm2rIXeI/pub?output=csv";

  const featuredGrid = document.getElementById("featured-grid");

  if (featuredGrid) {
    (async () => {
      try {
        const res = await fetch(CSV_URL);
        const csv = await res.text();

        const rows = csv.trim().split("\n").map(r => r.split(","));
        const headers = rows[0].map(h => h.trim());

        const items = rows.slice(1).map(row => {
          const obj = {};
          row.forEach((val, i) => {
            obj[headers[i]] = val.trim();
          });
          return obj;
        });

        const featured = items.filter(
          p => (p.featured || "").toLowerCase() === "true"
        );

        if (!featured.length) {
          featuredGrid.innerHTML = "<p>Ingen utvalgte produkter akkurat nå.</p>";
          return;
        }

        featuredGrid.innerHTML = "";

        featured.forEach(p => {
          const cleanProduct = {
            id: (p.id || p.product_name || "")
              .toString()
              .replace(/\s+/g, "_"),
            title: p.product_name || p.title || "Produkt",
            brand: p.brand || "",
            price: p.price || "",
            old_price: p.old_price || "",
            discount: p.discount || p.discount_label || "",
            image_url: p.image_url,
            product_url: p.link,
            description: p.reason || ""
          };

          const card = document.createElement("div");
          card.className = "product-card";

          card.innerHTML = `
            <div class="fav-icon">
              <svg viewBox="0 0 24 24" class="heart-icon">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 
                2 12.28 2 8.5 2 5.42 4.42 3 7.5 
                3c1.74 0 3.41.81 4.5 2.09C13.09 
                3.81 14.76 3 16.5 3 19.58 3 22 
                5.42 22 8.5c0 3.78-3.4 
                6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>

            <img src="${cleanProduct.image_url}" alt="${cleanProduct.title}">

            <div class="product-info" title="${cleanProduct.description}">
              <h3>${cleanProduct.title}</h3>
              <p class="brand">${cleanProduct.brand}</p>
              ${buildPriceHtml(
                cleanProduct.price,
                cleanProduct.old_price,
                cleanProduct.discount
              )}
            </div>
          `;

          // Klikk på kort → product.html
          card.addEventListener("click", e => {
            if (!e.target.closest(".fav-icon")) {
              window.location.href = `product.html?id=${encodeURIComponent(
                cleanProduct.id
              )}`;
            }
          });

          featuredGrid.appendChild(card);
        });
      } catch (err) {
        console.error("❌ Klarte ikke laste Featured Picks:", err);
        featuredGrid.innerHTML =
          "<p>Kunne ikke laste produktene akkurat nå.</p>";
      }
    })();
  }

  // ----------------------------------------------------
  // 🔥 TRENDING NOW – peker til BrandRadarProdukter via product_id
  // Google Sheet: TrendingNow (kolonner: product_id, rank, highlight_reason, active)
  // Google Sheet: BrandRadarProdukter (kolonne: id + pris, bilder osv.)
  // ----------------------------------------------------

  async function loadTrending() {
    const TREND_SHEET_ID = "13klEz2o7CZ0Q4mbm8WT_b1Sz7LMoJqcluyrFyg58uRc";
    const TREND_TAB = "TrendingNow";
    const PRODUCTS_SHEET_ID = "1EzQXnja3f5M4hKvTLrptnLwQJyI7NUrnyXglHQp8-jw";
    const PRODUCTS_TAB = "BrandRadarProdukter";

    const trendingUrl = `https://opensheet.elk.sh/${TREND_SHEET_ID}/${TREND_TAB}`;
    const productsUrl = `https://opensheet.elk.sh/${PRODUCTS_SHEET_ID}/${PRODUCTS_TAB}`;

    try {
      const [trendRes, productsRes] = await Promise.all([
        fetch(trendingUrl),
        fetch(productsUrl)
      ]);

      const trendingRaw = await trendRes.json();
      const productsRaw = await productsRes.json();

      console.log("🔥 TrendingNow (raw):", trendingRaw);
      console.log("🔥 BrandRadarProdukter (raw):", productsRaw);

      if (!Array.isArray(trendingRaw) || !Array.isArray(productsRaw)) return;

      // Indexér produkter på id
      const productById = {};
      productsRaw.forEach(p => {
        const pid = (p.id || p.product_id || "").toString().trim();
        if (pid) {
          productById[pid] = p;
        }
      });

      // Filtrer & sorter trending
      const trending = trendingRaw
        .filter(
          row => (row.active || "").toString().toLowerCase() === "true"
        )
        .map(row => ({
          ...row,
          rankNum: Number(row.rank || row.order || 9999)
        }))
        .sort((a, b) => a.rankNum - b.rankNum);

      const container = document.getElementById("trending-grid");
      if (!container) return;

      container.innerHTML = "";

      trending.forEach(row => {
        const pid = (row.product_id || "").toString().trim();
        const product = productById[pid];
        if (!product) return;

        const title =
          product.title ||
          product.product_name ||
          product.name ||
          "Produkt";
        const brand = product.brand || product.brand_name || "";
        const price = product.price || product.current_price || "";
        const oldPrice = product.old_price || product.striked_price || "";
        const discount =
          product.discount ||
          product.discount_label ||
          product.discount_percent ||
          "";

        const imageUrl =
          product.image_url || product.image || product.main_image || "";
        const productUrl =
          product.product_url || product.link || product.url || "";

        const cleanProduct = {
          id: pid,
          title,
          brand,
          price,
          old_price: oldPrice,
          discount,
          image_url: imageUrl,
          product_url: productUrl,
          description: row.highlight_reason || product.description || ""
        };

        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
          <div class="fav-icon">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 
              2 12.28 2 8.5 2 5.42 4.42 3 7.5 
              3c1.74 0 3.41.81 4.5 2.09C13.09 
              3.81 14.76 3 16.5 3 19.58 3 22 
              5.42 22 8.5c0 3.78-3.4 
              6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <img src="${cleanProduct.image_url}" alt="${cleanProduct.title}">

          <div class="product-info" title="${cleanProduct.description}">
            <h3>${cleanProduct.title}</h3>
            <p class="brand">${cleanProduct.brand}</p>
            ${buildPriceHtml(
              cleanProduct.price,
              cleanProduct.old_price,
              cleanProduct.discount
            )}
          </div>
        `;

        // Klikk → product.html med id fra BrandRadarProdukter
        card.addEventListener("click", e => {
          if (!e.target.closest(".fav-icon")) {
            window.location.href = `product.html?id=${encodeURIComponent(
              cleanProduct.id
            )}`;
          }
        });

        container.appendChild(card);
      });
    } catch (err) {
      console.error("❌ TrendingNow error:", err);
    }
  }

  // ----------------------------------------------------
  // 💎 TOP BRANDS (Logo + Navn + Kort beskrivelse)
  // Google Sheet: TopBrands
  // ----------------------------------------------------

  async function loadTopBrands() {
    const SHEET_ID = "1n3mCxmTb42RnZ_sNvP5CnYdGjwYFkU5kmnI_BFyiNkU";
    const TAB = "TopBrands";
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${TAB}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      console.log("🔥 TopBrands:", data);

      const container = document.getElementById("brands-grid");
      if (!container || !Array.isArray(data)) return;

      container.innerHTML = "";

      data.forEach(item => {
        if ((item.active || "").toLowerCase() !== "true") return;

        const card = document.createElement("a");
        card.className = "topbrand-card";
        card.href = item.link;
        card.target = "_blank";

        card.innerHTML = `
          <img src="${item.logo}" alt="${item.brand_name}">
          <h3>${item.brand_name}</h3>
          <p>${item.description}</p>
        `;

        container.appendChild(card);
      });
    } catch (err) {
      console.error("❌ TopBrands error:", err);
    }
  }

  // ----------------------------------------------------
  // 🚀 Kjør alle seksjoner
  // ----------------------------------------------------
  loadTrending();
  loadTopBrands();
});





