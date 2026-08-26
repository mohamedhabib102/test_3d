import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/* ============================================================
   Modern Residential Architecture 3D — Ultra-Realistic Adaptive ArchViz
   ============================================================ */

const CONFIG = {
  modelPath: "Untitled.obj?v=40",
  camera: { fov: 40, near: 0.1, far: 5000 },
};

const DOM = {
  loader: document.getElementById("loader"),
  loaderStatus: document.getElementById("loader-status"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  progressDetail: document.getElementById("progress-detail"),
  loaderBadge: document.getElementById("loader-tier-badge"),
  loaderError: document.getElementById("loader-error"),
  errorMessage: document.getElementById("error-message"),
  canvas: document.getElementById("scene"),
  fpsVal: document.getElementById("fps-val"),
  hudTier: document.getElementById("hud-tier"),
  btnRotate: document.getElementById("btn-rotate"),
  btnReset: document.getElementById("btn-reset"),
  btnWireframe: document.getElementById("btn-wireframe"),
  btnScreenshot: document.getElementById("btn-screenshot"),
  btnFullscreen: document.getElementById("btn-fullscreen"),
  btnToggleInfo: document.getElementById("btn-toggle-info"),
  btnLights: document.getElementById("btn-lights"),
  todDay: document.getElementById("tod-day"),
  todSunset: document.getElementById("tod-sunset"),
  todNight: document.getElementById("tod-night"),
  infoCard: document.querySelector(".property-card"),
  toast: document.getElementById("toast"),
};

let scene, camera, renderer, controls, model;
let initialCamState;
let envGroup;
let sunLight, hemiLight, ambientLight, backLight, sideLight, topLight, moonLight;
let entranceLampLight;
let entranceLampMaterial = null;
let roofLampsMaterial = null;
const interiorPointLights = [];
const animatedTrees = [];
window.allCars = [];
window.movingCars = [];

let frameCount = 0;
let lastFpsTime = performance.now();
let currentTimeOfDay = "day";
let windowLightsEnabled = true;

// Window entries tracking for real-time light toggling
let windowMeshEntries = [];

/* ---------- 1) توليد خامات PBR فائقة الواقعية والسرعة (Procedural ArchViz Textures) ---------- */

// خامة شرائح الخشب الطبيعي المعماري للبلكونات (Architectural Timber Louvers)
function createWoodSlatTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // فواصل ظلية داكنة بين الشرائح
  ctx.fillStyle = "#180f08";
  ctx.fillRect(0, 0, 512, 512);

  const slatCount = 16;
  const slatWidth = 512 / slatCount;
  const gap = 3;

  for (let i = 0; i < slatCount; i++) {
    const x = i * slatWidth;
    const w = slatWidth - gap;

    const baseTone = 0.94 + Math.sin(i * 4.1) * 0.06;
    const r = Math.floor(165 * baseTone);
    const g = Math.floor(115 * baseTone);
    const b = Math.floor(65 * baseTone);

    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, `rgb(${r + 15}, ${g + 12}, ${b + 8})`);
    grad.addColorStop(0.2, `rgb(${r}, ${g}, ${b})`);
    grad.addColorStop(0.85, `rgb(${r - 10}, ${g - 8}, ${b - 5})`);
    grad.addColorStop(1, `rgb(${r - 25}, ${g - 20}, ${b - 15})`);

    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, 512);

    // ألياف الخشب الطبيعي
    ctx.fillStyle = "rgba(40, 20, 10, 0.12)";
    for (let k = 0; k < 10; k++) {
      ctx.fillRect(x + Math.random() * w, 0, 1 + Math.random() * 1.5, 512);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// خامة جدران الجص المعماري والحجر الأبيض الناعم (Architectural Limestone Plaster)
function createArchitecturalPlasterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f3f5f8";
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, 243 + noise));
    data[i + 1] = Math.min(255, Math.max(0, 245 + noise));
    data[i + 2] = Math.min(255, Math.max(0, 248 + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // فواصل تمدد معمارية ناعمة
  ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
  ctx.lineWidth = 1.5;
  for (let y = 128; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// خامة أسفلت الطريق الواقعي مع حبيبات الحصى الناعمة (Realistic Asphalt Road Texture)
function createAsphaltTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#262a30";
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, 38 + noise));
    data[i + 1] = Math.min(255, Math.max(0, 42 + noise));
    data[i + 2] = Math.min(255, Math.max(0, 48 + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// خامة داخلية للشبابيك المنورة تحاكي غرف حقيقية مع ستائر وإضاءة سقفية دافئة
function createLitWindowTexture(isWarmAmber = true) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const roomGrad = ctx.createLinearGradient(128, 0, 128, 256);
  if (isWarmAmber) {
    roomGrad.addColorStop(0, "#fff5dc");
    roomGrad.addColorStop(0.35, "#ffd992");
    roomGrad.addColorStop(0.7, "#f3b355");
    roomGrad.addColorStop(1, "#c97e28");
  } else {
    roomGrad.addColorStop(0, "#ffffff");
    roomGrad.addColorStop(0.35, "#fff0d6");
    roomGrad.addColorStop(0.7, "#fedbb0");
    roomGrad.addColorStop(1, "#d4a46a");
  }
  ctx.fillStyle = roomGrad;
  ctx.fillRect(0, 0, 256, 256);

  // إضاءة ثريا الغرفة في السقف
  const glow = ctx.createRadialGradient(128, 70, 10, 128, 70, 120);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  glow.addColorStop(0.4, "rgba(255, 235, 170, 0.45)");
  glow.addColorStop(1, "rgba(255, 180, 70, 0.0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 256);

  // ستائر جانبية فاخرة
  ctx.fillStyle = "rgba(60, 45, 30, 0.35)";
  ctx.fillRect(0, 0, 45, 256);
  ctx.fillRect(211, 0, 45, 256);

  // ظلال خطوط الشيش
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  for (let y = 15; y < 250; y += 12) {
    ctx.fillRect(45, y, 166, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// خامة النوافذ المطفية ذات الزجاج العميق العاكس
function createDarkWindowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#121922";
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "rgba(25, 35, 48, 0.7)";
  ctx.fillRect(0, 0, 40, 256);
  ctx.fillRect(216, 0, 40, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// خامة أوراق الشجر الطبيعية
function createLushFoliageTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#2d5a1b";
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = 5 + Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);

    const rand = Math.random();
    if (rand > 0.65) ctx.fillStyle = "#6fb334";
    else if (rand > 0.3) ctx.fillStyle = "#4a8a23";
    else ctx.fillStyle = "#336818";

    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// خامة لحاء الشجر الطبيعي
function createBarkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#3e3122";
  ctx.fillRect(0, 0, 128, 256);

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? "#2a2016" : "#52412f";
    ctx.fillRect(x, y, 2 + Math.random() * 4, 15 + Math.random() * 40);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- 2) إعداد المشهد والـ Renderer المتكيف مع كارت الشاشة ---------- */
function initScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
  );

  renderer = new THREE.WebGLRenderer({
    canvas: DOM.canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });

  // ضبط دقة العرض التكيفية لضمان ثبات 60 FPS
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  setupLighting();
  setupEnvironment();
  setupControls();

  window.addEventListener("resize", onResize);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener("dblclick", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    let hit = intersects.find((i) => {
      let obj = i.object;
      while (obj) {
        if (obj.userData && obj.userData.isCar) return true;
        obj = obj.parent;
      }
      return false;
    });

    if (!hit) hit = intersects.find((i) => i.object.isMesh && i.object.visible);

    if (hit) {
      const p = hit.point;
      let distance = 16, height = 8;
      if (hit.object.name && hit.object.name.toLowerCase().includes("window")) {
        distance = 12; height = 5;
      }
      camera.position.set(p.x + distance, p.y + height, p.z + distance);
      controls.target.copy(p);
      controls.update();
      showToast("🔍 تم التركيز على الموقع");
    }
  });
}

/* ---------- 3) نظام الإضاءة المعمارية السينمائية المتوازنة (High Performance & Rich Shadows) ---------- */
function setupLighting() {
  hemiLight = new THREE.HemisphereLight(0xdceeff, 0x443a2e, 0.75);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  // ضوء الشمس المعماري بزاوية 45 درجة لإسقاط ظلال البلكونات والواجهة ثلاثية الأبعاد
  sunLight = new THREE.DirectionalLight(0xfff7ee, 1.55);
  sunLight.position.set(42, 54, 36);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.bias = -0.00008;
  sunLight.shadow.normalBias = 0.025;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 140;
  const d = 34;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  moonLight = new THREE.DirectionalLight(0x8ab4f8, 0.0);
  moonLight.position.set(-30, 45, -25);
  moonLight.castShadow = false;
  scene.add(moonLight);

  backLight = new THREE.DirectionalLight(0xd9e8f5, 0.4);
  backLight.position.set(-35, 36, -30);
  scene.add(backLight);

  sideLight = new THREE.DirectionalLight(0xe8f0f8, 0.3);
  sideLight.position.set(-34, 28, 26);
  scene.add(sideLight);

  topLight = new THREE.DirectionalLight(0xffffff, 0.35);
  topLight.position.set(0, 50, 0);
  scene.add(topLight);

  ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
  scene.add(ambientLight);

  // إضاءة مصباح المدخل الجداري الحقيقي
  entranceLampLight = new THREE.PointLight(0xffb852, 1.4, 10, 1.4);
  entranceLampLight.position.set(-1.48, 4.35, 7.85);
  entranceLampLight.castShadow = true;
  scene.add(entranceLampLight);

  // إضاءة بهو المدخل الدافئة
  const porchLight = new THREE.PointLight(0xffb04a, 1.0, 8, 1.5);
  porchLight.position.set(0.0, 3.2, 6.5);
  scene.add(porchLight);
  interiorPointLights.push(porchLight);
}

/* تبديل أوضاع الإضاءة بين النهار والغروب والليل */
function setTimeOfDay(mode) {
  currentTimeOfDay = mode;

  DOM.todDay?.classList.toggle("active", mode === "day");
  DOM.todSunset?.classList.toggle("active", mode === "sunset");
  DOM.todNight?.classList.toggle("active", mode === "night");

  const backdrop = document.querySelector(".sky-backdrop");

  if (mode === "day") {
    scene.background = new THREE.Color(0xe5f0fa);
    scene.fog = new THREE.FogExp2(0xdcebf8, 0.0035);
    if (backdrop) {
      backdrop.style.background = "linear-gradient(135deg, #74abd5 0%, #a2c6e6 40%, #e8f0f8 100%)";
    }

    sunLight.intensity = 1.55;
    sunLight.color.setHex(0xfff7ee);
    sunLight.position.set(42, 54, 36);

    moonLight.intensity = 0.0;
    hemiLight.intensity = 0.75;
    hemiLight.color.setHex(0xdceeff);
    hemiLight.groundColor.setHex(0x443a2e);
    ambientLight.intensity = 0.28;
    backLight.intensity = 0.4;
    renderer.toneMappingExposure = 1.06;

    entranceLampLight.intensity = 0.8;
    if (entranceLampMaterial) entranceLampMaterial.emissiveIntensity = 1.8;

    updateWindowMaterials(true, 1.2);
    showToast("☀️ وضع النهار المشمس");
  } else if (mode === "sunset") {
    scene.background = new THREE.Color(0xf68b55);
    scene.fog = new THREE.FogExp2(0xf59868, 0.004);
    if (backdrop) {
      backdrop.style.background = "linear-gradient(135deg, #e65c00 0%, #f9d423 60%, #ff8c53 100%)";
    }

    sunLight.intensity = 1.75;
    sunLight.color.setHex(0xff8438);
    sunLight.position.set(52, 18, 40);

    moonLight.intensity = 0.0;
    hemiLight.intensity = 0.6;
    hemiLight.color.setHex(0xffb57d);
    hemiLight.groundColor.setHex(0x3d2719);
    ambientLight.intensity = 0.25;
    backLight.intensity = 0.35;
    renderer.toneMappingExposure = 1.15;

    entranceLampLight.intensity = 1.6;
    if (entranceLampMaterial) entranceLampMaterial.emissiveIntensity = 3.5;

    updateWindowMaterials(true, 2.0);
    showToast("🌇 وضع الغروب الذهبي");
  } else if (mode === "night") {
    scene.background = new THREE.Color(0x0c1220);
    scene.fog = new THREE.FogExp2(0x0b111e, 0.005);
    if (backdrop) {
      backdrop.style.background = "linear-gradient(135deg, #070b14 0%, #0f1b2d 50%, #1e293b 100%)";
    }

    sunLight.intensity = 0.05;
    sunLight.color.setHex(0x3b5070);

    moonLight.intensity = 0.45;
    moonLight.color.setHex(0x94b4ea);

    hemiLight.intensity = 0.25;
    hemiLight.color.setHex(0x2d3e58);
    hemiLight.groundColor.setHex(0x0a1017);
    ambientLight.intensity = 0.12;
    backLight.intensity = 0.1;
    renderer.toneMappingExposure = 1.25;

    entranceLampLight.intensity = 2.4;
    if (entranceLampMaterial) entranceLampMaterial.emissiveIntensity = 5.0;

    updateWindowMaterials(true, 3.2);
    showToast("🌙 وضع الليل وأضواء الشبابيك الساحرة");
  }
}

/* تحديث شدة إضاءة النوافذ بحسب الوضع والتفعيل */
function updateWindowMaterials(enabled, intensityMultiplier = 1.5) {
  windowLightsEnabled = enabled;

  windowMeshEntries.forEach((entry) => {
    const { mesh, isLit, isStaircase, litMat, unlitMat, matIndex } = entry;
    if (Array.isArray(mesh.material)) {
      if (matIndex !== undefined && mesh.material[matIndex]) {
        if (isLit && windowLightsEnabled) {
          mesh.material[matIndex] = litMat;
          litMat.emissiveIntensity = isStaircase ? 1.8 * intensityMultiplier : 1.4 * intensityMultiplier;
        } else {
          mesh.material[matIndex] = unlitMat;
        }
      }
    } else {
      if (isLit && windowLightsEnabled) {
        mesh.material = litMat;
        litMat.emissiveIntensity = isStaircase ? 1.8 * intensityMultiplier : 1.4 * intensityMultiplier;
      } else {
        mesh.material = unlitMat;
      }
    }
  });

  interiorPointLights.forEach((light) => {
    light.intensity = windowLightsEnabled ? (currentTimeOfDay === "night" ? 1.8 : 0.9) : 0;
  });

  if (roofLampsMaterial) {
    roofLampsMaterial.emissiveIntensity = windowLightsEnabled ? (2.5 * intensityMultiplier) : 0.0;
  }

  if (entranceLampMaterial) {
    entranceLampMaterial.emissiveIntensity = windowLightsEnabled ? (2.5 * intensityMultiplier) : 0.0;
  }
  if (entranceLampLight) {
    entranceLampLight.intensity = windowLightsEnabled ? (currentTimeOfDay === "night" ? 2.4 : 1.0) : 0.0;
  }
}

/* ---------- 4) بيئة الموقع الطبيعي والأشجار والطريق ---------- */
function setupEnvironment() {
  scene.background = new THREE.Color(0xe5f0fa);
  scene.fog = new THREE.FogExp2(0xdcebf8, 0.0035);

  envGroup = new THREE.Group();
  scene.add(envGroup);

  const grassTex = new THREE.TextureLoader().load("grass.jpg");
  grassTex.wrapS = THREE.RepeatWrapping;
  grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(16, 12);
  grassTex.colorSpace = THREE.SRGBColorSpace;

  const groundGeo = new THREE.PlaneGeometry(600, 600);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2e4524,
    roughness: 0.95,
    metalness: 0.0
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  envGroup.add(ground);

  const yardGeo = new THREE.PlaneGeometry(105, 65);
  const yardMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    color: 0x92ba70,
    roughness: 0.85,
    metalness: 0.02
  });
  const yard = new THREE.Mesh(yardGeo, yardMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0, -0.01, -2);
  yard.receiveShadow = true;
  envGroup.add(yard);

  // سياج الحديقة الخشبي
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x483624, roughness: 0.85 });
  const fencePostGeo = new THREE.BoxGeometry(0.25, 1.6, 0.25);
  const fencePlankGeo = new THREE.BoxGeometry(0.1, 0.22, 3.2);

  function addFenceSegment(x, z, rotY) {
    const g = new THREE.Group();
    const p1 = new THREE.Mesh(fencePostGeo, fenceMat); p1.position.set(0, 0.8, -1.5); p1.castShadow = true;
    const p2 = new THREE.Mesh(fencePostGeo, fenceMat); p2.position.set(0, 0.8, 1.5); p2.castShadow = true;
    const h1 = new THREE.Mesh(fencePlankGeo, fenceMat); h1.position.set(0, 1.2, 0); h1.castShadow = true;
    const h2 = new THREE.Mesh(fencePlankGeo, fenceMat); h2.position.set(0, 0.6, 0); h2.castShadow = true;
    g.add(p1, p2, h1, h2);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    envGroup.add(g);
  }

  for (let z = -32; z <= 26; z += 3.2) addFenceSegment(-52, z, 0);
  for (let z = -32; z <= 26; z += 3.2) addFenceSegment(52, z, 0);
  for (let x = -50; x <= 50; x += 3.2) addFenceSegment(x, -33.5, Math.PI / 2);

  // الطريق والأسفلت الواقعي (Realistic Textured Asphalt)
  const asphaltTex = createAsphaltTexture();
  const roadGeo = new THREE.PlaneGeometry(320, 22);
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    color: 0x24282e,
    roughness: 0.75,
    metalness: 0.1
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.04, 38);
  road.receiveShadow = true;
  envGroup.add(road);

  // رصيف المشاة (Sidewalk)
  const sidewalkGeo = new THREE.BoxGeometry(320, 0.18, 9);
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0xc4ccd3,
    roughness: 0.7,
    metalness: 0.05
  });
  const s1 = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  s1.position.set(0, 0.09, 23.5);
  s1.receiveShadow = true;
  envGroup.add(s1);

  // بردورات الرصيف الخرسانية (Curb Stones)
  const curbGeo = new THREE.BoxGeometry(320, 0.22, 0.35);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x8e98a2, roughness: 0.8 });
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.position.set(0, 0.11, 27.8);
  curb.receiveShadow = true;
  curb.castShadow = true;
  envGroup.add(curb);

  // خطوط الشارع البيضاء
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = -150; i <= 150; i += 10) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.4), lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(i, 0.06, 38);
    envGroup.add(dash);
  }

  setupLushVolumetricTrees();
  setupOriginalCars();
}

