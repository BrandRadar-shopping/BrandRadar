// URL til offentlig Google Sheets i CSV-format
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
      <img src="${image}" alt="${name}" />
      <h3>${name}</h3>
      <p><strong>${price}</strong></p>
      <p>${category}</p>
      <a href="${link}" target="_blank"><button class="buy">Kjøp nå</button></a>
    `;
    container.appendChild(product);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});







