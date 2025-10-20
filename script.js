// --- BrandRadar Product Loader v5 (robust CSV + ekstra bilder) --- //
const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv";

// Enkel CSV-linjeparser som respekterer hermetegn
function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // toggle quotes eller escape av dobbel-quote
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
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

async function loadProducts() {
  try {
    const res = await fetch(sheetURL);
    if (!res.ok) throw new Error("Kunne ikke hente data fra Google Sheet");
    const csv = (await res.text()).trim();

    const lines = csv.split("\n");
    if (lines.length <= 1) {
      document.getElementById("products-container").innerHTML =
        "<p>Ingen produkter funnet.</p>";
      return;
    }

    // header + rader
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(parseCSVLine);

    const container = document.getElementById("products-container");
    container.innerHTML = "";

    rows.forEach((cols) => {
      // Forventet struktur basert på arket ditt:
      // 0 Brand | 1 Title | 2 Price | 3 Discount | 4 Image URL | 5 Product URL
      // 6 Category | 7 Gender | 8 Subcategory | 9 Visuelt bilde (ignorer)
      // 10 image2 | 11 image3 | 12 image4
      const brand = cols[0] || "";
      const title = cols[1] || "";
      const price = cols[2] || "";
      const discount = (cols[3] || "").replace(/"/g, "");
      const image = cols[4] || "";
      const link = cols[5] || "";
      const category = cols[6] || "";
      const gender = cols[7] || "";
      const subcategory = cols[8] || "";
      const image2 = cols[10] || "";
      const image3 = cols[11] || "";
      const image4 = cols[12] || "";

      if (!title || !image || !link) return; // hopp over ufullstendige rader

      // Badge
      let badgeHTML = "";
      if (discount) {
        const clean = discount.replace(/[%"]/g, "").trim();
        const isNew = /nyhet|new/i.test(clean);
        badgeHTML = `<span class="badge ${isNew ? "new" : ""}">${
          isNew ? "Nyhet!" : "Discount: " + clean + "%"
        }</span>`;
      }

      // Kort
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-image">
          ${badgeHTML}
          <img src="${image}" alt="${title}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${brand} ${title}</h3>
          <p class="product-price">${price}</p>
          <p class="product-category">${category} • ${gender} • ${subcategory}</p>
        </div>
      `;

      // Klikk → lagre alt vi trenger til product.html
      card.addEventListener("click", () => {
        const productData = {
          brand,
          title,
          price,
          discount,
          image,    // hovedbilde
          image2: image2 || undefined,
          image3: image3 || undefined,
          image4: image4 || undefined,
          link,
          category,
          gender,
          subcategory
        };
        localStorage.setItem("selectedProduct", JSON.stringify(productData));
        window.location.href = "product.html";
      });

      container.appendChild(card);
    });

    if (!container.children.length) {
      container.innerHTML = "<p>Ingen produkter å vise.</p>";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("products-container").innerHTML =
      "<p>Kunne ikke laste produkter nå.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);