/* ---------- 5) نظام الأشجار الحجمية المورقة السريعة والواقعية ---------- */
function setupLushVolumetricTrees() {
  const foliageTex = createLushFoliageTexture();
  const barkTex = createBarkTexture();

  const trunkMat = new THREE.MeshStandardMaterial({
    map: barkTex,
    roughness: 0.9,
    metalness: 0.02
  });

  const canopyMat = new THREE.MeshStandardMaterial({
    map: foliageTex,
    color: 0x88c458,
    roughness: 0.65,
    metalness: 0.02,
    emissive: 0x16300a,
    emissiveIntensity: 0.25,
  });

  const canopyMatWarm = new THREE.MeshStandardMaterial({
    map: foliageTex,
    color: 0xc8aa42,
    roughness: 0.68,
    metalness: 0.02,
    emissive: 0x282006,
    emissiveIntensity: 0.2,
  });

  function createLushTree(x, z, scale = 1.0, isWarm = false) {
    const treeGroup = new THREE.Group();

    const trunkHeight = 3.6 * scale;
    const trunkGeo = new THREE.CylinderGeometry(0.22 * scale, 0.42 * scale, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    const branch1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * scale, 0.2 * scale, 2.2 * scale, 6),
      trunkMat
    );
    branch1.position.set(0.4 * scale, 2.4 * scale, 0);
    branch1.rotation.z = -0.65;
    branch1.rotation.y = 0.3;
    branch1.castShadow = true;
    treeGroup.add(branch1);

    const branch2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * scale, 0.2 * scale, 2.0 * scale, 6),
      trunkMat
    );
    branch2.position.set(-0.35 * scale, 2.6 * scale, 0.3 * scale);
    branch2.rotation.z = 0.65;
    branch2.rotation.y = 2.2;
    branch2.castShadow = true;
    treeGroup.add(branch2);

    const crownGroup = new THREE.Group();
    const activeCanopyMat = isWarm ? canopyMatWarm : canopyMat;

    const puffConfigs = [
      { pos: [0, 4.4, 0], r: 2.3 },
      { pos: [1.2, 3.8, 0.4], r: 1.7 },
      { pos: [-1.1, 4.0, 0.5], r: 1.75 },
      { pos: [0.3, 3.7, -1.2], r: 1.65 },
      { pos: [-0.4, 3.6, 1.1], r: 1.6 },
      { pos: [0.2, 5.5, 0.1], r: 1.85 },
      { pos: [-0.8, 4.8, -0.7], r: 1.5 },
      { pos: [0.9, 4.9, 0.6], r: 1.45 }
    ];

    puffConfigs.forEach((cfg) => {
      const geo = new THREE.DodecahedronGeometry(cfg.r * scale, 1);
      const posAttr = geo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const vz = posAttr.getZ(i);
        const noise = Math.sin(vx * 3.0) * Math.cos(vy * 3.0) * 0.12 * scale;
        posAttr.setXYZ(i, vx + noise, vy + noise, vz + noise);
      }
      geo.computeVertexNormals();

      const puff = new THREE.Mesh(geo, activeCanopyMat);
      puff.position.set(cfg.pos[0] * scale, cfg.pos[1] * scale, cfg.pos[2] * scale);
      puff.castShadow = true;
      puff.receiveShadow = true;
      crownGroup.add(puff);
    });

    treeGroup.add(crownGroup);
    animatedTrees.push({ group: crownGroup, seed: Math.random() * 10 });

    treeGroup.position.set(x, 0, z);
    envGroup.add(treeGroup);
    return treeGroup;
  }

  function createLushPine(x, z, scale = 1.0) {
    const pineGroup = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * scale, 0.32 * scale, 2.5 * scale, 6),
      trunkMat
    );
    trunk.position.y = 1.25 * scale;
    trunk.castShadow = true;
    pineGroup.add(trunk);

    const pineMat = new THREE.MeshStandardMaterial({
      map: foliageTex,
      color: 0x2e5e28,
      roughness: 0.7,
      emissive: 0x0e200c,
      emissiveIntensity: 0.2
    });

    const tierCount = 5;
    for (let t = 0; t < tierCount; t++) {
      const radius = (2.2 - t * 0.35) * scale;
      const height = (2.0 - t * 0.15) * scale;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 8),
        pineMat
      );
      cone.position.y = (2.0 + t * 1.3) * scale;
      cone.castShadow = true;
      cone.receiveShadow = true;
      pineGroup.add(cone);
    }

    animatedTrees.push({ group: pineGroup, seed: Math.random() * 10 });
    pineGroup.position.set(x, 0, z);
    envGroup.add(pineGroup);
  }

  const treePositions = [
    [-40, -25, 1.2], [-25, -28, 1.1], [-10, -28, 1.15], [10, -28, 1.15], [25, -28, 1.1], [40, -25, 1.25],
    [-42, -10, 1.15], [-42, 5, 1.2], [-42, 20, 1.1],
    [42, -10, 1.15], [42, 5, 1.2], [42, 20, 1.1],
    [-30, 15, 1.05], [30, 15, 1.05], [-20, 12, 0.95], [20, 12, 0.95]
  ];

  treePositions.forEach((pos, idx) => {
    const isPine = idx % 4 === 1;
    if (isPine) {
      createLushPine(pos[0], pos[1], pos[2]);
    } else {
      createLushTree(pos[0], pos[1], pos[2], idx % 5 === 0);
    }
  });
}

