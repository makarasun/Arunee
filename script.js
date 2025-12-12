// =======================
// INTRO VIDEO OVERLAY
// =======================
(function () {
  const body = document.body;
  const introOverlay = document.getElementById("intro-overlay");
  const introVideo = document.getElementById("intro-video");
  const introSkip = document.getElementById("intro-skip");

  if (!introOverlay || !introVideo || !introSkip) return;

  function finishIntro() {
    introOverlay.classList.add("hidden");
    body.classList.remove("is-intro-playing");
    try {
      introVideo.pause();
    } catch (e) {}
  }

  introSkip.addEventListener("click", () => {
    finishIntro();
  });

  introVideo.addEventListener("ended", () => {
    finishIntro();
  });

  window.addEventListener("load", () => {
    body.classList.add("is-intro-playing");

    const tryPlay = () => {
      introVideo
        .play()
        .catch(() => {
          const resumeHandler = () => {
            introVideo.play().catch(() => {});
            window.removeEventListener("click", resumeHandler);
            window.removeEventListener("touchstart", resumeHandler);
          };
          window.addEventListener("click", resumeHandler, { once: true });
          window.addEventListener("touchstart", resumeHandler, {
            once: true,
          });
        });
    };

    introVideo.muted = true;
    tryPlay();
  });
})();

// =======================
// SERVICE TEXT DATA
// =======================

const SERVICE_DATA = {
  design: {
    tag: "งานออกแบบ",
    title: "Interior Design ผ้าม่าน พื้น",
    desc:
      "ออกแบบ Mood & Tone ห้อง เลือกผ้าม่าน วอลล์เปเปอร์ และงานพื้น ให้เข้ากับสไตล์ของคุณ พร้อมคุมโทน คุมงบประมาณ",
  },
  curtain: {
    tag: "งานผ้าม่าน",
    title: "ผ้าม่าน มู่ลี่ ม่านปรับแสง",
    desc:
      "เลือกผ้าม่านและระบบรางให้เหมาะกับแสง การใช้งาน และสไตล์ของบ้าน คอนโด และออฟฟิศ",
  },
  wall: {
    tag: "งานผนัง",
    title: "สีผนัง วอลล์เปเปอร์ ฉากกั้นห้อง",
    desc:
      "รีเฟรชบรรยากาศห้องด้วยสี วอลล์เปเปอร์ และฉากกั้นห้อง เพิ่มความเป็นส่วนตัวและดีไซน์ไปพร้อมกัน",
  },
  floor: {
    tag: "งานพื้น",
    title: "ปูพื้น วินิล กระเบื้องยาง",
    desc:
      "เลือกวัสดุปูพื้นที่เหมาะกับการใช้งาน ทั้งบ้านพักอาศัย ร้านค้า สำนักงาน และพื้นที่พิเศษ",
  },
  install: {
    tag: "งานติดตั้ง",
    title: "ติดตั้งม่าน แอร์ และอุปกรณ์เสริม",
    desc:
      "งานติดตั้งมาตรฐาน ทีมช่างเก็บรายละเอียดเรียบร้อย ทั้งผ้าม่าน แอร์ และอุปกรณ์ห้องประชุม",
  },
  aftercar: {
    tag: "บริการก่อน–หลังการขาย",
    title: "วัดหน้างาน ประเมิน และดูแลหลังการติดตั้ง",
    desc:
      "เข้าไปดูหน้างานจริง วัดขนาด ประเมินเบื้องต้น และดูแลงานหลังติดตั้ง เช่น ทำความสะอาดผ้าม่าน",
  },
};

// =======================
// AUTO-SCAN MEDIA FROM FOLDERS
// =======================

const SERVICE_MEDIA = {};
const SERVICE_KEYS = ["design", "curtain", "wall", "floor", "install", "aftercar"];
const MAX_IMAGES = 30;
const MAX_VIDEOS = 20;

function checkImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function checkVideo(url) {
  return fetch(url, { method: "HEAD" })
    .then((res) => res.ok)
    .catch(() => false);
}

