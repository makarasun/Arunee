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

// เสียงคั่นสั้นๆ ฟรี เพื่อให้มือถือ “เปิดทางเสียง”
function quickCue(text = "โอเคค่ะ ขอคิดแป๊บนะคะ") {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "th-TH";
    window.speechSynthesis.speak(u);
  } catch {}
}

// ทำข้อความให้ TTS มีจังหวะ (ลด monotone)
function makeVoiceFriendly(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s/g, "$1\n")
    .replace(/ค่ะ\s/g, "ค่ะ\n")
    .replace(/นะคะ\s/g, "นะคะ\n")
    .replace(/เลย\s/g, "เลย\n");
}

async function speak(text) {
  setMic("speaking", "Tangmo กำลังพูด…");

  const voiceText = makeVoiceFriendly(text);

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: voiceText })
  });

  const blob = await res.blob();
  const audio = new Audio(URL.createObjectURL(blob));

  audio.onended = () => setMic("idle", "แตะไมค์เพื่อคุยกับ Tangmo");
  audio.play().catch(() => {
    setMic("idle", "กดไมค์อีกครั้งเพื่อฟังคำตอบนะคะ");
  });
}

function withTimeout(promise, ms = 12000) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(v => { clearTimeout(id); resolve(v); }).catch(err => { clearTimeout(id); reject(err); });
  });
}

async function askTangmo(text) {
  setMic("thinking", "Tangmo กำลังคิด…");
  quickCue("โอเคค่ะ ขอคิดแป๊บนะคะ");

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
