// ===============================================
// BrandRadar – Ultra Premium Hero Slider v4
// Henter slides fra Google Sheet (HeroSlides)
// Auto-rotate, dots, arrows, parallax + radar feel
// ===============================================

document.addEventListener("DOMContentLoaded", async () => {
  const slider = document.querySelector(".hero-slider");
  if (!slider) return;

  const slidesWrapper = slider.querySelector(".slides");
  const dotsContainer = slider.querySelector(".dots");
  const prevBtn = slider.querySelector(".nav.prev");
  const nextBtn = slider.querySelector(".nav.next");

  const SHEET_ID = "1NmFQi5tygEvjmsfqxtOuo5mgCOXzniF5GtTKXoGpNEY";
  const SHEET_NAME = "HeroSlides";

  let slides = [];
  let dots = [];
  let current = 0;
  let autoTimer = null;
  const AUTO_TIME = 7000; // 7 sek mellom hver slide

  try {
    const res = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`);
    const raw = await res.json();
    console.log("✅ HeroSlides rådata:", raw);

    // Rens og normaliser data
    const slidesData = raw
      .filter(row => row && row.image_url && row.image_url.trim().startsWith("http"))
      .map(row => ({
        image_url: (row.image_url || "").trim(),
        title: (row.title || "").trim(),
        subtitle: (row.subtitle || "").trim(),
        link: (row.link || "").trim(),
        button_text: ((row.button_text || "").trim()) || "Les mer",
        active: String(row.active || "").toLowerCase() === "true"
      }));

    console.log("✅ HeroSlides normalisert:", slidesData);

    if (!slidesData.length) {
      console.warn("⚠️ Ingen gyldige slides funnet i HeroSlides-arket.");
      return;
    }

    // Bygg HTML for slides
    const hasExplicitActive = slidesData.some(s => s.active);

    slidesWrapper.innerHTML = slidesData
      .map((s, i) => {
        const isActive = hasExplicitActive ? s.active : i === 0;
        return `
          <div class="slide${isActive ? " active" : ""}"
               style="background-image:url('${s.image_url}');">
            <div class="slide-content">
              ${s.title ? `<h1>${s.title}</h1>` : ""}
              ${s.subtitle ? `<p>${s.subtitle}</p>` : ""}
              ${
                s.link
                  ? `<a href="${s.link}" class="btn" target="_blank" rel="noopener">
                       ${s.button_text}
                     </a>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    // Referanser til faktiske slide-elementer
    slides = Array.from(slider.querySelectorAll(".slide"));

    if (!slides.length) {
      console.warn("⚠️ Ingen .slide-elementer funnet etter bygging.");
      return;
    }

    // Finn startindeks
    current = slides.findIndex(s => s.classList.contains("active"));
    if (current < 0) {
      current = 0;
      slides[0].classList.add("active");
    }

    // Bygg dots basert på antall slides
    dotsContainer.innerHTML = "";
    slides.forEach((_, idx) => {
      const dot = document.createElement("span");
      dot.dataset.index = idx;
      if (idx === current) dot.classList.add("active");
      dotsContainer.appendChild(dot);
    });
    dots = Array.from(dotsContainer.querySelectorAll("span"));

    // --- Slider logikk ---
    function goTo(index) {
      if (!slides.length) return;
      const newIndex = (index + slides.length) % slides.length;
      if (newIndex === current) return;

      slides[current].classList.remove("active");
      if (dots[current]) dots[current].classList.remove("active");

      current = newIndex;

      slides[current].classList.add("active");
      if (dots[current]) dots[current].classList.add("active");
    }

    function next() {
      goTo(current + 1);
    }

    function prev() {
      goTo(current - 1);
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(next, AUTO_TIME);
    }

    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    }

    // Piler
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        prev();
        startAuto();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        next();
        startAuto();
      });
    }

    // Dots-klikk
    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        const idx = Number(dot.dataset.index || 0);
        goTo(idx);
        startAuto();
      });
    });

    // Pause på hover
    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);

    // --- Parallax-effekt ---
    slider.addEventListener("mousemove", (e) => {
      const rect = slider.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;

      const maxMoveX = 12;
      const maxMoveY = 8;

      const x = relX * maxMoveX;
      const y = relY * maxMoveY;

      slider.style.setProperty("--parallax-x", `${x}px`);
      slider.style.setProperty("--parallax-y", `${y}px`);
    });

    slider.addEventListener("mouseleave", () => {
      slider.style.setProperty("--parallax-x", "0px");
      slider.style.setProperty("--parallax-y", "0px");
    });

    // --- Scroll fade (subtil) ---
    function handleScroll() {
      const rect = slider.getBoundingClientRect();
      const windowH = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.min(
        Math.max(1 - (Math.max(rect.top, 0) / windowH) * 0.5, 0.5),
        1
      );
      slider.style.opacity = visible;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Start
    startAuto();
    handleScroll();
    console.log("✅ Hero slider klar.");
  } catch (err) {
    console.error("❌ Klarte ikke hente HeroSlides:", err);
  }
});


