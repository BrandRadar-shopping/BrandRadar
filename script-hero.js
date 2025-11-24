// ===============================================
// BrandRadar – Hero Slider v4
// Henter slides fra Google Sheet + premium animasjon
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

  try {
    const res = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`);
    const raw = await res.json();
    console.log("✅ HeroSlides rådata:", raw);

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

    console.log("✅ HeroSlides normalisert:", slidesData);

    if (!slidesData.length) {
      slidesContainer.innerHTML =
        "<p style='color:white;text-align:center;padding:4rem 1rem;'>Ingen hero-slides er konfigurert ennå.</p>";
      return;
    }

    const anyActive = slidesData.some(s => s.active);

    // 🧱 Bygg HTML for slides
    slidesContainer.innerHTML = slidesData
      .map((s, idx) => `
        <div class="slide${
          (anyActive && s.active) || (!anyActive && idx === 0) ? " active" : ""
        }" style="background-image:url('${s.image_url}');">
          <div class="slide-content">
            ${s.title ? `<h1>${s.title}</h1>` : ""}
            ${s.subtitle ? `<p>${s.subtitle}</p>` : ""}
            ${s.link ? `<a href="${s.link}" class="btn">${s.button_text}</a>` : ""}
          </div>
        </div>
      `)
      .join("");

    const slides = Array.from(slider.querySelectorAll(".slide"));
    if (!slides.length) return;

    // 🔘 Bygg dots
    dotsContainer.innerHTML = "";
    slides.forEach((slide, idx) => {
      const dot = document.createElement("span");
      dot.dataset.index = idx;
      if (slide.classList.contains("active")) {
        dot.classList.add("active");
      }
      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.querySelectorAll("span"));
    if (!dots.some(d => d.classList.contains("active")) && dots[0]) {
      dots[0].classList.add("active");
      slides[0].classList.add("active");
    }

    let current = slides.findIndex(s => s.classList.contains("active"));
    if (current === -1) current = 0;

    let autoTimer = null;
    const AUTO_TIME = 7000; // 7 sekunder

    function goTo(index) {
      if (!slides.length) return;
      index = (index + slides.length) % slides.length;
      if (index === current) return;

      slides[current].classList.remove("active");
      if (dots[current]) dots[current].classList.remove("active");

      current = index;

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

    // 🎯 Piler
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

    // 🎯 Dots klikk
    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        const idx = Number(dot.dataset.index || 0);
        goTo(idx);
        startAuto();
      });
    });

    // 🧊 Pause på hover
    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);

    // 🎮 Parallax
    slider.addEventListener("mousemove", (e) => {
      const rect = slider.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;

      const maxMoveX = 12;
      const maxMoveY = 8;

      slider.style.setProperty("--parallax-x", `${relX * maxMoveX}px`);
      slider.style.setProperty("--parallax-y", `${relY * maxMoveY}px`);
    });

    slider.addEventListener("mouseleave", () => {
      slider.style.setProperty("--parallax-x", "0px");
      slider.style.setProperty("--parallax-y", "0px");
    });

    // 🌫 Scroll-fade
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
    slides[current].classList.add("active");
    if (dots[current]) dots[current].classList.add("active");
    startAuto();
    handleScroll();

    console.log("✅ Hero slider klar.");
  } catch (err) {
    console.error("❌ Klarte ikke laste HeroSlides:", err);
  }
});



