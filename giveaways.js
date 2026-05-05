document.addEventListener("DOMContentLoaded", async () => {
  const SHEET_GIVEAWAYS = "1E7Fa82dSdgWzCCZ4M8zgodA565FXZvANxWT7RtdP1z8";
  const GIVEAWAYS_TAB = "giveaways";
  const SETTINGS_TAB = "site_settings";
  const MOBILE_BREAKPOINT = 768;

  const giveawaysUrl = `https://opensheet.elk.sh/${SHEET_GIVEAWAYS}/${GIVEAWAYS_TAB}`;
  const settingsUrl = `https://opensheet.elk.sh/${SHEET_GIVEAWAYS}/${SETTINGS_TAB}`;

  const shell = document.getElementById("giveaway-shell");
  if (!shell) return;

  const t = window.BrandRadarLang?.t || ((key, fallback) => fallback || key);
  const getLang = () => window.BrandRadarLang?.get?.() || "no";
  const isMobile = () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;

  shell.classList.add("is-loading");
  shell.innerHTML = `<p>${t("loading_giveaways", "Laster giveaways...")}</p>`;

  function parseBool(value) {
    const s = String(value ?? "").trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "ja";
  }

  function getSetting(rows, key, fallback = "") {
    const found = rows.find(row => String(row.key || "").trim() === key);
    return found ? String(found.value || "").trim() : fallback;
  }

  function getLocalized(row, key, fallback = "") {
    const lang = getLang();

    if (lang === "en") {
      return String(
        row[`${key}_en`] ||
        row[`${key}_english`] ||
        row[key] ||
        fallback ||
        ""
      ).trim();
    }

    return String(
      row[`${key}_no`] ||
      row[`${key}_norwegian`] ||
      row[key] ||
      fallback ||
      ""
    ).trim();
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
      return { text: t("coming_soon", "Kommer snart"), urgency: false, expired: false };
    }

    const diff = end - Date.now();

    if (diff <= 0) {
      return { text: t("giveaway_ended", "Giveaway avsluttet"), urgency: false, expired: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const totalDays = Math.floor(totalSeconds / 86400);
    const totalHours = Math.floor(totalSeconds / 3600);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let text;

    if (getLang() === "en") {
      if (totalDays > 10) text = `Draw in ${days}d ${hours}h ${minutes}m`;
      else if (totalDays > 2) text = `Draw in ${days}d ${hours}h ${minutes}m ${seconds}s`;
      else text = `Draw in ${totalHours}h ${minutes}m ${seconds}s`;
    } else {
      if (totalDays > 10) text = `Trekning om ${days}d ${hours}t ${minutes}m`;
      else if (totalDays > 2) text = `Trekning om ${days}d ${hours}t ${minutes}m ${seconds}s`;
      else text = `Trekning om ${totalHours}t ${minutes}m ${seconds}s`;
    }

    return { text, urgency: totalHours <= 48, expired: false };
  }

  function shortCountdown(text) {
    return String(text || "")
      .replace(/^Trekning om\s+/i, "")
      .replace(/^Draw in\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function shortMobileTitle(item) {
    let title = String(item.title || "");
    const sponsor = String(item.sponsor_name || "").trim();

    if (sponsor) {
      title = title.replace(new RegExp(`\\s+hos\\s+${sponsor}$`, "i"), "");
      title = title.replace(new RegExp(`\\s+fra\\s+${sponsor}$`, "i"), "");
    }

    return title.trim() || item.title;
  }

  function buildSponsorLabel(item) {
    const sponsorName = String(item.sponsor_name || "").trim();
    return sponsorName ? `${t("sponsored_by", "Sponset av")} ${sponsorName}` : "";
  }

  function normalizeDisplayStatus(row) {
    const raw = String(row.display_status || "").trim().toLowerCase();

    if (["active", "upcoming", "ended", "hidden"].includes(raw)) {
      return raw;
    }

    return parseBool(row.active) ? "active" : "hidden";
  }

  function normalizeRow(row) {
    const fallbackCountdown = looksLikeDate(row.cta_text) ? row.cta_text : row.countdown_end;
    const fallbackCtaText = looksLikeDate(row.cta_text)
      ? t("join_now", "Delta nå")
      : getLocalized(row, "cta_text", t("join_now", "Delta nå"));

    const rawEntrySteps =
      looksLikeUrl(row.entry_steps) && row.legal_note
        ? row.legal_note
        : getLocalized(row, "entry_steps");

    const rawLegalNote =
      looksLikeUrl(row.entry_steps) && row.legal_note
        ? getLocalized(row, "secondary_note")
        : getLocalized(row, "legal_note");

    const sponsorName =
      String(row.sponsor_name || "").trim() ||
      (String(row.sponsor_type || "").trim().toLowerCase() === "brandradar" ? "BrandRadar" : "");

    return {
      id: String(row.id || "").trim(),
      active: parseBool(row.active),
      display_status: normalizeDisplayStatus(row),
      sort_order: parseNumber(row.sort_order) ?? 999,
      overline: getLocalized(row, "overline", "BrandRadar Giveaway"),
      badge: getLocalized(row, "badge"),
      title: getLocalized(row, "title", "Giveaway"),
      description: getLocalized(row, "description"),
      image_url: normalizeImageUrl(row.image_url),
      thumb_url: normalizeImageUrl(row.thumb_url || row.image_url),
      sponsor_name: sponsorName,
      sponsor_type: row.sponsor_type || "",
      giveaway_value: parseNumber(row.giveaway_value),
      value_label: getLocalized(row, "value_label"),
      countdown_end: fallbackCountdown || "",
      cta_text: fallbackCtaText,
      cta_link: row.cta_link || "",
      entry_steps: rawEntrySteps || "",
      extra_entries: getLocalized(row, "extra_entries"),
      legal_note: rawLegalNote || "",
      secondary_note: getLocalized(row, "secondary_note"),
      product_id: String(row.product_id || "").trim(),
      product_link_text: getLocalized(row, "product_link_text", t("view_product", "Se produkt")),
      campaign_link: row.campaign_link || "",
      campaign_link_text: getLocalized(row, "campaign_link_text", t("visit_campaign", "Besøk kampanjen"))
    };
  }

  function renderMobileComingSoon() {
    return `
      <div class="m-giveaway-hub">
        <div class="m-giveaway-hero">
          <div>
            <p class="m-giveaway-kicker">GIVEAWAY HUB</p>
            <h2>${sanitize(t("giveaways_coming_soon", "Giveaways kommer snart"))}</h2>
            <p>${sanitize(t("giveaways_coming_soon_text", "Vi jobber med nye giveaways. Følg med – flere muligheter kommer snart."))}</p>
          </div>

          <div class="m-giveaway-visual">
            <img src="assets/img/giveaways/gift-box.png" alt="">
          </div>
        </div>

        <div class="m-giveaway-empty">
          <p class="m-giveaway-kicker">${sanitize(t("status", "Status"))}</p>
          <h3>${sanitize(t("coming_soon", "Kommer snart"))}</h3>
          <p>${sanitize(t("more_giveaways_soon", "Flere giveaways kommer snart – følg med"))}</p>
          <a href="news.html" class="m-giveaway-cta">${sanitize(t("explore_news", "Utforsk nyheter"))}</a>
        </div>

        <div class="m-giveaway-info-card">
          <div class="m-giveaway-info-icon">↻</div>
          <div>
            <h3>${sanitize(t("updated_regularly", "Oppdatert jevnlig"))}</h3>
            <p>${sanitize(t("stay_tuned", "Følg med"))}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderComingSoon() {
    shell.classList.remove("is-loading", "is-error");
    shell.classList.add("is-empty", "is-coming-soon");

    if (isMobile()) {
      shell.innerHTML = renderMobileComingSoon();
      return;
    }

    shell.innerHTML = `
      <div class="giveaway-module giveaway-module--coming-soon">
        <div class="giveaway-left">
          <div class="giveaway-main-stage is-placeholder is-blurred">
            <div class="giveaway-main-placeholder">
              <span class="giveaway-main-placeholder-mark">BR</span>
              <p class="giveaway-main-placeholder-title">${sanitize(t("giveaways_coming_soon", "Giveaways kommer snart"))}</p>
              <p class="giveaway-main-placeholder-sub">${sanitize(t("more_giveaways_soon", "Flere giveaways kommer snart – følg med"))}</p>
            </div>
            <div class="giveaway-main-overlay"></div>
          </div>
        </div>

        <div class="giveaway-right">
          <div class="giveaway-sponsor">${sanitize(t("brandradar_giveaway", "BrandRadar Giveaway"))}</div>
          <h2 class="giveaway-title">${sanitize(t("giveaways_coming_soon", "Giveaways kommer snart"))}</h2>
          <p class="giveaway-description">
            ${sanitize(t("giveaways_coming_soon_text", "Vi jobber med nye giveaways. Følg med – flere muligheter kommer snart."))}
          </p>

          <div class="giveaway-meta-grid">
            <div class="giveaway-meta-card">
              <span class="giveaway-meta-label">${sanitize(t("status", "Status"))}</span>
              <div class="giveaway-meta-value">${sanitize(t("coming_soon", "Kommer snart"))}</div>
            </div>

            <div class="giveaway-meta-card">
              <span class="giveaway-meta-label">${sanitize(t("next_update", "Neste oppdatering"))}</span>
              <div class="giveaway-meta-value">${sanitize(t("updated_regularly", "Oppdatert jevnlig"))}</div>
            </div>
          </div>

          <div class="giveaway-actions">
            <a href="news.html" class="giveaway-cta">${sanitize(t("explore_news", "Utforsk nyheter"))}</a>
            <span class="giveaway-secondary-note">${sanitize(t("stay_tuned", "Følg med"))}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderThumb(item, isActive, index) {
    return `
      <button
        class="giveaway-thumb ${isActive ? "is-active" : ""}"
        type="button"
        data-giveaway-index="${index}"
        aria-label="${sanitize(t("show_giveaway", "Vis giveaway"))}: ${sanitize(item.title)}"
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
    const valueText = active.value_label || formatPrice(active.giveaway_value) || t("coming_soon", "Kommer snart");
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
                  <p class="giveaway-main-placeholder-sub">${sanitize(t("giveaway_image_coming_soon", "Giveaway-bilde kommer snart"))}</p>
                </div>
              `
            }

            <div class="giveaway-main-overlay"></div>

            <div class="giveaway-main-countdown ${countdown.urgency ? "urgent" : ""}" data-countdown-main="true">
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
              <span class="giveaway-meta-label">${sanitize(t("value", "Verdi"))}</span>
              <div class="giveaway-meta-value">${sanitize(valueText)}</div>
            </div>

            <div class="giveaway-meta-card">
              <span class="giveaway-meta-label">${sanitize(t("deadline", "Frist"))}</span>
              <div class="giveaway-meta-value" data-countdown-meta="true">${sanitize(countdown.text)}</div>
            </div>
          </div>

          <div class="giveaway-rules">
            <p class="giveaway-rules-title">${sanitize(t("how_to_join", "Slik deltar du"))}</p>
            <ul class="giveaway-rules-list">
              ${entrySteps.length
                ? entrySteps.map(rule => `<li>${sanitize(rule)}</li>`).join("")
                : `<li>${sanitize(t("details_coming_soon", "Detaljer kommer snart"))}</li>`
              }
            </ul>
          </div>

          ${extraEntries.length ? `
            <div class="giveaway-bonus">
              <p class="giveaway-bonus-title">${sanitize(t("extra_entries", "Ekstra entries"))}</p>
              <div class="giveaway-bonus-list">
                ${extraEntries.map(item => `<span class="giveaway-bonus-pill">${sanitize(item)}</span>`).join("")}
              </div>
            </div>
          ` : ""}

          ${active.legal_note ? `<p class="giveaway-legal">${sanitize(active.legal_note)}</p>` : ""}

          <div class="giveaway-actions">
            ${active.cta_link
              ? `<a href="${sanitize(active.cta_link)}" class="giveaway-cta" ${isExternal ? `target="_blank" rel="noopener"` : ""}>${sanitize(active.cta_text || t("join_now", "Delta nå"))}</a>`
              : `<span class="giveaway-cta is-disabled">${sanitize(t("coming_soon", "Kommer snart"))}</span>`
            }

            ${active.product_id
              ? `<a href="product.html?id=${encodeURIComponent(active.product_id)}" class="giveaway-product-link">${sanitize(active.product_link_text || t("view_product", "Se produkt"))}</a>`
              : ""
            }

            ${active.campaign_link
              ? `<a href="${sanitize(active.campaign_link)}" class="giveaway-product-link" target="_blank" rel="noopener">${sanitize(active.campaign_link_text || t("visit_campaign", "Besøk kampanjen"))}</a>`
              : ""
            }

            ${active.secondary_note ? `<span class="giveaway-secondary-note">${sanitize(active.secondary_note)}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  function renderMobileModule(activeItems, upcomingItems = [], activeIndex = 0) {
    const hasMultiple = activeItems.length > 1;

    return `
      <div class="m-giveaway-hub m-giveaway-hub--active">
        <div class="m-giveaway-hero">
          <div>
            <p class="m-giveaway-kicker">GIVEAWAY HUB</p>
            <h2>${sanitize(t("active_giveaways", "Aktive giveaways"))}</h2>
            <p>${sanitize(t("mobile_giveaway_intro", "Utvalgte giveaways fra BrandRadar."))}</p>
          </div>

          <div class="m-giveaway-visual">
            <img src="assets/img/giveaways/gift-box.png" alt="">
          </div>
        </div>

        <div class="m-giveaway-slider" id="m-giveaway-slider">
          ${activeItems.map((item, index) => {
            const countdown = getCountdownState(item.countdown_end);
            const valueText = item.value_label || formatPrice(item.giveaway_value) || t("coming_soon", "Kommer snart");
            const isExternal = looksLikeUrl(item.cta_link);

            return `
              <article class="m-giveaway-card" data-mobile-giveaway-card="${index}">
                <div class="m-giveaway-card-top">
                  <div>
                    ${item.sponsor_name ? `<p class="m-giveaway-sponsor m-giveaway-sponsor--top">${sanitize(item.sponsor_name)}</p>` : ""}
                    <h3>${sanitize(shortMobileTitle(item))}</h3>
                    ${item.description ? `<p class="m-giveaway-desc">${sanitize(item.description)}</p>` : ""}
                  </div>

                  <div class="m-giveaway-media-wrap">
                    <div class="m-giveaway-countdown" data-mobile-countdown="${index}">
                      ${sanitize(shortCountdown(countdown.text))}
                    </div>

                    <div class="m-giveaway-media">
                      ${item.image_url
                        ? `<img src="${sanitize(item.image_url)}" alt="${sanitize(item.title)}" loading="lazy">`
                        : `<div class="giveaway-thumb-placeholder">BR</div>`
                      }
                    </div>
                  </div>
                </div>

                <div class="m-giveaway-meta m-giveaway-meta--single">
                  <div>
                    <span>${sanitize(t("value", "Verdi"))}</span>
                    <strong>${sanitize(valueText)}</strong>
                  </div>
                </div>

                ${item.cta_link
                  ? `<a href="${sanitize(item.cta_link)}" class="m-giveaway-cta" ${isExternal ? `target="_blank" rel="noopener"` : ""}>${sanitize(item.cta_text || t("join_now", "Delta nå"))}</a>`
                  : `<span class="m-giveaway-cta is-disabled">${sanitize(t("coming_soon", "Kommer snart"))}</span>`
                }
              </article>
            `;
          }).join("")}
        </div>

        ${hasMultiple ? `
          <div class="m-giveaway-dots">
            ${activeItems.map((_, index) => `
              <button
                class="m-giveaway-dot ${index === activeIndex ? "is-active" : ""}"
                type="button"
                data-mobile-dot="${index}"
                aria-label="${sanitize(t("show_giveaway", "Vis giveaway"))} ${index + 1}"
              ></button>
            `).join("")}
          </div>
        ` : ""}

        ${upcomingItems.length ? `
          <div class="m-giveaway-upcoming">
            <div class="m-giveaway-panel-head">
              <h3>${sanitize(t("coming_soon", "Kommer snart"))}</h3>
              ${upcomingItems.length > 3 ? `<button class="m-giveaway-see-all" type="button" data-mobile-upcoming-toggle>${sanitize(t("see_all", "Se alle"))}</button>` : ""}
            </div>

            <div class="m-upcoming-row" data-mobile-upcoming-row>
              ${upcomingItems.map(item => `
                <div class="m-upcoming-card">
                  ${item.thumb_url ? `<img src="${sanitize(item.thumb_url)}" alt="${sanitize(item.title)}" loading="lazy">` : ""}
                  <div>
                    <strong>${sanitize(shortMobileTitle(item))}</strong>
                    <span>${sanitize(item.sponsor_name || item.value_label || "")}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <div class="m-giveaway-info-card">
          <div class="m-giveaway-info-icon">✓</div>
          <div>
            <h3>${sanitize(t("how_it_works", "Slik fungerer det"))}</h3>
            <p>${sanitize(t("giveaway_how_it_works_text", "Delta via knappen og følg med på trekningen."))}</p>
          </div>
        </div>
      </div>
    `;
  }

  function updateCountdownOnly() {
    const mainCountdown = shell.querySelector("[data-countdown-main]");
    const metaCountdown = shell.querySelector("[data-countdown-meta]");

    const active = activeGiveaways[activeIndex];
    if (active) {
      const countdown = getCountdownState(active.countdown_end);

      if (mainCountdown) {
        mainCountdown.textContent = countdown.text;
        mainCountdown.classList.toggle("urgent", countdown.urgency);
      }

      if (metaCountdown) {
        metaCountdown.textContent = countdown.text;
      }
    }

    shell.querySelectorAll("[data-mobile-countdown]").forEach(el => {
      const index = Number(el.dataset.mobileCountdown || 0);
      const item = activeGiveaways[index];
      if (!item) return;
      el.textContent = shortCountdown(getCountdownState(item.countdown_end).text);
    });
  }

  let cachedRows = [];
  let giveawaysGloballyEnabled = false;
  let activeIndex = 0;
  let timerStarted = false;
  let activeGiveaways = [];
  let upcomingGiveaways = [];

  function bindMobileInteractions() {
    const slider = shell.querySelector("#m-giveaway-slider");
    if (!slider) return;

    const dots = Array.from(shell.querySelectorAll("[data-mobile-dot]"));

    function setActiveDot(index) {
      activeIndex = index;
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    }

    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        const index = Number(dot.dataset.mobileDot || 0);
        const card = shell.querySelector(`[data-mobile-giveaway-card="${index}"]`);
        if (card) {
          slider.scrollTo({ left: card.offsetLeft - slider.offsetLeft, behavior: "smooth" });
        }
        setActiveDot(index);
      });
    });

    slider.addEventListener("scroll", () => {
      const cards = Array.from(shell.querySelectorAll("[data-mobile-giveaway-card]"));
      if (!cards.length) return;

      const sliderLeft = slider.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - slider.offsetLeft - sliderLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveDot(closestIndex);
    }, { passive: true });

    const upcomingToggle = shell.querySelector("[data-mobile-upcoming-toggle]");
    const upcomingRow = shell.querySelector("[data-mobile-upcoming-row]");

    if (upcomingToggle && upcomingRow) {
      upcomingToggle.addEventListener("click", () => {
        upcomingRow.classList.toggle("is-expanded");
        const expanded = upcomingRow.classList.contains("is-expanded");
        upcomingToggle.textContent = expanded ? t("show_less", "Vis færre") : t("see_all", "Se alle");
      });
    }
  }

  function renderFromRows(rows) {
    cachedRows = rows;

    if (!giveawaysGloballyEnabled) {
      renderComingSoon();
      return;
    }

    const allGiveaways = rows
      .map(normalizeRow)
      .filter(item => item.display_status !== "hidden")
      .filter(item => item.display_status !== "ended")
      .sort((a, b) => a.sort_order - b.sort_order);

    const activeList = allGiveaways.filter(item => item.display_status === "active");
    const upcomingList = allGiveaways.filter(item => item.display_status === "upcoming");

    activeGiveaways = activeList;
    upcomingGiveaways = upcomingList;
    shell.classList.remove("is-loading");

    if (!activeList.length) {
      renderComingSoon();
      return;
    }

    if (activeIndex >= activeList.length) {
      activeIndex = 0;
    }

    function rerender() {
      shell.classList.remove("is-empty", "is-error", "is-coming-soon");

      if (isMobile()) {
        shell.innerHTML = renderMobileModule(activeList, upcomingList, activeIndex);
        bindMobileInteractions();
        return;
      }

      shell.innerHTML = renderModule(activeList, activeIndex);

      shell.querySelectorAll("[data-giveaway-index]").forEach(btn => {
        btn.addEventListener("click", () => {
          activeIndex = Number(btn.dataset.giveawayIndex || 0);
          rerender();
        });
      });
    }

    rerender();

    if (!timerStarted) {
      timerStarted = true;
      setInterval(() => {
        if (!document.body.contains(shell)) return;
        if (!giveawaysGloballyEnabled || !activeGiveaways.length) return;
        updateCountdownOnly();
      }, 1000);
    }
  }

   try {
    const fetchSheet = window.BrandRadarSheets?.fetchWithCache;

    const [rows, settingsRows] = await Promise.all([
      fetchSheet
        ? fetchSheet(giveawaysUrl, "giveaways_rows")
        : fetch(giveawaysUrl).then(r => r.json()),

      fetchSheet
        ? fetchSheet(settingsUrl, "giveaways_settings")
        : fetch(settingsUrl).then(r => r.json()).catch(() => [])
    ]);
     
    giveawaysGloballyEnabled = parseBool(
      getSetting(settingsRows, "giveaways_enabled", "FALSE")
    );

    renderFromRows(rows);

    window.addEventListener("brandradar:languagechange", () => {
      activeIndex = 0;
      renderFromRows(cachedRows);
    });

    window.addEventListener("resize", () => {
      activeIndex = 0;
      renderFromRows(cachedRows);
    });
  } catch (error) {
    console.error("Giveaways error:", error);
    shell.classList.remove("is-loading");
    shell.classList.add("is-error");
    shell.innerHTML = `<p>${t("could_not_load_giveaways", "Kunne ikke laste giveaways akkurat nå.")}</p>`;
  }
});