async function scanServiceFolder(serviceKey) {
  const base = `assets/gallery/${serviceKey}/`;
  const list = [];

  for (let i = 1; i <= MAX_IMAGES; i++) {
    const src = `${base}sample-${i}.jpg`;
    const thumb = `${base}sample-${i}-thumb.jpg`;
    const exists = await checkImage(src);
    if (!exists) continue;
    list.push({
      type: "image",
      src,
      thumb,
      label: `ภาพตัวอย่าง ${i}`,
    });
  }

  for (let i = 1; i <= MAX_VIDEOS; i++) {
    const src = `${base}vsample-${i}.mp4`;
    const thumb = `${base}vsample-${i}-thumb.jpg`;
    const exists = await checkVideo(src);
    if (!exists) continue;
    list.push({
      type: "video",
      src,
      thumb,
      label: `วิดีโอตัวอย่าง ${i}`,
    });
  }

  SERVICE_MEDIA[serviceKey] = list;
}

async function scanAllServices() {
  for (const key of SERVICE_KEYS) {
    await scanServiceFolder(key);
  }
  console.log("📁 Media auto-scan เสร็จแล้ว", SERVICE_MEDIA);
}

window.SERVICE_MEDIA = SERVICE_MEDIA;
window.scanAllServices = scanAllServices;

// =======================
// VIEWER (จอแสดงผลงาน + thumbnails)
// =======================

(function setupViewer() {
  const tagEl = document.getElementById("viewer-tag");
  const titleEl = document.getElementById("viewer-title");
  const descEl = document.getElementById("viewer-desc");
  const viewerMedia = document.getElementById("viewer-media");
  const placeholderEl = document.getElementById("viewer-placeholder");
  const thumbsEl = document.getElementById("viewer-thumbs");
  const fullscreenBtn = document.getElementById("viewer-fullscreen-btn");

  if (!viewerMedia || !thumbsEl) return;

  let mainEl = document.getElementById("viewer-main");
  if (!mainEl) {
    mainEl = document.createElement("div");
    mainEl.id = "viewer-main";
    mainEl.className = "viewer-main";
    viewerMedia.insertBefore(mainEl, placeholderEl);
  }

  function clearMain() {
    while (mainEl.firstChild) {
      mainEl.removeChild(mainEl.firstChild);
    }
  }

  function showMediaItem(item) {
    clearMain();

    if (!item) {
      if (placeholderEl) {
        placeholderEl.textContent = "ยังไม่มีรูปหรือวิดีโอตัวอย่างในหมวดนี้";
        placeholderEl.style.display = "block";
      }
      return;
    }

    if (placeholderEl) {
      placeholderEl.style.display = "none";
    }

    if (item.type === "video") {
      const video = document.createElement("video");
      video.src = item.src;
      video.controls = true;
      video.playsInline = true;
      video.className = "viewer-main-video";
      mainEl.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.label || "";
      img.className = "viewer-main-image";
      mainEl.appendChild(img);
    }
  }

  window.updateViewerForService = function (serviceKey) {
    const data = SERVICE_DATA[serviceKey];
    const mediaList = SERVICE_MEDIA[serviceKey] || [];

    if (data) {
      if (tagEl) tagEl.textContent = data.tag;
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.desc;
    }

    thumbsEl.innerHTML = "";

    if (!mediaList.length) {
      clearMain();
      if (placeholderEl) {
        placeholderEl.textContent = "ยังไม่มีรูปหรือวิดีโอตัวอย่างในหมวดนี้";
        placeholderEl.style.display = "block";
      }
      return;
    }

    showMediaItem(mediaList[0]);

    mediaList.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.className = "viewer-thumb";
      const img = document.createElement("img");
      img.src = item.thumb || item.src;
      img.alt = item.label || "";
      btn.appendChild(img);
      thumbsEl.appendChild(btn);

      if (index === 0) {
        btn.classList.add("active");
      }

      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".viewer-thumb")
          .forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
        showMediaItem(item);
      });
    });
  };

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      const target = mainEl || viewerMedia;
      if (!target) return;

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        target.requestFullscreen?.().catch(() => {});
      }
    });
  }
})();

// =======================
// DROPDOWN TOP-BAR → sync viewer
// =======================

(function hookServiceSelect() {
  const select = document.querySelector(".service-select");
  if (!select) return;

  select.addEventListener("change", (e) => {
    const value = e.target.value;
    const mapValueToKey = {
      design: "design",
      curtain: "curtain",
      walls: "wall",
      floor: "floor",
      install: "install",
      aftercar: "aftercar",
    };
    const key = mapValueToKey[value];
    if (key) {
      window.updateViewerForService?.(key);
    }
  });
})();

