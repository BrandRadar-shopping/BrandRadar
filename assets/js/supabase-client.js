// ======================================================
// BrandRadar Supabase Client
// ======================================================

window.BrandRadarSupabase = (() => {

  const SUPABASE_URL = "https://eifrfwtkyrirrmaupfij.supabase.co";
  const SUPABASE_KEY = "sb_publishable_4t_wIAT5FjDklllDJtYkaA_IlEkbxn2";

 async function fetchProducts(options = {}) {
  const {
    category = null,
    subcategory = null,
    limit = 100,
    offset = 0,
    brand = null
  } = options;

  let url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?select=*` +
    `&active=eq.true` +
    `&limit=${limit}` +
    `&offset=${offset}` +
`&order=id.asc`;

  if (category) {
    url += `&category=ilike.${encodeURIComponent(category)}`;
  }

  if (subcategory) {
    url += `&subcategory=ilike.${encodeURIComponent(subcategory)}`;
  }

  if (brand) {
    url += `&brand_slug=eq.${encodeURIComponent(brand)}`;
  }

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status}`);
  }

  return res.json();
}

  return {
    fetchProducts
  };

})();
