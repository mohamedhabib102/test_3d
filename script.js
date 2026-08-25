import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

/* ============================================================
   Modern Residential Architecture 3D — Dual Engine & 60 FPS
   ============================================================ */

const CONFIG = {
  glbPath: "Untitled.glb",
  objPath: "Untitled.obj",
  mtlPath: "Untitled.mtl",
  camera: { fov: 40, near: 0.2, far: 400 },
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
  infoCard: document.querySelector(".property-card"),
  toast: document.getElementById("toast"),
};

let scene, camera, renderer, controls, model;
let initialCamState;
let dynamicPixelRatio = 1.0;

// فحص الفريمات
let frameCount = 0;
let lastFpsTime = performance.now();
const fpsHistory = [];

/* ---------- 1) فحص عتاد الجهاز التلقائي ---------- */
function detectDeviceTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile || cores <= 2) return "perf";
  return "high";
}

/* ---------- 2) المشهد والإضاءة المعمارية السريعة والواقعية ---------- */
let lights = {};

function initScene() {
  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.FogExp2(0x0e131d, 0.00015);

  camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    innerWidth / innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
  );
  camera.position.set(22, 12, 24);

  renderer = new THREE.WebGLRenderer({
    canvas: DOM.canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  const tier = detectDeviceTier();
  dynamicPixelRatio = tier === "perf" ? 0.95 : Math.min(window.devicePixelRatio || 1, 1.25);
  renderer.setPixelRatio(dynamicPixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  setupAtmosphere();
  setupLighting();
  setupControls();

  addEventListener("resize", onResize);
}

function setupAtmosphere() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const skyScene = new THREE.Scene();

  const sky = new THREE.Mesh(
    new THREE.BoxGeometry(200, 200, 200),
    new THREE.MeshBasicMaterial({ color: 0x98bde3, side: THREE.BackSide })
  );
  skyScene.add(sky);

  const horizon = new THREE.Mesh(
    new THREE.CylinderGeometry(120, 120, 30, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffeedc, side: THREE.BackSide })
  );
  skyScene.add(horizon);

  const envMap = pmrem.fromScene(skyScene, 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();
}

function setupLighting() {
  // 1. إضاءة السماء المحيطية
  lights.hemi = new THREE.HemisphereLight(0xf5f8ff, 0x483e32, 1.4);
  scene.add(lights.hemi);

  // 2. ضوء الشمس
  lights.sun = new THREE.DirectionalLight(0xfff6ea, 2.5);
  lights.sun.position.set(30, 42, 28);
  lights.sun.castShadow = true;
  lights.sun.shadow.mapSize.set(1024, 1024);
  lights.sun.shadow.bias = -0.0001;
  lights.sun.shadow.normalBias = 0.02;
  lights.sun.shadow.camera.near = 1;
  lights.sun.shadow.camera.far = 100;
  const d = 25;
  lights.sun.shadow.camera.left = -d;
  lights.sun.shadow.camera.right = d;
  lights.sun.shadow.camera.top = d;
  lights.sun.shadow.camera.bottom = -d;
  scene.add(lights.sun);

  // 3. Fill Light
  lights.fill = new THREE.DirectionalLight(0x95bbe6, 0.7);
  lights.fill.position.set(-25, 18, -25);
  scene.add(lights.fill);

  // 4. Ambient Light
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
}

function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.6;
  controls.minDistance = 2.0;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2 - 0.01;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
}

/* ---------- 3) تحميل الموديل مع دعم الـ Fallback التلقائي (GLB ⬅ OBJ) ---------- */
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

