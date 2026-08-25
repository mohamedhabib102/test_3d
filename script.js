import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

/* ============================================================
   Modern Residential Architecture 3D — 100% Solid & Accurate
   ============================================================ */

const CONFIG = {
  modelPath: "Untitled.obj?v=13",
  camera: { fov: 36, near: 0.1, far: 500 },
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
let frameCount = 0;
let lastFpsTime = performance.now();

/* ---------- 1) إعداد المشهد والـ Renderer ---------- */
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

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  setupLighting();
  setupEnvironment();
  setupControls();

  window.addEventListener("resize", onResize);
}

/* ---------- 2) إضاءة الاستوديو المعمارية 360 درجة مع إضاءة خاصة للسطح ---------- */
function setupLighting() {
  // 1. إضاءة القبة السماوية المتوازنة (Hemisphere Light)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8294a5, 2.2);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  // 2. ضوء الشمس الرئيسي من الأمام والأعلى مع الظلال الناعمة
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.set(32, 48, 28);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.bias = -0.00008;
  sunLight.shadow.normalBias = 0.02;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 120;
  const d = 28;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  // 3. ضوء خلفي رئيسي لإنارة الواجهة الخلفية
  const backLight = new THREE.DirectionalLight(0xf4f8fd, 1.8);
  backLight.position.set(-30, 42, -30);
  scene.add(backLight);

  // 4. ضوء جانبي أيسر
  const leftLight = new THREE.DirectionalLight(0xdde8f5, 1.3);
  leftLight.position.set(-32, 28, 26);
  scene.add(leftLight);

  // 5. ضوء جانبي أيمن
  const rightLight = new THREE.DirectionalLight(0xdde8f5, 1.3);
  rightLight.position.set(32, 28, -26);
  scene.add(rightLight);

  // 6. ضوء علوي مباشر لإظهار كل تفاصيل السطح والمداخن والمواسير الفضية
  const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
  topLight.position.set(0, 50, 0);
  scene.add(topLight);

  // 7. إضاءة عامة ناعمة
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
}

/* بيئة انعكاسات استوديو للمعان الزجاج والمعادن */
function setupEnvironment() {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const studioScene = new THREE.Scene();
  const skyMesh = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x9cb0bf,
      side: THREE.BackSide,
    })
  );
  studioScene.add(skyMesh);

  const envTex = pmremGenerator.fromScene(studioScene, 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();
}

function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.6;
  controls.minDistance = 2.0;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
}

/* ---------- 3) تحميل الموديل المعماري الكامل ---------- */
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
  showLoader("جاري تحميل مجسم المبنى والخامات المعمارية المصمتة…");

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
      showToast("✓ تم تحميل المبنى بجدرانه البيضاء وتفاصيله بالكامل بنجاح!");
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

