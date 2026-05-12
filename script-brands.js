// ======================================================
// BrandRadar – Brands Page Supabase version
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = window.BRANDRADAR_SUPABASE_URL;
  const SUPABASE_KEY = window.BRANDRADAR_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY || !window.supabase) {
    console.error("Supabase mangler.");
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  const highlightGrid = document.getElementById("highlight-grid");
  const brandGrid = document.getElementById("brand-grid");
  const searchInput = document.getElementById("brandSearch");

  if (!brandGrid) return;

  function escapeHTML(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function loadBrands() {
    const { data, error } = await client
      .from("brands")
      .select("*")
      .eq("active", true)
      .order("featured_sort", { ascending: true })
      .order("product_count", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data || [];
  }

  function createBrandCard(brand) {
    return `
      <article class="brand-card">
        <button
          class="fav-icon"
          type="button"
          data-brand="${escapeHTML(brand.name)}"
        >
          <svg class="heart-icon" viewBox="0 0 24 24">
            <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
          </svg>
        </button>

        ${
          brand.logo_url
            ? `
          <img
            src="${escapeHTML(brand.logo_url)}"
            alt="${escapeHTML(brand.name)}"
            class="brand-logo"
          >
        `
            : `
          <div class="brand-logo-placeholder">
            ${escapeHTML(brand.name.charAt(0))}
          </div>
        `
        }

        <div class="brand-product-count">
          ${brand.product_count || 0} produkter
        </div>

        <a
          href="brand-page.html?brand=${encodeURIComponent(brand.name)}"
          class="brand-btn"
        >
          Se produkter →
        </a>
      </article>
    `;
  }

  function createFeaturedBrandCard(brand) {
    return `
      <article class="featured-brand-card">
        <div class="featured-brand-card__shell">

          <button
            class="fav-icon"
            type="button"
            data-brand="${escapeHTML(brand.name)}"
          >
            <svg class="heart-icon" viewBox="0 0 24 24">
              <path d="M12 21s-7-4.53-10-9.5C-1.4 7.2.6 2.8 4.3 1.5c2.4-.9 5.3.1 7.7 2.4 2.4-2.3 5.3-3.3 7.7-2.4 3.7 1.3 5.7 5.7 2.3 10C19 16.47 12 21 12 21z"/>
            </svg>
          </button>

          <div class="featured-brand-card__brandhead">

            <div class="featured-brand-card__logo-wrap">
              ${
                brand.logo_url
                  ? `
                <img
                  src="${escapeHTML(brand.logo_url)}"
                  alt="${escapeHTML(brand.name)}"
                  class="featured-brand-card__logo"
                >
              `
                  : `
                <div class="brand-logo-placeholder">
                  ${escapeHTML(brand.name.charAt(0))}
                </div>
              `
              }
            </div>

            <span class="featured-brand-card__tag">
              ${escapeHTML(
                brand.featured_tag || "Fremhevet brand"
              )}
            </span>
          </div>

          <div class="featured-brand-card__top">

            <div class="featured-brand-card__intro">

              <div class="featured-brand-card__eyebrow">
                BrandRadar
              </div>

              <h3 class="featured-brand-card__title">
                ${escapeHTML(brand.name)}
              </h3>

              <p class="featured-brand-card__copy">
                ${escapeHTML(
                  brand.featured_intro ||
                    "Utforsk produkter fra dette brandet."
                )}
              </p>

              <a
                class="featured-brand-card__cta"
                href="brand-page.html?brand=${encodeURIComponent(brand.name)}"
              >
                Se produkter →
              </a>
            </div>

            <div class="featured-brand-card__hero">

              ${
                brand.logo_url
                  ? `
                <div class="featured-brand-card__hero-stage">
                  <img
                    src="${escapeHTML(brand.logo_url)}"
                    alt="${escapeHTML(brand.name)}"
                    class="featured-brand-card__hero-image"
                  >
                </div>
              `
                  : ""
              }

              <div class="featured-brand-card__hero-caption">
                <div class="featured-brand-card__hero-name">
                  ${escapeHTML(brand.name)}
                </div>

                <div class="featured-brand-card__hero-price">
                  ${brand.product_count || 0} produkter
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderBrands(brands) {
    if (highlightGrid) {
      const featured = brands.filter((b) => b.is_featured);

      highlightGrid.innerHTML = featured
        .map(createFeaturedBrandCard)
        .join("");
    }

    brandGrid.innerHTML = brands
      .map(createBrandCard)
      .join("");
  }

  const brands = await loadBrands();

  renderBrands(brands);

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const value = String(e.target.value || "")
        .toLowerCase()
        .trim();

      const filtered = brands.filter((brand) =>
        String(brand.name || "")
          .toLowerCase()
          .includes(value)
      );

      renderBrands(filtered);
    });
  }
});
