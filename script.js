/* =========================
   TANGMO SCRIPT (TTS FIX)
   ========================= */

const API_BASE = ""; // ใช้ลิงก์เดียวกับเว็บ (vercel)

let isListening = false;
let recognition;
let audioPlayer = null;
let memory = JSON.parse(sessionStorage.getItem("tangmo_memory") || "[]");

const micBtn = document.getElementById("tangmo-mic");
const statusEl = document.getElementById("tangmo-status");

function saveMemory(role, content) {
  memory.push({ role, content });
  if (memory.length > 8) memory.shift();
  sessionStorage.setItem("tangmo_memory", JSON.stringify(memory));
}

function setStatus(text, mode) {
  statusEl.textContent = text;
  micBtn.setAttribute("data-state", mode);
}

async function speak(text) {
  try {
    setStatus("Tangmo กำลังพูด…", "speaking");

    const res = await fetch(`${API_BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    audioPlayer = new Audio(url);
    audioPlayer.onended = () => {
      setStatus("แตะไมค์เพื่อคุยกับ Tangmo", "idle");
    };
    audioPlayer.play();
  } catch (e) {
    setStatus("เกิดปัญหาเรื่องเสียง", "idle");
  }
}

async function sendToTangmo(text) {
  try {
    setStatus("Tangmo กำลังคิด…", "thinking");

    const res = await fetch(`${API_BASE}/api/chat`, {
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

    await speak(reply);
  } catch (e) {
    setStatus("ระบบมีปัญหา ลองใหม่อีกทีนะคะ", "idle");
  }
}

function initSpeech() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.continuous = false;

  recognition.onstart = () => {
    setStatus("Tangmo กำลังฟัง…", "listening");
  };

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    isListening = false;
    sendToTangmo(text);
  };

  recognition.onerror = () => {
    setStatus("ฟังไม่ชัด ลองใหม่อีกทีนะคะ", "idle");
    isListening = false;
  };
}

micBtn.addEventListener("click", () => {
  if (!recognition) initSpeech();

  if (!isListening) {
    isListening = true;
    recognition.start();
  } else {
    recognition.stop();
    isListening = false;
    setStatus("แตะไมค์เพื่อคุยกับ Tangmo", "idle");
  }
});

setStatus("แตะไมค์เพื่อคุยกับ Tangmo", "idle");

document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro"); // div ครอบ intro ทั้งก้อน (ถ้ามี)
  const v = document.getElementById("introVideo");

  function hideIntro() {
    if (intro) intro.style.display = "none";
    if (v) {
      try { v.pause(); } catch {}
    }
  }

  // กันค้าง: ไม่ว่าวิดีโอเล่น/ไม่เล่น ให้หายภายใน 2.5 วิ
  setTimeout(hideIntro, 2500);

  // ถ้าวิดีโอจบ/โหลดพัง ก็ให้หาย
  if (v) {
    v.addEventListener("ended", hideIntro);
    v.addEventListener("error", hideIntro);
    v.addEventListener("stalled", hideIntro);
  }
});

