/* =========================================================
   CIRCULAR CAROUSEL (INFINITE, NO AUTO-SPIN)
   - Mobile-first tuning
   - Works with:
     #ring.ring > button.card
     OR .carousel-ring > .carousel-card
   - Drag left/right to rotate (infinite)
   - No snap, no auto
   - Fixes opacity negative via clamp()
========================================================= */

(() => {
  const ring =
    document.querySelector("#ring") ||
    document.querySelector(".carousel-ring") ||
    document.querySelector(".ring");

  if (!ring) return;

  const cards = Array.from(
    ring.querySelectorAll(".card, .carousel-card")
  );

  if (!cards.length) return;

  // ---------------------------
  // Mobile-first tuning
  // ---------------------------
  const isMobile = matchMedia("(max-width: 767px)").matches;

  // Radius controls how "circular" / depth feel is.
  // Smaller radius -> tighter cluster.
  let RADIUS_X = isMobile ? 120 : 170;
  let RADIUS_Z = isMobile ? 260 : 340;

  // SPREAD controls how close cards are around the front.
  // 1.0 = full step, 0.6 = tighter clustering
  let SPREAD = isMobile ? 0.68 : 0.78;

  // Drag sensitivity (pixels -> index movement)
  let DRAG_SENS = isMobile ? 280 : 360;

  // Blur / scale limits
  const SCALE_MIN = isMobile ? 0.56 : 0.52;
  const SCALE_MAX = 1.0;
  const BLUR_MAX = isMobile ? 7.5 : 10;
  const OPACITY_MIN = isMobile ? 0.45 : 0.40;
  const OPACITY_MAX = 1.0;

  // ---------------------------
  // Helpers
  // ---------------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // wrap value into [0, n)
  const wrap = (v, n) => {
    let x = v % n;
    if (x < 0) x += n;
    return x;
  };

  // convert index-relative into shortest distance [-n/2, n/2]
  const shortestDelta = (i, pos, n) => {
    let d = i - pos;
    d = ((d + n / 2) % n) - n / 2;
    return d;
  };

  // ---------------------------
  // State
  // ---------------------------
  const N = cards.length;
  const step = (Math.PI * 2) / N;

  let pos = 0;            // float index position
  let isDown = false;
  let startX = 0;
  let startPos = 0;
  let lastX = 0;
  let lastT = 0;
  let v = 0;              // velocity (for gentle inertia)
  let raf = null;

  // Prevent default drag image behavior on buttons
  cards.forEach((c) => {
    c.setAttribute("draggable", "false");
  });

  // ---------------------------
  // Layout / render
  // ---------------------------
  function render() {
    const p = wrap(pos, N);

    for (let i = 0; i < N; i++) {
      const card = cards[i];
      const d = shortestDelta(i, p, N);         // [-N/2..N/2]
      const a = d * step * SPREAD;              // effective angle

      // Circle in XZ plane
      const x = Math.sin(a) * RADIUS_X;
      const z = Math.cos(a) * RADIUS_Z;

      // Normalize depth: front z ~ +RADIUS_Z, back z ~ -RADIUS_Z
      // Convert to [0..1] where 1 = front
      const depth01 = clamp((z / RADIUS_Z + 1) / 2, 0, 1);

      // Scale & blur: front = big/sharp, back = small/blur
      const scale = lerp(SCALE_MIN, SCALE_MAX, depth01);
      const blur = lerp(BLUR_MAX, 0, depth01);
      const opacity = lerp(OPACITY_MIN, OPACITY_MAX, depth01);

      // zIndex: front higher
      const zIndex = Math.round(depth01 * 1000);

      // Apply transform (centered)
      card.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) scale(${scale.toFixed(4)})`;

      // IMPORTANT: clamp blur/opacity to valid ranges
      card.style.filter = `blur(${clamp(blur, 0, BLUR_MAX).toFixed(2)}px)`;
      card.style.opacity = String(clamp(opacity, 0, 1));
      card.style.zIndex = String(zIndex);

      // state classes
      card.classList.toggle("is-front", depth01 > 0.84);
      card.classList.toggle("is-back", depth01 < 0.35);
    }
  }

  // ---------------------------
  // Pointer / touch handling
  // ---------------------------
  function onDown(clientX) {
    isDown = true;
    startX = clientX;
    startPos = pos;
    lastX = clientX;
    lastT = performance.now();
    v = 0;

    ring.classList.add("is-dragging");

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  }

  function onMove(clientX) {
    if (!isDown) return;

    const dx = clientX - startX;
    pos = startPos - dx / DRAG_SENS; // drag left -> rotate right feel

    // velocity estimate
    const t = performance.now();
    const dt = Math.max(1, t - lastT);
    const ddx = clientX - lastX;
    v = (-ddx / DRAG_SENS) / (dt / 16.67); // normalized per-frame

    lastX = clientX;
    lastT = t;

    render();
  }

  function onUp() {
    if (!isDown) return;
    isDown = false;

    ring.classList.remove("is-dragging");

    // gentle inertia (no snap)
    const friction = 0.92;
    const minV = 0.001;

    function inertia() {
      if (Math.abs(v) < minV) {
        v = 0;
        render();
        return;
      }
      pos += v;
      v *= friction;
      render();
      raf = requestAnimationFrame(inertia);
    }

    raf = requestAnimationFrame(inertia);
  }

  // Pointer events (best for mobile + desktop)
  ring.addEventListener("pointerdown", (e) => {
    // Only left button or touch/pen
    if (e.pointerType === "mouse" && e.button !== 0) return;
    ring.setPointerCapture?.(e.pointerId);
    onDown(e.clientX);
  });

  ring.addEventListener("pointermove", (e) => {
    onMove(e.clientX);
  });

  ring.addEventListener("pointerup", () => onUp());
  ring.addEventListener("pointercancel", () => onUp());

  // Click a card -> bring it to front (no snap animation, just set pos)
  cards.forEach((card, i) => {
    card.addEventListener("click", (e) => {
      // If user was dragging, ignore click
      if (Math.abs((lastX || 0) - startX) > 6) return;

      // Move pos so card i becomes front (d -> 0)
      const p = wrap(pos, N);
      const d = shortestDelta(i, p, N);
      pos = pos + d;
      render();
    });
  });

  // Re-tune on resize/orientation
  function retune() {
    const mobile = matchMedia("(max-width: 767px)").matches;
    RADIUS_X = mobile ? 120 : 170;
    RADIUS_Z = mobile ? 260 : 340;
    SPREAD = mobile ? 0.68 : 0.78;
    DRAG_SENS = mobile ? 280 : 360;
    render();
  }
  window.addEventListener("resize", retune);

  // Initial render
  render();
})();
