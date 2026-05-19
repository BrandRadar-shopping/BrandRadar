// ======================================================
// BRANDRADAR – RANKINGS PAGE
// Dynamic Top 10 / Top 5 system
// ======================================================

(function () {

  const supabase = window.brandradarSupabase;

  const CATEGORY_CONFIG = {
    sneakers: {
      title: "Top 10 Sneakers",
      label: "Sneakers",
      table: "rankings_sneakers",
      hero:
        "Sneakers som dominerer akkurat nå — basert på signaler fra retailers, sosiale medier, Reddit, trendrapporter og editorial tracking."
    },

    proteinbars: {
      title: "Top 10 Proteinbarer",
      label: "Proteinbarer",
      table: "rankings_proteinbars",
      hero:
        "Proteinbarer med sterkest momentum akkurat nå — populære på tvers av trening, smak, TikTok-trender og community-anbefalinger."
    },

    running: {
      title: "Top 10 Running Shoes",
      label: "Running",
      table: "rankings_running",
      hero:
        "Løpesko som får mest oppmerksomhet akkurat nå blant både casual runners og performance-miljøer."
    }
  };

  const state = {
    active: "sneakers"
  };

  const listEl = document.getElementById("rankings-list");
  const titleEl = document.getElementById("rankings-page-title");
  const heroTextEl = document.getElementById("rankings-hero-text");

  function cleanPrice(value) {
    return parseFloat(
      String(value ?? "")
        .replace(/[^\d.,]/g, "")
        .replace(",", ".")
    ) || 0;
  }

  function formatPrice(value) {
    const n = cleanPrice(value);

    if (!n) return "";

    return `${new Intl.NumberFormat("nb-NO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(n)} kr`;
  }

  function getCategoryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");

    if (category && CATEGORY_CONFIG[category]) {
      return category;
    }

    return "sneakers";
  }

  function updateHero(categoryKey) {
    const config = CATEGORY_CONFIG[categoryKey];

    titleEl.textContent = config.title;
    heroTextEl.textContent = config.hero;

    document.title = `${config.title} | BrandRadar`;
  }

  function updateTabs(categoryKey) {
    document.querySelectorAll(".ranking-tab").forEach(btn => {
      btn.classList.toggle(
        "is-active",
        btn.dataset.category === categoryKey
      );
    });
  }

  function createRankingCard(item, index) {

    const product = item.product || {};

    const productId =
      product.external_id ||
      product.id ||
      item.product_id ||
      "";

    const image =
      product.image_url ||
      product.image ||
      "";

    const brand =
      product.brand_name ||
      product.brand ||
      "Brand";

    const title =
      product.title ||
      product.product_name ||
      "Produkt";

    const reason =
      item.reason ||
      item.highlight_reason ||
      "Et av de sterkeste trending-produktene akkurat nå.";

    const tags = [];

    if (item.tag_1) tags.push(item.tag_1);
    if (item.tag_2) tags.push(item.tag_2);
    if (item.tag_3) tags.push(item.tag_3);

    const price =
      product.price ||
      item.price ||
      "";

    const formattedPrice = formatPrice(price);

    return `
      <article class="ranking-item-card">

        <div class="ranking-number">
          ${index + 1}
        </div>

        <div class="ranking-media">
          <img
            src="${image}"
            alt="${title}"
            loading="lazy"
          >
        </div>

        <div class="ranking-info">

          <p class="ranking-brand">
            ${brand}
          </p>

          <h3>
            ${title}
          </h3>

          <p class="ranking-reason">
            ${reason}
          </p>

          ${
            tags.length
              ? `
                <div class="ranking-tags">
                  ${tags.map(tag => `<span>${tag}</span>`).join("")}
                </div>
              `
              : ""
          }

        </div>

        <div class="ranking-actions">

          ${
            formattedPrice
              ? `
                <div class="ranking-price">
                  ${formattedPrice}
                </div>
              `
              : ""
          }

          <a
            class="ranking-cta"
            href="product.html?id=${encodeURIComponent(productId)}"
          >
            Se produkt
          </a>

          <div class="ranking-secondary">
            Oppdatert av BrandRadar
          </div>

        </div>

      </article>
    `;
  }

  async function loadCategory(categoryKey) {

    state.active = categoryKey;

    updateHero(categoryKey);
    updateTabs(categoryKey);

    const config = CATEGORY_CONFIG[categoryKey];

    listEl.innerHTML = `
      <div class="rankings-loading">
        Laster ranking...
      </div>
    `;

    try {

      if (!supabase) {
        throw new Error("Supabase mangler");
      }

      const { data, error } = await supabase
        .from(config.table)
        .select(`
          *,
          product:products(*)
        `)
        .eq("active", true)
        .order("rank", { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || !data.length) {

        listEl.innerHTML = `
          <div class="rankings-loading">
            Ingen produkter funnet enda.
          </div>
        `;

        return;
      }

      listEl.innerHTML = data
        .map((item, index) => createRankingCard(item, index))
        .join("");

    } catch (err) {

      console.error(err);

      listEl.innerHTML = `
        <div class="rankings-loading">
          Klarte ikke laste ranking akkurat nå.
        </div>
      `;
    }
  }

  function bindTabs() {

    document.querySelectorAll(".ranking-tab").forEach(btn => {

      btn.addEventListener("click", () => {

        const category = btn.dataset.category;

        const url = new URL(window.location);

        url.searchParams.set("category", category);

        window.history.replaceState({}, "", url);

        loadCategory(category);
      });
    });
  }

  function init() {

    const category = getCategoryFromUrl();

    bindTabs();

    loadCategory(category);
  }

  document.addEventListener("DOMContentLoaded", init);

})();
