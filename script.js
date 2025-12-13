// =========================
// Utils
// =========================
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

function withTimeout(promise, ms = 12000) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(id); resolve(v); })
           .catch((e) => { clearTimeout(id); reject(e); });
  });
}

// =========================
// Topbar auto-hide
// =========================
const topbar = $("#topbar");
let lastY = window.scrollY;
window.addEventListener("scroll", () => {
  if (!topbar) return;
  const y = window.scrollY;
  const goingDown = y > lastY;
  if (goingDown && y > 30) topbar.classList.add("is-hidden");
  else topbar.classList.remove("is-hidden");
  lastY = y;
});

// =========================
// Reveal on scroll (free scroll + reveal)
// =========================
const revealEls = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add("is-in");
  });
}, { threshold: 0.12 });

revealEls.forEach((el) => io.observe(el));

// =========================
// Stage BG swap (blur/outfocus vertical images)
// =========================
function setStageBg(bgName) {
  const imgs = $$(".stageBg__img");
  imgs.forEach((el) => {
    const isMatch = el.dataset.bg === bgName;
    el.classList.toggle("is-active", isMatch);
  });
  // fallback ถ้าไม่มีชื่อ
  const anyActive = imgs.some((el) => el.classList.contains("is-active"));
  if (!anyActive) {
    const def = imgs.find((x) => x.dataset.bg === "bg-default");
    def?.classList.add("is-active");
  }
}
setStageBg("bg-default");

// =========================
// Carousel 3D Ring (free drag rotate)
// =========================
const ring = $("#ring");
const cards = $$(".card3d");

let angle = 0;          // current rotation
let velocity = 0;       // inertia
let isDown = false;
let lastX = 0;

function layoutRing() {
  if (!ring || cards.length === 0) return;
  const n = cards.length;
  const step = 360 / n;
  const radius = 320; // depth
  cards.forEach((card, i) => {
    const a = step * i;
    // Each card stands facing out
    card.style.transform = `rotateY(${a}deg) translateZ(${radius}px)`;
  });
}
layoutRing();

function setRingRotation(a) {
  if (!ring) return;
  ring.style.transform = `rotateY(${a}deg)`;
}

function animateRing() {
  // inertia decay
  angle += velocity;
  velocity *= 0.92;
  if (Math.abs(velocity) < 0.0008) velocity = 0;

  setRingRotation(angle);
  requestAnimationFrame(animateRing);
}
animateRing();

function pointerDown(x) {
  isDown = true;
  lastX = x;
}
function pointerMove(x) {
  if (!isDown) return;
  const dx = x - lastX;
  lastX = x;

  // sensitivity
  const delta = dx * 0.22;
  angle += delta;
  velocity = delta; // keep inertia
}
function pointerUp() {
  isDown = false;
}

if (ring) {
  // mouse
  ring.addEventListener("mousedown", (e) => pointerDown(e.clientX));
  window.addEventListener("mousemove", (e) => pointerMove(e.clientX));
  window.addEventListener("mouseup", pointerUp);

  // touch
  ring.addEventListener("touchstart", (e) => pointerDown(e.touches[0].clientX), { passive: true });
  ring.addEventListener("touchmove", (e) => pointerMove(e.touches[0].clientX), { passive: true });
  ring.addEventListener("touchend", pointerUp);
}

// Select card -> scroll to section + set BG
function setActiveCard(card) {
  cards.forEach((c) => c.classList.toggle("is-active", c === card));
}

cards.forEach((card) => {
  card.addEventListener("click", () => {
    setActiveCard(card);

    const bg = card.dataset.bg || "bg-default";
    setStageBg(bg);

    const target = card.dataset.target;
    if (target) {
      const el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

// Default select first card
if (cards[0]) setActiveCard(cards[0]);

// =========================
// Tangmo (mic + drawer + chat)  (ใช้ endpoint เดิม /api/chat และ /api/tts)
// =========================
const micBtn = $("#tangmo-mic");
const statusEl = $("#tangmo-status");
const drawer = $("#tangmo-drawer");
const handle = $("#drawer-handle");
const textInput = $("#tangmo-text");
const sendBtn = $("#tangmo-send");
const clearBtn = $("#tangmo-clear");
const imgInput = $("#tangmo-image");
const chatEl = $("#tangmo-chat");

let recognition;
let isListening = false;
let memory = JSON.parse(sessionStorage.getItem("tangmo_memory") || "[]");

function setMic(state, text) {
  if (!micBtn) return;
  micBtn.className = `mic ${state}`;
  if (statusEl) statusEl.textContent = text;
}

function pushChat(role, text) {
  if (!chatEl) return;
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = text;
  wrap.appendChild(b);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function saveMemory(role, content) {
  memory.push({ role, content });
  if (memory.length > 10) memory.shift();
  sessionStorage.setItem("tangmo_memory", JSON.stringify(memory));
}

function openDrawer(open) {
  if (!drawer) return;
  drawer.classList.toggle("is-open", !!open);
  drawer.setAttribute("aria-hidden", open ? "false" : "true");
}
if (handle) handle.addEventListener("click", () => openDrawer(!drawer.classList.contains("is-open")));

function quickCue(text = "โอเคค่ะ ขอคิดแป๊บนะคะ") {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "th-TH";
    window.speechSynthesis.speak(u);
  } catch {}
}

function makeVoiceFriendly(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s/g, "$1\n")
    .replace(/ค่ะ\s/g, "ค่ะ\n")
    .replace(/นะคะ\s/g, "นะคะ\n")
    .trim();
}

async function speak(text) {
  setMic("speaking", "Tangmo กำลังพูด…");

  const voiceText = makeVoiceFriendly(text);
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: voiceText }),
  });

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  let audio;
  if (ct.includes("application/json")) {
    const j = await res.json();
    const b64 = j.audio_base64 || j.audio || "";
    if (!b64) throw new Error("tts-json-no-audio");
    const raw = b64.replace(/^data:audio\/[a-zA-Z0-9.+-]+;base64,/, "");
    const bin = atob(raw);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    audio = new Audio(URL.createObjectURL(blob));
  } else {
    const blob = await res.blob();
    audio = new Audio(URL.createObjectURL(blob));
  }

  audio.onended = () => setMic("idle", "แตะไมค์เพื่อคุยกับ Tangmo");
  audio.play().catch(() => setMic("idle", "แตะไมค์อีกครั้งได้เลยนะคะ"));
}

