const PRODUCTS_CSV='https://docs.google.com/spreadsheets/d/e/XXXXXX/pub?output=csv';
const BRANDS_CSV='https://docs.google.com/spreadsheets/d/e/YYYYYY/pub?output=csv';

function csvToRows(txt){
  return txt.trim().split(/\r?\n/).map(r=>r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'')));
}

async function loadHeader(){
  if(!document.getElementById('header-placeholder'))return;
  const res=await fetch('index.html');const txt=await res.text();
  const parser=new DOMParser();const doc=parser.parseFromString(txt,'text/html');
  const header=doc.querySelector('.top-header').outerHTML+doc.querySelector('.shop-nav').outerHTML;
  document.getElementById('header-placeholder').innerHTML=header;
  setupMenu();
}

async function fetchProducts(){
  const res=await fetch(PRODUCTS_CSV);const text=await res.text();
  const [h,...rows]=csvToRows(text);const i=Object.fromEntries(h.map((x,j)=>[x,j]));
  return rows.map(r=>({name:r[i.name],image:r[i.image],price:r[i.price],brand:r[i.brand],affiliate:r[i.affiliate_url]}));
}

async function renderProducts(){
  const wrap=document.getElementById('products');if(!wrap)return;
  const items=await fetchProducts();wrap.innerHTML='';
  items.forEach(p=>{
    const el=document.createElement('div');el.className='card';
    el.innerHTML=`<img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3><div class="meta">${p.brand||''}</div>
      <div class="price">${p.price}</div>
      <a href="${p.affiliate}" target="_blank" rel="nofollow sponsored noopener">Se hos butikk</a>`;
    wrap.appendChild(el);
  });
}

async function renderNews(){
  const root=document.getElementById('news');if(!root)return;
  const items=await fetchProducts();
  root.innerHTML='';
  items.slice(0,40).forEach(p=>{
    const el=document.createElement('div');el.className='card';
    el.innerHTML=`<img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3><div class="meta">${p.brand||''}</div>
      <div class="price">${p.price}</div>
      <a href="${p.affiliate}" target="_blank" rel="nofollow sponsored noopener">Se hos butikk</a>`;
    root.appendChild(el);
  });
}

async function renderBrands(){
  const root=document.getElementById('brands');if(!root)return;
  const res=await fetch(BRANDS_CSV);const txt=await res.text();
  const [h,...rows]=csvToRows(txt);const i=Object.fromEntries(h.map((x,j)=>[x,j]));
  root.innerHTML='';
  rows.forEach(r=>{
    const el=document.createElement('div');el.className='brand-card';
    el.innerHTML=`<img src="${r[i.logo]}" alt="${r[i.brand]}">
      <h3>${r[i.brand]}</h3>
      <a href="${r[i.affiliate_url]||r[i.website]}" target="_blank" rel="nofollow sponsored noopener">Besøk</a>`;
    root.appendChild(el);
  });
}

function setupMenu(){
  const burger=document.querySelector('.hamburger');
  const shopNav=document.querySelector('.shop-nav');
  burger?.addEventListener('click',()=>{
    const open=burger.getAttribute('aria-expanded')==='true';
    burger.setAttribute('aria-expanded',String(!open));
    shopNav?.classList.toggle('open');
  });
  const input=document.getElementById('searchBox');
  input?.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();alert('Søk: '+input.value);}
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  loadHeader();setupMenu();renderProducts();renderNews();renderBrands();
});



