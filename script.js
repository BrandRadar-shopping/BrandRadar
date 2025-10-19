const PRODUCTS_CSV = 'https://docs.google.com/spreadsheets/d/e/XXXXXX/pub?output=csv';

function csvToRows(txt){
  return txt.trim().split(/\r?\n/).map(r=>r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'')));
}

async function fetchProducts(){
  const res = await fetch(PRODUCTS_CSV);
  const text = await res.text();
  const [header,...data] = csvToRows(text);
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
  return data.map(r=>({
    name:r[idx.name], image:r[idx.image], price:r[idx.price],
    category:r[idx.category], sub:r[idx.subcategory],
    gender:r[idx.gender], brand:r[idx.brand],
    affiliate:r[idx.affiliate_url]
  }));
}

async function renderProducts(){
  const wrap=document.getElementById('products'); if(!wrap)return;
  wrap.innerHTML='Laster...';
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

function setupMenu(){
  document.querySelectorAll('[data-cat]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      const cat=a.dataset.cat, gen=a.dataset.gen||'', sub=a.dataset.sub||'';
      localStorage.setItem('filters',JSON.stringify({cat,gen,sub}));
      location.reload();
    });
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  setupMenu();
  renderProducts();
});



