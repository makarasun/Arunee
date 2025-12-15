/* =========================================================
   carousel.circular.js (MOBILE FIRST)
   Fix:
   - ✅ no snap (หมุนอิสระ)
   - ✅ stable ring geometry (ไม่หด/ไม่กองมั่วตอนปล่อย)
   - ✅ drag เฉพาะ “แนวนอนจริง” (ยัง scroll ลงได้)
   - ✅ front card ชัด / back blur นิดเดียว
   ========================================================= */

(() => {
  const ring = document.querySelector("#ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  if (!cards.length) return;

  // ---------------------------
  // STATE
  // ---------------------------
  const S = {
    angle: 0,
    vel: 0,

    down: false,
    dragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,

    raf: 0,
  };

  // ---------------------------
  // TUNE (ลื่น + คุมไม่ให้มั่ว)
  // ---------------------------
  const FRICTION = 0.915;   // ✅ ลื่นขึ้น ~10%
  const STOP_EPS = 0.0002;
  const MAX_VEL = 0.18;     // ✅ กันพุ่งมั่ว
  const DRAG_GATE = 9;      // ต้องแนวนอนชัดก่อนถึงจะลาก
  const SENS = 1.0;         // ✅ ปรับความไวรวม (1.0 = กลางๆ)

  // ---------------------------
  // LAYOUT (LOCKED, ไม่คำนวณใหม่ทุกเฟรม)
  // ---------------------------
  const L = {
    N: cards.length,
    step: (Math.PI * 2) / cards.length,
    R: 160,
    Z: 140,
    w: 0,
    h: 0,
    cardW: 200,
  };

  function pxVar(name, fallback){
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function computeLayout(){
    const box = ring.getBoundingClientRect();
    L.w = box.width;
    L.h = box.height;

    // ✅ เอาขนาดจาก CSS var (นิ่ง) ไม่ใช่วัดจาก transform แล้วแกว่ง
    L.cardW = pxVar("--card-w", 200);

    // edge-to-edge: chord length = cardW ≈ 2R sin(pi/N) => R = cardW / (2 sin(pi/N))
    const R_ideal = L.cardW / (2 * Math.sin(Math.PI / L.N));

    // จำกัดให้เข้ากับ container
    const R_max = Math.max(90, Math.min(L.w, L.h) * 0.34);
    L.R = Math.max(90, Math.min(R_ideal, R_max));

    // depth
    const Z_max = Math.min(220, Math.max(110, L.R * 0.85));
    L.Z = Z_max;
  }

  // ---------------------------
  // RENDER
  // ---------------------------
  const lerp = (a,b,t)=> a+(b-a)*t;
  const clamp01 = (t)=> Math.max(0, Math.min(1, t));

  function render(){
    let bestIdx = 0;
    let bestZ = -1e9;

    for (let i=0;i<L.N;i++){
      const th = S.angle + i * L.step;

      const x = Math.sin(th) * L.R;
      const z = Math.cos(th) * L.Z; // z มาก = หน้า

      if (z > bestZ){ bestZ = z; bestIdx = i; }

      const t = clamp01((z / L.Z + 1) / 2);

      // หน้าใหญ่ขึ้นนิด หลังเล็กลงนิด (ดูมีมิติ แต่ไม่หาย)
      const scale = lerp(0.90, 1.06, t);
      const blur  = lerp(0.7, 0.0, t);
      const op    = lerp(0.76, 1.0, t);

      // z-index เฉพาะใน carousel
      const zIndex = 1 + Math.round(t * 40);

      const el = cards[i];
      el.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      el.style.zIndex = String(zIndex);

      const img = el.querySelector("img");
      if (img){
        img.style.filter = `blur(${blur.toFixed(2)}px)`;
        img.style.opacity = op.toFixed(3);
      } else {
        el.style.filter = `blur(${blur.toFixed(2)}px)`;
        el.style.opacity = op.toFixed(3);
      }

      el.classList.toggle("is-front", t > 0.88);
      el.classList.toggle("is-back",  t <= 0.88);
    }

    // บังคับใบหน้าสุดชัด 100%
    const front = cards[bestIdx];
    front.classList.add("is-front");
    front.classList.remove("is-back");

    const fimg = front.querySelector("img");
    if (fimg){
      fimg.style.filter = "blur(0px)";
      fimg.style.opacity = "1";
    } else {
      front.style.filter = "blur(0px)";
      front.style.opacity = "1";
    }
  }

  // ---------------------------
  // INPUT → ANGLE
  // ---------------------------
  function dxToAngle(dx){
    // “ธรรมชาติ”: ปัดขวา => วงหมุนไปทางขวา (ถ้ายังกลับทาง คูณ -1 ตรงนี้)
    const denom = Math.max(220, L.R * 2.4);
    return -(dx / denom) * SENS;
  }

  function onDown(e){
    S.down = true;
    S.dragging = false;

    S.startX = e.clientX;
    S.startY = e.clientY;
    S.lastX = e.clientX;
    S.lastT = performance.now();

    S.vel = 0;
    cancelAnimationFrame(S.raf);
  }

  function onMove(e){
    if (!S.down) return;

    const dx0 = e.clientX - S.startX;
    const dy0 = e.clientY - S.startY;

    // ยังไม่ลาก จนกว่าจะ “ชัดว่าแนวนอน”
    if (!S.dragging){
      if (Math.abs(dx0) > Math.abs(dy0) + DRAG_GATE){
        S.dragging = true;
        ring.setPointerCapture?.(e.pointerId);
      } else {
        return; // ปล่อยให้ scroll page
      }
    }

    e.preventDefault?.();

    const now = performance.now();
    const dx = e.clientX - S.lastX;
    const dt = Math.max(10, now - S.lastT);

    const da = dxToAngle(dx);
    S.angle += da;

    let v = da / (dt / 16.67);
    v = Math.max(-MAX_VEL, Math.min(MAX_VEL, v));
    S.vel = v;

    S.lastX = e.clientX;
    S.lastT = now;

    render();
  }

  function onUp(){
    if (!S.down) return;
    S.down = false;

    if (!S.dragging){
      return; // tap / scroll
    }

    S.dragging = false;

    const tick = () => {
      S.vel *= FRICTION;

      if (Math.abs(S.vel) < STOP_EPS){
        S.vel = 0;
        return; // ✅ no snap
      }

      S.angle += S.vel;
      render();
      S.raf = requestAnimationFrame(tick);
    };

    S.raf = requestAnimationFrame(tick);
  }

  // ---------------------------
  // INIT
  // ---------------------------
  computeLayout();
  render();

  ring.addEventListener("pointerdown", onDown, { passive: true });
  ring.addEventListener("pointermove", onMove, { passive: false });
  ring.addEventListener("pointerup", onUp, { passive: true });
  ring.addEventListener("pointercancel", onUp, { passive: true });
  ring.addEventListener("pointerleave", () => { if (S.down) onUp(); }, { passive: true });

  let to = 0;
  window.addEventListener("resize", () => {
    clearTimeout(to);
    to = setTimeout(() => {
      computeLayout();
      render();
    }, 80);
  });
})();
