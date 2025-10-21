// --- BrandRadar Product Loader v6 (header-basert + ekstra bilder/fields) --- //
const sheetURL = "https://script.google.com/macros/s/AKfycbyAzMqPF84o66lUP5OujNfebfQiatAD1RbrPTFSSpuzkbEFi_pxV0Jdo1nRm8_lvdxV/exec";

// CSV-linjeparser som håndterer hermetegn og komma
function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'; i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

// Finn kolonneindeks ved å matche headernavn (case/space-insensitivt)
function idx(headers, candidates) {
  const norm = s => s.toLowerCase().replace(/\s+/g, "");
  const H = headers.map(norm);
  for (const c of candidates) {
    const k = norm(c);
    const i = H.indexOf(k);
    if (i !== -1) return i;
  }
  return -1;
}

async function loadProducts() {
  const container = document.getElementById("products-container");
  if (container) container.innerHTML = "<p>Laster produkter …</p>";

  // --- Cache-sjekk først ---
  const cacheKey = "productCache";
  const cacheTimeKey = "productCacheTime";
  const MAX_AGE = 6 * 60 * 60 * 1000; // 6 timer

  try {
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    if (cachedData && cachedTime && Date.now() - cachedTime < MAX_AGE) {
      const rows = JSON.parse(cachedData);
      renderProductRows(rows);
      // hent ny data i bakgrunnen uten å blokkere
      fetchAndUpdateProducts();
      return;
    }
  } catch (e) {
    console.warn("Cachefeil – henter på nytt:", e);
  }

  // --- Ingen gyldig cache: last nå ---
  await fetchAndUpdateProducts();

  async function fetchAndUpdateProducts() {
    try {
      const res = await fetch(sheetURL, { cache: "no-store" });
      if (!res.ok) throw new Error("Kunne ikke hente data fra Google Sheet");
      const csv = (await res.text()).trim();

      const lines = csv.split("\n");
      if (lines.length <= 1) {
        container.innerHTML = "<p>Ingen produkter funnet.</p>";
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(parseCSVLine);
      localStorage.setItem(cacheKey, JSON.stringify(rows));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
      renderProductRows(rows);
    } catch (err) {
      console.error(err);
      if (!container.innerHTML.includes("product-card"))
        container.innerHTML = "<p>Kunne ikke laste produkter nå 😢</p>";
    }
  }

  // --- Separer logikken for rendering ---
  function renderProductRows(rows) {
    const headers = parseCSVLine(rows.shift ? lines[0] : []);
    container.innerHTML = "";

    rows.forEach((cols) => {
      const val = (i) => (i >= 0 ? (cols[i] || "").trim() : "");

      const iBrand       = idx(headers, ["brand", "merke"]);
      const iTitle       = idx(headers, ["title", "produktnavn", "name"]);
      const iPrice       = idx(headers, ["price", "pris"]);
      const iDiscount    = idx(headers, ["discount", "rabatt", "badge"]);
      const iImage       = idx(headers, ["imageurl", "image", "bildeurl"]);
      const iProductURL  = idx(headers, ["producturl", "link", "affiliatelink"]);
      const iCategory    = idx(headers, ["category", "kategori"]);
      const iGender      = idx(headers, ["gender", "kjønn"]);
      const iSubcat      = idx(headers, ["subcategory", "underkategori"]);
      const iImage2      = idx(headers, ["image2"]);
      const iImage3      = idx(headers, ["image3"]);
      const iImage4      = idx(headers, ["image4"]);
      const iDescription = idx(headers, ["description", "beskrivelse", "pitch"]);
      const iRating      = idx(headers, ["rating", "vurdering", "score"]);

      const brand       = val(iBrand);
      const title       = val(iTitle);
      const price       = val(iPrice);
      const discountRaw = val(iDiscount).replace(/"/g, "");
      const image       = val(iImage);
      const link        = val(iProductURL);
      const category    = val(iCategory);
      const gender      = val(iGender);
      const subcategory = val(iSubcat);
      const image2      = val(iImage2);
      const image3      = val(iImage3);
      const image4      = val(iImage4);
      const description = val(iDescription);
      const rating      = val(iRating);

      if (!title || !image || !link) return;

      let badgeHTML = "";
      if (discountRaw) {
        const clean = discountRaw.replace(/[%"]/g, "").trim();
        const isNew = /nyhet|new/i.test(clean);
        badgeHTML = `<span class="badge ${isNew ? "new" : ""}">${isNew ? "Nyhet!" : "Discount: " + clean + "%"}</span>`;
      }

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-image">
          ${badgeHTML}
          <img src="${image}" alt="${title}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${brand ? brand + " " : ""}${title}</h3>
          <p class="product-price">${price}</p>
          <p class="product-category">${category}${gender ? " • " + gender : ""}${subcategory ? " • " + subcategory : ""}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        const productData = {
          brand, title, price,
          discount: discountRaw,
          image, image2, image3, image4,
          link, category, gender, subcategory,
          description, rating
        };
        localStorage.setItem("selectedProduct", JSON.stringify(productData));
        window.location.href = "product.html";
      });

      container.appendChild(card);
    });

    if (!container.children.length) {
      container.innerHTML = "<p>Ingen produkter å vise.</p>";
    }
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);

// --- Favoritt-teller på alle sider (live oppdatering + sanntid) ---
(function () {
  const favoritesKey = "favorites";

  function readFavs() {
    try {
      return JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    } catch {
      return [];
    }
  }

  function updateFavCount() {
    const count = readFavs().length;
    document.querySelectorAll("[data-fav-count]").forEach(el => el.textContent = count);
  }

  // Lytt på endringer i localStorage (andre faner / sider)
  window.addEventListener("storage", e => {
    if (e.key === favoritesKey) updateFavCount();
  });

  // Lytt på custom eventer lokalt (fra product.html og favoritter.html)
  window.addEventListener("favoritesChanged", updateFavCount);

  // Init
  document.addEventListener("DOMContentLoaded", updateFavCount);
})();





