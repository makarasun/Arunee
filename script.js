/* =========================================================
   Tangmo Neumo v3 (stable)
   - Intro skip always works
   - Random greeting after intro (1 time)
   - Mic toggle: tap to start / tap to stop (SpeechRecognition)
   - Calls /api/chat and /api/tts
   - Better error handling (no repeating “ระบบมีปัญหา” spam)
========================================================= */

const $ = (q) => document.querySelector(q);

const introEl = $("#intro");
const introSkip = $("#intro-skip");

const micBtn = $("#micBtn");
const ttsToggle = $("#ttsToggle");
const imgInput = $("#imgInput");

const bgImg = $("#bg-image");

const viewerTitle = $("#viewerTitle");
const viewerDesc = $("#viewerDesc");
const viewerImg = $("#viewerImg");
const thumbsEl = $("#thumbs");

const ring = $("#ring");
const cards = Array.from(document.querySelectorAll(".card"));

const chatEl = $("#chat");
const chatLog = $("#chatLog");

// ---- Gallery data (ใส่ของจริงทีหลังได้)
const GALLERY = {
  curtain: {
    title: "ผ้าม่าน / มู่ลี่",
    desc: "เหมาะบ้าน คอนโด สำนักงาน — เลือกผ้า/โทนตามแสงและการใช้งาน",
    bg: "./curtain-bg1.jpg",
    items: ["./curtain-bg1.jpg"]
  },
  wallpaper: {
    title: "วอลเปเปอร์",
    desc: "เพิ่มมิติให้ผนัง ทำให้ห้องดูแพงแบบไม่ต้องพูดเยอะ",
    bg: "./wall-BG1.jpg",
    items: ["./wall-BG1.jpg", "./wall-BG2.jpg"]
  },
  blind: {
    title: "ม่านปรับแสง",
    desc: "เรียบร้อย ดูแลง่าย เหมาะกับพื้นที่ต้องการความเป็นระเบียบ",
    bg: "./wall-BG2.jpg",
    items: ["./wall-BG2.jpg"]
  },
  floor: {
    title: "พื้น / พรม",
    desc: "ช่วยจัดโซน เพิ่มสัมผัส สบายเท้า และคุมโทนทั้งห้อง",
    bg: "./wall-BG1.jpg",
    items: ["./wall-BG1.jpg"]
  },
  fabric: {
    title: "ผ้า / วัสดุ",
    desc: "Texture + โทน ทำให้ mood ห้องมาไวแบบไม่ต้อง renovate",
    bg: "./curtain-bg1.jpg",
    items: ["./curtain-bg1.jpg"]
  },
  service: {
    title: "ติดตั้ง / หน้างาน",
    desc: "วัด-ติดตั้ง-เก็บงาน เน้นเรียบร้อย งานจบจริง",
    bg: "./wall-BG2.jpg",
    items: ["./wall-BG2.jpg"]
  }
};

let selectedKey = "curtain";

// =========================================================
// Intro
// =========================================================
function hideIntro() {
  if (!introEl) return;
  introEl.classList.add("hidden");
  // หลังข้าม intro -> ให้ Tangmo พูดต้อนรับ 1 ครั้ง
  sayOpeningOnce();
}

if (introSkip) introSkip.addEventListener("click", hideIntro);
// กันพลาด: แตะพื้นก็ข้ามได้ (ช่วยตอนปุ่มโดนอะไรกดไม่ติด)
if (introEl) introEl.addEventListener("click", (e) => {
  if (e.target === introEl) hideIntro();
});

// =========================================================
// Background sync with selected category
// =========================================================
function setBackground(src) {
  if (!bgImg) return;
  bgImg.src = src || "";
}

function renderViewer(key) {
  const data = GALLERY[key] || GALLERY.curtain;
  selectedKey = key;

  viewerTitle.textContent = data.title;
  viewerDesc.textContent = data.desc;

  setBackground(data.bg);

  // main image
  viewerImg.src = (data.items && data.items[0]) ? data.items[0] : data.bg;

  // thumbs
  thumbsEl.innerHTML = "";
  (data.items || []).forEach((src) => {
    const b = document.createElement("button");
    b.className = "thumb";
    b.type = "button";
    b.innerHTML = `<img alt="" src="${src}">`;
    b.addEventListener("click", () => {
      viewerImg.src = src;
      setBackground(src);
    });
    thumbsEl.appendChild(b);
  });
}

