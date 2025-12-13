/* =========================
   Tangmo Neumo v1 (Vercel)
   - intro card กดแล้วไปแน่นอน
   - ไมค์: แตะเพื่อเริ่ม / แตะอีกทีเพื่อหยุด
   - ไม่มีคำว่า "คิดแปบ"
   - random ประโยคต้อนรับ (แสดงข้อความทันที / เสียงจะพูดได้หลัง user แตะครั้งแรกเพราะ policy browser)
========================= */

const OPENING_LINES = [
  "สวัสดีค่ะ ที่นี่อรุณีบริการนะคะ ถึงชื่อจะเป็นผ้าม่าน แต่จริงๆ รับตกแต่งภายในครบวงจรค่ะ เดินดูเว็บได้สบายๆ นะคะ",
  "สวัสดีค่ะ ยินดีต้อนรับค่ะ ร้านอรุณีรับงานตกแต่งภายในหลายแบบ ไม่ได้มีแค่ผ้าม่านอย่างเดียวค่ะ",
  "สวัสดีค่ะ แวะดูผลงานได้เลยนะคะ ถ้าต้องการให้ช่วยแนะนำหมวดงาน ทักแตงโมได้ค่ะ",
];

const SERVICES = [
  {
    key: "design",
    badge: "01",
    title: "งานออกแบบ",
    desc: "Mood & Tone, คุมโทนให้ห้องดูแพงและเป็นตัวคุณ",
    bg: "assets/bg/wall-BG1.jpg",
    tag: "งานออกแบบ",
    viewerTitle: "Mood & Tone ให้ลงตัว",
    viewerDesc: "ช่วยจัดทิศทางสไตล์ วัสดุ และความรู้สึกของห้องให้ไปทางเดียวกัน",
    thumbs: [],
  },
  {
    key: "curtain",
    badge: "02",
    title: "งานผ้าม่าน",
    desc: "ม่าน/มู่ลี่/ปรับแสง เลือกให้เหมาะกับแสงและการใช้งาน",
    bg: "assets/bg/curtain-bg1.jpg",
    tag: "งานผ้าม่าน",
    viewerTitle: "เลือกกันแสง + ใช้งานจริง",
    viewerDesc: "เลือกผ้า/ระบบราง ให้ทนแดด ดูแลง่าย และเข้ากับสไตล์บ้าน",
    thumbs: [],
  },
  {
    key: "wall",
    badge: "03",
    title: "งานผนัง",
    desc: "สี/วอลเปเปอร์/ผิววัสดุ เพิ่มมิติให้ห้องแบบไม่เว่อร์",
    bg: "assets/bg/wall-BG2.jpg",
    tag: "งานผนัง",
    viewerTitle: "ผนังที่ “มีมิติ”",
    viewerDesc: "เปลี่ยนผนังให้ห้องดูมีราคา ด้วยวัสดุ/สีที่เหมาะกับพื้นที่",
    thumbs: [],
  },
  {
    key: "floor",
    badge: "04",
    title: "งานพื้น",
    desc: "วินิล/กระเบื้องยาง/ลามิเนต เลือกให้เหมาะกับทราฟฟิก",
    bg: "assets/bg/wall-BG1.jpg",
    tag: "งานพื้น",
    viewerTitle: "พื้นสวย + ทน",
    viewerDesc: "เหมาะกับบ้านและหน่วยงาน เลือกแบบทน + ดูแลไม่ยาก",
    thumbs: [],
  },
  {
    key: "install",
    badge: "05",
    title: "งานติดตั้ง",
    desc: "ทีมช่างเก็บงานเรียบร้อย มาตรฐานใช้งานจริง",
    bg: "assets/bg/wall-BG2.jpg",
    tag: "งานติดตั้ง",
    viewerTitle: "ติดตั้งเนี๊ยบ",
    viewerDesc: "งานติดตั้งที่ไม่ทิ้งงานไว้ให้ปวดหัวทีหลัง",
    thumbs: [],
  },
  {
    key: "aftercar",
    badge: "06",
    title: "บริการหลังการขาย",
    desc: "ดูแลต่อเนื่อง ทำความสะอาด/ปรับตั้ง/แก้ไขจุกจิก",
    bg: "assets/bg/wall-BG1.jpg",
    tag: "บริการหลังการขาย",
    viewerTitle: "ดูแลหลังจบงาน",
    viewerDesc: "งานบ้าน/หน่วยงาน ก็ต้องการความชัวร์หลังติดตั้งเหมือนกันค่ะ",
    thumbs: [],
  },
];

const $ = (id) => document.getElementById(id);

/* ---------- INTRO ---------- */
(function initIntro(){
  const intro = $("intro");
  const skip1 = $("intro-skip");
  const skip2 = $("intro-skip-ghost");
  if(!intro || !skip1) return;

  function finish(){
    intro.classList.add("hidden");
    document.body.classList.remove("is-intro-playing");
    // หลัง intro: แสดง opening 1 ครั้ง
    showOpeningOnce();
  }

  skip1.addEventListener("click", finish);
  if(skip2) skip2.addEventListener("click", finish);

  // กันเหนียว: ถ้า user งง ปล่อยไว้ 3 วิแล้วค่อยปล่อย scroll (แต่ไม่ปิด intro เอง)
  setTimeout(()=>{ document.body.classList.remove("is-intro-playing"); }, 3000);
})();

