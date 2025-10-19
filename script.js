/* ====== DATA (Google Sheet CSV) ====== */
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQnVz.../pub?output=csv';

async function loadProducts() {
  try {
    const res = await fetch(sheetURL);
    const text = await res.text();

    // Enkel CSV-splitt – for produksjon anbefales ordentlig CSV-parser
    const rows = text.trim().split('\n').slice(1);
    const container = document.getElementById('products-container');

    rows.forEach(row => {
      const parts = row.split(',');
      const [name, image, price, category, link] = parts;

      const card = document.createElement('div');
      card.className = 'product';
      card.innerHTML = `
        <img src="${(image || '').trim()}" alt="${(name || '').trim()}" loading="lazy" />
        <h3>${(name || '').trim()}</h3>
        <p>Price: ${(price || '').trim()}</p>
        <p>Category: ${(category || '').trim()}</p>
        <a href="${(link || '#').trim()}" target="_blank" rel="nofollow noopener">Buy</a>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.error('Failed to load products', e);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupMenus();
});

/* ====== MENUS ====== */
function setupMenus() {
  // Hamburger toggler hele mobilnavigasjonen
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      mobileNav.toggleAttribute('hidden'); // viser/skjuler hele blokken
    });

    // Start skjult på mobil
    mobileNav.setAttribute('hidden', '');
  }

  // Mobil: hver "Clothing/Supplements/Shoes"-seksjon
  document.querySelectorAll('.mobile-dropdown').forEach(drop => {
    const btn = drop.querySelector('.mobile-toggle');
    const submenu = drop.querySelector('.mobile-submenu');

    if (!btn || !submenu) return;

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      submenu.toggleAttribute('hidden');
    });
  });

  // Hindre at desktop-dropdown forsøker å åpne på mobil via klikk
  document.querySelectorAll('.dropdown > a.nav-root').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      if (window.innerWidth < 992) e.preventDefault();
    });
  });

  // Lukk mobilnav ved resize til desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992 && mobileNav) {
      mobileNav.setAttribute('hidden', '');
      hamburger && hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}