// =======================
// THREE.JS CAROUSEL + GLASS SHADER
// =======================

(function () {
  if (typeof THREE === "undefined") {
    console.warn("THREE.js ยังโหลดไม่สำเร็จ");
    return;
  }

  const canvas = document.getElementById("glass-carousel");
  const container = canvas ? canvas.parentElement : null;
  if (!canvas || !container) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight || 300, false);
  renderer.setClearColor(0x000000, 0);
  if (renderer.outputColorSpace !== undefined) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.45, 10);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
  frontLight.position.set(3, 5, 8);
  scene.add(frontLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
  rimLight.position.set(-4, 3, -6);
  scene.add(rimLight);

  const carouselGroup = new THREE.Group();
  scene.add(carouselGroup);

  // ---- Glass Shader (แบบ B,B,C) ----
  function createGlassCardMaterial(texture) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy() || 8;
    texture.colorSpace = THREE.SRGBColorSpace;

    const uniforms = {
      uMap: { value: texture },
      uThickness: { value: 0.4 }, // Q1-B: กลาง ๆ
      uFrostAmount: { value: 0.6 }, // Q2-B: ฝ้ากลาง ๆ
      uEdgeGlow: { value: 1.0 }, // Q3-C: เน้นขอบนีออนหน่อย
      uTime: { value: 0.0 },
    };

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      precision highp float;

      uniform sampler2D uMap;
      uniform float uThickness;
      uniform float uFrostAmount;
      uniform float uEdgeGlow;
      uniform float uTime;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      float luminance(vec3 c) {
        return dot(c, vec3(0.299, 0.587, 0.114));
      }

      void main() {
        // base color from PNG
        vec4 tex = texture2D(uMap, vUv);
        // ถ้าโปร่งใสเกินไป ตัดทิ้ง
        if (tex.a < 0.02) discard;

        // base env gradient
        float ny = clamp(vNormal.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 envTop = vec3(1.0, 0.96, 0.97);
        vec3 envBottom = vec3(0.07, 0.08, 0.12);
        vec3 envColor = mix(envBottom, envTop, ny);

        // luminance-based frost
        float lum = luminance(tex.rgb);
        // สว่างมาก = ฝ้าขึ้นเยอะ
        float frostFactor = smoothstep(0.3, 0.8, lum) * uFrostAmount;

        // fake refraction UV
        vec2 offsetDir = vec2(vViewDir.x, vViewDir.y) * 0.03;
        vec2 frostedUv = vUv + offsetDir * frostFactor;

        // เบลอ/เลื่อน texture นิดหน่อยตอนฝ้า
        vec4 texFrosted = texture2D(uMap, frostedUv);

        // mix base กับ env ตาม frost
        vec3 baseCol = mix(tex.rgb, texFrosted.rgb, 0.6 * frostFactor);
        vec3 glassCol = mix(baseCol, envColor, 0.35 * frostFactor);

        // edge glow (grazing angle)
        float edge = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 2.5);
        vec3 edgeColor = vec3(1.0, 0.4, 0.7); // neon pink
        vec3 glow = edgeColor * edge * 0.75 * uEdgeGlow;

        // thickness darkening
        float thicknessTerm = mix(1.0, 0.82, uThickness);

        vec3 finalColor = glassCol * thicknessTerm + glow;

        // alpha: เอาจาก alpha ของ PNG ผสมกับ frost
        float alpha = tex.a;
        alpha = mix(alpha * 0.9, alpha * 0.7, frostFactor);
        alpha = clamp(alpha, 0.15, 0.98);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  // ---- โหลดการ์ด PNG แล้ววางเป็นวงกลม ----
  const cardInfos = [
    { key: "design", path: "assets/cards/card-design.png" },
    { key: "curtain", path: "assets/cards/card-curtain.png" },
    { key: "wall", path: "assets/cards/card-wall.png" },
    { key: "install", path: "assets/cards/card-install.png" },
    { key: "aftercar", path: "assets/cards/card-aftercar.png" },
    { key: "floor", path: "assets/cards/card-floor.png" },
  ];

  const textureLoader = new THREE.TextureLoader();
  const cardMeshes = [];

  const radius = 2.5;
  const cardWidth = 2.6;
  const cardHeight = 4.0;

  cardInfos.forEach((info, index) => {
    const texture = textureLoader.load(info.path);
    const geo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const mat = createGlassCardMaterial(texture);

    const mesh = new THREE.Mesh(geo, mat);

    const angle = (index / cardInfos.length) * Math.PI * 2.0;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;

    mesh.position.set(x, 0, z);
    mesh.rotation.y = angle; // หันหน้าออกจากจุดกลาง

    mesh.userData.serviceKey = info.key;
    mesh.userData.angle = angle;

    carouselGroup.add(mesh);
    cardMeshes.push(mesh);
  });

  carouselGroup.position.y = -0.3;

  // หมุนแบบ flow + แตะแล้วหยุด (ไม่ snap)
  let targetRotation = 0;
  let currentRotation = 0;
  let isPointerDown = false;
  let lastX = 0;

  function getClientX(e) {
    if (e.touches && e.touches.length) {
      return e.touches[0].clientX;
    }
    return e.clientX;
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY || e.deltaX || 0;
    targetRotation += delta * 0.0012;
  }

  function onPointerDown(e) {
    isPointerDown = true;
    // แตะเมื่อไหร่ → หยุด inertia ตรงนั้นเลย
    currentRotation = carouselGroup.rotation.y;
    targetRotation = currentRotation;

    lastX = getClientX(e);

    if (e.pointerId != null && container.setPointerCapture) {
      try {
        container.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  }

  function onPointerMove(e) {
    if (!isPointerDown) return;
    const x = getClientX(e);
    const dx = x - lastX;
    lastX = x;

    const factor =
      e.pointerType === "touch" || (e.touches && e.touches.length)
        ? 0.3
        : 0.015;

    targetRotation += dx * factor;
  }

  function onPointerUp(e) {
    isPointerDown = false;
    if (e && e.pointerId != null && container.releasePointerCapture) {
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  }

  container.addEventListener("wheel", onWheel, { passive: false });
  container.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  // click การ์ด → เปลี่ยน viewer
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    pointer.set(x, y);

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(cardMeshes, false);
    if (hits.length > 0) {
      const mesh = hits[0].object;
      const key = mesh.userData.serviceKey;
      if (key) {
        window.updateViewerForService?.(key);
      }
    }
  }

  canvas.addEventListener("click", handleCanvasClick);

  function resizeRenderer() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight || 300;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resizeRenderer);
  resizeRenderer();

  function animate(time) {
    requestAnimationFrame(animate);

    // update uTime เผื่ออนาคตอยากใส่ motion บางอย่าง
    carouselGroup.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.uTime) {
        obj.material.uniforms.uTime.value = time * 0.001;
      }
    });

    if (!isPointerDown) {
      currentRotation = THREE.MathUtils.lerp(currentRotation, targetRotation, 0.16);
    } else {
      currentRotation = targetRotation;
    }

    carouselGroup.rotation.y = currentRotation;
    renderer.render(scene, camera);
  }

  animate(0);
})();

