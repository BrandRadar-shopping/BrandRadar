// ======================================================
// BRANDRADAR – RANKINGS PAGE
// Uses: ranking_lists + ranking_items + products
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.BrandRadarSupabase;

  const listEl = document.getElementById("rankings-list");
  const tabsEl = document.getElementById("rankings-tabs");
  const titleEl = document.getElementById("ranking-title");
  const subtitleEl = document.getElementById("ranking-subtitle");
  const headingEl = document.getElementById("ranking-list-heading");

  if (!listEl || !supabase?.from) return;

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatPrice(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "";
    return `${new Intl.NumberFormat("nb-NO").format(n)} kr`;
  }

  function getActiveSlug(lists) {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("list");

    if (fromUrl && lists.some(l => l.slug === fromUrl)) return fromUrl;

    return lists[0]?.slug || "top-sneakers";
  }

  async function fetchLists() {
    const { data, error } = await supabase
      .from("ranking_lists")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data || [];
  }

  async function fetchItems(slug) {
    const { data: items, error } = await supabase
      .from("ranking_items")
      .select("*")
      .eq("list_slug", slug)
      .eq("active", true)
      .order("rank", { ascending: true });

    if (error) throw error;

    const ids = [
      ...new Set((items || []).map(i => i.product_id).filter(Boolean))
    ];

    if (!ids.length) return [];

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("external_id,title,brand_name,image_url,price,product_url,affiliate_url")
      .in("external_id", ids);

    if (productError) throw productError;

    const productMap = new Map(
      (products || []).map(p => [String(p.external_id), p])
    );

    return (items || []).map(item => ({
      ...item,
      product: productMap.get(String(item.product_id)) || null
    }));
  }

  function renderTabs(lists, activeSlug) {
    if (!tabsEl) return;

    tabsEl.innerHTML = lists.map(list => `
      <button
        class="ranking-tab ${list.slug === activeSlug ? "is-active" : ""}"
        type="button"
        data-slug="${esc(list.slug)}"
      >
        ${esc(list.category_label || list.title)}
      </button>
    `).join("");

    tabsEl.querySelectorAll(".ranking-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        const slug = btn.dataset.slug;
        const url = new URL(window.location.href);

        url.searchParams.set("list", slug);
        window.history.replaceState({}, "", url);

        loadRanking(slug, lists);
      });
    });
  }

  function updateHeader(list) {
    if (!list) return;

    if (titleEl) titleEl.textContent = list.title || "BrandRadar Rankings";
    if (subtitleEl) subtitleEl.textContent = list.subtitle || "Produktene som får mest oppmerksomhet akkurat nå.";
    if (headingEl) headingEl.textContent = list.rank_type === "top5" ? "Top 5" : "Top 10";

    document.title = `${list.title || "Rankings"} | BrandRadar`;
  }

  function renderItem(item) {
    const p = item.product || {};

    const productId = p.external_id || item.product_id || "";
    const image = p.image_url || "";
    const title = p.title || "Produkt";
    const brand = p.brand_name || "";
    const price = formatPrice(p.price);

    const url =
      p.affiliate_url ||
      p.product_url ||
      `product.html?id=${encodeURIComponent(productId)}`;

    const tags = [item.tag_1, item.tag_2, item.tag_3].filter(Boolean);
    const trendScore = item.trend_score || 0;

    const imageFit = item.image_fit || "cover";
    const imageZoom = item.image_zoom || 1;
    const imageX = item.image_x || "50%";
    const imageY = item.image_y || "50%";

    return `
      <article class="ranking-item-card" data-product-id="${esc(productId)}">

        <div class="ranking-number">${esc(item.rank)}</div>

        <div class="ranking-media">
          ${
            image
              ? `
                <img
                  src="${esc(image)}"
                  alt="${esc(title)}"
                  loading="lazy"
                  style="
                    --rank-img-fit:${esc(imageFit)};
                    --rank-img-zoom:${esc(imageZoom)};
                    --rank-img-x:${esc(imageX)};
                    --rank-img-y:${esc(imageY)};
                  "
                >
              `
              : ""
          }
        </div>

        <div class="ranking-info">
          <div class="ranking-meta-row">
            <p class="ranking-brand">${esc(brand)}</p>
            <span class="ranking-trend-inline">Trend score: ${esc(trendScore)}</span>
          </div>

          <h3>${esc(title)}</h3>

          <p class="ranking-reason">${esc(item.reason || "")}</p>
        </div>

        ${
          tags.length
            ? `
              <div class="ranking-tags">
                ${tags.map(tag => `<span>${esc(tag)}</span>`).join("")}
              </div>
            `
            : `<div class="ranking-tags"></div>`
        }

        <div class="ranking-actions">
          ${price ? `<div class="ranking-price">${price}</div>` : ""}

          <a class="ranking-cta" href="${esc(url)}" target="_blank" rel="noopener">
            Se produkt
          </a>
        </div>

      </article>
    `;
  }

  async function loadRanking(slug, lists) {
    const activeList = lists.find(l => l.slug === slug) || lists[0];

    updateHeader(activeList);
    renderTabs(lists, activeList.slug);

    listEl.innerHTML = `<p class="rankings-loading">Laster ranking...</p>`;

    const items = await fetchItems(activeList.slug);

    if (!items.length) {
      listEl.innerHTML = `<p class="rankings-loading">Ingen produkter funnet enda.</p>`;
      return;
    }

    listEl.innerHTML = items.map(renderItem).join("");
  }

  try {
    const lists = await fetchLists();
    const activeSlug = getActiveSlug(lists);

    await loadRanking(activeSlug, lists);

    console.log("✅ Rankings page loaded", { lists, activeSlug });
  } catch (err) {
    console.error("❌ Rankings page error:", err);
    listEl.innerHTML = `<p class="rankings-loading">Klarte ikke laste ranking akkurat nå.</p>`;
  }
});
