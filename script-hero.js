// ======================================================
// BrandRadar – Hero Slider (Dynamic from Google Sheets)
// Ultra Premium v3 + radar + parallax + fade + auto-rotate
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🌟 HeroSlider: Initializing...");

  const SHEET_ID = "1NmFQi5tygEvjmsfqxtOuo5mgCOXzniF5GtTKXoGpNEY"; 
  const SHEET_NAME = "HeroSlides";

  const slider = document.querySelector(".hero-slider");
  const slidesContainer = slider?.querySelector(".slides");
  const dotsContainer = slider?.querySelector(".dots");
  const prevBtn = slider?.querySelector(".nav.prev");
  const nextBtn = slider?.querySelector(".nav.next");

  if (!slider || !slidesContainer) {
    console.warn("❌ Hero slider not found in DOM");
    return;
  }

  // ------------------------------------------------------
  // 1. HENT DATA FRA GOOGLE SHEET
  // ------------------------------------------------------
  let slidesData = [];
  try {
    const raw = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`)
      .then(r => r.json());

    slidesData = raw
      .filter(s => s.image_url && s.image_url.startsWith("http"))
      .map(s => ({
        image: s.image_url.trim(),
        title: s.title?.trim() || "",
        subtitle: s.subtitle?.trim() || "",
        link: s.link?.trim() || "",
        button: s.button_text?.trim() || "Les mer",
        active: String(s.active || "").toLowerCase() === "true"
      }));

    if (!slidesData.length) {
      slidesContainer.innerHTML = "<p style='color:white;text-align:center;'>Ingen slides funnet</p>";
      return;
    }
  } catch (err) {
    console.error("❌ Klarte ikke hente slides:", err);
    return;
  }

  // ------------------------------------------------------
  // 2. GENERER HTML SLIDES
  // ------------------------------------------------------
  slidesContainer.innerHTML = slidesData.map((s, i) => {
    return `
      <div class="slide ${s.active || i === 0 ? "active" : ""}"
           style="background-image:url('${s.image}')">
        <div class="slide-content">
          ${s.title ? `<h1>${s.title}</h1>` : ""}
          ${s.subtitle ? `<p>${s.subtitle}</p>` : ""}
          ${s.link ? `<a href="${s.link}" class="btn">${s.button}</a>` : ""}
        </div>
      </div>
    `;
  }).join("");

  const slides = [...slider.querySelectorAll(".slide")];

  // ------------------------------------------------------
  // 3. DOT NAVIGATION
  // ------------------------------------------------------
  dotsContainer.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    if (slides[i].classList.contains("active")) dot.classList.add("active");
    dot.dataset.index = i;
    dotsContainer.appendChild(dot);
  });

  const dots = [...dotsContainer.querySelectorAll("span")];

  // ------------------------------------------------------
  // 4. SLIDE LOGIKK
  // ------------------------------------------------------
  let current = slides.findIndex(s => s.classList.contains("active"));
  if (current === -1) current = 0;
  let timer = null;
  const AUTO_TIME = 7000;

  const goTo = (i) => {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");

    current = (i + slides.length) % slides.length;

    slides[current].classList.add("active");
    dots[current].classList.add("active");

    restartTimer();
  };

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // ------------------------------------------------------
  // 5. AUTO ROTATE
  // ------------------------------------------------------
  const restartTimer = () => {
    clearInterval(timer);
    timer = setInterval(next, AUTO_TIME);
  };

  restartTimer();

  // ------------------------------------------------------
  // 6. DOT / ARROW EVENTS
  // ------------------------------------------------------
  dots.forEach(dot =>
    dot.addEventListener("click", () => goTo(Number(dot.dataset.index)))
  );

  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);

  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", restartTimer);

  // ------------------------------------------------------
  // 7. PARALLAX-EFFEKT
  // ------------------------------------------------------
  slider.addEventListener("mousemove", e => {
    const rect = slider.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;

    slider.style.setProperty("--parallax-x", `${x}px`);
    slider.style.setProperty("--parallax-y", `${y}px`);
  });

  slider.addEventListener("mouseleave", () => {
    slider.style.setProperty("--parallax-x", `0px`);
    slider.style.setProperty("--parallax-y", `0px`);
  });

  // ------------------------------------------------------
  // 8. SUBTIL SCROLL FADE
  // ------------------------------------------------------
  const handleScroll = () => {
    const rect = slider.getBoundingClientRect();
    const windowH = window.innerHeight;
    const visible = Math.min(Math.max(1 - (Math.max(rect.top, 0) / windowH) * 0.5, 0.5), 1);
    slider.style.opacity = visible;
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  console.log("🌟 HeroSlider: Ready.");
});


