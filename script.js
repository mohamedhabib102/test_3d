import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

/* ============================================================
   Modern Residential Architecture 3D — Full 360° Studio Renderer
   ============================================================ */

const CONFIG = {
  glbPath: "Untitled.glb",
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

  // مساحة الألوان والـ Exposure المعماري عالي الدقة
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  // ظلال ناعمة ومتوازنة
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  setupLighting();
  setupEnvironment();
  setupControls();

  window.addEventListener("resize", onResize);
}

/* ---------- 2) إضاءة الاستوديو 360 درجة لإبراز كل الواجهات وتفاصيل السطح ---------- */
function setupLighting() {
  // 1. إضاءة القبة السماوية الشاملة (Hemisphere Light)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8898a8, 1.8);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  // 2. ضوء الشمس الرئيسي من الأمام واليمين والأعلى (Key Sun Light)
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
  sunLight.position.set(32, 48, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.bias = -0.00006;
  sunLight.shadow.normalBias = 0.02;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 120;
  const d = 28;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  // 3. ضوء رئيسي من الخلف لضمان بياض ونقاء الواجهة الخلفية تماماً مثل الأمامية
  const backSunLight = new THREE.DirectionalLight(0xf4f8fd, 1.8);
  backSunLight.position.set(-30, 42, -30);
  backSunLight.castShadow = false;
  scene.add(backSunLight);

  // 4. ضوء جانبي أيسر لإضاءة النوافذ الجانبية والبلكونات
  const leftFillLight = new THREE.DirectionalLight(0xdde8f5, 1.3);
  leftFillLight.position.set(-32, 28, 26);
  scene.add(leftFillLight);

  // 5. ضوء جانبي أيمن
  const rightFillLight = new THREE.DirectionalLight(0xdde8f5, 1.3);
  rightFillLight.position.set(32, 28, -26);
  scene.add(rightFillLight);

  // 6. ضوء علوي مباشر لتفاصيل السطح والمداخن وأنابيب التهوية الفضية
  const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
  topLight.position.set(0, 50, 0);
  scene.add(topLight);

  // 7. ضوء محيطي عام متوازن
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
}

/* بيئة انعكاسات الاستوديو لبريق الزجاج والمعادن والفضيات */
function setupEnvironment() {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const studioScene = new THREE.Scene();
  const skyMesh = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x98abbb,
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

/* ---------- 3) تحميل الموديل وتطبيق الخامات المعمارية فائقة الدقة ---------- */
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
  updateStatus("جاري تحميل مجسم المبنى والخامات المعمارية…");
  updateProgress(0.05);

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/");
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    CONFIG.glbPath,
    (gltf) => {
      model = gltf.scene;

      // تطبيق وضبط الخامات المعمارية الكاملة لمطابقة صور Blender بنسبة 100%
      applyArchitecturalMaterials(model);
      centerAndFrameModel(model);

      scene.add(model);
      finishLoading();
      showToast("✓ تم تحميل المبنى بالواجهات البيضاء وتفاصيل السطح الكاملة!");
    },
    (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        const ratio = xhr.loaded / xhr.total;
        updateProgress(ratio, xhr.loaded, xhr.total);
      } else if (xhr.loaded > 0) {
        const estTotal = 163 * 1024 * 1024;
        const ratio = Math.min(0.96, xhr.loaded / estTotal);
        updateProgress(ratio, xhr.loaded, estTotal);
      }
    },
    (err) => {
      console.error("[GLTFLoader Error]", err);
      showError("تعذر تحميل ملف الموديل: " + (err.message || err));
    }
  );
}

