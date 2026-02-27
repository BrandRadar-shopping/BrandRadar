// ===============================================
// BrandRadar – Hero Slider v5
// Touch: horizontal scroll + dots scrollTo()
// Desktop: active class + optional arrows
// ===============================================

document.addEventListener("DOMContentLoaded", async () => {
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

  try {
    const res = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`);
    const raw = await res.json();

    const slidesData = raw
      .filter(row => row.image_url && row.image_url.trim().startsWith("http"))
      .map(row => ({
        image_url: row.image_url.trim(),
        title: (row.title || "").trim(),
        subtitle: (row.subtitle || "").trim(),
        link: (row.link || "").trim(),
        button_text: (row.button_text || "").trim() || "Utforsk",
        active: String(row.active || "").toLowerCase() === "true"
      }));

    if (!slidesData.length) {
      slidesContainer.innerHTML =
        "<p style='text-align:center;padding:4rem 1rem;'>Ingen hero-slides er konfigurert ennå.</p>";
      return;
    }

    const anyActive = slidesData.some(s => s.active);

    // Build slides
    slidesContainer.innerHTML = slidesData
      .map((s, idx) => `
        <div class="slide${
          (anyActive && s.active) || (!anyActive && idx === 0) ? " active" : ""
        }" style="background-image:url('${s.image_url}');">
          <div class="slide-content">
            ${s.title ? `<h1>${escapeHtml(s.title)}</h1>` : ""}
            ${s.subtitle ? `<p>${escapeHtml(s.subtitle)}</p>` : ""}
            ${s.link ? `<a href="${s.link}" class="btn">${escapeHtml(s.button_text)}</a>` : ""}
          </div>
        </div>
      `)
      .join("");

    const slides = Array.from(slider.querySelectorAll(".slide"));
    if (!slides.length) return;

    // Build dots (buttons)
    dotsContainer.innerHTML = "";
    slides.forEach((_, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dot";
      btn.dataset.index = String(idx);
      btn.setAttribute("aria-label", `Gå til slide ${idx + 1}`);
      dotsContainer.appendChild(btn);
    });

    const dots = Array.from(dotsContainer.querySelectorAll("button.dot"));

    // Current index from active
    let current = slides.findIndex(s => s.classList.contains("active"));
    if (current === -1) current = 0;

    // --- helpers ---
    function setActive(index) {
      index = (index + slides.length) % slides.length;
      current = index;

      slides.forEach(s => s.classList.remove("active"));
      dots.forEach(d => d.classList.remove("active"));

      slides[current].classList.add("active");
      if (dots[current]) dots[current].classList.add("active");
    }

    function scrollToSlide(index) {
      index = (index + slides.length) % slides.length;

      const target = slides[index];
      if (!target) return;

      // Scroll container so that target aligns nicely.
      // Works best with your CSS where slides are “card-style” in a horizontal scroller.
      const left = target.offsetLeft - 12; // matcher padding: 12px
      slidesContainer.scrollTo({ left, behavior: "smooth" });

      setActive(index);
    }

    // Determine initial active
    setActive(current);

    // --- Dots click ---
    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        const idx = Number(dot.dataset.index || 0);
        if (isTouchMode) {
          scrollToSlide(idx);
        } else {
          // Desktop: simple active switch
          setActive(idx);
        }
        startAuto();
      });
    });

    // --- Arrows ---
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

    if (prevBtn) prevBtn.addEventListener("click", () => { prev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { next(); startAuto(); });

    // --- Auto play ---
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

    // Pause on hover (desktop only)
    if (!isTouchMode) {
      slider.addEventListener("mouseenter", stopAuto);
      slider.addEventListener("mouseleave", startAuto);
    }

    // --- Sync active dot when user swipes/scrolls (touch only) ---
    if (isTouchMode) {
      let rafId = null;

      const onScroll = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const containerRect = slidesContainer.getBoundingClientRect();
          const centerX = containerRect.left + containerRect.width / 2;

          // Find slide whose center is closest to container center
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

    // Start
    startAuto();

    // --- Util ---
    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    console.log("✅ Hero slider v5 klar.");
  } catch (err) {
    console.error("❌ Klarte ikke laste HeroSlides:", err);
  }
});


