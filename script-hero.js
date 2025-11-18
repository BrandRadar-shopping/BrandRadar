// ===============================================
// BrandRadar – Ultra Premium Hero Slider (Sheet Powered)
// Henter slides fra Google Sheet + automatisk bygging
// ===============================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🎨 HERO: Initialiserer…");

  const SHEET_ID = "1NmFQi5tygEvjmsfqxtOuo5mgCOXzniF5GtTKXoGpNEY";
  const SHEET_NAME = "HeroSlides";

  const slider = document.querySelector(".hero-slider");
  const slidesContainer = slider.querySelector(".slides");
  const dotsContainer = slider.querySelector(".dots");
  const prevBtn = slider.querySelector(".nav.prev");
  const nextBtn = slider.querySelector(".nav.next");

  try {
    const raw = await fetch(`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`).then(r => r.json());

    console.log("📄 RAW SHEET DATA:", raw);

    const slidesData = raw
      .filter(s => s.image_url && s.image_url.startsWith("http"))
      .map(s => ({
        img: s.image_url.trim(),
        title: s.title?.trim() || "",
        subtitle: s.subtitle?.trim() || "",
        link: s.link?.trim() || "",
        btn: s.button_text?.trim() || "Utforsk",
        active: (s.active || "").toLowerCase() === "true"
      }));

    console.log("🎯 PARSED SLIDES:", slidesData);

    if (!slidesData.length) {
      slidesContainer.innerHTML = "<p>Ingen slides tilgjengelig.</p>";
      return;
    }

    // --- Build slides ---
    slidesContainer.innerHTML = slidesData
      .map(
        (s, i) => `
      <div class="slide ${i === 0 ? "active" : ""}" 
        style="background-image:url('${s.img}')">
        <div class="slide-content">
          ${s.title ? `<h1>${s.title}</h1>` : ""}
          ${s.subtitle ? `<p>${s.subtitle}</p>` : ""}
          ${s.link ? `<a href="${s.link}" class="btn">${s.btn}</a>` : ""}
        </div>
      </div>`
      )
      .join("");

    const slides = [...slider.querySelectorAll(".slide")];

    // --- Build dots ---
    dotsContainer.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("span");
      if (i === 0) dot.classList.add("active");
      dot.dataset.index = i;
      dotsContainer.appendChild(dot);
    });

    const dots = [...dotsContainer.querySelectorAll("span")];

    let current = 0;

    function goTo(i) {
      slides[current].classList.remove("active");
      dots[current].classList.remove("active");

      current = (i + slides.length) % slides.length;

      slides[current].classList.add("active");
      dots[current].classList.add("active");
    }

    // Arrows
    nextBtn.onclick = () => goTo(current + 1);
    prevBtn.onclick = () => goTo(current - 1);

    // Dots
    dots.forEach(dot =>
      dot.addEventListener("click", () => goTo(Number(dot.dataset.index)))
    );

    console.log("✅ HERO SLIDER KLAR!");

  } catch (err) {
    console.error("❌ FEIL I HERO SLIDER:", err);
  }
});