/* ---------- 6) إعداد وركن السيارات في مواقعها الأصلية ---------- */
function setupOriginalCars() {
  const textureLoader = new THREE.TextureLoader();
  const carAlbedo = textureLoader.load("albedo.png");
  carAlbedo.flipY = false;
  carAlbedo.colorSpace = THREE.SRGBColorSpace;

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  const carAlbedoRed = new THREE.CanvasTexture(canvas);
  carAlbedoRed.flipY = false;
  carAlbedoRed.colorSpace = THREE.SRGBColorSpace;

  const img = new Image();
  img.src = "albedo.png";
  img.onload = () => {
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (b > r + 20 && b > g + 10) {
        data[i] = Math.min(255, b * 1.2);
        data[i + 1] = g * 0.5;
        data[i + 2] = r * 0.5;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    carAlbedoRed.needsUpdate = true;
  };

  const gltfLoader = new GLTFLoader();
  gltfLoader.load("dodge_LP.glb", (gltf) => {
    const carScene = gltf.scene;
    const box = new THREE.Box3().setFromObject(carScene);
    const size = box.getSize(new THREE.Vector3());
    const scaleFactor = 5.5 / Math.max(size.x, size.z);
    carScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    box.setFromObject(carScene);
    const center = box.getCenter(new THREE.Vector3());
    carScene.position.sub(center);
    carScene.position.y += box.getSize(new THREE.Vector3()).y / 2;

    const baseCarGroup = new THREE.Group();
    baseCarGroup.add(carScene);

    function createRealCar(x, z, direction = 1, isParked = false, customTexture = null) {
      const carClone = baseCarGroup.clone();
      carClone.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.map = customTexture ? customTexture : carAlbedo;
          child.material.vertexColors = false;
          child.material.color.setHex(0xffffff);
          child.material.metalness = 0.2;
          child.material.roughness = 0.6;
          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      carClone.position.set(x, 0, z);
      if (direction === -1) carClone.rotation.y = Math.PI;

      const headlight = new THREE.PointLight(0xffffee, 1.0, 20);
      headlight.position.set(direction === 1 ? 2.5 : -2.5, 1.0, 0);
      carClone.add(headlight);

      carClone.userData.isCar = true;
      carClone.userData.speed = isParked ? 0 : (0.3 + Math.random() * 0.1) * direction;
      envGroup.add(carClone);
      return carClone;
    }

    const movingCar1 = createRealCar(-15, 10, 1, true, carAlbedoRed);
    movingCar1.rotation.y = 0;

    const parkedCar = createRealCar(15, 10, 1, true, carAlbedo);
    parkedCar.rotation.y = 0;

    window.allCars.push(movingCar1, parkedCar);
    window.movingCars.push(movingCar1, parkedCar);
  });
}

/* ---------- 7) عناصر التحكم بالكاميرا ---------- */
function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.6;
  controls.minDistance = 2.0;
  controls.maxDistance = 140;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
}

