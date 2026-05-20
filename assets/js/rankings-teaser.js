// ======================================================
// BrandRadar Rankings Teaser – Supabase version
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.BrandRadarSupabase;
  const grid = document.getElementById("radar-rankings-grid");

  if (!grid) return;

  if (!supabase?.from) {
    console.error("❌ BrandRadarSupabase mangler for rankings teaser");
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function fetchLists() {
    const { data, error } = await supabase
      .from("ranking_lists")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(5);

    if (error) throw error;
    return data || [];
  }

  async function fetchItemsForLists(slugs) {
    const { data: items, error } = await supabase
      .from("ranking_items")
      .select("*")
      .in("list_slug", slugs)
      .eq("active", true)
      .order("rank", { ascending: true });

    if (error) throw error;

    const productIds = [...new Set(
      (items || []).map(i => String(i.product_id || "").trim()).filter(Boolean)
    )];

    if (!productIds.length) return new Map();

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("external_id,title,image_url,brand_name")
      .in("external_id", productIds);

    if (productError) throw productError;

    const productMap = new Map(
      (products || []).map(p => [String(p.external_id).trim(), p])
    );

    const byList = new Map();

    (items || []).forEach(item => {
      const product = productMap.get(String(item.product_id || "").trim());
      if (!product) return;

      if (!byList.has(item.list_slug)) byList.set(item.list_slug, []);

      byList.get(item.list_slug).push({
        ...item,
        product
      });
    });

    return byList;
  }

  function renderCard(list, items = []) {
    const topItems = items.slice(0, 3);
    const heroProduct = topItems[0]?.product;
    const image = list.image_url || heroProduct?.image_url || "";
    const ctaText = list.rank_type === "top5" ? "Se Top 5" : "Se Top 10";

    return `
      <a class="radar-ranking-card" href="rankings.html?list=${encodeURIComponent(list.slug)}">
        <div class="radar-ranking-media">
          <span class="radar-ranking-icon">${escapeHtml(list.icon || "✦")}</span>
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(list.title)}" loading="lazy">`
              : `<div class="radar-ranking-placeholder">${escapeHtml(list.title)}</div>`
          }
        </div>

        <div class="radar-ranking-body">
          <div class="radar-ranking-title-row">
            <h3>${escapeHtml(list.title)}</h3>
            <span class="radar-ranking-arrow">↗</span>
          </div>

          <ol class="radar-ranking-list">
            ${
              topItems.length
                ? topItems.map(item => `
                    <li>
                      <strong>${item.rank}</strong>
                      <span>${escapeHtml(item.product.title || "Produkt")}</span>
                    </li>
                  `).join("")
                : `
                  <li><strong>1</strong><span>Kommer snart</span></li>
                  <li><strong>2</strong><span>Oppdateres fortløpende</span></li>
                  <li><strong>3</strong><span>Følg med</span></li>
                `
            }
            <li><strong>…</strong><span></span></li>
          </ol>

          <div class="radar-ranking-cta">${ctaText} →</div>
        </div>
      </a>
    `;
  }

  try {
    const lists = await fetchLists();
    const slugs = lists.map(l => l.slug);
    const itemsByList = await fetchItemsForLists(slugs);

    grid.innerHTML = lists
      .map(list => renderCard(list, itemsByList.get(list.slug) || []))
      .join("");

    console.log("✅ Rankings teaser loaded", { lists, itemsByList });
  } catch (err) {
    console.error("❌ Kunne ikke laste rankings teaser:", err);
    grid.innerHTML = "";
  }
});