function loadModel() {
  updateStatus("جاري تحميل مجسم المبنى والخامات الواقعية…");
  updateProgress(0.05);

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/");
  loader.setDRACOLoader(dracoLoader);

  // محاولة تحميل ملف GLB أولاً
  loader.load(
    CONFIG.glbPath,
    (gltf) => {
      model = gltf.scene;
      enhanceAndOptimizeMaterials(model);
      centerAndFrameModel(model);
      scene.add(model);
      finishLoading();
      showToast("✓ تم تحميل المبنى بكامل تفاصيله وواقعيته!");
    },
    (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        const ratio = xhr.loaded / xhr.total;
        updateProgress(ratio, xhr.loaded, xhr.total);
      } else if (xhr.loaded > 0) {
        const estTotal = 163 * 1024 * 1024;
        const ratio = Math.min(0.95, xhr.loaded / estTotal);
        updateProgress(ratio, xhr.loaded, estTotal);
      }
    },
    (err) => {
      console.warn("[GLTFLoader Fallback to OBJ]", err);
      loadObjFallback();
    }
  );
}

function loadObjFallback() {
  updateStatus("جاري قراءة خامات ومجسم المبنى (Untitled.obj)…");
  updateProgress(0.3);

  const mtlLoader = new MTLLoader();
  mtlLoader.load(
    CONFIG.mtlPath,
    (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load(
        CONFIG.objPath,
        (object) => {
          model = object;
          enhanceAndOptimizeMaterials(model);
          centerAndFrameModel(model);
          scene.add(model);
          finishLoading();
          showToast("✓ تم تحميل المبنى بنجاح!");
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const ratio = 0.3 + (xhr.loaded / xhr.total) * 0.7;
            updateProgress(ratio, xhr.loaded, xhr.total);
          }
        },
        (err) => {
          console.error("[OBJLoader Error]", err);
          showError("تعذر تحميل ملف الموديل");
        }
      );
    },
    (xhr) => {
      if (xhr.lengthComputable) updateProgress((xhr.loaded / xhr.total) * 0.3);
    },
    () => {
      // إذا لم يتوفر MTL نحمل OBJ مباشرة
      const objLoader = new OBJLoader();
      objLoader.load(CONFIG.objPath, (object) => {
        model = object;
        enhanceAndOptimizeMaterials(model);
        centerAndFrameModel(model);
        scene.add(model);
        finishLoading();
      });
    }
  );
}

/* ترقية الخامات إلى PBR وإلغاء السواد والبقع اللامعة */
function enhanceAndOptimizeMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;

    const meshName = (child.name || "").toLowerCase();

    // تخفيف ضغط الظلال لضمان 60 FPS
    const isMajorOuterWall = meshName.includes("cube") || meshName.includes("wall") || meshName.includes("roof");
    child.castShadow = isMajorOuterWall;
    child.receiveShadow = true;
    child.frustumCulled = true;

    if (child.geometry && !child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }

    const mats = Array.isArray(child.material) ? child.material : [child.material];

    mats.forEach((mat) => {
      if (!mat) return;
      const matName = (mat.name || "").toLowerCase();

      mat.envMapIntensity = 1.0;

      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
      }

      // 1. تصحيح الجدران الخرسانية والرخامية الفاتحة
      if (matName.includes("plaster.002") || matName.includes("concrete") || matName.includes("plaster") || matName.includes("material.002") || matName.includes("material.003")) {
        mat.color.setHex(0xdedad2);
        mat.metalness = 0.0;
        mat.roughness = 0.85;
        mat.transparent = false;
        mat.opacity = 1.0;
      }
      // 2. الزجاج الشفاف للنوافذ
      else if (matName.includes("glass") || mat.transmission > 0) {
        mat.transparent = true;
        mat.opacity = 0.35;
        mat.roughness = 0.04;
        mat.metalness = 0.1;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
      }
      // 3. درابزين الشرفة والمعادن السوداء والأبواب
      else if (matName.includes("steel") || matName.includes("barierka") || matName.includes("pvc") || matName.includes("black")) {
        mat.color.setHex(0x242629);
        mat.roughness = 0.35;
        mat.metalness = 0.8;
        mat.side = THREE.DoubleSide;
      }
      // 4. السقف والألواح
      else if (matName.includes("roof") || matName.includes("schody")) {
        mat.color.setHex(0x32353a);
        mat.roughness = 0.6;
        mat.metalness = 0.2;
      }
      // 5. الخشب الطبيعي
      else if (matName.includes("wood")) {
        mat.roughness = 0.5;
        mat.metalness = 0.05;
      }
      // 6. الرصيف وأحجار الأرضيات
      else if (matName.includes("pavingstone") || matName.includes("cobblestone") || matName.includes("tiles") || matName.includes("floor")) {
        mat.roughness = 0.8;
        mat.metalness = 0.02;
      }

      mat.needsUpdate = true;
    });
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

  camera.position.set(dist * 0.62, size.y * 0.7, dist * 0.75);
  camera.near = Math.max(dist / 200, 0.1);
  camera.far = dist * 25;
  camera.updateProjectionMatrix();

  controls.target.set(0, size.y * 0.35, 0);
  controls.minDistance = 2.0;
  controls.maxDistance = dist * 4;
  controls.update();

  initialCamState = { pos: camera.position.clone(), target: controls.target.clone() };
}

