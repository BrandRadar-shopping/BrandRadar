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
    if (value == null || value === "") return null;
    const cleaned = String(value)
      .replace(/\s/g, "")
      .replace(/[^\d,.\-]/g, "")
      .replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function sanitize(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatPrice(value) {
    const n = parseNumber(value);
    if (n == null) return "";
    return `${new Intl.NumberFormat("nb-NO").format(Math.round(n))} kr`;
  }

  function looksLikeUrl(value) {
    return /^https?:\/\//i.test(String(value ?? "").trim());
  }

  function looksLikeDate(value) {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(value ?? "").trim());
  }

  function normalizeImageUrl(url) {
    const raw = String(url ?? "").trim();
    if (!raw) return "";

    const driveFileMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (driveFileMatch?.[1]) {
      return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
    }

    const driveOpenMatch = raw.match(/[?&]id=([^&]+)/i);
    if (/drive\.google\.com/i.test(raw) && driveOpenMatch?.[1]) {
      return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
    }

    return raw;
  }

  function splitList(text) {
    return String(text ?? "")
      .split(/\||\n/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function getCountdownState(endValue) {
    const end = new Date(endValue).getTime();

    if (!Number.isFinite(end)) {
      return { text: "Kommer snart", urgency: false, expired: false };
    }

    const diff = end - Date.now();

    if (diff <= 0) {
      return { text: "Giveaway avsluttet", urgency: false, expired: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const totalDays = Math.floor(totalSeconds / 86400);
    const totalHours = Math.floor(totalSeconds / 3600);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let text;

    if (totalDays > 10) {
      text = `Trekning om ${days}d ${hours}t ${minutes}m`;
    } else if (totalDays > 2) {
      text = `Trekning om ${days}d ${hours}t ${minutes}m ${seconds}s`;
    } else {
      text = `Trekning om ${totalHours}t ${minutes}m ${seconds}s`;
    }

    return {
      text,
      urgency: totalHours <= 48,
      expired: false
    };
  }

  function buildSponsorLabel(item) {
    const sponsorName = String(item.sponsor_name || "").trim();
    return sponsorName ? `Sponset av ${sponsorName}` : "";
  }

  function normalizeRow(row) {
    const fallbackCountdown = looksLikeDate(row.cta_text) ? row.cta_text : row.countdown_end;
    const fallbackCtaText = looksLikeDate(row.cta_text) ? "Delta nå" : (row.cta_text || "Delta nå");

    const rawEntrySteps =
      looksLikeUrl(row.entry_steps) && row.legal_note
        ? row.legal_note
        : row.entry_steps;

    const rawLegalNote =
      looksLikeUrl(row.entry_steps) && row.legal_note
        ? row.secondary_note
        : row.legal_note;

    const sponsorName =
      String(row.sponsor_name || "").trim() ||
      (String(row.sponsor_type || "").trim().toLowerCase() === "brandradar" ? "BrandRadar" : "");

    return {
      id: String(row.id || "").trim(),
      active: parseBool(row.active),
      sort_order: parseNumber(row.sort_order) ?? 999,
      overline: row.overline || "BrandRadar Giveaway",
      badge: row.badge || "",
      title: row.title || "Giveaway",
      description: row.description || "",
      image_url: normalizeImageUrl(row.image_url),
      thumb_url: normalizeImageUrl(row.thumb_url || row.image_url),
      sponsor_name: sponsorName,
      sponsor_type: row.sponsor_type || "",
      giveaway_value: parseNumber(row.giveaway_value),
      value_label: row.value_label || "",
      countdown_end: fallbackCountdown || "",
      cta_text: fallbackCtaText,
      cta_link: row.cta_link || "",
      entry_steps: rawEntrySteps || "",
      extra_entries: row.extra_entries || "",
      legal_note: rawLegalNote || "",
      secondary_note: row.secondary_note || "",
      product_id: String(row.product_id || "").trim(),
      product_link_text: row.product_link_text || "Se produkt"
    };
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
            : `<div class="giveaway-thumb-placeholder">BR</div>`
          }
        </div>
        <p class="giveaway-thumb-title">${sanitize(item.title)}</p>
        <p class="giveaway-thumb-meta">${sanitize(item.value_label || formatPrice(item.giveaway_value) || "")}</p>
      </button>
    `;
  }

  function renderModule(items, activeIndex = 0) {
    const active = items[activeIndex];
    if (!active) return "";

    const countdown = getCountdownState(active.countdown_end);
    const sponsorLabel = buildSponsorLabel(active);
    const entrySteps = splitList(active.entry_steps);
    const extraEntries = splitList(active.extra_entries);
    const valueText = active.value_label || formatPrice(active.giveaway_value) || "Kommer snart";
    const hasMultiple = items.length > 1;
    const isExternal = looksLikeUrl(active.cta_link);

    return `
      <div class="giveaway-module">
        <div class="giveaway-left">
          <div class="giveaway-topline">
            <p class="giveaway-overline">${sanitize(active.overline)}</p>
            ${active.badge ? `<span class="giveaway-status-badge">${sanitize(active.badge)}</span>` : ""}
          </div>

          <div class="giveaway-main-stage ${active.image_url ? "" : "is-placeholder"}">
            ${active.image_url
              ? `<img src="${sanitize(active.image_url)}" alt="${sanitize(active.title)}" loading="lazy">`
              : `
                <div class="giveaway-main-placeholder">
                  <span class="giveaway-main-placeholder-mark">BR</span>
                  <p class="giveaway-main-placeholder-title">${sanitize(active.title)}</p>
                  <p class="giveaway-main-placeholder-sub">Giveaway-bilde kommer snart</p>
                </div>
              `
            }

            <div class="giveaway-main-overlay"></div>

            <div
              class="giveaway-main-countdown ${countdown.urgency ? "urgent" : ""}"
              data-countdown-main="true"
            >
              ${sanitize(countdown.text)}
            </div>

            <div class="giveaway-main-value">
              ${sanitize(valueText)}
            </div>
          </div>

          <div class="giveaway-thumbs" ${hasMultiple ? "" : "hidden"}>
            ${items.map((item, index) => renderThumb(item, index === activeIndex, index)).join("")}
          </div>
        </div>

        <div class="giveaway-right">
          ${sponsorLabel ? `<div class="giveaway-sponsor">${sanitize(sponsorLabel)}</div>` : ""}

          <h2 class="giveaway-title">${sanitize(active.title)}</h2>

          ${active.description ? `<p class="giveaway-description">${sanitize(active.description)}</p>` : ""}

          <div class="giveaway-meta-grid">
            <div class="giveaway-meta-card">
              <span class="giveaway-meta-label">Verdi</span>
              <div class="giveaway-meta-value">${sanitize(valueText)}</div>
            </div>

            <div class="giveaway-meta-card">
              <span class="giveaway-meta-label">Frist</span>
              <div class="giveaway-meta-value" data-countdown-meta="true">${sanitize(countdown.text)}</div>
            </div>
          </div>

          <div class="giveaway-rules">
            <p class="giveaway-rules-title">Slik deltar du</p>
            <ul class="giveaway-rules-list">
              ${entrySteps.length
                ? entrySteps.map(rule => `<li>${sanitize(rule)}</li>`).join("")
                : `<li>Detaljer kommer snart</li>`
              }
            </ul>
          </div>

          ${extraEntries.length ? `
            <div class="giveaway-bonus">
              <p class="giveaway-bonus-title">Ekstra entries</p>
              <div class="giveaway-bonus-list">
                ${extraEntries.map(item => `<span class="giveaway-bonus-pill">${sanitize(item)}</span>`).join("")}
              </div>
            </div>
          ` : ""}

          ${active.legal_note ? `<p class="giveaway-legal">${sanitize(active.legal_note)}</p>` : ""}

          <div class="giveaway-actions">
            ${active.cta_link
              ? `<a href="${sanitize(active.cta_link)}" class="giveaway-cta" ${isExternal ? `target="_blank" rel="noopener"` : ""}>${sanitize(active.cta_text || "Delta nå")}</a>`
              : `<span class="giveaway-cta is-disabled">Kommer snart</span>`
            }

            ${active.product_id
              ? `<a href="product.html?id=${encodeURIComponent(active.product_id)}" class="giveaway-product-link">${sanitize(active.product_link_text || "Se produkt")}</a>`
              : ""
            }

            ${active.secondary_note ? `<span class="giveaway-secondary-note">${sanitize(active.secondary_note)}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  function updateCountdownOnly(items, activeIndex) {
    const active = items[activeIndex];
    if (!active) return;

    const countdown = getCountdownState(active.countdown_end);

    const mainCountdown = shell.querySelector("[data-countdown-main]");
    const metaCountdown = shell.querySelector("[data-countdown-meta]");

    if (mainCountdown) {
      mainCountdown.textContent = countdown.text;
      mainCountdown.classList.toggle("urgent", countdown.urgency);
    }

    if (metaCountdown) {
      metaCountdown.textContent = countdown.text;
    }
  }

  try {
    const rows = await fetch(giveawaysUrl).then(r => r.json());

    const giveaways = rows
      .map(normalizeRow)
      .filter(item => item.active)
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

      shell.querySelectorAll("[data-giveaway-index]").forEach(btn => {
        btn.addEventListener("click", () => {
          activeIndex = Number(btn.dataset.giveawayIndex || 0);
          rerender();
        });
      });
    }

    rerender();

    setInterval(() => {
      if (!document.body.contains(shell)) return;
      updateCountdownOnly(giveaways, activeIndex);
    }, 1000);

  } catch (error) {
    console.error("Giveaways error:", error);
    shell.classList.remove("is-loading");
    shell.classList.add("is-error");
    shell.innerHTML = `<p>Kunne ikke laste giveaways akkurat nå.</p>`;
  }
});
