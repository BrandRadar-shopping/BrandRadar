const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQnVz.../pub?output=csv';

async function loadProducts() {
  const response = await fetch(sheetURL);
  const data = await response.text();
  const rows = data.split('\n').slice(1);
  const container = document.getElementById('products-container');

  rows.forEach(row => {
    const [name, image, price, category, link] = row.split(',');
    const product = document.createElement('div');
    product.className = 'product';
    product.innerHTML = `
      <h3>${name}</h3>
      <img src="${image}" alt="${name}" />
      <p>Price: ${price}</p>
      <p>Category: ${category}</p>
      <a href="${link}" target="_blank">Buy</a>
    `;
    container.appendChild(product);
  });
}

window.onload = loadProducts;

// Skjul "Admin"-knappen fra navigasjonen
document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll("nav a");
  links.forEach(link => {
    if (link.textContent.trim().toLowerCase() === "admin") {
      link.style.display = "none";
    }
  });
});





