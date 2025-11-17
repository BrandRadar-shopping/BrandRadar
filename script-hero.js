// ===============================================
// BrandRadar – Ultra Premium Hero Slider v3
// Auto-rotate, dots, arrows, parallax + radar feel
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".hero-slider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".slide"));
  const dotsContainer = slider.querySelector(".dots");
  const prevBtn = slider.querySelector(".nav.prev");
  const nextBtn = slider.querySelector(".nav.next");

  if (!slides.length) return;

  // --- Build dots dynamically ---
  dotsContainer.innerHTML = "";
  slides.forEach((_, idx) => {
    const dot = document.createElement("span");
    if (idx === 0) dot.classList.add("active");
    dot.dataset.index = idx;
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.querySelectorAll("span"));

  let current = 0;
  let autoTimer = null;
  const AUTO_TIME = 7000; // 7 sek mellom hver slide

  function goTo(index) {
    if (index === current) return;

    slides[current].classList.remove("active");
    dots[current].classList.remove("active");

    current = (index + slides.length) % slides.length;

    slides[current].classList.add("active");
    dots[current].classList.add("active");
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

  // --- Events: arrows & dots ---
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

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const idx = Number(dot.dataset.index || 0);
      goTo(idx);
      startAuto();
    });
  });

  // --- Pause på hover for bedre UX ---
  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);

  // --- Parallax-effekt (musbevegelse) ---
  slider.addEventListener("mousemove", (e) => {
    const rect = slider.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;

    const maxMoveX = 12; // px
    const maxMoveY = 8;  // px

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

    const visible = Math.min(Math.max(1 - (Math.max(rect.top, 0) / windowH) * 0.5, 0.5), 1);
    slider.style.opacity = visible;
  }

  window.addEventListener("scroll", handleScroll, { passive: true });

  // Start
  slides[0].classList.add("active");
  startAuto();
  handleScroll();
});