/* ---------- Reveal on scroll ---------- */
(function(){
  const io = new IntersectionObserver((entries)=>{
    for (const e of entries){
      if(e.isIntersecting) e.target.classList.add("on");
    }
  }, {threshold: 0.08});
  document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
})();

/* ---------- Background ---------- */
function setBg(src){
  const img = $("bg-image");
  if(!img) return;
  if(!src){
    img.removeAttribute("src");
    return;
  }
  img.src = src;
}

/* ---------- Carousel (vertical cards in circle feel) ---------- */
let activeIndex = 0;

function renderCarousel(){
  const wrap = $("carousel");
  const dots = $("dots");
  if(!wrap) return;

  wrap.innerHTML = "";
  if(dots) dots.innerHTML = "";

  SERVICES.forEach((s, i)=>{
    const card = document.createElement("div");
    card.className = "card3d";
    card.dataset.index = String(i);

    card.innerHTML = `
      <div class="card-top">
        <div class="badge">${s.badge}</div>
        <div class="icon-dot"></div>
      </div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    `;

    card.addEventListener("click", ()=> setActive(i, true));
    wrap.appendChild(card);

    if(dots){
      const d = document.createElement("div");
      d.className = "dot" + (i===activeIndex ? " on": "");
      d.addEventListener("click", ()=> setActive(i, true));
      dots.appendChild(d);
    }
  });

  layoutCarousel();
}

function layoutCarousel(){
  const cards = Array.from(document.querySelectorAll(".card3d"));
  const n = cards.length;

  cards.forEach((card, i)=>{
    const offset = i - activeIndex;

    // วางเหมือนหมุนเป็นวงกลม (fake 3D)
    const angle = offset * 18;        // ยิ่งมากยิ่งโค้ง
    const z = -Math.abs(offset) * 55; // ยิ่งห่างยิ่งถอยหลัง
    const x = offset * 62;            // กระจายซ้าย-ขวา
    const y = 0;
    const scale = 1 - Math.min(Math.abs(offset)*0.08, 0.25);

    card.style.transform =
      `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${angle}deg) scale(${scale})`;

    card.classList.toggle("active", offset === 0);
    card.classList.toggle("dim", offset !== 0);
  });

  const dots = Array.from(document.querySelectorAll(".dot"));
  dots.forEach((d, i)=> d.classList.toggle("on", i === activeIndex));
}

function setActive(i, userAction=false){
  activeIndex = Math.max(0, Math.min(SERVICES.length-1, i));
  layoutCarousel();

  const s = SERVICES[activeIndex];
  setBg(s.bg);
  setViewer(s);

  // ถ้าผู้ใช้เป็นคนแตะ เปลี่ยน BG แล้วโชว์ viewer แบบลื่นๆ
  if(userAction){
    document.getElementById("viewer")?.scrollIntoView({behavior:"smooth", block:"start"});
  }
}

function enableSwipe(){
  const wrap = $("carousel");
  if(!wrap) return;
  let startX = 0;
  let down = false;

  wrap.addEventListener("touchstart", (e)=>{
    down = true;
    startX = e.touches[0].clientX;
  }, {passive:true});

  wrap.addEventListener("touchmove", (e)=>{
    if(!down) return;
    const dx = e.touches[0].clientX - startX;
    if(Math.abs(dx) > 40){
      down = false;
      if(dx < 0) setActive(activeIndex+1);
      else setActive(activeIndex-1);
    }
  }, {passive:true});

  wrap.addEventListener("touchend", ()=>{ down=false; }, {passive:true});
}

/* ---------- Viewer ---------- */
function setViewer(s){
  $("viewerTag").textContent = s.tag || "หมวดงาน";
  $("viewerTitle").textContent = s.viewerTitle || s.title;
  $("viewerDesc").textContent = s.viewerDesc || s.desc;

  // thumbs (ยังว่างได้)
  const thumbs = $("thumbs");
  thumbs.innerHTML = "";
  if(s.thumbs && s.thumbs.length){
    s.thumbs.forEach((src)=>{
      const t = document.createElement("div");
      t.className = "thumb";
      t.innerHTML = `<img src="${src}" alt="">`;
      t.addEventListener("click", ()=> setMainImage(src));
      thumbs.appendChild(t);
    });
    setMainImage(s.thumbs[0]);
  }else{
    setMainImage(null);
  }
}

function setMainImage(src){
  const img = $("viewerMainImg");
  const empty = $("viewerEmpty");
  if(!img || !empty) return;

  if(src){
    img.src = src;
    img.style.display = "block";
    empty.style.display = "none";
  }else{
    img.removeAttribute("src");
    img.style.display = "none";
    empty.style.display = "grid";
  }
}

