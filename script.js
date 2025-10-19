// ==== KONFIG ====
const PRODUCTS_CSV = 'https://docs.google.com/spreadsheets/d/e/XXXXXXXX/pub?output=csv';
const BRANDS_CSV   = 'https://docs.google.com/spreadsheets/d/e/YYYYYYYY/pub?output=csv';

// ==== UTIL ====
const csvToRows = (txt) => txt.trim().split(/\r?\n/).map(r => r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'')));
const by = (k, dir='desc') => (a,b) => (dir==='desc' ? (a[k]>b[k]?-1:1) : (a[k]>b[k]?1:-1));

// Query helpers
const getParams = () => Object.fromEntries(new URLSearchParams(location.search));
const setParamsAndGo = (params) => {
  const qs = new URLSearchParams(params);
  if (location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
    history.replaceState(null,'','?'+qs.toString());
    // re-render
    renderProducts();
  } else {
    location.href = 'index.html?'+qs.toString();
  }
};

// ==== MENY (mobil + desktop klikk på mobil) ====
function setupNav(){
  const burger = document.querySelector('.hamburger');
  const mobile = document.getElementById('mobileNav');
  if (burger && mobile){
    burger.addEventListener('click', ()=>{
      const open = burger.getAttribute('aria-expanded')==='true';
      burger.setAttribute('aria-expanded', String(!open));
      mobile.toggleAttribute('hidden');
    });
  }
  document.querySelectorAll('.mobile-accordion').forEach(btn=>{
    const panel = btn.nextElementSibling;
    btn.addEventListener('click', ()=>{
      panel.toggleAttribute('hidden');
    });
  });
  // Hindre desktop dropdown lenker i å navigere på mobil før vi legger på filtrering
  document.querySelectorAll('.dropdown > .nav-root').forEach(a=>{
    a.addEventListener('click', e=>{
      if (window.innerWidth < 993) e.preventDefault();
    });
  });

  // Alle menylenker med data-link → lager filter (via query params)
  document.querySelectorAll('[data-link]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const category = a.getAttribute('data-category') || '';
      const gender   = a.getAttribute('data-gender')   || '';
      const sub      = a.getAttribute('data-sub')      || '';
      setParamsAndGo({ category, gender, sub });
    });
  });
}

// ==== DATAHENTING ====
async function fetchProducts(){
  const res = await fetch(PRODUCTS_CSV);
  const text = await res.text();
  const rows = csvToRows(text);
  const [header, ...data] = rows;
  const idx = Object.fromEntries(header.map((h,i)=>[h.trim(), i]));
  return data.map(r=>({
    id: r[idx.id],
    name: r[idx.name],
    image: r[idx.image],
    price: r[idx.price],
    category: r[idx.category],
    subcategory: r[idx.subcategory],
    gender: r[idx.gender],
    brand: r[idx.brand],
    affiliate_url: r[idx.affiliate_url],
    published_at: r[idx.published_at],
    tags: (r[idx.tags]||'').toLowerCase()
  }));
}

async function fetchBrands(){
  const res = await fetch(BRANDS_CSV);
  const text = await res.text();
  const rows = csvToRows(text);
  const [header, ...data] = rows;
  const idx = Object.fromEntries(header.map((h,i)=>[h.trim(), i]));
  return data.map(r=>({
    brand: r[idx.brand],
    logo: r[idx.logo],
    blurb: r[idx.blurb],
    website: r[idx.website],
    affiliate_url: r[idx.affiliate_url]
  }));
}