/* تطبيق الخامات المعمارية الدقيقة والمطابقة لصورة الموديل 100% */
function applyArchitecturalMaterials(object) {
  // خامات مسبقة الصنع فائقة الدقة
  const matWhiteWall = new THREE.MeshStandardMaterial({
    color: 0xfcfdff, // أبيض نقي ناصع مصمت
    roughness: 0.88,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const matWoodBalcony = new THREE.MeshStandardMaterial({
    color: 0xc4975e, // خشب طبيعي دافئ
    roughness: 0.52,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const matDarkBase = new THREE.MeshStandardMaterial({
    color: 0x353b44, // رمادي داكن معماري
    roughness: 0.82,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const matAccentBand = new THREE.MeshStandardMaterial({
    color: 0x363c46, // رمادي غامق لأشرطة النوافذ
    roughness: 0.85,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const matRoofSurface = new THREE.MeshStandardMaterial({
    color: 0x2e333b, // رمادي السطح والكورنيش
    roughness: 0.72,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  const matSilverPipes = new THREE.MeshStandardMaterial({
    color: 0xe4ebf2, // فضي كروم عاكس
    metalness: 0.95,
    roughness: 0.14,
    envMapIntensity: 2.5,
    side: THREE.DoubleSide,
  });

  const matBlackChimney = new THREE.MeshStandardMaterial({
    color: 0x20242a, // أسود مطفي للمداخن
    roughness: 0.55,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0xd0e2ec,
    transparent: true,
    opacity: 0.38,
    roughness: 0.04,
    metalness: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const matDarkFrame = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.45,
    metalness: 0.7,
    side: THREE.DoubleSide,
  });

  const matSidewalk = new THREE.MeshStandardMaterial({
    color: 0xcfc8ba,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  object.traverse((child) => {
    if (!child.isMesh) return;

    const meshName = (child.name || "").toLowerCase();

    // 1. إخفاء خيوط الستائر والستائر لمنع خطوط الوايرفريم
    if (meshName.startsWith("string") || meshName.startsWith("venetian") || meshName.includes("string") || meshName.startsWith("plane.00") || meshName.startsWith("plane.010") || meshName.startsWith("plane.014") || meshName.startsWith("plane.015") || meshName.startsWith("plane.016") || meshName.startsWith("plane.017")) {
      child.visible = false;
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = true;

    // 2. الجدران الرئيسية (الأدوار العلوية) - مصفوفة الخامات الأربعة
    if (meshName === "walls") {
      child.material = [
        matWhiteWall,    // 0: PLASTER (الحيطان البيضاء)
        matWhiteWall,    // 1: PLASTER.001 (حوائط الشبابيك البيضاء)
        matWoodBalcony,  // 2: WOOD.001 (خشب البلكونات)
        matSidewalk      // 3: tiles (أرضية البلكونات)
      ];
    }
    // 3. الدور الأرضي والأساسات
    else if (meshName === "fundament") {
      child.material = [
        matDarkBase,     // 0: Concrete (الرمادي الداكن)
        matDarkBase,     // 1: floor
        matSidewalk      // 2: tiles
      ];
    }
    // 4. أشرطة النوافذ الغامقة
    else if (meshName === "cube.003" || meshName === "cube.005" || meshName === "cube.017" || meshName === "cube.018") {
      child.material = matAccentBand;
    }
    // 5. أنابيب التهوية الفضية بالسطح
    else if (meshName.includes("cylinder.004") || meshName.includes("cylinder.005") || meshName.includes("cylinder.006") || meshName.includes("cylinder.007") || meshName.includes("cylinder.001") || meshName.includes("cylinder.002") || meshName.includes("cylinder.003") || meshName === "cylinder") {
      child.material = matSilverPipes;
    }
    // 6. المداخن الثلاثة بالسطح
    else if (meshName.includes("cylinder.008") || meshName.includes("cylinder.010") || meshName.includes("cylinder.011") || meshName.includes("cylinder.012") || meshName.includes("cylinder.020") || meshName.includes("cylinder.022") || meshName.includes("cylinder.023") || meshName.includes("cylinder.024")) {
      child.material = matBlackChimney;
    }
    // 7. سطح المبنى وكورنيش السطح
    else if (meshName.includes("cube.010") || meshName.includes("cube.021") || meshName.includes("schody")) {
      child.material = matRoofSurface;
    }
    // 8. الزجاج
    else if (meshName.includes("barierka.012") || meshName.includes("barierka.013") || meshName.includes("barierka.014") || meshName.includes("barierka.015") || meshName.includes("barierka.016") || meshName.includes("barierka.017") || meshName.includes("barierka.018") || meshName.includes("barierka.019") || meshName.includes("barierka.020") || meshName.includes("barierka.021") || meshName.includes("barierka.022") || meshName.includes("barierka.023")) {
      child.material = matGlass;
    }
    // 9. إطارات النوافذ والأبواب والدرابزين الأسود
    else if (meshName.includes("window") || meshName.includes("pvc") || meshName.includes("barierka") || meshName.includes("steel")) {
      child.material = matDarkFrame;
    }
    // 10. الرصيف
    else if (meshName === "plane") {
      child.material = matSidewalk;
    }
    // 11. باقي الجدران والعناصر العلوية
    else if (meshName.startsWith("cube.04") || meshName.startsWith("cube.05")) {
      child.material = matWhiteWall;
    }
    else {
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
  const dist = (maxDim / Math.sin(fov / 2)) * 0.75;

  camera.position.set(dist * 0.68, size.y * 0.68, dist * 0.74);
  camera.near = Math.max(dist / 200, 0.1);
  camera.far = dist * 25;
  camera.updateProjectionMatrix();

  controls.target.set(0, size.y * 0.42, 0);
  controls.minDistance = 2.0;
  controls.maxDistance = dist * 4;
  controls.update();

  initialCamState = { pos: camera.position.clone(), target: controls.target.clone() };
}

/* ---------- 4) حلقة العرض التفاعلية ---------- */
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();

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

/* ---------- 5) أدوات التحكم والواجهة ---------- */
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
    showToast("⛶ تم تفعيل وضع ملء الشاشة");
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
      showToast("⌂ تم إعادة ضبط الكاميرا للزاوية الافتراضية");
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
    showToast(enable ? "◈ تفعيل وضع الهيكل السلكي (Wireframe)" : "◈ استعادة العرض المعماري الملون الكامل");
  });

  DOM.btnScreenshot?.addEventListener("click", captureScreenshot);
  DOM.btnFullscreen?.addEventListener("click", toggleFullscreen);

  DOM.btnToggleInfo?.addEventListener("click", () => {
    DOM.infoCard.classList.toggle("collapsed");
    DOM.btnToggleInfo.textContent = DOM.infoCard.classList.contains("collapsed") ? "+" : "−";
  });
}

/* ---------- 6) التشغيل ---------- */
try {
  initScene();
  loadModel();
  initUI();
  animate();
} catch (err) {
  console.error("[Architecture Viewer] Init Error:", err);
  showError(`تعذر بدء العارض ثلاثي الأبعاد: ${err.message}`);
}
