/* =========================================================
   carousel.circular.js (MOBILE FIRST)
   FIX:
   - Add real depth via CSS perspective (in css)
   - Use translate3d(x,0,z) (not -z)
   - Blur/opacity applied to IMG only (not whole button)
   ========================================================= */

(() => {
  const ring = document.querySelector("#ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  if (!cards.length) return;

  const STATE = {
    angle: 0,
    vel: 0,
    dragging: false,
    lastX: 0,
    lastT: 0,
    raf: 0,
  };

  const FRICTION = 0.92;   // ลื่นขึ้น
  const STOP_EPS = 0.00012;

  function getLayout(){
    const box = ring.getBoundingClientRect();
    const w = box.width;
    const h = box.height;

    const sample = cards[0].getBoundingClientRect();
    const cardW = sample.width || 112;

    const N = cards.length;

    // ขอบติดขอบ (เพิ่มชิดด้วย *0.90)
    const minR = (cardW / (2 * Math.sin(Math.PI / N))) * 0.90;
    const maxR = Math.min(w, h) * 0.34;
    const R = Math.max(44, Math.min(minR, maxR));

    // depth ไม่โหด
    const Z = Math.max(55, Math.min(110, R * 1.15));

    return { R, Z, N };
  }

  const lerp = (a,b,t)=> a+(b-a)*t;
  const clamp01 = (t)=> Math.max(0, Math.min(1, t));

  function render(){
    const { R, Z, N } = getLayout();
    const step = (Math.PI * 2) / N;

    let bestIdx = 0;
    let bestZ = -1e9;

    for (let i=0;i<N;i++){
      const th = STATE.angle + i*step;

      const x = Math.sin(th) * R;
      const z = Math.cos(th) * Z;   // z มาก = อยู่หน้า

      if (z > bestZ){ bestZ = z; bestIdx = i; }

      // normalize depth => 0..1
      const t = clamp01((z / Z + 1) / 2);

      const scale = lerp(0.80, 1.00, t);
      const blur  = lerp(1.6, 0.0, t);
      const op    = lerp(0.78, 1.0, t);
      const zIndex = 1000 + Math.round(t * 400);

      // สำคัญ: ใช้ z ตรงๆ (ไม่ใส่ -z)
      cards[i].style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)})`;

      cards[i].style.zIndex = String(zIndex);

      // blur/opacity ลงที่ IMG เท่านั้น
      const img = cards[i].querySelector("img");
      if (img){
        img.style.filter = `blur(${blur.toFixed(2)}px)`;
        img.style.opacity = op.toFixed(3);
      } else {
        // fallback ถ้ายังไม่ได้ใส่ img
        cards[i].style.filter = `blur(${blur.toFixed(2)}px)`;
        cards[i].style.opacity = op.toFixed(3);
      }

      cards[i].classList.remove("is-front","is-back");
      cards[i].classList.add(t > 0.86 ? "is-front" : "is-back");
    }

    // บังคับใบหน้าคือ bestZ
    cards.forEach((c, idx)=>{
      if (idx === bestIdx){
        c.classList.add("is-front");
        c.classList.remove("is-back");
        const img = c.querySelector("img");
        if (img){
          img.style.filter = "blur(0px)";
          img.style.opacity = "1";
        } else {
          c.style.filter = "blur(0px)";
          c.style.opacity = "1";
        }
      }
    });
  }

  function dxToAngle(dx){
    const { R } = getLayout();
    // ทิศปัด: ถ้ายังกลับทางทีหลัง ลบ/ใส่ - ตรงนี้จุดเดียว
    return -(dx / Math.max(60, R * 2.2));
  }

  function onDown(x){
    STATE.dragging = true;
    STATE.lastX = x;
    STATE.lastT = performance.now();
    STATE.vel = 0;
    cancelAnimationFrame(STATE.raf);
  }

  function onMove(x){
    if (!STATE.dragging) return;
    const now = performance.now();
    const dx = x - STATE.lastX;
    const dt = Math.max(8, now - STATE.lastT);

    const da = dxToAngle(dx);
    STATE.angle += da;
    STATE.vel = da / (dt / 16.67);

    STATE.lastX = x;
    STATE.lastT = now;
    render();
  }

  function onUp(){
    if (!STATE.dragging) return;
    STATE.dragging = false;

    const tick = ()=>{
      STATE.vel *= FRICTION;
      if (Math.abs(STATE.vel) < STOP_EPS){
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

  ring.addEventListener("pointerdown", (e)=>{
    ring.setPointerCapture?.(e.pointerId);
    onDown(e.clientX);
  });
  ring.addEventListener("pointermove", (e)=> onMove(e.clientX));
  ring.addEventListener("pointerup", onUp);
  ring.addEventListener("pointercancel", onUp);
  ring.addEventListener("pointerleave", ()=> { if (STATE.dragging) onUp(); });

  render();

  let to = 0;
  window.addEventListener("resize", ()=>{
    clearTimeout(to);
    to = setTimeout(render, 80);
  });
})();
