// Produkter (placeholder)
const sheetURL = ""; // legg inn din Google Sheet CSV-link hvis ønsket
const container = document.getElementById("products-container");

if (container) {
  container.innerHTML = `
    <div class="product"><img src="#" alt=""><h3>undefined</h3><p>undefined</p><a href="#" class="buy">Se hos butikk</a></div>
    <div class="product"><img src="#" alt=""><h3>undefined</h3><p>undefined</p><a href="#" class="buy">Se hos butikk</a></div>
    <div class="product"><img src="#" alt=""><h3>undefined</h3><p>undefined</p><a href="#" class="buy">Se hos butikk</a></div>
    <div class="product"><img src="#" alt=""><h3>undefined</h3><p>undefined</p><a href="#" class="buy">Se hos butikk</a></div>
  `;
}

// Mobil-knapper
document.querySelectorAll(".mobile-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    const isVisible = target.style.display === "flex";
    document.querySelectorAll(".mobile-submenu").forEach(menu => menu.style.display = "none");
    target.style.display = isVisible ? "none" : "flex";
  });
});
