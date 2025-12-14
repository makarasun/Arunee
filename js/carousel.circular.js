/* =========================================================
   Circular Carousel (DOM)
   - Infinite loop (no auto-rotate)
   - Swipe/drag to rotate
   - Mobile tuned
   Targets:
     #ring.ring
     children: button.card
   ========================================================= */

(() => {
  const ring = document.querySelector("#ring.ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  if (cards.length === 0) return;

  // ========= TUNABLES (มือถือ) =========
  // ถ้าจะให้ชิดขึ้น: ลด SPREAD (เช่น 0.75)
  // ถ้าจะให้ไม่ล้น/ลึกน้อยลง: ลด RADIUS (เช่น 150)
  const RADIUS = 170;
  const SPREAD = 0.82;

  // drag sensitivity
  const DRAG_SPEED = 0.008;

  // ========= helpers =========
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ========= state =========
  const n = cards.length;
  const step = ((Math.PI * 2) / n) * SPREAD; // smaller = tighter
  let baseAngle = 0;
  let isDown = false;
  let startX = 0;
  let startAngle = 0;

  function render() {
    // normalize angle for stability
    const twoPI = Math.PI * 2;
    const norm = (a) => {
      a = a % twoPI;
      if (a < -Math.PI) a += twoPI;
      if (a > Math.PI) a -= twoPI;
      return a;
    };

    // compute each card transform
    cards.forEach((card, i) => {
      const a = norm(baseAngle + i * step);

      // circle coordinates (x for left-right, z for depth)
      const x = Math.sin(a) * RADIUS;
      const z = -Math.cos(a) * RADIUS; // front = smaller z (less negative)

      // depth factor: front=1, back=0
      const depth = (Math.cos(a) + 1) / 2;

      // scale / blur / opacity tuned for “out focus”
      const scale = lerp(0.72, 1.0, depth);
      const blur = lerp(3.2, 0.0, depth);
      const opacity = clamp(lerp(0.45, 1.0, depth), 0.2, 1.0);
      const zIndex = Math.round(1000 * depth);

      card.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      card.style.filter = `blur(${blur.toFixed(2)}px)`;
      card.style.opacity = `${opacity}`;
      card.style.zIndex = `${zIndex}`;

      // state class
      card.classList.toggle("is-front", depth > 0.86);
      card.classList.toggle("is-back", depth < 0.35);
    });
  }

  // ========= pointer events =========
  function onDown(clientX) {
    isDown = true;
    startX = clientX;
    startAngle = baseAngle;
  }

  function onMove(clientX) {
    if (!isDown) return;
    const dx = clientX - startX;
    baseAngle = startAngle + dx * DRAG_SPEED;
    render();
  }

  function onUp() {
    isDown = false;
  }

  ring.addEventListener("pointerdown", (e) => {
    ring.setPointerCapture?.(e.pointerId);
    onDown(e.clientX);
  });

  ring.addEventListener("pointermove", (e) => onMove(e.clientX));
  ring.addEventListener("pointerup", onUp);
  ring.addEventListener("pointercancel", onUp);
  ring.addEventListener("pointerleave", onUp);

  // prevent accidental click when dragging
  let moved = 0;
  ring.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    moved += Math.abs(e.movementX || 0);
  });
  ring.addEventListener("click", (e) => {
    if (moved > 8) {
      e.preventDefault();
      e.stopPropagation();
    }
    moved = 0;
  }, true);

  // initial render (นิ่งก่อน ให้ user ปัดเอง)
  render();
})();