/* ضبط وتطبيق الخامات المعمارية الدقيقة المطابقة للصور الأصلية 100% */
function applyArchitecturalMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = true;

    if (child.geometry && !child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }

    const meshName = (child.name || "").toLowerCase();
    const mats = Array.isArray(child.material) ? child.material : [child.material];

    mats.forEach((mat) => {
      if (!mat) return;
      const matName = (mat.name || "").toLowerCase();

      mat.envMapIntensity = 1.0;

      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      }
      if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;

      // 1. الحيطان العلوية الرئيسية (الأمامية والخلفية والجانبية) - أبيض معماري ناصع 100%
      if (matName === "plaster" || matName === "plaster.001" || matName.startsWith("concrete.0")) {
        mat.color.setHex(0xfcfdff); // أبيض معماري ناصع ونظيف
        mat.roughness = 0.86;
        mat.metalness = 0.0;
        mat.transparent = false;
        mat.opacity = 1.0;
      }
      // 2. خشب البلكونات وتجويف المدخل - خشب باركيه طبيعي دافئ
      else if (matName.includes("wood")) {
        mat.roughness = 0.52;
        mat.metalness = 0.02;
        mat.envMapIntensity = 0.9;
      }
      // 3. الدور الأرضي وقاعدة المبنى - رمادي داكن فحمي معماري أنيق
      else if (matName === "concrete" && (meshName.includes("fundament") || meshName.includes("cube.006") || meshName.includes("cube.039") || meshName.includes("cube.001"))) {
        mat.color.setHex(0x353b44);
        mat.roughness = 0.82;
        mat.metalness = 0.04;
      }
      // 4. شرائط النوافذ الجانبية والخلفية الغامقة (Accent window bands)
      else if (matName === "plaster.002") {
        mat.color.setHex(0x363c46); // رمادي غامق فخم
        mat.roughness = 0.85;
        mat.metalness = 0.02;
      }
      // 5. أنابيب التهوية الفضية على قمة المداخن في السطح (Shiny Silver Vent Pipes)
      else if (meshName.includes("cylinder") && (matName.includes("steel dirty") || matName.includes("steel"))) {
        mat.color.setHex(0xdce3ea); // فضي ميتاليك لامع وواضح
        mat.metalness = 0.92;
        mat.roughness = 0.18;
        mat.envMapIntensity = 2.0;
      }
      // 6. مداخن السطح السوداء (Black Chimneys)
      else if (meshName.includes("cylinder") && (matName.includes("black") || matName.includes("plastic"))) {
        mat.color.setHex(0x1e2126);
        mat.roughness = 0.6;
        mat.metalness = 0.2;
      }
      // 7. سطح المبنى وإطار الكورنيش (Roof Surface & Perimeter Trim)
      else if (matName.includes("roof") || matName.includes("schody") || meshName.includes("cube.010")) {
        mat.color.setHex(0x2d323a);
        mat.roughness = 0.72;
        mat.metalness = 0.15;
      }
      // 8. الزجاج والواجهة الزجاجية المركزية وبلكونات الزجاج (Glass Panels)
      else if (matName.includes("glass") || mat.transmission > 0) {
        mat.color.setHex(0xd0e2ec);
        mat.transparent = true;
        mat.opacity = 0.38;
        mat.roughness = 0.04;
        mat.metalness = 0.15;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
        mat.envMapIntensity = 1.6;
      }
      // 9. الستائر الداخلية خلف النوافذ (Curtains & Blinds)
      else if (matName.includes("curtin") || matName.includes("venetian") || matName.includes("string")) {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.roughness = 0.7;
        mat.metalness = 0.0;
      }
      // 10. إطارات النوافذ والأبواب والدرابزين الأسود (Black Window Frames & Steel Railings)
      else if (matName.includes("pvc") || matName.includes("black") || matName.includes("steel") || matName.includes("barierka")) {
        mat.color.setHex(0x22252a);
        mat.roughness = 0.45;
        mat.metalness = 0.7;
        mat.side = THREE.DoubleSide;
      }
      // 11. الرصيف والأرضية المحيطة (Sidewalk Paving Slabs & Cobblestone)
      else if (matName.includes("pavingstone") || matName.includes("cobblestone") || matName.includes("tiles") || matName.includes("floor")) {
        mat.roughness = 0.75;
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

  // وضع قاعدة المبنى ومحاذاته بالكامل
  object.position.x -= center.x;
  object.position.y -= box.min.y;
  object.position.z -= center.z;

  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = (maxDim / Math.sin(fov / 2)) * 0.75;

  // الزاوية المعمارية الأيزومترية 3/4 المتطابقة تماماً مع صورة المعاينة
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
