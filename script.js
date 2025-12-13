/*
  Tangmo v1.5 (Front-end only)
  - Neumorphic theme
  - Card carousel menu (free scroll, no snap)
  - Viewer + thumbs + trending tones
  - Voice (Web Speech API) -> /api/chat -> /api/tts
  - No "คิดแปบ" spam: use mic glow + small toast only
*/

// =======================
// DATA
// =======================

const SERVICE_DATA = {
  design: {
    tag: "ออกแบบ / เลือกวัสดุ",
    title: "Mood & Tone ให้ลง",
    desc:
      "ช่วยดูแนวทางโทนสี วัสดุ และความรู้สึกของพื้นที่ ให้เข้ากับบ้าน/องค์กร แบบไม่ฝืน",
    bg: "wall-BG2.jpg",
  },
  curtain: {
    tag: "ผ้าม่าน",
    title: "แสง/ความเป็นส่วนตัว",
    desc:
      "แนะนำผ้าม่านตามแสง การใช้งาน และความเรียบร้อยของพื้นที่ เช่น บ้าน/สำนักงาน/ราชการ",
    bg: "curtain-bg1.jpg",
  },
  wall: {
    tag: "ผนัง",
    title: "ผนัง/งานตกแต่งผนัง",
    desc:
      "ลุคเรียบหรู ทำความสะอาดง่าย หรือเพิ่มมิติด้วยวัสดุ—เลือกให้เหมาะกับพื้นที่ใช้งานจริง",
    bg: "wall-BG1.jpg",
  },
  floor: {
    tag: "พื้น",
    title: "พื้น/วัสดุปูพื้น",
    desc:
      "โฟกัสความทนทาน การดูแลรักษา และภาพรวมของพื้นที่ให้ดูแพงแบบไม่พยายาม",
    bg: "wall-BG2.jpg",
  },
  install: {
    tag: "ติดตั้ง",
    title: "มาตรฐานงานติดตั้ง",
    desc:
      "ติดตั้งให้เรียบร้อย เนี๊ยบ เก็บงานครบ ลดความวุ่นวายหน้างาน",
    bg: "wall-BG2.jpg",
  },
  aftercar: {
    tag: "บริการหลังการขาย",
    title: "ดูแลต่อเนื่อง",
    desc:
      "งานต้องอยู่กับคุณไปนาน ๆ เลยต้องดูแล ซ่อม/ปรับ/แก้ ให้จบแบบมืออาชีพ",
    bg: "wall-BG1.jpg",
  },
};

// ตัวอย่างผลงาน (ใส่ไฟล์จริงทีหลังได้)
// ถ้ามีไฟล์อยู่ตาม path นี้ มันจะขึ้นเอง
const SERVICE_MEDIA = {
  design: ["assets/portfolio/design-1.jpg", "assets/portfolio/design-2.jpg"],
  curtain: ["assets/portfolio/curtain-1.jpg", "assets/portfolio/curtain-2.jpg"],
  wall: ["assets/portfolio/wall-1.jpg", "assets/portfolio/wall-2.jpg"],
  floor: ["assets/portfolio/floor-1.jpg", "assets/portfolio/floor-2.jpg"],
  install: ["assets/portfolio/install-1.jpg", "assets/portfolio/install-2.jpg"],
  aftercar: ["assets/portfolio/after-1.jpg"],
};

const WELCOME_LINES = [
  "สวัสดีค่ะ ที่นี่อรุณีผ้าม่านนะคะ ถึงชื่อจะเป็นผ้าม่าน แต่จริง ๆ รับงานตกแต่งภายในครบวงจรเลยค่ะ เดินดูเว็บได้สบาย ๆ นะคะ",
  "ยินดีต้อนรับค่ะ ร้านอรุณีรับงานตกแต่งภายในหลายแบบ ไม่ได้มีแค่ผ้าม่านอย่างเดียวค่ะ",
  "เข้ามาแล้วสบายใจได้เลยค่ะ ถ้าถามอะไรเมื่อไหร่ แตงโมอยู่ตรงปุ่มนี้นะคะ",
];

