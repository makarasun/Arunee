/* =========================================================
   Tangmo Neumo v3 (carousel + media viewer + voice + chat)
========================================================= */

const $ = (q) => document.querySelector(q);

const introEl = $("#intro");
const introSkip = $("#intro-skip");

const micBtn = $("#micBtn");
const ttsToggle = $("#ttsToggle"); // ใช้เป็นสวิตช์เปิด/ปิด chat board
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

const chatSection = $("#chat");
const chatLog = $("#chatLog");

// ---------------------------
// Services + media mapping
// ---------------------------
const SERVICES = {
  curtain: {
    title: "งานผ้าม่าน",
    desc: "ผ้าม่านและผ้าเลเยอร์ เลือกผ้า โทน และแพทเทิร์นตาม mood",
    folder: "/assets/gallery/curtain"
  },
  wall: {
    title: "งานผนัง / วอลล์",
    desc: "วอลล์เปเปอร์ ผนังตกแต่ง และพื้นผิวที่เข้ากับพื้นที่ใช้งาน",
    folder: "/assets/gallery/wall"
  },
  design: {
    title: "งานออกแบบ",
    desc: "งานออกแบบ moodboard / concept / visualization",
    folder: "/assets/gallery/design"
  },
  floor: {
    title: "งานพื้น",
    desc: "วัสดุปูพื้นหลายชนิด เลือกลายและสัมผัสที่เหมาะกับสไตล์",
    folder: "/assets/gallery/floor"
  },
  install: {
    title: "งานติดตั้ง",
    desc: "ก่อน-ระหว่าง-หลังการติดตั้ง ขั้นตอนควบคุมคุณภาพ",
    folder: "/assets/gallery/install"
  },
  aftercare: {
    title: "งานหลังการขาย",
    desc: "บริการหลังติดตั้งและการดูแลรักษา",
    folder: "/assets/gallery/aftercare"
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

// -------------------------------------------------------
// Media helpers
// -------------------------------------------------------
async function headOK(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch (e) {
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
  // fallback auto-discovery
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

function seedCardPreviewsFromSeeds(){
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

// Fullscreen toggles
async function enterFullscreen() {
  if (!viewer) return;
  if (document.fullscreenElement) return;
  try { await viewer.requestFullscreen(); } catch (e) {}
}
async function exitFullscreen() {
  if (!document.fullscreenElement) return;
  try { await document.exitFullscreen(); } catch (e) {}
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
  selectService(key, { scrollToViewer: e.detail?.via === "tap" });
});

cards.forEach((c) => {
  c.addEventListener("click", () => {
    const key = c.getAttribute("data-key");
    if (key) selectService(key, { scrollToViewer: true });
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
let lastErrorToastAt = 0;
let lastOpeningSpoken = false;

function appendMsg(role, text) {
  if (!chatLog) return;
  const d = document.createElement("div");
  d.className = `msg ${role === "user" ? "u" : "a"}`;
  d.textContent = text;
  chatLog.appendChild(d);
  chatLog.scrollTop = chatLog.scrollHeight;

  // เปิด chat board อัตโนมัติ
  if (ttsToggle) {
    ttsToggle.checked = true;
    toggleChatBoard(true);
  }
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
    "ยินดีต้อนรับสู่ร้านอรุณี ผ้าม่าน เรามีบริการตกแต่งภายในครบวงจร ตั้งแต่ผ้าม่าน วอลล์ เปเปอร์ พื้น งานออกแบบ และติดตั้ง",
    "ที่ร้านอรุณี ผ้าม่านไม่ได้มีแค่ผ้าม่านนะคะ เราดูแลงานผนัง พื้น และการออกแบบทั้งหมด เลือกการ์ดที่สนใจได้เลยค่ะ",
    "ถ้าต้องการคุยไอเดียตกแต่งครบชุด ห้องเดียวจบที่ร้านอรุณี ผ้าม่าน กดปุ่มไมค์แล้วเล่าโจทย์ได้เลยค่ะ",
    "อยากรู้ตัวอย่างงานผ้าม่าน วอลล์ เปเปอร์ หรือบริการติดตั้งทั้งหมด เลือกการ์ด แล้ว Tangmo จะเล่าให้ฟังนะคะ",
    "มีรูปหน้างานหรืออยากเห็นงานตกแต่งครบวงจร ส่งรูปขึ้นมาได้เลย Tangmo จากร้านอรุณี ผ้าม่านจะช่วยแนะนำค่ะ"
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

        if ((ttsToggle?.checked ?? true) && reply) {
          await callTTS(reply);
        }
      } catch (e) {
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
    appendMsg("user", "อัปโหลดภาพหน้างานแล้ว");

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
