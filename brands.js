// --- BrandRadar Brands Loader (v3) --- //
const brandsSheet =
  https://docs.google.com/spreadsheets/d/e/2PACX-1vQllg-SFti-NWDq1EkYCQ5MenTpetINSfrLZuJ7vIjzF3xwClmJAeI8Ha6Lmj0xgGmo4dv5qOpEDCgh/pub?output=csv;

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

    const grid = document.getElementById("brands");
    const highlightGrid = document.getElementById("highlight-grid");
    grid.innerHTML = "";
    highlightGrid.innerHTML = "";

    rows.forEach(row => {
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

      (highlight ? highlightGrid : grid).appendChild(card);
    });
  } catch (err) {
    console.error(err);
    document.getElementById("brands").innerHTML = "<p>Kunne ikke laste brands nå.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadBrands);