/* ---------- 8) تحميل الموديل وتطبيق خامات PBR المعمارية الفاخرة للواقعية التامة ---------- */
function updateStatus(text) {
  if (DOM.loaderStatus) DOM.loaderStatus.textContent = text;
}

function updateProgress(ratio, loaded, total) {
  const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));
  if (DOM.progressBar) DOM.progressBar.style.width = `${pct}%`;
  if (DOM.progressText) DOM.progressText.textContent = `${pct}%`;

  if (loaded !== undefined && total !== undefined && total > 0) {
    const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
    const totalMB = (total / (1024 * 1024)).toFixed(1);
    if (DOM.progressDetail) {
      DOM.progressDetail.textContent = `${loadedMB} MB / ${totalMB} MB`;
    }
  }
}

function showLoader(text = "جاري تحميل مجسم المبنى والخامات…") {
  DOM.loader.classList.remove("done");
  updateStatus(text);
  updateProgress(0.05);
}

function removeCurrentModel() {
  if (model) {
    scene.remove(model);
    model = null;
  }
}

function loadModel() {
  showLoader("جاري تطبيق خامات PBR المعمارية الفاخرة والواقعية التامة…");

  const loader = new OBJLoader();
  loader.load(
    CONFIG.modelPath,
    (object) => {
      removeCurrentModel();
      model = object;

      applyArchitecturalMaterials(model);
      centerAndFrameModel(model);

      scene.add(model);
      finishLoading();
      showToast("✓ تم تفعيل المشهد المعماري الواقعي الفاخر!");
    },
    (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        updateProgress(xhr.loaded / xhr.total, xhr.loaded, xhr.total);
      } else if (xhr.loaded > 0) {
        const estTotal = 18 * 1024 * 1024;
        updateProgress(Math.min(0.96, xhr.loaded / estTotal), xhr.loaded, estTotal);
      }
    },
    (err) => {
      console.error("[Loader Error]", err);
      showError("تعذر تحميل ملف الموديل: " + (err.message || err));
    }
  );
}

