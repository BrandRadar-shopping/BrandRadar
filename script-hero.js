// ============================================
// 🧭 HERO SLIDER fra Google Sheet (BrandRadar)
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
const SHEET_ID = "1NmFQi5tygEvjmsfqxtOuo5mgCOXzniF5GtTKXoGpNEY"; 
const SHEET_NAME = "HeroSlides";
 

  const sliderContainer = document.querySelector(".hero-slider .slides");
  const dotsContainer = document.querySelector(".hero-slider .dots");
  const prev = document.querySelector(".hero-slider .prev");
  const next = document.querySelector(".hero-slider .next");

  try {
    const slidesData = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`)
      .then(r => r.json());

    if (!slidesData.length) {
      sliderContainer.innerHTML = "<p>Ingen slides tilgjengelig.</p>";
      return;
    }

    // Lag slides dynamisk
    sliderContainer.innerHTML = slidesData
      .filter(s => s.image_url)
      .map((s, i) => `
        <div class="slide${s.active?.toLowerCase() === 'true' || i === 0 ? ' active' : ''}" 
             style="background-image:url('${s.image_url}');">
          <div class="slide-content">
            <h1>${s.title || ''}</h1>
            <p>${s.subtitle || ''}</p>
            ${s.link ? `<a href="${s.link}" class="btn">${s.button_text || 'Les mer'}</a>` : ''}
          </div>
        </div>
      `)
      .join("");

    // Dot-navigasjon
    const slides = document.querySelectorAll(".hero-slider .slide");
    slides.forEach((_, i) => {
      const dot = document.createElement("span");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => showSlide(i));
      dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll("span");

    let index = slidesData.findIndex(s => s.active?.toLowerCase() === "true");
    if (index < 0) index = 0;
    let timer;

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
      timer = setInterval(nextSlide, 6000);
    };

    resetTimer();
  } catch (err) {
    console.error("❌ Klarte ikke hente HeroSlides:", err);
  }
});
