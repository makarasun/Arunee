/* =========================================================
   Tangmo Neumo v3 (carousel + media viewer + voice + chat + memory)
========================================================= */

const $ = (q) => document.querySelector(q);

const introEl = $("#intro");
const introSkip = $("#intro-skip");

const micBtn = $("#micBtn");
const ttsToggle = $("#ttsToggle"); // ใช้เป็นสวิตช์เปิด/ปิด chat dock
const imgInput = $("#imgInput");

const bgImg = $("#bg-image");

const viewer = $("#viewer");
const viewerTitle = $("#viewerTitle");
const viewerDesc = $("#viewerDesc");
const viewerImg = $("#viewerImg");
const viewerVideo = $("#viewerVideo");
const viewerFullBtn = $("#viewerFull");
const thumbsEl = $("#thumbs");

const ring = $("#ring");
const cards = Array.from(document.querySelectorAll(".card"));
const serviceButtons = Array.from(document.querySelectorAll(".service-btn"));
const serviceHeading = $(".service-heading");
const serviceStrip = $(".service-strip");
const serviceAudio = $("#serviceAudio");
const cardCaption = $("#cardCaption");

const chatSection = $("#chat");
const chatLog = $("#chatLog");
const AUTOHIDE_SERVICE_STRIP = false;

// ---------------------------
// Services + media mapping
// ---------------------------
const SERVICES = {
  curtain: {
    title: "งานผ้าม่าน",
    desc: "ผ้าม่านเลเยอร์ ผ้าม่านปรับแสง เลือกผ้า/โทน/สไตล์ตาม mood",
    folder: "/assets/gallery/curtain"
  },
  wall: {
    title: "งานผนัง / วอลล์",
    desc: "วอลล์เปเปอร์ ผนังตกแต่ง ผิวสัมผัสที่เข้ากับพื้นที่",
    folder: "/assets/gallery/wall"
  },
  design: {
    title: "งานออกแบบ",
    desc: "ออกแบบ moodboard / concept / visualization ห้องหรือมุมโปรด",
    folder: "/assets/gallery/design"
  },
  floor: {
    title: "งานพื้น",
    desc: "วัสดุปูพื้นหลายชนิด ลายและสัมผัสเหมาะกับสไตล์",
    folder: "/assets/gallery/floor"
  },
  install: {
    title: "งานติดตั้ง",
    desc: "ก่อน-ระหว่าง-หลังการติดตั้ง ควบคุมคุณภาพครบขั้นตอน",
    folder: "/assets/gallery/install"
  },
  aftercare: {
    title: "งานบริการหลังการขาย",
    desc: "ดูแลหลังติดตั้ง ซ่อมแซม ตรวจเช็ก บำรุงรักษา",
    folder: "/assets/gallery/aftercare"
  }
};

const SERVICE_AUDIO = {
  curtain: {
    src: "/assets/audio/service-curtain.mp3",
    script: "บริการผ้าม่านครบวงจร วัดพื้นที่จริง เลือกผ้าและรางให้เหมาะกับแสงและสไตล์บ้าน ตัดเย็บอย่างประณีต และติดตั้งให้เรียบร้อยสวยงาม."
  },
  wall: {
    src: "/assets/audio/service-wall.mp3",
    script: "บริการวอลล์เปเปอร์และผนังตกแต่ง ช่วยคัดลายที่เข้ากับบรรยากาศ พื้นผิวเนี๊ยบ ติดตั้งเรียบสนิท เพิ่มมิติให้พื้นที่ใช้งาน."
  },
  design: {
    src: "/assets/audio/service-design.mp3",
    script: "บริการออกแบบภาพรวมงาน จัดทำคอนเซ็ปต์และ moodboard ให้เห็นทิศทางชัดเจน พร้อมคำแนะนำเรื่องวัสดุและโทนสีที่ลงตัว."
  },
  floor: {
    src: "/assets/audio/service-floor.mp3",
    script: "บริการงานพื้นทั้งพื้นไม้ ลามิเนต และกระเบื้องยาง เลือกวัสดุให้เหมาะกับการใช้งาน ติดตั้งแน่นหนา เดินสบาย ดูแลง่าย."
  },
  install: {
    src: "/assets/audio/service-install.mp3",
    script: "บริการติดตั้งโดยทีมช่างมาตรฐาน เข้างานตรงเวลา ทำงานสะอาด เก็บรายละเอียดครบ เพื่อให้ใช้งานได้ยาวนานและปลอดภัย."
  },
  aftercare: {
    src: "/assets/audio/service-aftercare.mp3",
    script: "บริการดูแลหลังการขาย พร้อมรับประกันงาน ติดตามผลหลังติดตั้ง และช่วยแก้ไขเมื่อมีปัญหา ให้คุณมั่นใจได้ตลอดการใช้งาน."
  }
};

