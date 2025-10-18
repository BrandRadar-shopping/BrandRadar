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

window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});

function toggleMobileMenu(headerElement) {
  const submenu = headerElement.nextElementSibling;
  const isOpen = submenu.style.display === "block";

  // Lukk alle andre åpne menyer først
  document.querySelectorAll('.mobile-submenu').forEach(menu => {
    menu.style.display = "none";
  });

  // Vis denne hvis den ikke allerede var åpen
  if (!isOpen) {
    submenu.style.display = "block";
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.hamburger');
  const categoryMenu = document.querySelector('.category-menu');
  const dropdownToggles = document.querySelectorAll('.dropdown > a');

  // Toggle mobilmeny
  if (hamburger && categoryMenu) {
    hamburger.addEventListener('click', function () {
      categoryMenu.classList.toggle('open');
    });
  }

  // Toggle undermenyer i mobilvisning
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const dropdownMenu = this.nextElementSibling;
        dropdownMenu.classList.toggle('visible');
      }
    });
  });
});



