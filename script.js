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

  try {
    const res = await fetch(sheetURL, { cache: "no-store" });
    if (!res.ok) throw new Error("Nettverksfeil");
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      container.innerHTML = "<p>Ingen produkter funnet.</p>";
      return;
    }

    container.innerHTML = "";

    data.forEach(p => {
      if (!p.title || !p.image || !p.link) return;

      const isNew = /nyhet|new/i.test(p.discount || "");
      const badge = p.discount
        ? `<span class="badge ${isNew ? "new" : ""}">${isNew ? "Nyhet!" : "Discount: " + p.discount}</span>`
        : "";

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-image">
          ${badge}
          <img src="${p.image}" alt="${p.title}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${p.brand ? p.brand + " " : ""}${p.title}</h3>
          <p class="product-price">${p.price || ""}</p>
          <p class="product-category">${p.category || ""}${p.gender ? " • " + p.gender : ""}${p.subcategory ? " • " + p.subcategory : ""}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        localStorage.setItem("selectedProduct", JSON.stringify(p));
        window.location.href = "product.html";
      });

      container.appendChild(card);
    });

    if (!container.children.length) {
      container.innerHTML = "<p>Ingen produkter å vise.</p>";
    }
  } catch (err) {
    console.error("Feil ved lasting av produkter:", err);
    container.innerHTML = "<p>Kunne ikke laste produkter nå 😢</p>";
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






