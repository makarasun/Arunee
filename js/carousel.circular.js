/* =========================================================
   carousel.circular.js (MOBILE FIRST)
   Fix:
   - ปัดแล้วไม่มั่ว: clamp velocity + snap-to-card
   - กันมันลากตอนตั้งใจ scroll ลง (drag เฉพาะแนวนอน)
   - ลด z-index ไม่ให้ทับ section อื่น
   ========================================================= */

(() => {
  const ring = document.querySelector("#ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  if (!cards.length) return;

  const STATE = {
    angle: 0,
    vel: 0,

    // gesture
    pointerDown: false,
    dragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,

    raf: 0,
  };

  const FRICTION = 0.90;     // ลื่นขึ้นอีกนิด
  const STOP_EPS = 0.00015;
  const MAX_VEL = 0.22;      // กันพุ่งมั่ว

  function getLayout(){
    const box = ring.getBoundingClientRect();
    const w = box.width;
    const h = box.height;

    const sample = cards[0].getBoundingClientRect();
    const cardW = sample.width || 150;

    const N = cards.length;

    // ชิดกันกว่าก่อน (ขอบเกือบติดขอบ)
    const minR = (cardW / (2 * Math.sin(Math.PI / N))) * 0.86;
    const maxR = Math.min(w, h) * 0.10;
    const R = Math.max(55, Math.min(minR, maxR));

    // depth กำลังพอดี
    const Z = Math.max(70, Math.min(150, R * 1.15));

    return { R, Z, N, step: (Math.PI * 2) / N };
  }

  const lerp = (a,b,t)=> a+(b-a)*t;
  const clamp01 = (t)=> Math.max(0, Math.min(1, t));

  function render(){
    const { R, Z, N, step } = getLayout();

    let bestIdx = 0;
    let bestZ = -1e9;

    for (let i=0;i<N;i++){
      const th = STATE.angle + i*step;

      const x = Math.sin(th) * R;
      const z = Math.cos(th) * Z;   // z มาก = หน้า

      if (z > bestZ){ bestZ = z; bestIdx = i; }

      const t = clamp01((z / Z + 1) / 2);

      const scale = lerp(0.86, 1.02, t);
      const blur  = lerp(1.0, 0.0, t);
      const op    = lerp(0.86, 1.0, t);

      // ✅ z-index ภายใน carousel เท่านั้น (ไม่ทับ section อื่น)
      const zIndex = 1 + Math.round(t * 20);

      cards[i].style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      cards[i].style.zIndex = String(zIndex);

      const img = cards[i].querySelector("img");
      if (img){
        img.style.filter = `blur(${blur.toFixed(2)}px)`;
        img.style.opacity = op.toFixed(3);
      } else {
        cards[i].style.filter = `blur(${blur.toFixed(2)}px)`;
        cards[i].style.opacity = op.toFixed(3);
      }

      cards[i].classList.remove("is-front","is-back");
      cards[i].classList.add(t > 0.88 ? "is-front" : "is-back");
    }

    // บังคับใบหน้าสุดชัด
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

  function dxToAngle(dx){
    const { R } = getLayout();
    // ทิศปัด: ตอนนี้ “ธรรมชาติ” = ปัดขวาให้หมุนไปขวา
    return -(dx / Math.max(80, R * 2.3));
  }

  function snapToNearest(){
    const { step } = getLayout();
    const target = Math.round(STATE.angle / step) * step;

    const start = STATE.angle;
    const delta = target - start;

    const dur = 180; // ms
    const t0 = performance.now();

    const easeOut = (t)=> 1 - Math.pow(1 - t, 3);

    const anim = (now)=>{
      const t = Math.min(1, (now - t0) / dur);
      STATE.angle = start + delta * easeOut(t);
      render();
      if (t < 1) STATE.raf = requestAnimationFrame(anim);
    };

    cancelAnimationFrame(STATE.raf);
    STATE.raf = requestAnimationFrame(anim);
  }

  function onPointerDown(e){
    STATE.pointerDown = true;
    STATE.dragging = false;
    STATE.startX = e.clientX;
    STATE.startY = e.clientY;
    STATE.lastX = e.clientX;
    STATE.lastT = performance.now();
    STATE.vel = 0;
  }

  function onPointerMove(e){
    if (!STATE.pointerDown) return;

    const dx0 = e.clientX - STATE.startX;
    const dy0 = e.clientY - STATE.startY;

    // ✅ ยังไม่ลาก จนกว่าจะ “ชัดเจนว่าเป็นแนวนอน”
    if (!STATE.dragging){
      if (Math.abs(dx0) > Math.abs(dy0) + 8){
        STATE.dragging = true;
        ring.setPointerCapture?.(e.pointerId);
        cancelAnimationFrame(STATE.raf);
      } else {
        // ปล่อยให้ scroll page ได้
        return;
      }
    }

    // ลากจริง
    e.preventDefault?.();

    const now = performance.now();
    const dx = e.clientX - STATE.lastX;
    const dt = Math.max(10, now - STATE.lastT);

    const da = dxToAngle(dx);
    STATE.angle += da;

    let v = da / (dt / 16.67);
    // ✅ clamp กันพุ่งมั่ว
    v = Math.max(-MAX_VEL, Math.min(MAX_VEL, v));
    STATE.vel = v;

    STATE.lastX = e.clientX;
    STATE.lastT = now;

    render();
  }

  function onPointerUp(){
    if (!STATE.pointerDown) return;
    STATE.pointerDown = false;

    if (!STATE.dragging){
      // ไม่ได้ลากจริง = แค่ tap/scroll
      return;
    }

    STATE.dragging = false;

    const tick = ()=>{
      STATE.vel *= FRICTION;

      if (Math.abs(STATE.vel) < STOP_EPS){
  STATE.vel = 0;
  return; // ❌ ไม่ snap แล้ว
}


      STATE.angle += STATE.vel;
      render();
      STATE.raf = requestAnimationFrame(tick);
    };

    STATE.raf = requestAnimationFrame(tick);
  }

  ring.addEventListener("pointerdown", onPointerDown, { passive: true });
  ring.addEventListener("pointermove", onPointerMove, { passive: false });
  ring.addEventListener("pointerup", onPointerUp, { passive: true });
  ring.addEventListener("pointercancel", onPointerUp, { passive: true });
  ring.addEventListener("pointerleave", ()=> { if (STATE.pointerDown) onPointerUp(); }, { passive: true });

  render();

  let to = 0;
  window.addEventListener("resize", ()=>{
    clearTimeout(to);
    to = setTimeout(render, 80);
  });
})();