async function postChatPayload(payload) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`chat-http-${res.status}`);
  return res.json();
}

async function askTangmo(text, imageBase64 = null) {
  setMic("thinking", "Tangmo กำลังคิด…");
  quickCue("โอเคค่ะ ขอคิดแป๊บนะคะ");

  pushChat("user", text);

  try {
    const msgText = imageBase64 ? `${text}\n\n[แนบรูปภาพ 1 รูป]` : text;
    const messages = [...(memory || []), { role: "user", content: msgText }].slice(-12);

    const payloads = [
      { message: msgText, history: memory, image: imageBase64 || undefined },
      { text: msgText, history: memory, image: imageBase64 || undefined },
      { input: msgText, history: memory, image: imageBase64 || undefined },
      { messages, image: imageBase64 || undefined },
      { messages, image_base64: imageBase64 || undefined },
    ];

    let data = null;
    let lastErr = null;

    for (const p of payloads) {
      try {
        data = await withTimeout(postChatPayload(p), 12000);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!data) throw lastErr || new Error("chat-no-response");

    const reply =
      data.reply ||
      data.text ||
      data.output_text ||
      data?.message ||
      data?.choices?.[0]?.message?.content ||
      (Array.isArray(data?.choices?.[0]?.message?.content)
        ? data.choices[0].message.content.map((x) => x.text || "").join(" ")
        : "") ||
      "ขอโทษนะคะ ตอนนี้ตอบไม่ได้";

    saveMemory("user", text);
    saveMemory("assistant", reply);

    pushChat("assistant", reply);
    await speak(reply);
  } catch (e) {
    const fallback = "ขอโทษนะคะ เมื่อกี้ระบบตอบช้าหน่อย ลองถามสั้นๆ อีกทีได้ไหมคะ";
    pushChat("assistant", fallback);
    setMic("idle", fallback);
  }
}

function initSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setMic("idle", "เครื่องนี้ไม่รองรับ Speech Recognition ค่ะ (พิมพ์ถามแทนได้)");
    openDrawer(true);
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.continuous = false;

  recognition.onstart = () => setMic("listening", "Tangmo กำลังฟัง…");
  recognition.onresult = (e) => {
    isListening = false;
    const text = e.results?.[0]?.[0]?.transcript || "";
    if (text.trim()) askTangmo(text.trim());
    else setMic("idle", "ฟังไม่ชัด ลองใหม่อีกทีนะคะ");
  };
  recognition.onerror = () => {
    isListening = false;
    setMic("idle", "ฟังไม่ชัด ลองใหม่อีกทีนะคะ");
  };
}

if (micBtn) {
  micBtn.addEventListener("click", () => {
    if (!recognition) initSpeech();
    if (!recognition) return;

    // tap once = start, tap again = stop
    if (!isListening) {
      isListening = true;
      try {
        recognition.start();
      } catch {
        isListening = false;
        setMic("idle", "แตะอีกครั้งเพื่อเริ่มฟังนะคะ");
      }
    } else {
      isListening = false;
      try { recognition.stop(); } catch {}
      setMic("idle", "แตะไมค์เพื่อคุยกับ Tangmo");
    }
  });
}

if (sendBtn) {
  sendBtn.addEventListener("click", () => {
    const t = (textInput?.value || "").trim();
    if (!t) return;
    textInput.value = "";
    openDrawer(true);
    askTangmo(t);
  });
}
if (textInput) {
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn?.click();
  });
}
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    memory = [];
    sessionStorage.removeItem("tangmo_memory");
    if (chatEl) chatEl.innerHTML = "";
    setMic("idle", "ล้างบทสนทนาแล้วค่ะ");
  });
}
if (imgInput) {
  imgInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "");
      openDrawer(true);
      askTangmo("ช่วยดูรูปหน้างานนี้ให้หน่อยค่ะ", base64);
      imgInput.value = "";
    };
    reader.readAsDataURL(file);
  });
}

setMic("idle", "แตะไมค์เพื่อคุยกับ Tangmo");

// footer year
const y = $("#y");
if (y) y.textContent = new Date().getFullYear();
