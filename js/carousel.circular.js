/* =========================================================
   CIRCULAR CAROUSEL (MOBILE TUNED)
   - 6 cards
   - infinite, manual swipe only (no auto rotate)
   - cards upright (no tilt)
   - out focus by depth
   Targets:
     #ring.ring > button.card
   ========================================================= */

(function () {
  const ring = document.getElementById("ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  if (!cards.length) return;

  // ====== TUNING (หลักๆ จูน 2 ตัวนี้ก่อน) ======
  // ระยะวงกลม: ใกล้ = ชิดกันขึ้น แต่ต้องไม่ชนกันจนอ่านไม่ออก
  let RADIUS = 150; // px
  // ความลึก 3D: มาก = หน้าชัด หลังเบลอหนักขึ้น
  let DEPTH = 260; // px

  // อ่านค่าจาก CSS variables ถ้ามี (ให้มึงจูนที่ css ได้ด้วย)
  const css = getComputedStyle(document.documentElement);
  const cssRadius = parseFloat(css.getPropertyValue("--cc-radius"));
  const cssDepth = parseFloat(css.getPropertyValue("--cc-depth"));
  if (!Number.isNaN(cssRadius)) RADIUS = cssRadius;
  if (!Number.isNaN(cssDepth)) DEPTH = cssDepth;

  const N = cards.length;
  const STEP = (Math.PI * 2) / N; // มุมต่อใบ

  // state
  let angle = 0;             // current rotation
  let startX = 0;
  let startAngle = 0;
  let dragging = false;

  // “ความไวการปัด” (มาก = หมุนไว)
  const SENSITIVITY = 0.008;

  // clamp helper
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function render() {
    // จัด depth ตาม cos(theta): หน้า = cos ใกล้ 1, หลัง = cos ใกล้ -1
    for (let i = 0; i < N; i++) {
      const t = angle + i * STEP;

      // วงกลมซ้าย-ขวา (x) + depth (z)
      const x = Math.sin(t) * RADIUS;
      const z = -Math.cos(t) * DEPTH; // หน้าออกมา = z น้อยกว่า? เราใช้เป็น depth weight เอง

      // normalize depth: front ~ 1, back ~ 0
      const frontness = (Math.cos(t) + 1) / 2; // 0..1 (1=front)

      // scale: หน้าใหญ่ หลังเล็ก (แต่ไม่ให้หายไป)
      const scale = 0.70 + frontness * 0.38;   // 0.70..1.08

      // blur: หลังเบลอ หน้าใส
      const blur = (1 - frontness) * 6.5;      // 0..6.5px

      // opacity: หลังจาง หน้าเต็ม (ห้ามติดลบ)
      const opacity = clamp(0.25 + frontness * 0.75, 0.25, 1);

      // z-index ให้ใบหน้าทับ
      const zIndex = Math.round(frontness * 1000);

      const el = cards[i];
      el.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      el.style.filter = `blur(${blur.toFixed(2)}px)`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(zIndex);

      // class ช่วยดีบัก
      el.classList.toggle("is-front", frontness > 0.88);
      el.classList.toggle("is-back", frontness < 0.25);
    }
  }

  function onPointerDown(e) {
    dragging = true;
    ring.classList.add("is-dragging");
    startX = e.clientX;
    startAngle = angle;
    ring.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    angle = startAngle + dx * SENSITIVITY;

    // infinite by nature (angle is unbounded)
    render();
  }

  function onPointerUp(e) {
    dragging = false;
    ring.classList.remove("is-dragging");
    ring.releasePointerCapture?.(e.pointerId);
  }

  // Prevent click selecting / accidental focus while dragging
  ring.addEventListener("click", (e) => {
    if (ring.classList.contains("is-dragging")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  ring.addEventListener("pointerdown", onPointerDown, { passive: true });
  ring.addEventListener("pointermove", onPointerMove, { passive: true });
  ring.addEventListener("pointerup", onPointerUp, { passive: true });
  ring.addEventListener("pointercancel", onPointerUp, { passive: true });
  ring.addEventListener("pointerleave", onPointerUp, { passive: true });

  // initial render (must be still, no auto rotate)
  render();

  // expose tiny debug knobs (optional)
  window.__CAROUSEL_DEBUG__ = {
    setRadius(v) { RADIUS = Number(v) || RADIUS; render(); },
    setDepth(v) { DEPTH = Number(v) || DEPTH; render(); },
    get() { return { RADIUS, DEPTH, N }; }
  };
})();
