/* carousel.circular.js – mobile tuned */
(() => {
  const ring = document.querySelector("#ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  const N = cards.length || 6;

  // === MOBILE TUNE ===
  const RADIUS = 42;          // ระยะโค้ง (ชิดขึ้น = เลขน้อยลง)
  const Z_DEPTH = 240;        // ระยะลึก (ลดลง = ไม่พุ่งออกจอ)
  const MAX_BLUR = 2.2;       // เบลอหลัง “นิดหน่อย” ตามที่มึงขอ
  const FRONT_SCALE = 1.0;    // ไม่ขยายเพิ่มแล้ว
  const BACK_SCALE = 0.78;    // ใบหลังเล็กลงพอดูเป็นวง
  const FRICTION = 0.92;      // ลื่นขึ้น ~10% (ใกล้ 1 = ลื่น/ไหลนานขึ้น)

  let angle = 0;
  let vel = 0;
  let dragging = false;
  let lastX = 0;

  function clamp01(v){ return Math.max(0, Math.min(1, v)); }

  function layout() {
    for (let i = 0; i < N; i++) {
      const a = angle + (i * (Math.PI * 2 / N));

      // x = โค้งซ้ายขวา, z = ลึกหน้า/หลัง
      const x = Math.sin(a) * RADIUS;
      const z = Math.cos(a) * -Z_DEPTH;

      // depth: 1 = หน้า, 0 = หลัง
      const depth01 = (Math.cos(a) + 1) / 2;

      const scale = BACK_SCALE + (FRONT_SCALE - BACK_SCALE) * depth01;

      // เบลอหลังนิดหน่อย
      const blur = (1 - depth01) * MAX_BLUR;

      // opacity ให้คุมไว้ (ห้ามติดลบ)
      const opacity = 0.45 + depth01 * 0.55;

      // z-index ให้ “ใบหน้า” อยู่บนสุดแน่นอน
      const zIndex = Math.floor(100 + depth01 * 100);

      const el = cards[i];
      el.style.transform =
        `translate(-50%, -50%) translate3d(${x}px, 0px, ${z}px) scale(${scale})`;
      el.style.filter = `blur(${blur}px)`;
      el.style.opacity = `${clamp01(opacity)}`;
      el.style.zIndex = `${zIndex}`;
    }
  }

  function onDown(e){
    dragging = true;
    vel = 0;
    lastX = (e.touches ? e.touches[0].clientX : e.clientX);
  }

  function onMove(e){
    if (!dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = x - lastX;
    lastX = x;

    // ทิศปัด: ปัดขวา = หมุนไปทางขวา (ถ้ามึงอยากกลับทาง แค่ใส่ -dx)
    const delta = dx * 0.012;
    angle += delta;
    vel = delta;
    layout();
  }

  function onUp(){
    dragging = false;
  }

  function tick(){
    if (!dragging) {
      // inertia
      vel *= FRICTION;
      if (Math.abs(vel) > 0.00005) {
        angle += vel;
        layout();
      }
    }
    requestAnimationFrame(tick);
  }

  ring.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  ring.addEventListener("touchstart", onDown, { passive: true });
  ring.addEventListener("touchmove", onMove, { passive: true });
  ring.addEventListener("touchend", onUp, { passive: true });

  layout();
  tick();
})();
