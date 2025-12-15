/* =========================================================
   CIRCULAR CAROUSEL (FINAL TUNE)
   Targets:
     #ring.ring > button.card
   Goals:
     - Cards closer (edge-to-edge feel)
     - Transparent container (handled by CSS)
     - Smoothness +10% (easing + inertia)
     - Infinite, manual only (no auto-rotate)
========================================================= */

(function () {
  const ring = document.getElementById("ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  if (!cards.length) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Pull tuning from CSS vars (single source of truth)
  const rootStyle = getComputedStyle(document.documentElement);
  const readVar = (name, fallback) => {
    const v = parseFloat(rootStyle.getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
  };

  // “ชิดกัน” หลักอยู่ตรง RADIUS
  let RADIUS = readVar("--cc-radius", 140);
  let DEPTH  = readVar("--cc-depth", 250);

  const N = cards.length;
  const STEP = (Math.PI * 2) / N;

  // Drag feel
  const SENS = 0.008;         // base sensitivity
  const EASE = 0.14;          // +10% smoothness (was ~0.12-ish feel)
  const FRICTION = 0.935;     // inertia smoother (higher = glide longer)
  const MIN_V = 0.0012;

  // State
  let targetAngle = 0;        // where the user is dragging toward
  let angle = 0;              // rendered angle (eased)
  let dragging = false;

  let startX = 0;
  let startTarget = 0;

  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let raf = null;

  function render() {
    // ease angle toward targetAngle
    angle = lerp(angle, targetAngle, EASE);

    for (let i = 0; i < N; i++) {
      const t = angle + i * STEP;

      // circle
      const x = Math.sin(t) * RADIUS;
      const z = -Math.cos(t) * DEPTH;

      const frontness = (1 - Math.cos(t)) / 2; // 0..1 (1 = front)

      // scale / blur / opacity
      const scale = 0.82 + frontness * 0.22;          // หลังไม่เล็กจนหาย
      const blur = (1 - frontness) * 2.0;             // เบลอหลังนิดเดียว (0..2px)
      const opacity = clamp(0.55 + frontness * 0.45, 0.55, 1); // หลังยังเห็นชัด


      const zIndex = Math.round(frontness * 1000);

      const el = cards[i];
      el.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      el.style.filter = `blur(${clamp(blur, 0, 10).toFixed(2)}px)`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(zIndex);

      el.classList.toggle("is-front", frontness > 0.88);
      el.classList.toggle("is-back", frontness < 0.22);
    }

    raf = requestAnimationFrame(render);
  }

  function startRenderLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  }

  function onDown(e) {
    dragging = true;
    ring.classList.add("is-dragging");

    startX = e.clientX;
    startTarget = targetAngle;

    lastX = e.clientX;
    lastT = performance.now();
    velocity = 0;

    ring.setPointerCapture?.(e.pointerId);
  }

  function onMove(e) {
    if (!dragging) return;

    const dx = e.clientX - startX;
    targetAngle = startTarget - dx * SENS;

    // velocity estimate
    const t = performance.now();
    const dt = Math.max(1, t - lastT);
    const ddx = e.clientX - lastX;
    velocity = (ddx * SENS) / (dt / 16.67);

    lastX = e.clientX;
    lastT = t;
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    ring.classList.remove("is-dragging");
    ring.releasePointerCapture?.(e.pointerId);

    // inertia: keep moving a bit
    let v = velocity;
    function glide() {
      if (dragging) return;
      if (Math.abs(v) < MIN_V) return;

      targetAngle += v;
      v *= FRICTION;

      requestAnimationFrame(glide);
    }
    requestAnimationFrame(glide);
  }

  ring.addEventListener("pointerdown", onDown, { passive: true });
  ring.addEventListener("pointermove", onMove, { passive: true });
  ring.addEventListener("pointerup", onUp, { passive: true });
  ring.addEventListener("pointercancel", onUp, { passive: true });
  ring.addEventListener("pointerleave", onUp, { passive: true });

  // Re-read CSS vars on resize/orientation changes
  window.addEventListener("resize", () => {
    const rs = getComputedStyle(document.documentElement);
    const v1 = parseFloat(rs.getPropertyValue("--cc-radius"));
    const v2 = parseFloat(rs.getPropertyValue("--cc-depth"));
    if (Number.isFinite(v1)) RADIUS = v1;
    if (Number.isFinite(v2)) DEPTH = v2;
  });

  // Start loop (still/no auto rotate because targetAngle stays 0 until user drags)
  startRenderLoop();
})();