// Known media seeds + auto discovery
const KNOWN_MEDIA = {
  curtain: [
    { type: "image", src: "/assets/gallery/curtain/curtain-bg1.jpg", thumb: "/assets/gallery/curtain/curtain-bg1.jpg" }
  ],
  wall: [
    { type: "image", src: "/assets/gallery/wall/wall-BG1.jpg", thumb: "/assets/gallery/wall/wall-BG1.jpg" }
  ],
  design: [
    { type: "image", src: "/assets/gallery/design/sample-1.jpg", thumb: "/assets/gallery/design/sample-1-thumb.jpg" }
  ],
  floor: [
    { type: "image", src: "/assets/gallery/floor/floor-BG1.jpg", thumb: "/assets/gallery/floor/floor-BG1.jpg" }
  ],
  install: [
    { type: "image", src: "/assets/gallery/install/install-BG1.jpg", thumb: "/assets/gallery/install/install-BG1.jpg" }
  ],
  aftercare: [
    { type: "image", src: "/assets/gallery/aftercare/aftercar-BG1.jpg", thumb: "/assets/gallery/aftercare/aftercar-BG1.jpg" }
  ]
};

const mediaCache = {};
const IMG_EXTS = ["jpg", "jpeg", "png", "webp"];
const VID_EXTS = ["mp4", "webm"];
let selectedKey = "curtain";

function toastOnce(msg) {
  const now = Date.now();
  if (!toastOnce.last) toastOnce.last = 0;
  if (now - toastOnce.last < 5000) return;
  toastOnce.last = now;
  console.warn(msg);
}

// -------------------------------------------------------
// Memory (long/short)
// -------------------------------------------------------
const MEMORY_KEY = "tangmo_memory_v1";
let memory = {
  long: { name: null, topics: [] },
  short: [] // { text, ts, expires }
};

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (raw) memory = JSON.parse(raw);
  } catch {}
  pruneShortMemory();
}

function saveMemory() {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {}
}

function pruneShortMemory() {
  const now = Date.now();
  memory.short = (memory.short || []).filter((m) => m.expires > now);
}

function addShortMemory(text) {
  pruneShortMemory();
  memory.short.push({ text, ts: Date.now(), expires: Date.now() + 2 * 60 * 60 * 1000 });
  saveMemory();
}

function addTopic(topic) {
  if (!topic) return;
  const set = new Set(memory.long.topics || []);
  set.add(topic);
  memory.long.topics = Array.from(set).slice(-10);
  saveMemory();
}

function detectName(text) {
  const m = String(text || "").match(/ชื่อ\s*([^\s]+)/);
  if (m && m[1]) {
    memory.long.name = m[1];
    saveMemory();
  }
}

function buildMemorySummary() {
  pruneShortMemory();
  const name = memory.long.name ? `ชื่อลูกค้า: ${memory.long.name}` : "";
  const topics = (memory.long.topics || []).length
    ? `หัวข้อที่เคยคุย: ${memory.long.topics.join(", ")}`
    : "";
  const shortNotes = (memory.short || []).length
    ? `บันทึกชั่วคราว: ${memory.short.map((m) => m.text).join(" | ")}`
    : "";
  const parts = [name, topics, shortNotes].filter(Boolean);
  if (!parts.length) return "";
  return `บริบทที่จำได้: ${parts.join(" | ")}`;
}

loadMemory();