// =======================
// ซ่อน top-bar ตอน scroll ลง + โผล่กลับด้วย double-tap ขอบบน
// =======================

const topBar = document.querySelector(".top-bar");
let lastScroll = 0;

window.addEventListener("scroll", () => {
  if (!topBar) return;

  const current =
    window.scrollY || document.documentElement.scrollTop || 0;

  if (current > lastScroll && current > 50) {
    topBar.classList.add("hide");
  }

  if (current <= 5) {
    topBar.classList.remove("hide");
  }

  lastScroll = current;
});

(function setupTopBarDoubleTap() {
  if (!topBar) return;

  let lastTapTime = 0;
  const TAP_THRESHOLD = 300;
  const TOP_REGION = 80;

  function handleTap(e) {
    let clientY = 0;

    if (e.touches && e.touches.length) {
      clientY = e.touches[0].clientY;
    } else {
      clientY = e.clientY;
    }

    if (clientY > TOP_REGION) return;

    const now = Date.now();
    if (now - lastTapTime < TAP_THRESHOLD) {
      topBar.classList.remove("hide");
    }
    lastTapTime = now;
  }

  window.addEventListener("touchstart", handleTap);
  window.addEventListener("click", handleTap);
})();

// =======================
// INITIALIZE MEDIA AFTER SCAN
// =======================

