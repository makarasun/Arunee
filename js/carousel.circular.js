/* ==================================================
   Circular Carousel – Isolated Module
   Safe to use with existing script.js
   ================================================== */

(function () {
  const ring = document.querySelector(".carousel-ring");
  const cards = Array.from(document.querySelectorAll(".carousel-card"));
  if (!ring || cards.length === 0) return;

  const COUNT = cards.length;
  const RADIUS = 40;
  const SPREAD = 2;

  let offset = 0;
  let dragging = false;
  let startX = 0;

  function layout() {
    cards.forEach((card, i) => {
      const idx = (i + offset) % COUNT;
      const angle = (idx / COUNT) * Math.PI * 2;

      const x = Math.sin(angle) * SPREAD;
      const z = Math.cos(angle) * RADIUS;

      const scale = 0.38 + (z / RADIUS) * 0.12;
      const opacity = 0.4 + (z / RADIUS) * 0.6;
      const blur = Math.max(0, 2 - (z / RADIUS) * 2);

      card.style.transform = `
        translate(-50%, -50%)
        translate3d(${x}px, 0, ${z}px)
        scale(${scale})
      `;
      card.style.opacity = opacity;
      card.style.filter = `blur(${blur}px)`;
      card.style.zIndex = Math.round(z);
    });
  }

  function dragStart(x) {
    dragging = true;
    startX = x;
  }

  function dragMove(x) {
    if (!dragging) return;
    const dx = x - startX;
    startX = x;

    if (Math.abs(dx) > 12) {
      offset = (offset + (dx < 0 ? 1 : -1) + COUNT) % COUNT;
      layout();
    }
  }

  function dragEnd() {
    dragging = false;
  }

  // Touch
  ring.addEventListener("touchstart", e =>
    dragStart(e.touches[0].clientX)
  );
  ring.addEventListener("touchmove", e =>
    dragMove(e.touches[0].clientX)
  );
  ring.addEventListener("touchend", dragEnd);

  // Mouse
  ring.addEventListener("mousedown", e =>
    dragStart(e.clientX)
  );
  window.addEventListener("mousemove", e =>
    dragMove(e.clientX)
  );
  window.addEventListener("mouseup", dragEnd);

  // Click to focus
  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      offset = (COUNT - i) % COUNT;
      layout();
    });
  });

  layout();
})();