// -------------------------------------------------------
// Service strip auto-hide on scroll (swipe up)
// -------------------------------------------------------
function setupServiceStripAutoHide() {
  if (!AUTOHIDE_SERVICE_STRIP) return;
  if (!serviceStrip && !serviceHeading) return;
  let lastY = window.scrollY || 0;
  const threshold = 6;

  window.addEventListener("scroll", () => {
    const y = window.scrollY || 0;
    const delta = y - lastY;
    if (Math.abs(delta) < threshold) return;

    if (y <= 10) {
      serviceStrip?.classList.remove("is-hidden");
      serviceHeading?.classList.remove("is-hidden");
    } else if (delta > 0) {
      serviceStrip?.classList.add("is-hidden");
      serviceHeading?.classList.add("is-hidden");
    } else {
      serviceStrip?.classList.remove("is-hidden");
      serviceHeading?.classList.remove("is-hidden");
    }
    lastY = y;
  }, { passive: true });
}

setupServiceStripAutoHide();

// -------------------------------------------------------
// Intro
// -------------------------------------------------------
function hideIntro() {
  if (!introEl) return;
  introEl.classList.add("hidden");
  sayOpeningOnce();
}
if (introSkip) introSkip.addEventListener("click", hideIntro);
if (introEl) introEl.addEventListener("click", (e) => {
  if (e.target === introEl) hideIntro();
});
function armOpeningGreeting() {
  if (armOpeningGreeting.armed) return;
  armOpeningGreeting.armed = true;
  const trigger = () => {
    if (introEl && !introEl.classList.contains("hidden")) hideIntro();
    else sayOpeningOnce();
  };
  window.addEventListener("pointerdown", trigger, { once: true });
  window.addEventListener("keydown", trigger, { once: true });
}
armOpeningGreeting();

// -------------------------------------------------------
// Media helpers
// -------------------------------------------------------
async function headOK(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function findWithExts(base, name, exts) {
  for (const ext of exts) {
    const url = `${base}/${name}.${ext}`;
    if (await headOK(url)) return url;
  }
  return null;
}

async function discoverPattern(folder, prefix, isVideo) {
  const maxTry = 10;
  const exts = isVideo ? VID_EXTS : IMG_EXTS;
  const out = [];
  for (let i = 1; i <= maxTry; i++) {
    const main = await findWithExts(folder, `${prefix}-${i}`, exts);
    if (!main) continue;
    const thumb = await findWithExts(folder, `${prefix}-${i}-thumb`, IMG_EXTS);
    out.push({ type: isVideo ? "video" : "image", src: main, thumb: thumb || main });
  }
  return out;
}

function dedupeMedia(list) {
  const seen = new Set();
  return list.filter((m) => {
    if (!m?.src) return false;
    const k = m.src;
    if (seen.has(k)) return false;
    seen.add(k);
    if (!m.thumb) m.thumb = m.src;
    return true;
  });
}

async function ensureMedia(key) {
  if (mediaCache[key]) return mediaCache[key];
  const cfg = SERVICES[key];
  if (!cfg) return [];

  const seed = KNOWN_MEDIA[key] ? [...KNOWN_MEDIA[key]] : [];
  const autos = await discoverPattern(cfg.folder, "sample", false);
  const autosV = await discoverPattern(cfg.folder, "vsample", true);

  const merged = dedupeMedia([...seed, ...autos, ...autosV]);
  mediaCache[key] = merged;
  return merged;
}

function setBackground(src) {
  if (!bgImg) return;
  bgImg.src = src || "";
}

// -------------------------------------------------------
// Viewer render
// -------------------------------------------------------
function showMedia(item) {
  if (!item) return;
  if (item.type === "video") {
    viewerImg.classList.add("hidden");
    viewerVideo.classList.remove("hidden");
    viewerVideo.src = item.src;
    viewerVideo.poster = item.thumb || "";
    viewerVideo.loop = true;
    viewerVideo.muted = true;
    viewerVideo.play().catch(() => {});
  } else {
    viewerVideo.pause?.();
    viewerVideo.classList.add("hidden");
    viewerImg.classList.remove("hidden");
    viewerImg.src = item.src;
  }
}

function renderThumbs(list) {
  if (!thumbsEl) return;
  thumbsEl.innerHTML = "";
  list.forEach((item, idx) => {
    const b = document.createElement("button");
    b.className = "thumb";
    b.type = "button";
    b.innerHTML = `<img alt="" src="${item.thumb || item.src}" />`;
    b.addEventListener("click", () => {
      thumbsEl.querySelectorAll(".thumb").forEach((t) => t.classList.remove("active"));
      b.classList.add("active");
      showMedia(item);
      setBackground(item.src);
      addShortMemory(`ลูกค้าดูสื่อ: ${item.src}`);
    });
    if (idx === 0) b.classList.add("active");
    thumbsEl.appendChild(b);
  });
}

function ensureCardPreview(key, mediaList) {
  const card = cards.find((c) => c.dataset.key === key);
  if (!card || !mediaList.length) return;
  let preview = card.querySelector(".card-preview");
  if (!preview) {
    preview = document.createElement("div");
    preview.className = "card-preview";
    preview.innerHTML = `<video class="hidden" playsinline muted loop></video><img alt="" />`;
    card.appendChild(preview);
  }
  const pvVid = preview.querySelector("video");
  const pvImg = preview.querySelector("img");
  const first = mediaList[0];

  if (first.type === "video") {
    pvVid.src = first.src;
    pvVid.classList.remove("hidden");
    pvImg.classList.add("hidden");
    pvVid.play().catch(() => {});
  } else {
    pvImg.src = first.thumb || first.src;
    pvImg.classList.remove("hidden");
    pvVid.classList.add("hidden");
  }
}

function seedCardPreviewsFromSeeds() {
  cards.forEach((c) => {
    const key = c.dataset.key;
    const list = KNOWN_MEDIA[key];
    if (list && list.length) ensureCardPreview(key, list);
  });
}

async function selectService(key, opts = {}) {
  const cfg = SERVICES[key] || SERVICES.curtain;
  selectedKey = key;
  viewerTitle.textContent = cfg.title;
  viewerDesc.textContent = cfg.desc;
  setServiceActive(key);

  addTopic(cfg.title);

  const media = await ensureMedia(key);
  const first = media[0];
  if (first) {
    setBackground(first.src);
    showMedia(first);
  }
  renderThumbs(media);
  ensureCardPreview(key, media);

  if (opts.scrollToViewer && viewer) {
    viewer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setServiceActive(key) {
  if (!serviceButtons.length) return;
  serviceButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.service === key);
  });
}

