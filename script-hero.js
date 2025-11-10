// ============================================
// 🎬 HERO SLIDER SCRIPT (BrandRadar)
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".hero-slider .slide");
  const prev = document.querySelector(".hero-slider .prev");
  const next = document.querySelector(".hero-slider .next");
  const dotsContainer = document.querySelector(".hero-slider .dots");
  let index = 0;
  let timer;

  // Lag dot-navigasjon
  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => showSlide(i));
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll("span");

  const showSlide = (i) => {
    slides[index].classList.remove("active");
    dots[index].classList.remove("active");
    index = (i + slides.length) % slides.length;
    slides[index].classList.add("active");
    dots[index].classList.add("active");
    resetTimer();
  };

  const nextSlide = () => showSlide(index + 1);
  const prevSlide = () => showSlide(index - 1);

  next.addEventListener("click", nextSlide);
  prev.addEventListener("click", prevSlide);

  const resetTimer = () => {
    clearInterval(timer);
    timer = setInterval(nextSlide, 6000); // 6 sek intervall
  };

  resetTimer();
});
