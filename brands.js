// --- BrandRadar Brands Loader (v2) --- //
const brandsSheet =
https://docs.google.com/spreadsheets/d/e/2PACX-1vQllg-SFti-NWDq1EkYCQ5MenTpetINSfrLZuJ7vIjzF3xwClmJAeI8Ha6Lmj0xgGmo4dv5qOpEDCgh/pub?output=csv;

// CSV parser
function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

async function loadBrands() {
  try {
    const res = await fetch(brandsSheet);
    if (!res.ok) throw new Error("Kunne ikke hente brands-data");
    const csv = (await res.text()).trim().split("\n");
    const headers = parseCSVLine(csv[0]);
    const rows = csv.slice(1).map(parseCSVLine);

    const iBrand = headers.findIndex(h => h.toLowerCase().includes("brand"));
    const iLogo = headers.findIndex(h => h.toLowerCase().includes("logo"));
    const iDesc = headers.findIndex(h => h.toLowerCase().includes("description"));
    const iLink = headers.findIndex(h => h.toLowerCase().includes("link"));
    const iHighlight = headers.findIndex(h => h.toLowerCase().includes("highlight"));

    const container = document.getElementById("brands");
    container.innerHTML = "";

    // Sorter slik at highlight=YES kommer øverst
    const sortedRows = rows.sort((a, b) => {
      const ha = (a[iHighlight] || "").toLowerCase().trim() === "yes";
      const hb = (b[iHighlight] || "").toLowerCase().trim() === "yes";
      return ha === hb ? 0 : ha ? -1 : 1;
    });

    sortedRows.forEach(row => {
      const name = row[iBrand];
      const logo = row[iLogo];
      const desc = row[iDesc];
      const link = row[iLink];
      const highlight = (row[iHighlight] || "").toLowerCase().trim() === "yes";

      if (!name) return;

      const card = document.createElement("div");
      card.className = "brand-card" + (highlight ? " highlight" : "");
      card.innerHTML = `
        <img src="${logo}" alt="${name}">
        <h3>${name}</h3>
        <p>${desc || ""}</p>
      `;

      if (link) card.addEventListener("click", () => window.open(link, "_blank"));
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    document.getElementById("brands").innerHTML = "<p>Kunne ikke laste brands nå.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadBrands);