function focusCarouselCard(key) {
  if (!cards.length) return false;
  const target = cards.find((c) => c.dataset.key === key);
  if (!target) return false;
  window.dispatchEvent(new CustomEvent("carousel:go", { detail: { key, via: "service" } }));
  return true;
}

let speakingCard = null;

function setCaption(text) {
  if (!cardCaption) return;
  cardCaption.textContent = text || "";
  cardCaption.classList.toggle("show", !!text);
}

function clearCaption() {
  if (!cardCaption) return;
  cardCaption.textContent = "";
  cardCaption.classList.remove("show");
}

function setSpeakingCard(card) {
  if (speakingCard && speakingCard !== card) {
    speakingCard.classList.remove("is-speaking");
  }
  speakingCard = card || null;
  speakingCard?.classList.add("is-speaking");
}

function clearSpeakingCard() {
  if (!speakingCard) return;
  speakingCard.classList.remove("is-speaking");
  speakingCard = null;
}

function stopServiceAudio() {
  if (!serviceAudio) return;
  try {
    serviceAudio.pause();
    serviceAudio.currentTime = 0;
  } catch {}
}

function playServiceAudio(key, card) {
  const cfg = SERVICE_AUDIO[key];
  if (!cfg || !serviceAudio) return;
  try {
    stopServiceAudio();
    clearSpeakingCard();
    setCaption(cfg.script);
    setSpeakingCard(card);
    serviceAudio.pause();
    serviceAudio.currentTime = 0;
    serviceAudio.src = cfg.src;
    serviceAudio.play().catch(() => {
      clearSpeakingCard();
      clearCaption();
      toastOnce("ไม่สามารถเล่นเสียงได้");
    });
  } catch (e) {
    clearSpeakingCard();
    clearCaption();
    toastOnce(e.message || String(e));
  }
}

