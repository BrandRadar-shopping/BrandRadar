const PRODUCTS_CSV='https://docs.google.com/spreadsheets/d/e/XXXXXX/pub?output=csv';
const BRANDS_CSV='https://docs.google.com/spreadsheets/d/e/YYYYYY/pub?output=csv';

// --- CSV utility ---
function csvToRows(txt){
  return txt.trim().split(/\r?\n/).map(r=>r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'')));
}

// --- Header reuse for all pages ---
async function loadHeader(){
  if(!document.getElementById('header-placeholder')) return;
  const res=await fetch('index.html'); 
  const txt=await res.text();
  const parser=new DOMParser();const doc=parser.parseFromString(txt,'text/html');
  const header=doc.querySelector('.top-header').outerHTML+doc.querySelector('.shop-nav').outerHTML;
  document.getElementById('header-placeholder').innerHTML=header;
  setupMenu();
}

// --- Products ---
async function fetchProducts(){
  const res=await fetch(PRODUCTS_CSV);
  const text=await res.text();
  const [header,...rows]=csvToRows(text);
  const idx=Object.fromEntries(header.map((h,i)=>[h,i]));
  return rows.map(r=>({
    name:r[idx.name],image:r[idx.image],price:r[idx.price],
    category:r[idx.category],subcategory:r[idx.subcategory],
    gender:r[idx.gender],brand:r[idx.brand],
    affiliate:r[idx.affiliate_url],published:r[idx.published_at]
  }));
}

async function renderProducts(){
  const wrap=document.getElementById('products'); if(!wrap)return;
  const items=await fetchProducts();
  wrap.innerHTML='';
  items.forEach(p=>{
    const el=document.createElement('div');
    el.className='card';
    el.innerHTML=`
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="meta">${p.brand||''} ${p.gender?'· '+p.gender:''}</div>
      <div class="price">${p.price}</div>
      <a href="${p.affiliate}" target="_blank" rel="nofollow sponsored noopener">Se hos butikk</a>`;
    wrap.appendChild(el);
  });
}

async function renderNews(){
  const root=document.getElementById('news'); if(!root)return;
  const items=await fetchProducts();
  items.sort((a,b)=>(b.published||'').localeCompare(a.published||''));
  root.innerHTML='';
  items.slice(0,40).forEach(p=>{
    const el=document.createElement('div');
    el.className='card';
    el.innerHTML=`
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="meta">${p.brand||''} · ${p.category||''}</div>
      <div class="price">${p.price}</div>
      <a href="${p.affiliate}" target="_blank" rel="nofollow sponsored noopener">Se hos butikk</a>`;
    root.appendChild(el);
  });
}

async function renderBrands(){
  const root=document.getElementById('brands'); if(!root)return;
  const res=await fetch(BRANDS_CSV);const txt=await res.text();
  const [header,...rows]=csvToRows(txt);
  const idx=Object.fromEntries(header.map((h,i)=>[h,i]));
  root.innerHTML='';
  rows.forEach(r=>{
    const el=document.createElement('div');
    el.className='brand-card';
    el.innerHTML=`
      <img src="${r[idx.logo]}" alt="${r[idx.brand]}">
      <h3>${r[idx.brand]}</h3>
      <p>${r[idx.blurb]}</p>
      <a href="${r[idx.affiliate_url]||r[idx.website]}" target="_blank" rel="nofollow sponsored noopener">Besøk</a>`;
    root.appendChild(el);
  });
}

// --- Navigation behaviour ---
function setupMenu(){
  // Hover already handled by CSS; mobile toggle:
  const burger=document.querySelector('.hamburger');
  const shopNav=document.querySelector('.shop-nav');
  burger?.addEventListener('click',()=>{
    const open=burger.getAttribute('aria-expanded')==='true';
    burger.setAttribute('aria-expanded',String(!open));
    shopNav?.classList.toggle('open');
  });

  // Søkefelt enter = søk
  const input=document.getElementById('searchBox');
  input?.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();alert('Søk: '+input.value);}
  });

  // Data-link navigasjon (filtrering demo)
  document.querySelectorAll('[data-cat]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      alert(`Filter: ${a.dataset.cat} ${a.dataset.gen||''} ${a.dataset.sub||''}`);
    });
  });
}

// --- INIT ---
window.addEventListener('DOMContentLoaded',()=>{
  loadHeader();
  setupMenu();
  renderProducts();
  renderNews();
  renderBrands();
});