// =========================================================
// 3D Ring Carousel (vertical cards)
// =========================================================
let rotY = 0;
let dragging = false;
let lastX = 0;

function layoutRing() {
  const n = cards.length;
  const radius = 290; // ความโค้งวงกลม (ปรับได้)
  const step = 360 / n;

  cards.forEach((card, i) => {
    const a = (i * step + rotY) * (Math.PI / 180);
    // zDepth + xShift ให้มันเป็นวงโค้งด้านหน้า
    const z = Math.cos(a) * radius;
    const x = Math.sin(a) * radius;
    const scale = 0.72 + (z / radius) * 0.28; // ใกล้สุดใหญ่สุด
    const blur = Math.max(0, 10 - (z / radius) * 10); // ใกล้สุด blur ต่ำ
    const opacity = 0.35 + (z / radius) * 0.65;

    card.style.transform = `translate(-50%,-50%) translate3d(${x}px,0,${z}px) scale(${scale})`;
    card.style.filter = `blur(${blur * 0.55}px)`;
    card.style.opacity = `${opacity}`;
    card.style.zIndex = `${Math.round(1000 + z)}`;
  });
}

function pickFrontCard() {
  // การ์ดที่ z มากสุด = อยู่หน้าสุด
  let best = cards[0];
  let bestZ = -Infinity;
  cards.forEach((c) => {
    const m = c.style.transform.match(/translate3d\(([-\d.]+)px,0,([-\d.]+)px\)/);
    if (!m) return;
    const z = parseFloat(m[2]);
    if (z > bestZ) { bestZ = z; best = c; }
  });
  return best;
}

function onDragStart(e) {
  dragging = true;
  lastX = (e.touches ? e.touches[0].clientX : e.clientX);
}
function onDragMove(e) {
  if (!dragging) return;
  const x = (e.touches ? e.touches[0].clientX : e.clientX);
  const dx = x - lastX;
  lastX = x;
  rotY += dx * 0.35; // sensitivity
  layoutRing();
}
function onDragEnd() {
  dragging = false;

  // หลังปล่อย ให้เลือกการ์ดหน้าสุด
  const front = pickFrontCard();
  if (front) {
    const key = front.getAttribute("data-key");
    if (key) renderViewer(key);
  }
}

ring.addEventListener("mousedown", onDragStart);
window.addEventListener("mousemove", onDragMove);
window.addEventListener("mouseup", onDragEnd);

ring.addEventListener("touchstart", onDragStart, { passive: true });
window.addEventListener("touchmove", onDragMove, { passive: true });
window.addEventListener("touchend", onDragEnd);

cards.forEach((c) => {
  c.addEventListener("click", () => {
    const key = c.getAttribute("data-key");
    if (key) renderViewer(key);
  });
});

// init viewer + ring
renderViewer(selectedKey);
layoutRing();

// =========================================================
// Tangmo voice/chat
// =========================================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
let listening = false;
let lastErrorToastAt = 0;
let lastOpeningSpoken = false;

function toastOnce(msg) {
  const now = Date.now();
  if (now - lastErrorToastAt < 5000) return; // กัน spam
  lastErrorToastAt = now;
  console.warn(msg);
  // (ยังไม่ทำ UI toast แยกให้รก เดี๋ยวเฟสหน้า)
}

function appendMsg(role, text) {
  if (!chatLog) return;
  const d = document.createElement("div");
  d.className = `msg ${role === "user" ? "u" : "a"}`;
  d.textContent = text;
  chatLog.appendChild(d);
}

async function callChat(userText, imageDataUrl = null) {
  const payload = {
    messages: [{ role: "user", content: userText }],
    image: imageDataUrl || null
  };

  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || data?.error || `chat error ${r.status}`);
  return (data?.text || "").trim();
}

