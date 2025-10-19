// ----- Enter-søk (ingen knapp nødvendig)
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // TODO: koble til filtrering senere
      console.log('Søk:', searchInput.value);
    }
  });
}

// ----- Mobil: toggles for Shop by category
document.querySelectorAll('.mobile-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const isOpen = target.style.display === 'flex';
    document.querySelectorAll('.mobile-submenu').forEach((m) => (m.style.display = 'none'));
    target.style.display = isOpen ? 'none' : 'flex';
  });
});

// ----- Demo-render (tom til vi kobler Sheets)
function renderPlaceholderCards() {
  const root = document.getElementById('products');
  if (!root) return;
  root.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <img src="https://via.placeholder.com/400x280?text=Produkt" alt="Produkt" loading="lazy">
      <h3>Produktnavn</h3>
      <div class="meta">Brand · Category</div>
      <div class="price">—</div>
      <a class="btn" href="#" rel="nofollow noopener" target="_blank">Se hos butikk</a>
    `;
    root.appendChild(el);
  }
}
renderPlaceholderCards();