const TRENDING = [
  { name: "Warm Greige", code: "#D9D2C7", note: "เรียบหรู / ใช้ได้ทุกห้อง" },
  { name: "Soft Sand", code: "#E9E1D6", note: "บ้านดูอบอุ่น ไม่จืด" },
  { name: "Smoky Taupe", code: "#B9AEA1", note: "เข้ากับไม้/ทองด้าน" },
  { name: "Concrete Mist", code: "#C9CED3", note: "ทางการ / องค์กร" },
  { name: "Graphite", code: "#3B3F46", note: "ตัดกับผ้าสว่าง ดูแพง" },
  { name: "Ink Navy", code: "#233047", note: "สุภาพ มีมิติ" },
];

// =======================
// HELPERS
// =======================

function $(sel) {
  return document.querySelector(sel);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function toast(msg, ms = 1400) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => el.classList.remove("show"), ms);
}

async function safeImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// =======================
// INTRO
// =======================

(function initIntro() {
  const intro = $("#intro");
  const skip = $("#skipIntro");
  if (!intro) return;

  const doneKey = "arunee_intro_done";
  const already = sessionStorage.getItem(doneKey);
  if (already === "1") {
    intro.remove();
    document.body.classList.remove("is-intro-playing");
    // welcome once per session AFTER intro
    queueWelcome();
    return;
  }

  function finishIntro() {
    sessionStorage.setItem(doneKey, "1");
    intro.classList.add("out");
    window.setTimeout(() => {
      intro.remove();
      document.body.classList.remove("is-intro-playing");
      queueWelcome();
    }, 380);
  }

  skip?.addEventListener("click", finishIntro);
  // auto finish after 1.9s
  window.setTimeout(finishIntro, 1900);
})();

// =======================
// THEME BG (blur)
// =======================

function setBg(src) {
  const img = $("#bg-image");
  if (!img) return;
  img.src = src;
  img.classList.remove("ready");
  img.onload = () => img.classList.add("ready");
}

// =======================
// CARDS (free scroll + out-focus by distance)
// =======================

function buildCards() {
  const wrap = $("#cards");
  if (!wrap) return;

  const order = ["design", "curtain", "wall", "floor", "install", "aftercar"];
  wrap.innerHTML = "";

  order.forEach((key) => {
    const d = SERVICE_DATA[key];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.setAttribute("role", "listitem");
    btn.dataset.key = key;
    btn.innerHTML = `
      <div class="card-top">
        <span class="pill pill-soft">${d.tag}</span>
      </div>
      <div class="card-title">${d.title}</div>
      <div class="card-desc">${d.desc}</div>
    `;
    btn.addEventListener("click", () => selectService(key, true));
    wrap.appendChild(btn);
  });

  // initial
  selectService("design", false);
  // compute focus continuously
  const onTick = () => {
    applyCardFocus(wrap);
    requestAnimationFrame(onTick);
  };
  requestAnimationFrame(onTick);
}

function applyCardFocus(wrap) {
  const cards = Array.from(wrap.querySelectorAll(".card"));
  if (!cards.length) return;

  const rect = wrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;

  cards.forEach((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const dist = Math.abs(x - cx);
    const t = clamp(dist / (rect.width * 0.55), 0, 1);
    const blur = 6 * t;
    const scale = 1 - 0.06 * t;
    const opacity = 1 - 0.28 * t;
    el.style.filter = `blur(${blur.toFixed(2)}px)`;
    el.style.transform = `translateY(${(t * 4).toFixed(2)}px) scale(${scale.toFixed(3)})`;
    el.style.opacity = opacity.toFixed(3);
  });

  // pick the closest to center as "active" (visual only)
  let best = { el: null, dist: Infinity };
  cards.forEach((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const dist = Math.abs(x - cx);
    if (dist < best.dist) best = { el, dist };
  });
  cards.forEach((el) => el.classList.toggle("is-front", el === best.el));
}