if (serviceAudio) {
  serviceAudio.addEventListener("ended", () => {
    clearSpeakingCard();
    clearCaption();
  });
  serviceAudio.addEventListener("error", () => {
    clearSpeakingCard();
    clearCaption();
  });
}


// Fullscreen toggles
async function enterFullscreen() {
  if (!viewer) return;
  if (document.fullscreenElement) return;
  try { await viewer.requestFullscreen(); } catch {}
}
async function exitFullscreen() {
  if (!document.fullscreenElement) return;
  try { await document.exitFullscreen(); } catch {}
}
function toggleFullscreen() {
  if (document.fullscreenElement) exitFullscreen();
  else enterFullscreen();
}

// Orientation trigger fullscreen (landscape)
function setupOrientationFullscreen() {
  const mql = window.matchMedia("(orientation: landscape)");
  const handler = (e) => {
    if (e.matches) enterFullscreen();
    else exitFullscreen();
  };
  mql.addEventListener("change", handler);
}

// -------------------------------------------------------
// Chat board toggle (switch)
// -------------------------------------------------------
function toggleChatBoard(show) {
  if (!chatSection) return;
  chatSection.classList.toggle("show", !!show);
  chatSection.classList.toggle("hidden", !show);
}
if (ttsToggle) {
  toggleChatBoard(ttsToggle.checked);
  ttsToggle.addEventListener("change", () => toggleChatBoard(ttsToggle.checked));
}

// -------------------------------------------------------
// Carousel sync hooks
// -------------------------------------------------------
if (viewerFullBtn) viewerFullBtn.addEventListener("click", toggleFullscreen);
setupOrientationFullscreen();

// bridge from carousel.circular.js
window.addEventListener("carousel:select", (e) => {
  const key = e.detail?.key;
  if (!key) return;
  const via = e.detail?.via;
  selectService(key, { scrollToViewer: via === "tap" });
  const cardEl = cards.find((c) => c.dataset.key === key);
  if (via === "tap") {
    playServiceAudio(key, cardEl);
  } else {
    stopServiceAudio();
    clearSpeakingCard();
    clearCaption();
  }
});

serviceButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.service;
    if (!key) return;
    const moved = focusCarouselCard(key);
    if (!moved) selectService(key, { scrollToViewer: false });
    stopServiceAudio();
    clearSpeakingCard();
    clearCaption();
  });
});

// init viewer + previews
seedCardPreviewsFromSeeds();
selectService(selectedKey);

// =========================================================
// Tangmo voice/chat
// =========================================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
let listening = false;
let lastOpeningSpoken = false;
let micRestartTimer = 0;

function appendMsg(role, text, attachment) {
  if (!chatLog) return;
  const d = document.createElement("div");
  d.className = `msg ${role === "user" ? "u" : "a"}`;
  if (attachment) {
    d.innerHTML = `<div class="msg-text">${text || ""}</div>`;
    if (attachment.type === "image") {
      const img = document.createElement("img");
      img.src = attachment.src;
      img.alt = attachment.alt || "";
      img.style.maxWidth = "100%";
      img.style.borderRadius = "12px";
      img.style.marginTop = "8px";
      d.appendChild(img);
    }
  } else {
    d.textContent = text;
  }
  chatLog.appendChild(d);
  chatLog.scrollTop = chatLog.scrollHeight;

  if (ttsToggle) {
    ttsToggle.checked = true;
    toggleChatBoard(true);
  }
}