async function callTTS(text) {
  const r = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || e?.error || `tts error ${r.status}`);
  }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  return new Promise((resolve) => {
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    audio.play().catch(() => resolve());
  });
}

async function sayOpeningOnce() {
  if (lastOpeningSpoken) return;
  lastOpeningSpoken = true;

  const lines = [
    "สวัสดีค่ะ ที่นี่อรุณีผ้าม่านนะคะ จริง ๆ ทางร้านรับตกแต่งภายในครบวงจรเลยค่ะ เชิญดูเว็บได้สบาย ๆ นะคะ",
    "สวัสดีค่ะ ยินดีต้อนรับนะคะ ร้านอรุณีรับงานตกแต่งภายในหลายแบบ ไม่ได้มีแค่ผ้าม่านอย่างเดียวค่ะ",
    "สวัสดีค่ะ ที่ร้านอรุณี เราทำผ้าม่าน และแต่งบ้านทั้งหลัง เซฟตังค์ตามงบ ครบและจบในที่เดียวค่า",
    "สวัสดีค่ะ ยินดีต้อนรับค่ะ ร้านอรุณีผ้าม่าน ร้านตกแต่งภายใน ครบวงจร ร้านแรกที่มี Ai คอยให้บริการนะคะ", 
    "สวัสดีค่ะ เชิญดูผลงานก่อนได้เลยนะคะ ถ้าอยากถามอะไรค่อยเรียกแตงโม ai ประจำร้าน ถามได้เลยค่ะ"
  ];
  const pick = lines[Math.floor(Math.random() * lines.length)];

  // แค่พูด ไม่ต้องไปถามโมเดล (กันช้า/กันค่าใช้จ่าย)
  if (ttsToggle.checked) {
    micBtn.classList.add("speaking");
    await callTTS(pick).catch((e) => toastOnce(e.message));
    micBtn.classList.remove("speaking");
  }
}

function startRec() {
  if (!SpeechRecognition) {
    toastOnce("เครื่องนี้ไม่รองรับ SpeechRecognition (ลอง Chrome บน Android/desktop)");
    return;
  }
  if (!rec) {
    rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = async (ev) => {
      const text = ev.results?.[0]?.[0]?.transcript?.trim();
      if (!text) return;

      appendMsg("user", text);

      try {
        micBtn.classList.remove("listening");
        micBtn.classList.add("speaking");

        const reply = await callChat(text);
        appendMsg("assistant", reply);

        if (ttsToggle.checked && reply) {
          await callTTS(reply);
        }
      } catch (e) {
        // อย่า spam ประโยคเดิม ๆ
        toastOnce(e.message || String(e));
      } finally {
        micBtn.classList.remove("speaking");
      }
    };

    rec.onerror = (e) => {
      toastOnce(e?.error || "speech error");
      micBtn.classList.remove("listening");
      listening = false;
    };

    rec.onend = () => {
      micBtn.classList.remove("listening");
      listening = false;
    };
  }

  listening = true;
  micBtn.classList.add("listening");
  rec.start();
}

function stopRec() {
  if (!rec) return;
  try { rec.stop(); } catch {}
  micBtn.classList.remove("listening");
  listening = false;
}

micBtn.addEventListener("click", async () => {
  // tap to start/stop
  if (!introEl.classList.contains("hidden")) hideIntro();

  if (listening) stopRec();
  else startRec();
});

imgInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const dataUrl = String(reader.result || "");
    appendMsg("user", "ส่งรูปหน้างานให้แตงโมดูค่ะ");

    try {
      micBtn.classList.add("speaking");
      const reply = await callChat("ช่วยดูรูปหน้างานนี้ให้หน่อยค่ะ", dataUrl);
      appendMsg("assistant", reply);
      if (ttsToggle.checked && reply) await callTTS(reply);
    } catch (err) {
      toastOnce(err.message || String(err));
    } finally {
      micBtn.classList.remove("speaking");
    }
  };
  reader.readAsDataURL(file);
});