// =======================
// VIEWER + THUMBS
// =======================

async function selectService(key, scrollIntoView) {
  const data = SERVICE_DATA[key];
  if (!data) return;

  // active highlight
  document.querySelectorAll(".card").forEach((c) => {
    c.classList.toggle("active", c.dataset.key === key);
  });

  // bg blur
  setBg(data.bg);

  // viewer text
  $("#viewerTag").textContent = data.tag;
  $("#viewerTitle").textContent = data.title;
  $("#viewerDesc").textContent = data.desc;

  // viewer image + thumbs
  const mainImg = $("#viewerImage");
  const placeholder = $("#viewerPlaceholder");
  const thumbs = $("#thumbs");
  thumbs.innerHTML = "";

  const candidates = (SERVICE_MEDIA[key] || []).slice(0, 12);
  const existing = [];
  for (const url of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (await safeImageExists(url)) existing.push(url);
    if (existing.length >= 10) break;
  }

  if (!existing.length) {
    mainImg.removeAttribute("src");
    mainImg.classList.remove("show");
    placeholder.style.display = "flex";
    placeholder.textContent = "(ยังไม่ใส่รูปผลงานในหมวดนี้ — ใส่ไฟล์ลง assets/portfolio ได้เลยค่ะ)";
  } else {
    placeholder.style.display = "none";
    mainImg.src = existing[0];
    mainImg.classList.add("show");
  }

  existing.forEach((url, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "thumb";
    b.setAttribute("role", "listitem");
    b.innerHTML = `<img alt="" src="${url}" loading="lazy" />`;
    if (idx === 0) b.classList.add("active");
    b.addEventListener("click", () => {
      document.querySelectorAll(".thumb").forEach((t) => t.classList.remove("active"));
      b.classList.add("active");
      placeholder.style.display = "none";
      mainImg.src = url;
      mainImg.classList.add("show");
    });
    thumbs.appendChild(b);
  });

  if (scrollIntoView) {
    $("#viewer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// =======================
// TREND GRID
// =======================

function buildTrends() {
  const grid = $("#trendGrid");
  if (!grid) return;
  grid.innerHTML = "";

  TRENDING.forEach((t) => {
    const card = document.createElement("div");
    card.className = "trend";
    card.innerHTML = `
      <div class="swatch" style="background:${t.code}"></div>
      <div class="trend-name">${t.name}</div>
      <div class="trend-code">${t.code}</div>
      <div class="trend-note">${t.note}</div>
    `;
    grid.appendChild(card);
  });
}

// =======================
// TANGMO (chat + tts)
// =======================

const state = {
  messages: [], // short-term memory (context only)
  listening: false,
  thinking: false,
  speaking: false,
};

function setMicState(next) {
  const btn = $("#micBtn");
  if (!btn) return;
  btn.classList.toggle("is-listening", !!next.listening);
  btn.classList.toggle("is-thinking", !!next.thinking);
  btn.classList.toggle("is-speaking", !!next.speaking);
}

function pushMessage(role, content) {
  state.messages.push({ role, content });
  // keep short context
  if (state.messages.length > 10) state.messages.splice(0, state.messages.length - 10);
  renderChat();
}

function renderChat() {
  const log = $("#chatLog");
  if (!log) return;
  log.innerHTML = "";
  state.messages.forEach((m) => {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${m.role}`;
    bubble.textContent = m.content;
    log.appendChild(bubble);
  });
}

function openChat() {
  const chat = $("#chat");
  if (!chat) return;
  chat.hidden = false;
  chat.classList.add("show");
}

function closeChat() {
  const chat = $("#chat");
  if (!chat) return;
  chat.classList.remove("show");
  window.setTimeout(() => (chat.hidden = true), 200);
}

$("#chatClose")?.addEventListener("click", closeChat);

async function speakText(text) {
  const toggle = $("#voiceToggle");
  if (!toggle?.checked) return;

  try {
    state.speaking = true;
    setMicState(state);

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("TTS failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      state.speaking = false;
      setMicState(state);
    };
  } catch {
    state.speaking = false;
    setMicState(state);
  }
}

async function askTangmo(userText, extra = {}) {
  if (!userText || !userText.trim()) return;

  pushMessage("user", userText.trim());
  openChat();

  state.thinking = true;
  setMicState(state);

  // IMPORTANT: no fake "คิดแปบ" text. just a toast.
  toast("Tangmo กำลังตอบ…");

  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), 22000);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: state.messages, ...extra }),
      signal: controller.signal,
    });
    window.clearTimeout(t);

    if (!res.ok) {
      throw new Error(`chat failed (${res.status})`);
    }

    const data = await res.json();
    const reply = (data?.text || data?.message || "").trim();
    if (!reply) throw new Error("empty reply");

    pushMessage("assistant", reply);
    state.thinking = false;
    setMicState(state);
    await speakText(reply);
  } catch {
    window.clearTimeout(t);
    state.thinking = false;
    setMicState(state);
    pushMessage(
      "assistant",
      "ขอโทษนะคะ ตอนนี้ระบบตอบแชทมีปัญหานิดนึง ลองใหม่อีกทีได้ไหมคะ"
    );
    await speakText("ขอโทษนะคะ ตอนนี้ระบบตอบแชทมีปัญหานิดนึง ลองใหม่อีกทีได้ไหมคะ");
  }
}

// =======================
// VOICE INPUT (tap-to-toggle)
// =======================

function initVoice() {
  const mic = $("#micBtn");
  if (!mic) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  if (!SpeechRecognition) {
    mic.addEventListener("click", () => {
      toast("เบราว์เซอร์นี้ไม่มี Voice Recognition — พิมพ์แทนได้ค่ะ");
      openChat();
    });
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = "th-TH";
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let finalText = "";

  function start() {
    finalText = "";
    state.listening = true;
    setMicState(state);
    toast("กำลังฟัง…");
    try {
      rec.start();
    } catch {
      // ignored
    }
  }

  function stop() {
    state.listening = false;
    setMicState(state);
    try {
      rec.stop();
    } catch {
      // ignored
    }
  }

  mic.addEventListener("click", () => {
    if (state.thinking || state.speaking) return;
    if (!state.listening) start();
    else stop();
  });

  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const r = event.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    // show light hint only
    if (interim.trim()) toast(interim.trim(), 900);
  };

  rec.onend = async () => {
    const text = finalText.trim();
    state.listening = false;
    setMicState(state);
    if (text) {
      await askTangmo(text);
    }
  };

  rec.onerror = () => {
    state.listening = false;
    setMicState(state);
  };
}

// =======================
// IMAGE UPLOAD -> /api/chat (multimodal)
// =======================

function initUpload() {
  const input = $("#imageInput");
  if (!input) return;

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("ขอเป็นไฟล์รูปนะคะ");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      input.value = "";
      toast("รับรูปแล้วค่ะ ส่งให้ Tangmo ดู…", 1400);
      await askTangmo("ช่วยดูรูปหน้างานนี้ให้หน่อยค่ะ", { image: dataUrl });
    };
    reader.readAsDataURL(file);
  });
}

// =======================
// WELCOME AFTER INTRO
// =======================

let _welcomeQueued = false;
async function queueWelcome() {
  if (_welcomeQueued) return;
  _welcomeQueued = true;
  const line = pickRandom(WELCOME_LINES);
  toast("Tangmo: " + line, 2400);
  await speakText(line);
}

// =======================
// BOOT
// =======================

(function boot() {
  buildCards();
  buildTrends();
  setBg(SERVICE_DATA.design.bg);
  initVoice();
  initUpload();

  // close chat when tapping outside (mobile friendly)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeChat();
  });
})();
