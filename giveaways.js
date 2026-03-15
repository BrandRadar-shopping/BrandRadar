document.addEventListener("DOMContentLoaded", async () => {
  const SHEET_GIVEAWAYS = "1E7Fa82dSdgWzCCZ4M8zgodA565FXZvANxWT7RtdP1z8";
  const GIVEAWAYS_TAB = "giveaways";
  const giveawaysUrl = `https://opensheet.elk.sh/${SHEET_GIVEAWAYS}/${GIVEAWAYS_TAB}`;

  const shell = document.getElementById("giveaway-shell");
  if (!shell) return;

  shell.classList.add("is-loading");
  shell.innerHTML = `<p>Laster giveaways...</p>`;

  function parseBool(value) {
    const s = String(value ?? "").trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "ja";
  }

  function parseNumber(value) {
    if (value == null) return null;
    const cleaned = String(value)
      .replace(/\s/g, "")
      .replace(/[^\d,.\-]/g, "")
      .replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function formatPrice(value) {
    const n = parseNumber(value);
    if (n == null) return "";
    return `${new Intl.NumberFormat("nb-NO").format(Math.round(n))} kr`;
  }

  function sanitize(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCountdownParts(endValue) {
    const end = new Date(endValue).getTime();
    if (!Number.isFinite(end)) return null;

    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) {
      return {
        expired: true,
        text: "Trekningen er avsluttet"
      };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return {
      expired: false,
      text: `Trekning om ${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}t ${String(minutes).padStart(2, "0")}m`
    };
  }

  function splitRules(text) {
    return String(text ?? "")
      .split("|")
      .map(item => item.trim())
      .filter(Boolean);
  }

  function sponsorLabel(item) {
    const sponsor = String(item.sponsor_name || "").trim();
    if (!sponsor) return "";

    return `Sponset av ${sponsor}`;
  }

  function renderThumb(item, isActive, index) {
    return `
      <button
        class="giveaway-thumb ${isActive ? "is-active" : ""}"
        type="button"
        data-giveaway-index="${index}"
        aria-label="Vis giveaway: ${sanitize(item.title)}"
      >
        <div class="giveaway-thumb-media">
          ${item.thumb_url
            ? `<img src="${sanitize(item.thumb_url)}" alt="${sanitize(item.title)}" loading="lazy">`
            : item.image_url
              ? `<img src="${sanitize(item.image_url)}" alt="${sanitize(item.title)}" loading="lazy">`
              : `<div></div>`
          }
        </div>
        <p class="giveaway-thumb-title">${sanitize(item.title)}</p>
        <p class="giveaway-thumb-meta">${sanitize(item.value_label || "")}</p>
      </button>
    `;
  }

  function renderModule(items, activeIndex = 0) {
    const active = items[activeIndex];
    if (!active) return "";

    const countdown = getCountdownParts(active.countdown_end);
    const rules = splitRules(active.entry_steps);
    const hasMultiple = items.length > 1;

    return `
      <div class="giveaway-module">
        <div class="giveaway-left">
          <div class="giveaway-topline">
            <p class="giveaway-overline">${sanitize(active.overline || "BrandRadar Giveaway")}</p>
            ${active.badge ? `<span class="giveaway-status-badge">${sanitize(active.badge)}</span>` : ""}
          </div>

          <div class="giveaway-main-stage ${active.image_url ? "" : "is-placeholder"}">
            ${active.image_url
              ? `<img src="${sanitize(active.image_url)}" alt="${sanitize(active.title)}" loading="lazy">`
              : `<span>Ingen giveaway-bilde tilgjengelig</span>`
            }

            ${countdown ? `<div class="giveaway-main-countdown">${sanitize(countdown.text)}</div>` : ""}
            ${active.value_label ? `<div class="giveaway-main-value">${sanitize(active.value_label)}</div>` : ""}
          </div>

          <div class="giveaway-thumbs" ${hasMultiple ? "" : "hidden"}>
            ${items.map((item, index) => renderThumb(item, index === activeIndex, index)).join("")}
          </div>
        </div>

        <div class="giveaway-right">
          ${sponsorLabel(active) ? `<div class="giveaway-sponsor">${sanitize(sponsorLabel(active))}</div>` : ""}

          <h2 class="giveaway-title">${sanitize(active.title)}</h2>

          ${active.description ? `<p class="giveaway-description">${sanitize(active.description)}</p>` : ""}

          <div class="giveaway-meta-grid">
            <div class="giveaway-meta-card">
              <span class="giveaway-meta-label">Verdi</span>
              <div class="giveaway-meta-value">${sanitize(active.value_label || formatPrice(active.giveaway_value) || "Kommer snart")}</div>
            </div>

            <div class="giveaway-meta-card">
              <span class="giveaway-meta-label">Frist</span>
              <div class="giveaway-meta-value">${countdown ? sanitize(countdown.text) : "Kommer snart"}</div>
            </div>
          </div>

          <div class="giveaway-rules">
            <p class="giveaway-rules-title">Slik deltar du</p>
            <ul class="giveaway-rules-list">
              ${rules.length
                ? rules.map(rule => `<li>${sanitize(rule)}</li>`).join("")
                : `<li>Detaljer kommer snart</li>`
              }
            </ul>
          </div>

          ${active.legal_note ? `<p class="giveaway-legal">${sanitize(active.legal_note)}</p>` : ""}

          <div class="giveaway-actions">
            ${active.cta_link
              ? `<a href="${sanitize(active.cta_link)}" class="giveaway-cta" target="_blank" rel="noopener">${sanitize(active.cta_text || "Delta nå")}</a>`
              : `<span class="giveaway-cta" aria-disabled="true">${sanitize(active.cta_text || "Kommer snart")}</span>`
            }

            ${active.secondary_note ? `<span class="giveaway-secondary-note">${sanitize(active.secondary_note)}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  try {
    const rows = await fetch(giveawaysUrl).then(r => r.json());

    const giveaways = rows
      .filter(row => parseBool(row.active))
      .map(row => ({
        id: String(row.id || "").trim(),
        sort_order: parseNumber(row.sort_order) ?? 999,
        overline: row.overline || "BrandRadar Giveaway",
        badge: row.badge || "",
        title: row.title || "Giveaway",
        description: row.description || "",
        image_url: row.image_url || "",
        thumb_url: row.thumb_url || "",
        sponsor_name: row.sponsor_name || "",
        sponsor_type: row.sponsor_type || "",
        giveaway_value: row.giveaway_value || "",
        value_label: row.value_label || "",
        countdown_end: row.countdown_end || "",
        cta_text: row.cta_text || "Delta nå",
        cta_link: row.cta_link || "",
        entry_steps: row.entry_steps || "",
        legal_note: row.legal_note || "",
        secondary_note: row.secondary_note || ""
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    shell.classList.remove("is-loading");

    if (!giveaways.length) {
      shell.classList.add("is-empty");
      shell.innerHTML = `<p>Ingen aktive giveaways akkurat nå.</p>`;
      return;
    }

    let activeIndex = 0;

    function rerender() {
      shell.classList.remove("is-empty", "is-error");
      shell.innerHTML = renderModule(giveaways, activeIndex);

      const thumbButtons = shell.querySelectorAll("[data-giveaway-index]");
      thumbButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          activeIndex = Number(btn.dataset.giveawayIndex || 0);
          rerender();
        });
      });
    }

    rerender();

    setInterval(() => {
      if (!document.body.contains(shell)) return;
      rerender();
    }, 60000);

  } catch (error) {
    console.error("Giveaways error:", error);
    shell.classList.remove("is-loading");
    shell.classList.add("is-error");
    shell.innerHTML = `<p>Kunne ikke laste giveaways akkurat nå.</p>`;
  }
});
