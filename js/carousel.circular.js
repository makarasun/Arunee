/* =========================================================
   CIRCULAR CAROUSEL (6 cards) – mobile tuned
   - Infinite loop (ไม่หมุนเอง)
   - Start: still
   - Swipe direction fixed
   - Front card = sharpest (correct focus)
   - BG transparent / no container frame (CSS)
   - Uses PNG as card face
   ========================================================= */

(() => {
  const ring = document.querySelector("#ring.ring");
  if (!ring) return;

  const cards = Array.from(ring.querySelectorAll(".card"));
  if (!cards.length) return;

  // --- Map รูปการ์ด (ตาม data-key ใน HTML ปัจจุบัน)
  // ถ้า key ของมึงไม่ตรง ให้แก้เฉพาะฝั่งนี้ได้เลย
  const IMG_BY_KEY = {
    install: "/assets/cards/card-install.png",
    wall: "/assets/cards/card-wall.png",
    aftercar: "/assets/cards/card-aftercar.png",
    curtain: "/assets/cards/card-curtain.png",
    design: "/assets/cards/card-design.png",
    floor: "/assets/cards/card-floor.png",
  };

  // ใส่รูปลงการ์ด
  cards.forEach((el) => {
    const key = el.dataset.key || "";
    const src = IMG_BY_KEY[key];
    if (src) el.style.backgroundImage = `url("${src}")`;
    el.setAttribute("aria-label", key || "card");
  });

  // --- Config
  const N = cards.length;
  const STEP = (Math.PI * 2) / N;

  // อ่าน radius จาก CSS variable (ให้มึงจูนจาก css ได้)
  const getCssNum = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseFloat(v.replace("px",""));
    return Number.isFinite(n) ? n : fallback;
  };

  // การ “ชิดกันแบบขอบติดขอบ” ทำหลักๆที่ RADIUS นี่แหละ
  // (ยิ่งน้อยยิ่งชิด/ทับกันมากขึ้น)
  const DEPTH = 300;           // ความลึกวงกลม (คุม scale)
  const DRAG_SENS = 0.0062;    // ความไวปัด (เพิ่มความลื่นอีก ~10%)
  const SMOOTH = 0.12;         // ความหนืด/ลื่น (เพิ่มจากเดิมเล็กน้อย)

  let target = 0;   // เป้าหมายการหมุน
  let current = 0;  // ค่าจริงที่ render

  // --- Drag state
  let dragging = false;
  let lastX = 0;

  const pointerDown = (clientX) => {
    dragging = true;
    lastX = clientX;
  };

  const pointerMove = (clientX) => {
    if (!dragging) return;
    const dx = clientX - lastX;
    lastX = clientX;

    // FIX “ทิศปัดกลับทาง”:
    // ลากไปขวา => หมุนไปอีกทิศ (invert)
    target -= dx * DRAG_SENS;
  };

  const pointerUp = () => {
    dragging = false;
  };

  // Touch
  ring.addEventListener("touchstart", (e) => pointerDown(e.touches[0].clientX), { passive: true });
  ring.addEventListener("touchmove",  (e) => pointerMove(e.touches[0].clientX), { passive: true });
  ring.addEventListener("touchend", pointerUp, { passive: true });

  // Mouse (เผื่อเทสบนคอม)
  ring.addEventListener("mousedown", (e) => pointerDown(e.clientX));
  window.addEventListener("mousemove", (e) => pointerMove(e.clientX));
  window.addEventListener("mouseup", pointerUp);

  // กัน “หมุนเอง” — ไม่ใส่ autoplay ใดๆ

  function normAngle(a) {
    // keep in -PI..PI for stable depth calcs
    a = (a + Math.PI) % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;
    return a - Math.PI;
  }

  function render() {
    // smooth follow (ลื่นขึ้น)
    current += (target - current) * SMOOTH;

    // radius จาก css
    const RADIUS = getCssNum("--cc-radius", 115);

    for (let i = 0; i < N; i++) {
      // มุมของแต่ละใบ
      const a = normAngle(i * STEP + current);

      // วงกลมแนวนอน: x ซ้ายขวา, z หน้า-หลัง
      const x = Math.sin(a) * RADIUS;
      const z = Math.cos(a) * DEPTH;

      // depth -> scale
      // หน้า (z มาก) => scale ใกล้ 1
      const t = (z + DEPTH) / (2 * DEPTH); // 0..1
      const scale = 0.80 + t * 0.22;       // 0.80..1.02

      // blur “น้อยๆ” (หลังสุดเบลอนิดเดียวพอ)
      const blur = (1 - t) * 1.2;          // 0..1.2
      const opacity = 0.74 + t * 0.26;     // 0.74..1.0

      // zIndex: ใบหน้าสุดอยู่บนสุด
      const zIndex = Math.round(1000 + z);

      const el = cards[i];
      el.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      el.style.filter = `blur(${blur.toFixed(2)}px)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = zIndex;

      // state class (front/back)
      if (t > 0.82) {
        el.classList.add("is-front");
        el.classList.remove("is-back");
      } else {
        el.classList.add("is-back");
        el.classList.remove("is-front");
      }
    }

    requestAnimationFrame(render);
  }

  // start still (target=0 current=0) แล้ว render
  requestAnimationFrame(render);
})();