/* =========================
   Tangmo Chat + Voice
========================= */

const chatPanel = $("chatPanel");
const chatLog = $("chatLog");
const chatClose = $("chatClose");
const micBtn = $("micBtn");
const voiceToggle = $("voiceToggle");
const imgInput = $("imgInput");

let recognition = null;
let listening = false;
let hasUserGesture = false;
let pendingSpeakQueue = [];
let lastImageDataUrl = null;

function addBubble(text, who="ai"){
  if(!chatLog) return;
  const div = document.createElement("div");
  div.className = "bubble " + (who === "me" ? "me" : "ai");
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function showChat(){
  if(chatPanel) chatPanel.classList.add("show");
}
function hideChat(){
  if(chatPanel) chatPanel.classList.remove("show");
}
if(chatClose) chatClose.addEventListener("click", hideChat);

function setMicState(state){
  micBtn?.classList.remove("listening","thinking");
  if(state === "listening") micBtn?.classList.add("listening");
  if(state === "thinking") micBtn?.classList.add("thinking");
}

function showOpeningOnce(){
  // โชว์แชทแบบเงียบๆ (ไม่บังคับ)
  const line = OPENING_LINES[Math.floor(Math.random()*OPENING_LINES.length)];
  showChat();
  addBubble(line, "ai");

  // เสียง: browser จะไม่ยอม autoplay ถ้า user ยังไม่แตะอะไร
  speak(line);
}

async function speak(text){
  if(!voiceToggle?.checked) return;

  // ถ้ายังไม่มี user gesture → คิวไว้ก่อน
  if(!hasUserGesture){
    pendingSpeakQueue.push(text);
    return;
  }

  try{
    const r = await fetch("/api/tts", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ text })
    });
    if(!r.ok) throw new Error("TTS failed");
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play().catch(()=>{});
    audio.onended = ()=> URL.revokeObjectURL(url);
  }catch(e){
    // เงียบไว้ ไม่ต้องพูด “ระบบมีปัญหา” ซ้ำๆ
    console.warn(e);
  }
}

function flushSpeakQueue(){
  if(!pendingSpeakQueue.length) return;
  const q = [...pendingSpeakQueue];
  pendingSpeakQueue = [];
  q.forEach(t=> speak(t));
}

async function askTangmo(userText){
  setMicState("thinking");
  showChat();
  addBubble(userText, "me");

  try{
    const payload = {
      messages: [
        { role:"user", content: userText }
      ]
    };
    if(lastImageDataUrl) payload.image = lastImageDataUrl;

    const r = await fetch("/api/chat", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(()=> ({}));
    if(!r.ok) throw new Error(data?.error?.message || data?.error || "chat failed");

    const text = (data.text || "").trim();
    if(text){
      addBubble(text, "ai");
      await speak(text);
    }
  }catch(e){
    console.warn(e);
    addBubble("ขอโทษนะคะ เมื่อกี้ระบบสะดุดนิดนึง ลองใหม่อีกทีได้ไหมคะ", "ai");
  }finally{
    setMicState(listening ? "listening" : "");
    // ส่งรูปครั้งเดียวพอ (ไม่ล็อกไว้ยิงซ้ำ)
    lastImageDataUrl = null;
  }
}

/* ---------- Speech Recognition ---------- */
function getRecognizer(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return null;
  const rec = new SR();
  rec.lang = "th-TH";
  rec.interimResults = false;
  rec.continuous = false;
  return rec;
}

function startListening(){
  hasUserGesture = true;
  flushSpeakQueue();

  if(!recognition){
    recognition = getRecognizer();
    if(!recognition){
      addBubble("มือถือเครื่องนี้ไม่รองรับไมค์อัตโนมัติค่ะ (ลองพิมพ์แทนได้)","ai");
      return;
    }
    recognition.onresult = async (e)=>{
      const text = e.results?.[0]?.[0]?.transcript?.trim();
      if(text) await askTangmo(text);
    };
    recognition.onerror = (e)=>{ console.warn("SR error", e); };
    recognition.onend = ()=>{
      listening = false;
      setMicState("");
    };
  }

  listening = true;
  setMicState("listening");
  try{ recognition.start(); }catch(_){}
}

function stopListening(){
  listening = false;
  setMicState("");
  try{ recognition?.stop(); }catch(_){}
}

/* mic toggle click */
if(micBtn){
  micBtn.addEventListener("click", ()=>{
    hasUserGesture = true;
    flushSpeakQueue();

    if(!listening) startListening();
    else stopListening();
  });
}

/* upload image */
if(imgInput){
  imgInput.addEventListener("change", ()=>{
    const f = imgInput.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      lastImageDataUrl = String(reader.result || "");
      showChat();
      addBubble("รับรูปแล้วค่ะ เดี๋ยวแตงโมดูให้นะคะ (พิมพ์หรือกดไมค์ถามต่อได้เลย)", "ai");
    };
    reader.readAsDataURL(f);
  });
}

/* init */
renderCarousel();
enableSwipe();
setActive(0);