/* ---------- 4) محرك التكيف التلقائي (Stable 60 FPS) ---------- */
function adaptPerformance(currentFps) {
  fpsHistory.push(currentFps);
  if (fpsHistory.length > 3) {
    fpsHistory.shift();
    const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;

    if (avgFps < 45 && dynamicPixelRatio > 0.85) {
      dynamicPixelRatio = Math.max(0.8, Number((dynamicPixelRatio - 0.08).toFixed(2)));
      renderer.setPixelRatio(dynamicPixelRatio);
    } else if (avgFps >= 57 && dynamicPixelRatio < Math.min(window.devicePixelRatio || 1, 1.4)) {
      dynamicPixelRatio = Math.min(Math.min(window.devicePixelRatio || 1, 1.4), Number((dynamicPixelRatio + 0.04).toFixed(2)));
      renderer.setPixelRatio(dynamicPixelRatio);
    }
  }
}

/* ---------- 5) دورة العرض التفاعلية ---------- */
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();

  controls.update();
  renderer.render(scene, camera);

  frameCount++;
  if (now - lastFpsTime >= 1000) {
    const currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    if (DOM.fpsVal) DOM.fpsVal.textContent = `${currentFps}`;
    adaptPerformance(currentFps);
    frameCount = 0;
    lastFpsTime = now;
  }
}

/* ---------- 6) الأدوات المساعدة ---------- */
function captureScreenshot() {
  renderer.render(scene, camera);
  const dataURL = DOM.canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = `Architecture_3D_${Date.now()}.png`;
  a.click();
  showToast("📸 تم حفظ صورة المبنى بنجاح!");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    showToast("⛶ تم تفعيل ملء الشاشة");
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
  }, 300);
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
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(dynamicPixelRatio);
}

function initUI() {
  DOM.btnRotate?.addEventListener("click", () => {
    controls.autoRotate = !controls.autoRotate;
    DOM.btnRotate.classList.toggle("active", controls.autoRotate);
    showToast(controls.autoRotate ? "⟳ تم تشغيل الدوران التلقائي" : "⏸ تم إيقاف الدوران");
  });

  DOM.btnReset?.addEventListener("click", () => {
    if (initialCamState) {
      camera.position.copy(initialCamState.pos);
      controls.target.copy(initialCamState.target);
      controls.update();
      showToast("⌂ تم إعادة ضبط الكاميرا");
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
    showToast(enable ? "◈ تفعيل وضع الهيكل السلكي (Wireframe)" : "◈ العرض الملون الكامل");
  });

  DOM.btnScreenshot?.addEventListener("click", captureScreenshot);
  DOM.btnFullscreen?.addEventListener("click", toggleFullscreen);

  DOM.btnToggleInfo?.addEventListener("click", () => {
    DOM.infoCard.classList.toggle("collapsed");
    DOM.btnToggleInfo.textContent = DOM.infoCard.classList.contains("collapsed") ? "+" : "−";
  });
}

/* ---------- 7) البدء ---------- */
try {
  initScene();
  loadModel();
  initUI();
  animate();
} catch (err) {
  console.error("[Architecture Viewer] Init Error:", err);
  showError(`تعذر بدء العارض ثلاثي الأبعاد: ${err.message}`);
}
