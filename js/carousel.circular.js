/* =========================================================
   carousel.circular.js (MOBILE FIRST)
   - 6 cards arranged in a circle (3D)
   - Drag / swipe / wheel to spin (momentum)
   - Tap card pops forward + dispatches selection event
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
    activeIdx: 0,
    justDragged: false,
  };

  // ---------------------------
  // TUNE
  // ---------------------------
  const FRICTION = 0.93;
  const STOP_EPS = 0.0012;
  const MAX_VEL = 0.24;
  const DRAG_GATE = 8;
  const SENS = 1.18;

  // ---------------------------
  // LAYOUT
  // ---------------------------
  const L = {
    N: cards.length,
    step: (Math.PI * 2) / cards.length,
    R: 180,
    Z: 150,
    w: 0,
    h: 0,
    cardW: 210,
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

    L.cardW = pxVar("--card-w", 210);

    // edge-to-edge: chord length = cardW / (2 sin(pi/N))
    const R_ideal = L.cardW / (2 * Math.sin(Math.PI / L.N));

    const dim = Math.max(260, Math.min(L.w, L.h));
    const R_max = Math.max(150, dim * 0.6);
    L.R = Math.max(140, Math.min(R_ideal, R_max));

    const Z_max = Math.min(280, Math.max(150, L.R * 0.92));
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
      const z = Math.cos(th) * L.Z;

      if (z > bestZ){ bestZ = z; bestIdx = i; }

      const t = clamp01((z / L.Z + 1) / 2);
      const isActive = i === S.activeIdx;

      let scale = lerp(0.96, 1.09, t);
      const blur  = lerp(0.5, 0.0, t);
      const op    = lerp(0.84, 1.0, t);
      if (isActive) scale *= 1.04;

      const zIndex = 4 + Math.round(t * 36);

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

      el.classList.toggle("is-front", t > 0.92);
      el.classList.toggle("is-back",  t <= 0.92);
      el.classList.toggle("is-active", isActive);
    }

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

    if (typeof S.activeIdx !== "number") S.activeIdx = bestIdx;
  }

  // ---------------------------
  // INPUT -> ANGLE
  // ---------------------------
  function dxToAngle(dx){
    const denom = Math.max(L.cardW * 1.05, L.R * 2.1);
    return (dx / denom) * SENS; // หมุนตรงตามทิศการปัด
  }

  function onDown(e){
    S.down = true;
    S.dragging = false;
    S.justDragged = false;

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

    if (!S.dragging){
      if (Math.abs(dx0) > Math.abs(dy0) + DRAG_GATE){
        S.dragging = true;
        ring.setPointerCapture?.(e.pointerId);
      } else {
        return;
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

  function spin(){
    const tick = () => {
      S.vel *= FRICTION;
      if (Math.abs(S.vel) < STOP_EPS){
        S.vel = 0;
        render();
        return;
      }
      S.angle += S.vel;
      render();
      S.raf = requestAnimationFrame(tick);
    };
    S.raf = requestAnimationFrame(tick);
  }

  function onUp(){
    if (!S.down) return;
    S.down = false;

    if (!S.dragging){
      return;
    }

    S.dragging = false;
    S.justDragged = true;
    spin();
  }

  function onWheel(e){
    e.preventDefault?.();
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const da = dxToAngle(delta * 0.7);
    S.angle += da;
    S.vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, da));
    render();
    spin();
  }

  function snapToIndex(idx){
    if (idx < 0 || idx >= L.N) return;
    const target = -idx * L.step;
    const tau = Math.PI * 2;
    let diff = (target - S.angle) % tau;
    if (diff > Math.PI) diff -= tau;
    if (diff < -Math.PI) diff += tau;
    S.angle += diff;
    S.activeIdx = idx;
    render();
  }

  function emitSelect(idx, via){
    const card = cards[idx];
    if (!card) return;
    const key = card.getAttribute("data-key");
    window.dispatchEvent(new CustomEvent("carousel:select", { detail: { key, index: idx, via } }));
  }

  function onClick(e){
    if (S.dragging || S.justDragged) {
      S.justDragged = false;
      return;
    }
    const card = e.target.closest(".card");
    if (!card) return;
    const idx = cards.indexOf(card);
    if (idx < 0) return;
    snapToIndex(idx);
    emitSelect(idx, "tap");
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
  ring.addEventListener("click", onClick);
  ring.addEventListener("wheel", onWheel, { passive: false });

  let to = 0;
  window.addEventListener("resize", () => {
    clearTimeout(to);
    to = setTimeout(() => {
      computeLayout();
      render();
    }, 80);
  });
})();