/* تطبيق خامات PBR المعمارية الفاخرة للواقعية التامة */
function applyArchitecturalMaterials(object) {
  windowMeshEntries = [];
  interiorPointLights.forEach((l) => scene.remove(l));
  interiorPointLights.length = 0;

  // توليد التكستشرات
  const woodSlatTex = createWoodSlatTexture();
  const plasterTex = createArchitecturalPlasterTexture();
  const litWindowWarmTex = createLitWindowTexture(true);
  const litWindowSoftTex = createLitWindowTexture(false);
  const darkWindowTex = createDarkWindowTexture();

  // 1. خامة الجدران الرئيسية البيضاء المعمارية الفاخرة (Architectural White Stucco/Plaster)
  const matWhiteWall = new THREE.MeshStandardMaterial({
    map: plasterTex,
    color: 0xf3f5f8,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  // 2. خامة شرائح الخشب الطبيعي الفاخر للبلكونات والمدخل (Natural Architectural Timber Louvers)
  const matWoodBalcony = new THREE.MeshStandardMaterial({
    map: woodSlatTex,
    roughness: 0.42,
    metalness: 0.04,
    side: THREE.DoubleSide
  });

  // 3. خامة أساسات وقاعدة المبنى المعمارية (Architectural Basalt/Concrete Base)
  const matDarkBase = new THREE.MeshStandardMaterial({
    color: 0x22272e,
    roughness: 0.75,
    metalness: 0.06,
    side: THREE.DoubleSide
  });

  // 4. أشرطة النوافذ المعمارية الفحمية والكورنيش (Architectural Cornice & Accent Bands)
  const matAccentBand = new THREE.MeshStandardMaterial({
    color: 0x282d36,
    roughness: 0.65,
    metalness: 0.12,
    side: THREE.DoubleSide
  });

  // 5. سطح المبنى والكورنيش
  const matRoofSurface = new THREE.MeshStandardMaterial({
    color: 0x303640,
    roughness: 0.7,
    metalness: 0.15,
    side: THREE.DoubleSide
  });

  // 6. لمبات وإنارة السطح المتوهجة (Glowing Roof Lamps)
  const matRoofLamps = new THREE.MeshStandardMaterial({
    color: 0xfff4e0,
    emissive: 0xffaa33,
    emissiveIntensity: 3.5,
    roughness: 0.15,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  roofLampsMaterial = matRoofLamps;

  // 6.1 مصباح وإنارة المدخل الجداري الفاخرة
  const matEntranceLamp = new THREE.MeshStandardMaterial({
    color: 0xffeedd,
    emissive: 0xffaa24,
    emissiveIntensity: 4.5,
    roughness: 0.15,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  entranceLampMaterial = matEntranceLamp;

  // إضافة إضاءة نقطية دافئة لمجموعات لمبات السطح الثلاث
  const roofPositions = [
    [-4.05, 16.5, -1.0],
    [0.0, 16.5, -1.0],
    [4.05, 16.5, -1.0]
  ];
  roofPositions.forEach((pos) => {
    const roofLight = new THREE.PointLight(0xffa834, 1.2, 14, 1.4);
    roofLight.position.set(pos[0], pos[1], pos[2]);
    scene.add(roofLight);
    interiorPointLights.push(roofLight);
  });

  // 7. المداخن السوداء بالسطح
  const matBlackChimney = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.55,
    metalness: 0.2,
    side: THREE.DoubleSide
  });

  // 8. إطارات النوافذ والأبواب والدرابزين (Anthracite Architectural Frames)
  const matDarkFrame = new THREE.MeshStandardMaterial({
    color: 0x1f2329,
    roughness: 0.35,
    metalness: 0.7,
    side: THREE.DoubleSide
  });

  // 9. زجاج الشرفات الفاخر فائق السلاسة والأداء (High-Speed Tinted Balcony Glass)
  const matBalconyGlass = new THREE.MeshStandardMaterial({
    color: 0x182c3f,
    roughness: 0.06,
    metalness: 0.85,
    envMapIntensity: 2.2,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });

  // 10. أرضية الشرفات والرصيف الحجري
  const matBalconyFloor = new THREE.MeshStandardMaterial({
    color: 0xb5bcc4,
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  // 11. خامات الزجاج للنوافذ:
  // أ. زجاج مطفي عاكس للسماء والبيئة مع ستائر خافتة (Unlit Reflective Glass)
  const matGlassReflective = new THREE.MeshStandardMaterial({
    map: darkWindowTex,
    roughness: 0.05,
    metalness: 0.92,
    envMapIntensity: 2.6,
    side: THREE.DoubleSide
  });

  // ب. زجاج نافذة مضاءة بغرفة دافئة مع ستائر وإضاءة سقفية (Realistic Lit Window Amber)
  const matWindowLitWarm = new THREE.MeshStandardMaterial({
    map: litWindowWarmTex,
    emissive: 0xffa036,
    emissiveIntensity: 1.5,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  // ج. زجاج نافذة مضاءة بغرفة ناعمة (Realistic Lit Window Soft)
  const matWindowLitSoft = new THREE.MeshStandardMaterial({
    map: litWindowSoftTex,
    emissive: 0xffbd66,
    emissiveIntensity: 1.3,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  // د. زجاج الواجهة الزجاجية للدرج والمصعد المركزي (Luminous Architectural Stairwell Glass)
  const matStaircaseLit = new THREE.MeshStandardMaterial({
    color: 0xffedd0,
    emissive: 0xffaa44,
    emissiveIntensity: 1.7,
    roughness: 0.25,
    metalness: 0.2,
    side: THREE.DoubleSide
  });

  const matStaircaseDark = new THREE.MeshStandardMaterial({
    color: 0x162432,
    roughness: 0.06,
    metalness: 0.92,
    envMapIntensity: 2.5,
    side: THREE.DoubleSide
  });

  object.traverse((child) => {
    if (!child.isMesh) return;

    const meshName = (child.name || "").toLowerCase();

    if (
      meshName.startsWith("string") ||
      meshName.startsWith("venetian") ||
      meshName.includes("string") ||
      meshName.startsWith("plane.00") ||
      meshName.startsWith("plane.010") ||
      meshName.startsWith("plane.014") ||
      meshName.startsWith("plane.015") ||
      meshName.startsWith("plane.016") ||
      meshName.startsWith("plane.017")
    ) {
      child.visible = false;
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = true;

    // 1. الجدران الرئيسية (الأدوار العلوية)
    if (meshName === "walls") {
      child.material = [
        matWhiteWall,     // 0: PLASTER (الحيطان البيضاء الفاخرة)
        matWhiteWall,     // 1: PLASTER.001 (حوائط الشبابيك)
        matWoodBalcony,   // 2: WOOD.001 (شرائح الخشب المعمارية الفاخرة)
        matBalconyFloor   // 3: tiles (أرضية البلكونات)
      ];
    }
    // 2. الدور الأرضي والأساسات
    else if (meshName === "fundament") {
      child.material = [
        matDarkBase,      // 0: Concrete
        matDarkBase,      // 1: floor
        matBalconyFloor   // 2: tiles
      ];
    }
    // 3. أشرطة النوافذ الغامقة والكورنيش
    else if (
      meshName === "cube.003" ||
      meshName === "cube.005" ||
      meshName === "cube.017" ||
      meshName === "cube.018"
    ) {
      child.material = matAccentBand;
    }
    // 4. لمبات وإنارة السطح المتوهجة (Roof Lamp Bulbs)
    else if (
      meshName.includes("cylinder.004") ||
      meshName.includes("cylinder.005") ||
      meshName.includes("cylinder.006") ||
      meshName.includes("cylinder.007") ||
      meshName.includes("cylinder.001") ||
      meshName.includes("cylinder.002") ||
      meshName.includes("cylinder.003") ||
      meshName === "cylinder"
    ) {
      child.material = matRoofLamps;
    }
    // 5. مصباح ومستشعر المدخل الجداري الحقيقي (Outdoor Entrance Wall Lamp & Sconce)
    else if (
      meshName.includes("cylinder.020") ||
      meshName.includes("cylinder.022") ||
      meshName.includes("cylinder.023") ||
      meshName.includes("cylinder.024")
    ) {
      child.material = matEntranceLamp;
    }
    // 6. المداخن السوداء بالسطح
    else if (
      meshName.includes("cylinder.008") ||
      meshName.includes("cylinder.009") ||
      meshName.includes("cylinder.010") ||
      meshName.includes("cylinder.011") ||
      meshName.includes("cylinder.012") ||
      meshName.includes("cylinder.013") ||
      meshName.includes("cylinder.014") ||
      meshName.includes("cylinder.015") ||
      meshName.includes("cylinder.016") ||
      meshName.includes("cylinder.017") ||
      meshName.includes("cylinder.018")
    ) {
      child.material = matBlackChimney;
    }
    // 7. فتحة ومخرج السطح / الكوة (Roof Access Hatch)
    else if (meshName === "cube.015") {
      child.material = matDarkFrame;
    }
    // 8. سطح المبنى وكورنيش السطح
    else if (
      meshName.includes("cube.010") ||
      meshName.includes("cube.021") ||
      meshName.includes("schody")
    ) {
      child.material = matRoofSurface;
    }
    // 9. زجاج الشرفات الفاخر الشبه شفاف مع انعكاسات
    else if (
      meshName.includes("barierka.012") ||
      meshName.includes("barierka.013") ||
      meshName.includes("barierka.014") ||
      meshName.includes("barierka.015") ||
      meshName.includes("barierka.016") ||
      meshName.includes("barierka.017") ||
      meshName.includes("barierka.018") ||
      meshName.includes("barierka.019") ||
      meshName.includes("barierka.020") ||
      meshName.includes("barierka.021") ||
      meshName.includes("barierka.022") ||
      meshName.includes("barierka.023")
    ) {
      child.material = matBalconyGlass;
    }
    // 10. إطارات الدرابزين الحديدي
    else if (meshName.startsWith("barierka")) {
      child.material = matDarkFrame;
    }
    // 11. واجهات الدرج والسلالم الوسطية والشقق (Windows Architecture)
    else if (meshName.startsWith("window")) {
      child.geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      child.geometry.boundingBox.getCenter(center);

      const isStaircase = Math.abs(center.x) < 2.0;
      let isLit = false;
      let litMat = matWindowLitWarm;

      if (isStaircase) {
        isLit = center.y > 6.0;
        litMat = matStaircaseLit;
      } else {
        const hash = Math.sin(center.x * 12.9898 + center.y * 78.233 + center.z * 37.719) * 43758.5453;
        const randVal = hash - Math.floor(hash);
        isLit = randVal > 0.52;
        litMat = randVal > 0.78 ? matWindowLitWarm : matWindowLitSoft;
      }

      const unlitMat = isStaircase ? matStaircaseDark : matGlassReflective;
      const currentMat = isLit ? litMat : unlitMat;

      if (Array.isArray(child.material) && child.material.length > 1) {
        child.material = child.material.map((_, idx) => {
          if (idx === 2 || idx === 1) {
            windowMeshEntries.push({
              mesh: child,
              isLit,
              isStaircase,
              litMat,
              unlitMat,
              matIndex: idx
            });
            return currentMat;
          }
          return matDarkFrame;
        });
      } else {
        child.material = currentMat;
        windowMeshEntries.push({
          mesh: child,
          isLit,
          isStaircase,
          litMat,
          unlitMat
        });
      }

      if (isLit && !isStaircase && Math.random() > 0.4) {
        const roomLight = new THREE.PointLight(0xffb04a, 0.8, 6, 1.8);
        roomLight.position.set(center.x, center.y + 0.3, center.z - (center.z > 0 ? 0.6 : -0.6));
        scene.add(roomLight);
        interiorPointLights.push(roomLight);
      }
    }
    // 12. إطارات النوافذ والمداخل والأبواب
    else if (
      meshName.startsWith("cube.008") ||
      meshName.startsWith("rama") ||
      meshName.startsWith("frame") ||
      meshName === "cube"
    ) {
      child.material = matDarkFrame;
    }
    // 13. الرصيف
    else if (meshName === "plane") {
      child.material = matBalconyFloor;
    }
    // 14. باقي الجدران والعناصر
    else if (meshName.startsWith("cube.04") || meshName.startsWith("cube.05")) {
      child.material = matWhiteWall;
    } else {
      child.material = matWhiteWall;
    }
  });
}

function centerAndFrameModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  object.position.x -= center.x;
  object.position.y -= box.min.y;
  object.position.z -= center.z;

  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = (maxDim / Math.sin(fov / 2)) * 0.72;

  camera.position.set(dist * 0.65, size.y * 0.62, dist * 0.78);
  camera.near = Math.max(dist / 200, 0.1);
  camera.far = dist * 30;
  camera.updateProjectionMatrix();

  controls.target.set(0, size.y * 0.42, 0);
  controls.minDistance = 2.0;
  controls.maxDistance = dist * 4;
  controls.update();

  initialCamState = { pos: camera.position.clone(), target: controls.target.clone() };
}

/* ---------- 9) حلقة العرض والأنيميشن التفاعلية (60 FPS Locked) ---------- */
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const timeSec = now * 0.001;

  animatedTrees.forEach((item) => {
    const angle = Math.sin(timeSec * 1.5 + item.seed) * 0.015;
    item.group.rotation.z = angle;
    item.group.rotation.x = Math.cos(timeSec * 1.1 + item.seed) * 0.01;
  });

  controls.update();
  renderer.render(scene, camera);

  frameCount++;
  if (now - lastFpsTime >= 1000) {
    const currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    if (DOM.fpsVal) DOM.fpsVal.textContent = `${currentFps}`;
    frameCount = 0;
    lastFpsTime = now;
  }
}

/* ---------- 10) أدوات التحكم والواجهة ---------- */
function captureScreenshot() {
  renderer.render(scene, camera);
  const dataURL = DOM.canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = `Modern_Architecture_PBR_${Date.now()}.png`;
  a.click();
  showToast("📸 تم حفظ لقطة معمارية للمبنى بجودة فائقة!");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    showToast("⛶ وضع ملء الشاشة");
  } else {
    document.exitFullscreen();
    showToast("⛶ تم الخروج من ملء الشاشة");
  }
}

function finishLoading() {
  updateProgress(1);
  updateStatus("اكتمل تحميل المبنى بنجاح!");
  setTimeout(() => {
    DOM.loader.classList.add("done");
    document.body.classList.add("ready");
  }, 350);
}

function showError(msg) {
  DOM.errorMessage.textContent = msg;
  DOM.loaderError.classList.remove("hidden");
  if (DOM.progressBar) DOM.progressBar.style.background = "#ef4444";
}

let toastTimer;
function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.add("hidden"), 3000);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
}

function initUI() {
  DOM.todDay?.addEventListener("click", () => setTimeOfDay("day"));
  DOM.todSunset?.addEventListener("click", () => setTimeOfDay("sunset"));
  DOM.todNight?.addEventListener("click", () => setTimeOfDay("night"));

  DOM.btnLights?.addEventListener("click", () => {
    const newState = !windowLightsEnabled;
    DOM.btnLights.classList.toggle("active", newState);
    updateWindowMaterials(newState, currentTimeOfDay === "night" ? 3.0 : 1.4);
    showToast(newState ? "💡 تم تشغيل إنارة الشبابيك" : "🌑 تم إطفاء إنارة الشبابيك");
  });

  DOM.btnRotate?.addEventListener("click", () => {
    controls.autoRotate = !controls.autoRotate;
    DOM.btnRotate.classList.toggle("active", controls.autoRotate);
    showToast(controls.autoRotate ? "⟳ دوران تلقائي للمبنى" : "⏸ إيقاف الدوران");
  });

  DOM.btnReset?.addEventListener("click", () => {
    if (initialCamState) {
      camera.position.copy(initialCamState.pos);
      controls.target.copy(initialCamState.target);
      controls.update();
      showToast("⌂ إعادة ضبط الكاميرا للزاوية الافتراضية");
    }
  });

  DOM.btnWireframe?.addEventListener("click", () => {
    const enable = !DOM.btnWireframe.classList.contains("active");
    DOM.btnWireframe.classList.toggle("active", enable);
    model?.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => m && (m.wireframe = enable));
    });
    showToast(enable ? "◈ تفعيل وضع الهيكل السلكي" : "◈ استعادة الخامات الواقعية الكاملة");
  });

  DOM.btnScreenshot?.addEventListener("click", captureScreenshot);
  DOM.btnFullscreen?.addEventListener("click", toggleFullscreen);

  DOM.btnToggleInfo?.addEventListener("click", () => {
    DOM.infoCard.classList.toggle("collapsed");
    DOM.btnToggleInfo.textContent = DOM.infoCard.classList.contains("collapsed") ? "+" : "−";
  });
}

/* ---------- 11) بدء التشغيل ---------- */
try {
  initScene();
  loadModel();
  initUI();
  animate();
} catch (err) {
  console.error("[Architecture Viewer] Init Error:", err);
  showError(`تعذر بدء العارض ثلاثي الأبعاد: ${err.message}`);
}