async function callChat(userText, imageDataUrl = null) {
  detectName(userText);
  addShortMemory(`ลูกค้าถาม: ${userText}`);

  const memorySummary = buildMemorySummary();
  const payloadMessages = [];
  if (memorySummary) payloadMessages.push({ role: "system", content: memorySummary });
  payloadMessages.push({ role: "user", content: userText });

  const payload = {
    messages: payloadMessages,
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
    "สวัสดีค่ะ น้องม่านนะคะ ถ้าสงสัยอะไร ถามน้องได้เลยนะคะ หรือกดปุ่มด้านล่าง  จะมี [whispers] เสียงลุงแก่ๆ  จากทีมช่าง [laughs]  คอยอธิบายโซนบริการต่างๆ  ของร้านอรุณีผ้าม่าน   ให้ฟังนะคะ",
    "ยินดีต้อนรับสู่ร้าน อรุณีผ้าม่าน ชื่อร้านมีคำว่าผ้าม่านแต่บริการครบวงจร ผ้าม่าน ผนัง พื้น ออกแบบ ติดตั้ง และดูแลหลังการขายค่ะ",
    "น้องม่านช่วยดีไซน์และจัดวัสดุทั้งห้องให้จบที่เดียว ทีมช่างใจดี สายชิลล์ ปรึกษาได้ทุกเรื่องตั้งแต่ผ้าม่าน วอลล์ ไปจนถึงพื้นและงานติดตั้ง",
    "อยากดูโทนสีหรือขอคำแนะนำติดตั้ง น้องม่านช่วยเล่าและเลือกตัวอย่างให้ได้ทันทีค่ะ",
    "ส่งรูปหน้างานมาได้เลย น้องม่านจะช่วยวิเคราะห์และแนะนำวัสดุที่เหมาะ พร้อมส่งต่อให้ทีมช่างได้ค่ะ",
    "คุยกับน้องม่านได้ทั้งเรื่องผ้าม่าน วอลล์ พื้น หรือบริการติดตั้ง-หลังการขาย บอกสิ่งที่ต้องการได้เลยค่ะ"
  ];
  const pick = lines[Math.floor(Math.random() * lines.length)];

  if (ttsToggle?.checked ?? true) {
    micBtn?.classList.add("speaking");
    await callTTS(pick).catch((e) => toastOnce(e.message));
    micBtn?.classList.remove("speaking");
  }
}

function startRec() {
  if (!SpeechRecognition) {
    toastOnce("เบราว์เซอร์นี้ไม่รองรับ SpeechRecognition (แนะนำ Chrome)");
    return;
  }
  if (!rec) {
    rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = async (ev) => {
      const result = ev.results?.[ev.results.length - 1];
      if (!result?.isFinal) return;
      const text = result[0]?.transcript?.trim();
      if (!text) return;

      appendMsg("user", text);

      try {
        micBtn.classList.remove("listening");
        micBtn.classList.add("speaking");

        const reply = await callChat(text);
        appendMsg("assistant", reply);

        if ((ttsToggle?.checked ?? true) && reply) {
          await callTTS(reply);
        }
      } catch (e) {
        toastOnce(e.message || String(e));
      } finally {
        micBtn.classList.remove("speaking");
        micBtn.classList.add("listening");
      }
    };

    rec.onerror = (e) => {
      toastOnce(e?.error || "speech error");
      micBtn.classList.remove("listening");
      listening = false;
    };

    rec.onend = () => {
      micBtn.classList.remove("listening");
      if (listening) {
        clearTimeout(micRestartTimer);
        micRestartTimer = setTimeout(() => {
          try { rec.start(); } catch {}
        }, 300);
      }
    };
  }

  listening = true;
  micBtn.classList.add("listening");
  try { rec.start(); } catch {}
}

function stopRec() {
  listening = false;
  if (!rec) return;
  try { rec.stop(); } catch {}
  micBtn.classList.remove("listening");
}

micBtn?.addEventListener("click", async () => {
  if (introEl && !introEl.classList.contains("hidden")) hideIntro();
  if (listening) stopRec();
  else startRec();
});

imgInput?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const dataUrl = String(reader.result || "");
    appendMsg("user", "อัปโหลดภาพหน้างานแล้ว", { type: "image", src: dataUrl });
    addShortMemory("ลูกค้าอัปโหลดภาพหน้างาน");

    try {
      micBtn?.classList.add("processing");
      const reply = await callChat("ช่วยวิเคราะห์ภาพหน้างานนี้ และแนะนำวัสดุ/โทนสีให้หน่อย", dataUrl);
      appendMsg("assistant", reply);
      if ((ttsToggle?.checked ?? true) && reply) await callTTS(reply);
    } catch (err) {
      toastOnce(err.message || String(err));
    } finally {
      micBtn?.classList.remove("processing");
    }
  };
  reader.readAsDataURL(file);
});
