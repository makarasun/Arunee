// =========================
// Tangmo UX (mic-first + optional drawer)
// =========================
const micBtn = document.getElementById("tangmo-mic");
const statusEl = document.getElementById("tangmo-status");
const drawer = document.getElementById("tangmo-drawer");
const handle = document.getElementById("drawer-handle");
const textInput = document.getElementById("tangmo-text");
const sendBtn = document.getElementById("tangmo-send");
const clearBtn = document.getElementById("tangmo-clear");
const imgInput = document.getElementById("tangmo-image");
const chatEl = document.getElementById("tangmo-chat");

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

// Tap on handle toggles drawer (noob-friendly)
if (handle) handle.addEventListener("click", () => openDrawer(!drawer.classList.contains("is-open")));

// Quick cue (browser voice) to avoid silence
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

  // รองรับทั้งแบบส่งกลับเป็นไฟล์เสียง (blob) และแบบ JSON (บางคนทำ endpoint คนละแบบ)
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  let audio;
  if (ct.includes("application/json")) {
    const j = await res.json();
    // ตัวอย่างที่เจอบ่อย: { audio_base64: "..." } หรือ { audio: "base64..." }
    const b64 = j.audio_base64 || j.audio || "";
    if (!b64) throw new Error("tts-json-no-audio");
    const bin = atob(b64.replace(/^data:audio\/[a-zA-Z0-9.+-]+;base64,/, ""));
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

function withTimeout(promise, ms = 12000) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(id);
        reject(e);
      });
  });
}

async function askTangmo(text, imageBase64 = null) {
  setMic("thinking", "Tangmo กำลังคิด…");
  quickCue("โอเคค่ะ ขอคิดแป๊บนะคะ");

  if (chatEl) pushChat("user", text);

  try {
    const msgText = imageBase64 ? `${text}\n\n[แนบรูปภาพ 1 รูป]` : text;

    // ทำ payload หลายแบบ เผื่อ endpoint คนละเวอร์ชัน (กันพัง)
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

    // รองรับ response หลายรูปแบบ
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

    if (chatEl) pushChat("assistant", reply);
    await speak(reply);
  } catch (e) {
    const fallback = "ขอโทษนะคะ เมื่อกี้ระบบตอบช้าหน่อย ลองถามสั้นๆ อีกทีได้ไหมคะ";
    if (chatEl) pushChat("assistant", fallback);
    setMic("idle", fallback);
  }
}

function initSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setMic("idle", "มือถือเครื่องนี้ไม่รองรับ Speech Recognition ค่ะ (พิมพ์ถามแทนได้)");
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

    // Convert to base64 (lightweight)
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

