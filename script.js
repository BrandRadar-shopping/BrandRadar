// --- BrandRadar Product Loader v6 (header-basert + ekstra bilder/fields) --- //
const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWnu8IsFKWjitEl3Jv-ZjwnFHF63q_3YTYNNoJRWEoCWNOjlpUCUs_oF1737lGxAtAa2NGlRq0ThN-/pub?output=csv";

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
  try {
    const res = await fetch(sheetURL);
    if (!res.ok) throw new Error("Kunne ikke hente data fra Google Sheet");
    const csv = (await res.text()).trim();

    const lines = csv.split("\n");
    if (lines.length <= 1) {
      document.getElementById("products-container").innerHTML = "<p>Ingen produkter funnet.</p>";
      return;
    }

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(parseCSVLine);

    // Kartlegg kolonner (støtter flere skrivemåter)
    const iBrand       = idx(headers, ["brand", "merke"]);
    const iTitle       = idx(headers, ["title", "produktnavn", "name"]);
    const iPrice       = idx(headers, ["price", "pris"]);
    const iDiscount    = idx(headers, ["discount", "rabatt", "badge"]);
    const iImage       = idx(headers, ["imageurl", "image", "bildeurl"]);
    const iProductURL  = idx(headers, ["producturl", "link", "affiliatelink"]);
    const iCategory    = idx(headers, ["category", "kategori"]);
    const iGender      = idx(headers, ["gender", "kjønn"]);
    const iSubcat      = idx(headers, ["subcategory", "underkategori"]);
    const iVisualOnly  = idx(headers, ["visueltbilde", "visualimage", "adminimage"]); // ignorér
    const iImage2      = idx(headers, ["image2"]);
    const iImage3      = idx(headers, ["image3"]);
    const iImage4      = idx(headers, ["image4"]);
    const iDescription = idx(headers, ["description", "beskrivelse", "pitch"]);
    const iRating      = idx(headers, ["rating", "vurdering", "score"]);

    const container = document.getElementById("products-container");
    container.innerHTML = "";

    rows.forEach((cols) => {
      const val = (i) => (i >= 0 ? (cols[i] || "").trim() : "");

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

      // hopp over rader uten minimumsfelt
      if (!title || !image || !link) return;

      // Badge
      let badgeHTML = "";
      if (discountRaw) {
        const clean = discountRaw.replace(/[%"]/g, "").trim();
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
          <h3 class="product-name">${brand ? brand + " " : ""}${title}</h3>
          <p class="product-price">${price}</p>
          <p class="product-category">${category}${gender ? " • " + gender : ""}${subcategory ? " • " + subcategory : ""}</p>
        </div>
      `;

      // Klikk → send ALT vi trenger til product.html
      card.addEventListener("click", () => {
        const productData = {
          brand, title, price,
          discount: discountRaw,
          image,
          image2: image2 || undefined,
          image3: image3 || undefined,
          image4: image4 || undefined,
          link, category, gender, subcategory,
          description: description || undefined,
          rating: rating || undefined
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


