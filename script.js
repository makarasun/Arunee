const micBtn = document.getElementById("tangmo-mic");
const statusEl = document.getElementById("tangmo-status");

let recognition;
let isListening = false;
let memory = JSON.parse(sessionStorage.getItem("tangmo_memory") || "[]");

function setMic(state, text) {
  micBtn.className = `mic ${state}`;
  statusEl.textContent = text;
}

function saveMemory(role, content) {
  memory.push({ role, content });
  if (memory.length > 8) memory.shift();
  sessionStorage.setItem("tangmo_memory", JSON.stringify(memory));
}

// ✅ เสียงคั่นสั้นๆ แบบฟรี (ใช้เสียงของเครื่อง) เพื่อ “เปิดทางเสียง” บนมือถือ
function quickCue(text = "ขอคิดแป๊บนะคะ") {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "th-TH";
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {}
}

async function speak(text) {
  setMic("speaking", "Tangmo กำลังพูด…");
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const blob = await res.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.onended = () => setMic("idle", "แตะไมค์เพื่อคุยกับ Tangmo");
  audio.play().catch(() => {
    // ถ้าเล่นเสียงไม่ได้จริงๆ ให้บอกสถานะ
    setMic("idle", "กดไมค์อีกครั้งเพื่อฟังคำตอบนะคะ");
  });
}

// กันค้างหน้าเว็บ: ถ้าเกิน 12 วิให้แจ้ง
function withTimeout(promise, ms = 12000) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(v => { clearTimeout(id); resolve(v); }).catch(err => { clearTimeout(id); reject(err); });
  });
}

async function askTangmo(text) {
  // ✅ อย่างที่ 2: มีทั้ง UI + เสียงคั่นทันที
  setMic("thinking", "Tangmo กำลังคิด…");
  quickCue("ขอคิดแป๊บนะคะ");

  try {
    const res = await withTimeout(fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: memory })
    }), 12000);

    const data = await res.json();
    const reply = data.reply || "ขอโทษนะคะ ตอนนี้ตอบไม่ได้";

    saveMemory("user", text);
    saveMemory("assistant", reply);

    await speak(reply);
  } catch (e) {
    setMic("idle", "ขอโทษนะคะ เมื่อกี้ระบบตอบช้าหน่อย ลองถามสั้นๆ อีกทีได้ไหมคะ");
  }
}

function initSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.continuous = false;

  recognition.onstart = () => setMic("listening", "Tangmo กำลังฟัง…");

  recognition.onresult = (e) => {
    isListening = false;
    const text = e.results[0][0].transcript;
    askTangmo(text);
  };

  recognition.onerror = () => {
    isListening = false;
    setMic("idle", "ฟังไม่ชัด ลองใหม่อีกทีนะคะ");
  };
}

// ✅ แตะครั้งเดียวเริ่ม / แตะอีกครั้งหยุด
micBtn.addEventListener("click", () => {
  if (!recognition) initSpeech();

  if (!isListening) {
    isListening = true;
    recognition.start();
  } else {
    isListening = false;
    recognition.stop();
    setMic("idle", "แตะไมค์เพื่อคุยกับ Tangmo");
  }
});

setMic("idle", "แตะไมค์เพื่อคุยกับ Tangmo");