// =========================
// Services UI
// =========================
const SERVICE_DATA = {
  design: {
    tag: "งานออกแบบ",
    title: "ออกแบบ Mood & Tone / เลือกวัสดุ",
    desc: "ช่วยจัดแนวทางดีไซน์ เลือกโทนผ้า/ผนัง/พื้นให้เข้ากับพื้นที่ใช้งานจริง",
    bullets: [
      ["เหมาะกับ", "บ้าน / โชว์รูม / สำนักงาน"],
      ["ได้อะไร", "แนวทาง + ตัวเลือกวัสดุ"],
      ["จุดเด่น", "คุมโทนให้ดูแพง"],
      ["สไตล์", "เรียบหรู ไม่รก"],
    ],
  },
  curtain: {
    tag: "ผ้าม่าน",
    title: "ผ้าม่าน มู่ลี่ ม่านปรับแสง",
    desc: "เลือกชนิดผ้า/ระบบรางตามแสง การใช้งาน และความเป็นส่วนตัว",
    bullets: [
      ["แสงแรง", "เน้นกันยูวี / ทึบแสง"],
      ["ทำความสะอาด", "เลือกผ้าดูแลง่าย"],
      ["ฟังก์ชัน", "กันร้อน / เก็บแสง"],
      ["ภาพรวม", "ดูเรียบร้อย"],
    ],
  },
  wall: {
    tag: "ผนัง",
    title: "วอลเปเปอร์ สีผนัง ฉากกั้น",
    desc: "เพิ่มคาแรกเตอร์ห้องแบบคุมโทน ทำให้ดูใหม่แต่ไม่เวอร์",
    bullets: [
      ["หน่วยงาน", "โทนสุภาพ สะอาด"],
      ["บ้าน", "อุ่น นุ่ม"],
      ["งานไว", "ติดตั้งเป็นระบบ"],
      ["คุมภาพรวม", "ไม่หลุดธีม"],
    ],
  },
  floor: {
    tag: "พื้น",
    title: "ปูพื้น วินิล กระเบื้องยาง",
    desc: "เลือกวัสดุให้เหมาะกับการเดิน การทำความสะอาด และการใช้งานจริง",
    bullets: [
      ["ทนใช้งาน", "เหมาะองค์กร/หน่วยงาน"],
      ["ดูแลง่าย", "เช็ดถูสะดวก"],
      ["ความปลอดภัย", "กันลื่น"],
      ["ความสวย", "ลายเรียบ ดูแพง"],
    ],
  },
  install: {
    tag: "ติดตั้ง",
    title: "วัดหน้างาน ติดตั้ง เก็บงาน",
    desc: "ทีมช่างเก็บรายละเอียดเรียบร้อย งานจบ ไม่ทิ้งงาน",
    bullets: [
      ["มาตรฐาน", "วัดจริง ติดตั้งจริง"],
      ["ความเรียบร้อย", "เก็บขอบ/ราง"],
      ["เวลา", "นัดหมายชัดเจน"],
      ["ผลลัพธ์", "ดูเนี๊ยบ"],
    ],
  },
  org: {
    tag: "งานหน่วยงาน/องค์กร",
    title: "งานราชการ โรงพยาบาล อำเภอ",
    desc: "โทนเรียบร้อย ดูเป็นทางการ วัสดุเน้นทนและดูแลง่าย",
    bullets: [
      ["ภาพลักษณ์", "สุภาพ เป็นระเบียบ"],
      ["ความทน", "ใช้งานหนักได้"],
      ["ทำความสะอาด", "ง่าย"],
      ["เอกสาร", "คุยงานเป็นระบบ"],
    ],
  },
};

const rail = document.getElementById("service-rail");
const vTag = document.getElementById("viewer-tag");
const vTitle = document.getElementById("viewer-title");
const vDesc = document.getElementById("viewer-desc");
const vGrid = document.getElementById("viewer-grid");

function renderServiceCards() {
  if (!rail) return;
  rail.innerHTML = "";

  Object.entries(SERVICE_DATA).forEach(([key, s], idx) => {
    const card = document.createElement("div");
    card.className = "card" + (idx === 0 ? " is-active" : "");
    card.dataset.key = key;

    card.innerHTML = `
      <div class="card__title">${s.tag}</div>
      <p class="card__desc">${s.desc}</p>
    `;

    card.addEventListener("click", () => selectService(key));
    rail.appendChild(card);
  });
}

function selectService(key) {
  const s = SERVICE_DATA[key];
  if (!s) return;

  rail?.querySelectorAll(".card").forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));

  if (vTag) vTag.textContent = s.tag;
  if (vTitle) vTitle.textContent = s.title;
  if (vDesc) vDesc.textContent = s.desc;

  if (vGrid) {
    vGrid.innerHTML = "";
    (s.bullets || []).forEach(([t, b]) => {
      const d = document.createElement("div");
      d.className = "mini";
      d.innerHTML = `<div class="mini__t">${t}</div><p class="mini__b">${b}</p>`;
      vGrid.appendChild(d);
    });
  }
}

renderServiceCards();
selectService(Object.keys(SERVICE_DATA)[0]);

// =========================
// Topbar auto-hide on scroll
// =========================
const topbar = document.getElementById("topbar");
let lastY = window.scrollY;
window.addEventListener("scroll", () => {
  if (!topbar) return;
  const y = window.scrollY;
  const goingDown = y > lastY;
  if (goingDown && y > 30) topbar.classList.add("is-hidden");
  else topbar.classList.remove("is-hidden");
  lastY = y;
});

// footer year
const y = document.getElementById("y");
if (y) y.textContent = new Date().getFullYear();