// ==== RENDER: PRODUKTER (index) ====
async function renderProducts(){
  const root = document.getElementById('products');
  if (!root) return;
  root.innerHTML = 'Laster…';

  const items = await fetchProducts();
  const p = getParams();

  // Filter fra UI (drop-downs)
  const uiCategory = document.getElementById('filterCategory')?.value || '';
  const uiGender   = document.getElementById('filterGender')?.value   || '';
  const uiQuery    = document.getElementById('filterQuery')?.value?.toLowerCase() || '';

  const category = p.category || uiCategory || '';
  const gender   = p.gender   || uiGender   || '';
  const sub      = p.sub      || '';
  const q        = p.q        || uiQuery   || '';

  let list = items.filter(it=>{
    if (category && it.category !== category) return false;
    if (gender && (it.gender||'') !== gender) return false;
    if (sub && it.subcategory !== sub && sub !== 'Explore all products') return false;
    if (q && !(it.name.toLowerCase().includes(q) || (it.brand||'').toLowerCase().includes(q) || (it.tags||'').includes(q))) return false;
    return true;
  });

  // Render
  root.innerHTML = '';
  if (!list.length){ root.innerHTML = '<p>Ingen produkter funnet.</p>'; return; }

  list.forEach(it=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${it.image}" alt="${it.name}" loading="lazy">
      <h3>${it.name}</h3>
      <div class="meta">${it.brand || ''} ${it.gender?('· '+it.gender):''} ${it.subcategory?('· '+it.subcategory):''}</div>
      <div class="price">${it.price}</div>
      <div class="actions"><a href="${it.affiliate_url}" target="_blank" rel="nofollow sponsored noopener">Se hos butikk</a></div>
    `;
    root.appendChild(card);
  });

  // Synk UI med params
  if (document.getElementById('filterCategory')) document.getElementById('filterCategory').value = category;
  if (document.getElementById('filterGender')) document.getElementById('filterGender').value = gender;
  if (document.getElementById('filterQuery')) document.getElementById('filterQuery').value = q;
}

// UI filter handling
function setupFilters(){
  const cat = document.getElementById('filterCategory');
  const gen = document.getElementById('filterGender');
  const q   = document.getElementById('filterQuery');
  const searchForm = document.querySelector('.site-search');

  cat?.addEventListener('change', ()=>setParamsAndGo({ ...getParams(), category: cat.value }));
  gen?.addEventListener('change', ()=>setParamsAndGo({ ...getParams(), gender: gen.value }));
  q?.addEventListener('input', ()=>setParamsAndGo({ ...getParams(), q: q.value }));
  searchForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const inp = document.getElementById('q');
    if (inp) setParamsAndGo({ ...getParams(), q: inp.value });
  });
}

// ==== RENDER: NEWS (nyeste først) ====
async function renderNews(){
  const root = document.getElementById('news');
  if (!root) return;
  root.innerHTML = 'Laster…';

  const items = await fetchProducts();
  items.sort((a,b)=> (b.published_at||'').localeCompare(a.published_at||''));
  const list = items.slice(0, 40); // vis topp 40

  root.innerHTML = '';
  list.forEach(it=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${it.image}" alt="${it.name}" loading="lazy">
      <h3>${it.name}</h3>
      <div class="meta">${it.brand || ''} · ${it.category}${it.subcategory?(' · '+it.subcategory):''}</div>
      <div class="meta">Publisert: ${it.published_at || '–'}</div>
      <div class="price">${it.price}</div>
      <div class="actions"><a href="${it.affiliate_url}" target="_blank" rel="nofollow sponsored noopener">Se hos butikk</a></div>
    `;
    root.appendChild(card);
  });
}

// ==== RENDER: BRANDS ====
async function renderBrands(){
  const root = document.getElementById('brands');
  if (!root) return;
  root.innerHTML = 'Laster…';

  const brands = await fetchBrands();
  root.innerHTML = '';
  brands.forEach(b=>{
    const el = document.createElement('div');
    el.className = 'brand-card';
    el.innerHTML = `
      <img src="${b.logo}" alt="${b.brand}">
      <h3>${b.brand}</h3>
      <p>${b.blurb || ''}</p>
      <p><a href="${b.affiliate_url || b.website}" target="_blank" rel="nofollow sponsored noopener">Besøk</a></p>
    `;
    root.appendChild(el);
  });
}

// ==== INIT ====
window.addEventListener('DOMContentLoaded', ()=>{
  setupNav();
  setupFilters();
  renderProducts();
  renderNews();
  renderBrands();
});


