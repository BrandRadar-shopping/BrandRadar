// ===============================================
// BrandRadar – Hero Slider v6
// Fix:
// - CTA-knapp i aktiv slide er klikkbar
// - bare aktiv slide mottar pointer events
// - dots fungerer stabilt
// - språkstøtte for HeroSlides
// ===============================================

document.addEventListener("DOMContentLoaded", async () => {
  const t = window.BrandRadarLang?.t || ((key, fallback) => fallback || key);
  const currentLang = window.BrandRadarLang?.get?.() || "no";

  const slider = document.querySelector(".hero-slider");
  if (!slider) return;

  const slidesContainer = slider.querySelector(".slides");
  const dotsContainer = slider.querySelector(".dots");
  const prevBtn = slider.querySelector(".nav.prev");
  const nextBtn = slider.querySelector(".nav.next");

  if (!slidesContainer || !dotsContainer) return;

  const SHEET_ID = "1NmFQi5tygEvjmsfqxtOuo5mgCOXzniF5GtTKXoGpNEY";
  const SHEET_NAME = "HeroSlides";

  const isTouchMode = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  function getLocalized(row, baseKey) {
  const normalizedRow = {};

  Object.keys(row || {}).forEach((key) => {
    normalizedRow[String(key).trim().toLowerCase()] = row[key];
  });

  const clean = (value) => String(value || "").trim();

  if (currentLang === "en") {
    return clean(
      normalizedRow[`${baseKey}_en`] ||
      normalizedRow[`${baseKey}_english`] ||
      normalizedRow[`${baseKey} english`] ||
      normalizedRow[baseKey] ||
      ""
    );
  }

  return clean(
    normalizedRow[`${baseKey}_no`] ||
    normalizedRow[`${baseKey}_norwegian`] ||
    normalizedRow[baseKey] ||
    ""
  );
}

  try {
    const res = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`);
    const raw = await res.json();

    const slidesData = raw
      .filter(row => row.image_url && row.image_url.trim().startsWith("http"))
      .map(row => ({
        image_url: row.image_url.trim(),
        title: getLocalized(row, "title"),
        subtitle: getLocalized(row, "subtitle"),
        link: (row.link || "").trim(),
        button_text: getLocalized(row, "button_text") || t("explore", "Utforsk"),
        active: String(row.active || "").toLowerCase() === "true"
      }));

    if (!slidesData.length) {
      slidesContainer.innerHTML =
        `<p style="text-align:center;padding:4rem 1rem;">${t("no_hero_slides", "Ingen hero-slides er konfigurert ennå.")}</p>`;
      return;
    }

    const anyActive = slidesData.some(s => s.active);

    slidesContainer.innerHTML = slidesData
      .map((s, idx) => `
        <div class="slide${
          (anyActive && s.active) || (!anyActive && idx === 0) ? " active" : ""
        }" style="background-image:url('${s.image_url}');">
          <div class="slide-content">
            ${s.title ? `<h1>${escapeHtml(s.title)}</h1>` : ""}
            ${s.subtitle ? `<p>${escapeHtml(s.subtitle)}</p>` : ""}
            ${s.link ? `<a href="${escapeAttribute(s.link)}" class="btn">${escapeHtml(s.button_text)}</a>` : ""}
          </div>
        </div>
      `)
      .join("");

    const slides = Array.from(slider.querySelectorAll(".slide"));
    if (!slides.length) return;

    dotsContainer.innerHTML = "";
    slides.forEach((_, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dot";
      btn.dataset.index = String(idx);
      btn.setAttribute("aria-label", `${t("go_to_slide", "Gå til slide")} ${idx + 1}`);
      dotsContainer.appendChild(btn);
    });

    const dots = Array.from(dotsContainer.querySelectorAll(".dot"));

    let current = slides.findIndex(s => s.classList.contains("active"));
    if (current === -1) current = 0;

    function setActive(index) {
      index = (index + slides.length) % slides.length;
      current = index;

      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === current);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === current);
      });
    }

    function scrollToSlide(index) {
  index = (index + slides.length) % slides.length;
  const target = slides[index];
  if (!target) return;

  const left = target.offsetLeft;
  slidesContainer.scrollTo({ left, behavior: "smooth" });
  setActive(index);
}

    setActive(current);

    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        const idx = Number(dot.dataset.index || 0);

        if (isTouchMode) {
          scrollToSlide(idx);
        } else {
          setActive(idx);
        }

        startAuto();
      });
    });

    function next() {
      const idx = current + 1;
      if (isTouchMode) scrollToSlide(idx);
      else setActive(idx);
    }

    function prev() {
      const idx = current - 1;
      if (isTouchMode) scrollToSlide(idx);
      else setActive(idx);
    }

    if (prevBtn) prevBtn.addEventListener("click", () => {
      prev();
      startAuto();
    });

    if (nextBtn) nextBtn.addEventListener("click", () => {
      next();
      startAuto();
    });

    let autoTimer = null;
    const AUTO_TIME = 7000;

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(next, AUTO_TIME);
    }

    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    }

    if (!isTouchMode) {
      slider.addEventListener("mouseenter", stopAuto);
      slider.addEventListener("mouseleave", startAuto);
    }

    if (isTouchMode) {
      let rafId = null;

      const onScroll = () => {
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const containerRect = slidesContainer.getBoundingClientRect();
          const centerX = containerRect.left + containerRect.width / 2;

          let bestIdx = 0;
          let bestDist = Infinity;

          slides.forEach((slide, idx) => {
            const r = slide.getBoundingClientRect();
            const slideCenter = r.left + r.width / 2;
            const dist = Math.abs(slideCenter - centerX);

            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = idx;
            }
          });

          if (bestIdx !== current) setActive(bestIdx);
        });
      };

      slidesContainer.addEventListener("scroll", onScroll, { passive: true });
    }

    startAuto();

    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function escapeAttribute(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    console.log("✅ Hero slider v6 klar.");
  } catch (err) {
    console.error("❌", t("could_not_load_hero_slides", "Klarte ikke laste HeroSlides:"), err);
  }
});