document.addEventListener("DOMContentLoaded", () => {
  scanAllServices()
    .then(() => {
      window.updateViewerForService?.("design");
    })
    .catch((err) => {
      console.error("scanAllServices error:", err);
      window.updateViewerForService?.("design");
    });
});



// =======================
// NAV (HIDE BAR) + AI DOCK (Tangmo v1)
// =======================
(function () {
  // ---- NAV toggle (mobile) ----
  const navToggle = document.getElementById("nav-toggle");
  const topNav = document.getElementById("top-nav");
  if (navToggle && topNav) {
    navToggle.addEventListener("click", () => {
      topNav.classList.toggle("is-collapsed");
    });

    // close menu when clicking outside
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      if (t === navToggle) return;
      if (topNav.contains(t)) return;
      topNav.classList.add("is-collapsed");
    });
  }

  // smooth scroll for nav buttons
  document.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-scroll");
      const el = target ? document.querySelector(target) : null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      topNav?.classList.add("is-collapsed");
    });
  });

  // ---- Tangmo AI Dock ----
  const dock = document.getElementById("ai-dock");
  const closeBtn = document.getElementById("ai-close");
  const chatPanel = document.getElementById("ai-chat");
  const trayPanel = document.getElementById("ai-tray");
  const msgBox = document.getElementById("ai-messages");
  const micBtn = document.getElementById("ai-mic");
  const fileInput = document.getElementById("ai-file");
  const form = document.getElementById("ai-form");
  const input = document.getElementById("ai-text");

  if (!dock || !msgBox || !form || !input) return;

  const STORAGE_KEY = "tangmo_v1_history";
  const OPENED_KEY = "tangmo_v1_opened";
  const MAX_TURNS = 12; // short-term memory

  // If your website is on GitHub Pages but your AI runs on Vercel,
  // put your Vercel URL here, e.g. "https://your-project.vercel.app"
  // Leave empty "" if the site itself is hosted on Vercel.
  const TANGMO_API_BASE = "";

  function apiUrl(path) {
    if (TANGMO_API_BASE && /^https?:\/\//.test(TANGMO_API_BASE)) {
      return TANGMO_API_BASE.replace(/\/$/, "") + path;
    }
    return path;
  }

  // Mic visual state
  function setMicState(state) {
    if (!micBtn) return;
    micBtn.classList.remove("is-listening", "is-thinking", "is-speaking");
    if (state === "listening") micBtn.classList.add("is-listening");
    if (state === "thinking") micBtn.classList.add("is-thinking");
    if (state === "speaking") micBtn.classList.add("is-speaking");
  }

  function showChat() {
    chatPanel?.classList.remove("is-hidden");
    trayPanel?.classList.add("is-hidden");
    chatPanel?.setAttribute("aria-hidden", "false");
    trayPanel?.setAttribute("aria-hidden", "true");
  }

  function showTray() {
    trayPanel?.classList.remove("is-hidden");
    chatPanel?.classList.add("is-hidden");
    trayPanel?.setAttribute("aria-hidden", "false");
    chatPanel?.setAttribute("aria-hidden", "true");
  }

  function hidePanels() {
    chatPanel?.classList.add("is-hidden");
    trayPanel?.classList.add("is-hidden");
    chatPanel?.setAttribute("aria-hidden", "true");
    trayPanel?.setAttribute("aria-hidden", "true");
  }

  // start clean
  hidePanels();

  // Basic PII scrubbing (keep it gentle)
  function scrubPII(s) {
    if (!s) return s;
    let out = String(s);
    // phone-like
    out = out.replace(/\b0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}\b/g, "[เบอร์ถูกซ่อน]");
    // email
    out = out.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[อีเมลถูกซ่อน]");
    // line id (rough)
    out = out.replace(/\bline\s*[:：]?\s*[a-z0-9._-]{3,}\b/gi, "LINE: [ถูกซ่อน]");
    return out;
  }

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveHistory(arr) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-MAX_TURNS)));
    } catch {}
  }

  function pushHistory(role, text) {
    const h = loadHistory();
    h.push({ role, text: scrubPII(text), ts: Date.now() });
    saveHistory(h);
  }

  function addMsg(text, who) {
    const div = document.createElement("div");
    div.className = `ai-msg ${who}`;
    div.textContent = text;
    msgBox.appendChild(div);
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  // Randomized opening (once per tab/session)
  function maybeOpening() {
    let opened = false;
    try { opened = sessionStorage.getItem(OPENED_KEY) === "1"; } catch {}
    if (opened) return;

    const openings = [
      "สวัสดีค่ะ ที่นี่อรุณีผ้าม่านนะคะ 😊 ถึงชื่อจะเป็นผ้าม่าน แต่จริงๆ ทางร้านรับงานตกแต่งภายในครบวงจรเลยค่ะ เดินดูเว็บได้สบายๆ นะคะ",
      "สวัสดีค่ะ ยินดีต้อนรับนะคะ 🙂 ร้านอรุณีรับงานตกแต่งภายในหลายประเภท ไม่ได้มีแค่ผ้าม่านอย่างเดียวค่ะ ดูข้อมูลก่อนได้เลยนะคะ",
      "สวัสดีค่ะ Tangmo เป็นผู้ช่วยหน้าร้านนะคะ 🙏 ร้านเราทำงานตกแต่งภายในครบวงจรค่ะ เดินดูผลงานก่อนได้เลยนะคะ",
      "สวัสดีค่ะ 😊 ที่นี่อรุณีค่ะ ทางร้านดูแลงานตกแต่งภายในครบวงจรด้วยนะคะ ถ้ามีอะไรอยากถามค่อยพิมพ์หรือกดไมค์ได้เลยค่ะ"
    ];

    const msg = openings[Math.floor(Math.random() * openings.length)];
    addMsg(msg, "bot");
    pushHistory("assistant", msg);

    try { sessionStorage.setItem(OPENED_KEY, "1"); } catch {}

    // speak opening (best-effort)
    speakWithOpenAITTS(msg).catch(() => {});
  }

  closeBtn?.addEventListener("click", () => {
    dock.classList.add("is-hidden");
  });

  // Swipe gestures on mic:
  // - Swipe UP  => show chat display
  // - Swipe DOWN => show input tray
  // - Small move => do nothing (tap still works)
  (function setupMicSwipe() {
    if (!micBtn) return;
    let startY = 0;
    let moved = false;
    const THRESH = 40;

    micBtn.addEventListener("touchstart", (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      startY = t.clientY;
      moved = false;
    }, { passive: true });

    micBtn.addEventListener("touchmove", (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > 10) moved = true;
    }, { passive: true });

    micBtn.addEventListener("touchend", (e) => {
      // If user swiped enough, toggle panels
      const changed = e.changedTouches && e.changedTouches[0];
      if (!changed) return;
      const dy = changed.clientY - startY;
      if (!moved) return; // treat as tap, click handler will run

      if (dy <= -THRESH) {
        showChat();
      } else if (dy >= THRESH) {
        showTray();
      }
    });
  })();

  // Convert file to data URL
  async function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  // Call your backend chat endpoint
  async function callChatAPI({ text, imageDataUrl }) {
    const history = loadHistory().map(({ role, text }) => ({ role, content: text })).slice(-MAX_TURNS);

    const res = await fetch(apiUrl("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: scrubPII(text || ""),
        image: imageDataUrl || null,
        history
      })
    });

    if (!res.ok) {
      // Noob hint: 404 usually means you are on GitHub Pages (no backend)
      const hint = res.status === 404
        ? "(404) ไม่เจอระบบหลังบ้าน: ถ้าคุณเปิดจาก GitHub Pages ให้เปิดลิงก์ Vercel แทน หรือใส่ TANGMO_API_BASE ใน script.js"
        : `(${res.status})`;
      throw new Error(`Chat API error ${hint}`);
    }
    return res.json(); // { reply: "..." }
  }

  // OpenAI TTS via backend: returns audio/mpeg
  async function speakWithOpenAITTS(text) {
    const res = await fetch(apiUrl("/api/tts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(`TTS API error ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    setMicState("speaking");
    audio.onended = () => {
      URL.revokeObjectURL(url);
      setMicState(null);
    };

    // On some mobile browsers, autoplay can be blocked.
    // If play() fails, we just stop glowing and keep text response.
    try {
      await audio.play();
    } catch (e) {
      URL.revokeObjectURL(url);
      setMicState(null);
    }
  }

  // Send text message
  async function sendText(text) {
    const clean = (text || "").trim();
    if (!clean) return;

    addMsg(clean, "user");
    pushHistory("user", clean);

    addMsg("กำลังคิดให้นะคะ…", "bot");
    setMicState("thinking");
    const thinkingEl = msgBox.lastChild;

    try {
      const data = await callChatAPI({ text: clean });
      const reply = (data && data.reply) ? String(data.reply) : "ขอโทษนะคะ ตอนนี้ตอบไม่ติดนิดนึง";

      thinkingEl?.remove();
      addMsg(reply, "bot");
      pushHistory("assistant", reply);

      setMicState(null);

      // speak reply (best-effort)
      speakWithOpenAITTS(reply).catch(() => { setMicState(null); });
    } catch (err) {
      thinkingEl?.remove();
      addMsg("ขอโทษนะคะ ตอนนี้ระบบตอบแชทมีปัญหานิดนึง ลองใหม่อีกทีได้ไหมคะ", "bot");
      setMicState(null);
      console.error(err);
    }
  }

  // Form submit (typed input)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = input.value;
    input.value = "";
    sendText(t);
  });

  // Image upload flow
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    addMsg(`ส่งรูป: ${file.name}`, "user");
    pushHistory("user", `ส่งรูป: ${file.name}`);

    addMsg("รับรูปแล้วค่ะ กำลังดูหน้างานให้นะคะ…", "bot");
    const thinkingEl = msgBox.lastChild;

    try {
      const dataUrl = await fileToDataURL(file);
      const prompt =
        "ลูกค้าส่งรูปหน้างานมา ขอให้คุณ: (1) สรุปสิ่งที่เห็นจากภาพแบบไม่มั่ว (ใช้คำว่า จากภาพที่เห็น/ลักษณะคล้าย/อาจดูจากรูปอย่างเดียวไม่ครบ) " +
        "(2) แนะนำหมวดงานหรือประเภทสินค้า + เหตุผลเชิงใช้งาน โดยไม่ถามข้อมูลส่วนตัว และไม่เสนอการนัดหมายก่อน";

      const data = await callChatAPI({ text: prompt, imageDataUrl: dataUrl });
      const reply = (data && data.reply) ? String(data.reply) : "ขอโทษนะคะ วิเคราะห์รูปไม่สำเร็จ";

      thinkingEl?.remove();
      addMsg(reply, "bot");
      pushHistory("assistant", reply);

      speakWithOpenAITTS(reply).catch(() => {});
    } catch (err) {
      thinkingEl?.remove();
      addMsg("ขอโทษนะคะ อัปโหลด/วิเคราะห์รูปไม่สำเร็จ ลองใหม่อีกทีได้ไหมคะ", "bot");
      console.error(err);
    } finally {
      fileInput.value = "";
    }
  });

  // Voice input (browser speech recognition -> text -> send)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recog = null;
  let isListening = false;

  function ensureSR() {
    if (!SR) return null;
    const r = new SR();
    r.lang = "th-TH";
    r.continuous = false;
    r.interimResults = false;
    return r;
  }

  micBtn?.addEventListener("click", () => {
    if (!SR) {
      addMsg("เครื่องนี้ยังไม่รองรับการพูดในเบราว์เซอร์ค่ะ (ลองพิมพ์แทนได้เลยนะคะ)", "bot");
      return;
    }

    if (!recog) recog = ensureSR();
    if (!recog) return;

    if (isListening) {
      try { recog.stop(); } catch {}
      isListening = false;
      setMicState(null);
      return;
    }

    isListening = true;
    setMicState("listening");
    addMsg("กำลังฟังอยู่นะคะ…", "bot");
    const listeningEl = msgBox.lastChild;

    recog.onresult = (ev) => {
      const text = ev.results?.[0]?.[0]?.transcript || "";
      listeningEl?.remove();
      isListening = false;
      setMicState(null);
      if (text.trim()) sendText(text);
    };

    recog.onerror = () => {
      listeningEl?.remove();
      isListening = false;
      setMicState(null);
      addMsg("ขอโทษนะคะ ฟังไม่ชัด ลองใหม่อีกที หรือพิมพ์แทนได้เลยค่ะ", "bot");
    };

    recog.onend = () => { isListening = false; setMicState(null); };

    try { recog.start(); } catch (e) {
      listeningEl?.remove();
      isListening = false;
      setMicState(null);
    }
  });

  // Start clean: hide chat + tray by default
  hidePanels();

  // Kick off opening (and show chat only when user swipes up)
  maybeOpening();
})();
