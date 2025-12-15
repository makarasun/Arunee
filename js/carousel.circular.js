/* =========================================================
   carousel.circular.js (MOBILE FIRST)
   - Infinite circular ring (no auto spin)
   - User drag/swipe with inertia (smooth +10%)
   - Front card sharpest, back slightly blurred
   - Strictly confined inside .carousel (no overlay whole page)
   ========================================================= */

(() => {
  const ring = document.querySelector("#ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  if (!cards.length) return;

  // ---- TUNING (มือถือเป็นหลัก)
  const STATE = {
    angle: 0,          // radians
    vel: 0,            // angular velocity
    dragging: false,
    lastX: 0,
    lastT: 0,
    raf: 0,
  };

  // “ลื่นขึ้น 10%” = ลดแรงเสียดทานลงนิด
  const FRICTION = 0.92;       // (ยิ่งใกล้ 1 ยิ่งลื่น)
  const STOP_EPS = 0.00012;

  // ระยะ ring: คุมไม่ให้ล้นจอ
  function getLayout() {
    const box = ring.getBoundingClientRect();
    const w = box.width;
    const h = box.height;

    // ขนาดการ์ด (อ่านจาก CSS ถ้ามี)
    const sample = cards[0].getBoundingClientRect();
    const cardW = sample.width || 112;
    const cardH = sample.height || 168;

    // radius = ให้การ์ด “ขอบติดขอบ” บนวง (ตาม chord length)
    // chord ≈ 2R sin(pi/N) ~ cardW  => R ~ cardW / (2 sin(pi/N))
    const N = cards.length;
    const minR = (cardW / (2 * Math.sin(Math.PI / N))) * 0.92; // 0.92 = ชิดเพิ่ม
    const maxR = Math.min(w, h) * 0.33;                        // clamp กันล้น
    const R = Math.max(44, Math.min(minR, maxR));

    // depth (z) ไม่แรง
    const Z = Math.max(42, Math.min(90, R * 1.05));

    return { w, h, cardW, cardH, R, Z, N };
  }

  // map helper
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => Math.max(0, Math.min(1, t));

  function render() {
    const { R, Z, N } = getLayout();

    // มุมห่างแต่ละใบ
    const step = (Math.PI * 2) / N;

    let bestIdx = 0;
    let bestZ = -999;

    for (let i = 0; i < N; i++) {
      const th = STATE.angle + i * step;

      // วงกลมบนแกน XZ (ตั้งตรงทุกใบ)
      const x = Math.sin(th) * R;
      const z = Math.cos(th) * Z; // front = cos(th) ~ 1

      if (z > bestZ) {
        bestZ = z;
        bestIdx = i;
      }

      // normalize z => [0..1]
      const t = clamp01((z / Z + 1) / 2);

      // scale/blur/opacity แบบ “ไม่โหด”
      const scale = lerp(0.78, 0.98, t);
      const blurPx = lerp(2.0, 0.0, t);
      const opacity = lerp(0.72, 1.0, t);

      // z-index ให้หน้าเด้งสุด
      const zIndex = 1000 + Math.round(t * 200);

      // NOTE: translate(-50%,-50%) มีอยู่ใน CSS transform base แล้ว
      // ที่นี่เรายัด transform ทั้งก้อนเพื่อคุมแน่น
      cards[i].style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${(-z).toFixed(2)}px) scale(${scale.toFixed(3)})`;

      cards[i].style.filter = `blur(${blurPx.toFixed(2)}px)`;
      cards[i].style.opacity = opacity.toFixed(3);
      cards[i].style.zIndex = String(zIndex);

      cards[i].classList.remove("is-front", "is-back");
      cards[i].classList.add(t > 0.84 ? "is-front" : "is-back");
    }

    // ทำให้ใบหน้าคลาส front แน่นอน
    cards.forEach((c, idx) => {
      if (idx === bestIdx) {
        c.classList.add("is-front");
        c.classList.remove("is-back");
      }
    });
  }

  // ---- Drag controls (ทิศปัดให้ “เป็นธรรมชาติ”)
  // ปัดซ้าย -> ไปการ์ดถัดไปทางขวา (มุมเพิ่ม/ลดตามที่สบายตา)
  // ถ้ามึงอยากกลับทิศอีกที: แค่สลับ sign ใน dxToAngle()
  function dxToAngle(dx) {
    const { R } = getLayout();
    // R ใหญ่ = หมุนช้าลง, R เล็ก = หมุนไวขึ้น
    // sign ตรงนี้คือ “ทิศปัด”
    return -(dx / Math.max(60, R * 2.2));
  }

  function onDown(clientX) {
    STATE.dragging = true;
    STATE.lastX = clientX;
    STATE.lastT = performance.now();
    STATE.vel = 0; // ดับ inertia เก่า
    cancelAnimationFrame(STATE.raf);
  }

  function onMove(clientX) {
    if (!STATE.dragging) return;
    const now = performance.now();
    const dx = clientX - STATE.lastX;
    const dt = Math.max(8, now - STATE.lastT);

    const da = dxToAngle(dx);
    STATE.angle += da;

    // velocity for inertia
    STATE.vel = da / (dt / 16.67);

    STATE.lastX = clientX;
    STATE.lastT = now;

    render();
  }

  function onUp() {
    if (!STATE.dragging) return;
    STATE.dragging = false;

    // inertia loop
    const tick = () => {
      STATE.vel *= FRICTION;

      if (Math.abs(STATE.vel) < STOP_EPS) {
        STATE.vel = 0;
        render();
        return;
      }

      STATE.angle += STATE.vel;
      render();
      STATE.raf = requestAnimationFrame(tick);
    };

    STATE.raf = requestAnimationFrame(tick);
  }

  // Pointer events
  ring.addEventListener("pointerdown", (e) => {
    ring.setPointerCapture?.(e.pointerId);
    onDown(e.clientX);
  });

  ring.addEventListener("pointermove", (e) => onMove(e.clientX));
  ring.addEventListener("pointerup", onUp);
  ring.addEventListener("pointercancel", onUp);
  ring.addEventListener("pointerleave", () => {
    // กันลากแล้วนิ้วหลุดออกนอก ring
    if (STATE.dragging) onUp();
  });

  // first paint
  render();

  // re-render on resize/orientation
  let resizeTO = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => render(), 80);
  });
})();
