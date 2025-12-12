/* =========================
   TANGMO SCRIPT (CLEAN)
   ========================= */

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

async function speak(text) {
  setMic("speaking", "Tangmo กำลังพูด…");

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const blob = await res.blob();
  const audio = new Audio(URL.createObjectURL(blob));

  audio.onended = () => {
    setMic("idle", "แตะไมค์เพื่อคุยกับ Tangmo");
  };

  audio.play();
}

async function askTangmo(text) {
  setMic("thinking", "Tangmo กำลังคิด…");

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      history: memory
    })
  });

  const data = await res.json();
  const reply = data.reply || "ขอโทษนะคะ ตอนนี้ตอบไม่ได้";

  saveMemory("user", text);
  saveMemory("assistant", reply);

  speak(reply);
}

function initSpeech() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.continuous = false;

  recognition.onstart = () => {
    setMic("listening", "Tangmo กำลังฟัง…");
  };

  recognition.onresult = (e) => {
    isListening = false;
    askTangmo(e.results[0][0].transcript);
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
