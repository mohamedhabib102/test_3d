import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

/* ============================================================
   Modern Residential Architecture 3D — Multi-Format & Complete
   ============================================================ */

const CONFIG = {
  glbPath: "Untitled.glb?v=6",
  fallbackGlbPath: "Untitled(1).glb?v=6",
  objPath: "Untitled.obj?v=6",
  mtlPath: "Untitled.mtl?v=6",
  fbxPath: "Untitled.fbx?v=6",
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
  tabButtons: document.querySelectorAll(".tab-btn"),
};

let scene, camera, renderer, controls, model;
let initialCamState;
let frameCount = 0;
let lastFpsTime = performance.now();
let currentFormat = "glb";

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
  renderer.toneMappingExposure = 1.16;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  setupLighting();
  setupEnvironment();
  setupControls();

  window.addEventListener("resize", onResize);
}

/* ---------- 2) إضاءة الاستوديو المعمارية 360 درجة ---------- */
function setupLighting() {
  // 1. إضاءة القبة السماوية المتوازنة (Hemisphere Light)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8294a5, 2.0);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  // 2. ضوء الشمس الرئيسي من الأمام والأعلى مع الظلال الناعمة
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
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
  const topLight = new THREE.DirectionalLight(0xffffff, 1.4);
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

/* ---------- 3) تحميل الموديلات بجميع الصيغ (GLB / OBJ / FBX) ---------- */
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

/* 1. تحميل بصيغة GLB */
function loadGLB(path = CONFIG.glbPath) {
  showLoader("جاري تحميل مجسم المبنى بصيغة GLB PBR…");

  const loader = new GLTFLoader();

  loader.load(
    path,
    (gltf) => {
      removeCurrentModel();
      model = gltf.scene;

      applyArchitecturalMaterials(model);
      centerAndFrameModel(model);

      scene.add(model);
      finishLoading();
      showToast("✓ تم تحميل المبنى بصيغة GLB بنجاح!");
    },
    (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        updateProgress(xhr.loaded / xhr.total, xhr.loaded, xhr.total);
      } else if (xhr.loaded > 0) {
        const estTotal = 8 * 1024 * 1024;
        updateProgress(Math.min(0.96, xhr.loaded / estTotal), xhr.loaded, estTotal);
      }
    },
    (err) => {
      console.warn("[GLTFLoader Error]", err);
      if (path !== CONFIG.fallbackGlbPath) {
        loadGLB(CONFIG.fallbackGlbPath);
      } else {
        showError("تعذر تحميل ملف GLB: " + (err.message || err));
      }
    }
  );
}

/* 2. تحميل بصيغة OBJ + MTL */
function loadOBJ() {
  showLoader("جاري قراءة خامات ومجسم المبنى بصيغة OBJ + MTL…");

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
          removeCurrentModel();
          model = object;
          applyArchitecturalMaterials(model);
          centerAndFrameModel(model);
          scene.add(model);
          finishLoading();
          showToast("✓ تم تحميل المبنى بصيغة OBJ بنجاح!");
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            updateProgress(xhr.loaded / xhr.total, xhr.loaded, xhr.total);
          }
        },
        (err) => {
          console.error("[OBJLoader Error]", err);
          showError("تعذر تحميل ملف OBJ");
        }
      );
    },
    null,
    () => {
      // تحميل OBJ بدون MTL
      const objLoader = new OBJLoader();
      objLoader.load(CONFIG.objPath, (object) => {
        removeCurrentModel();
        model = object;
        applyArchitecturalMaterials(model);
        centerAndFrameModel(model);
        scene.add(model);
        finishLoading();
      });
    }
  );
}

/* 3. تحميل بصيغة FBX */
function loadFBX() {
  showLoader("جاري تحميل مجسم المبنى بصيغة FBX…");

  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    CONFIG.fbxPath,
    (object) => {
      removeCurrentModel();
      model = object;
      applyArchitecturalMaterials(model);
      centerAndFrameModel(model);
      scene.add(model);
      finishLoading();
      showToast("✓ تم تحميل المبنى بصيغة FBX بنجاح!");
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        updateProgress(xhr.loaded / xhr.total, xhr.loaded, xhr.total);
      }
    },
    (err) => {
      console.error("[FBXLoader Error]", err);
      showError("تعذر تحميل ملف FBX: " + (err.message || err));
    }
  );
}

/* تطبيق الخامات المعمارية بدقة متناهية 100% */
function applyArchitecturalMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = true;

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

      // 1. الحيطان العلوية الرئيسية (White Architectural Plaster) - أبيض ناصع نقي 100%
      if (matName.includes("plaster") && !matName.includes("plaster.002") || matName.startsWith("concrete.0")) {
        mat.color.setHex(0xfcfdff);
        mat.roughness = 0.88;
        mat.metalness = 0.0;
        mat.normalMap = null;
        mat.transparent = false;
        mat.opacity = 1.0;
      }
      // 2. خشب البلكونات وتجويف المدخل - خشب باركيه طبيعي دافئ
      else if (matName.includes("wood")) {
        mat.roughness = 0.52;
        mat.metalness = 0.02;
        mat.envMapIntensity = 0.9;
      }
      // 3. الدور الأرضي والأساسات (Ground Floor Base) - رمادي داكن معماري أنيق
      else if (matName === "concrete" && (meshName.includes("fundament") || meshName.includes("cube.006") || meshName.includes("cube.039") || meshName.includes("cube.001"))) {
        mat.color.setHex(0x353b44);
        mat.roughness = 0.82;
        mat.metalness = 0.04;
      }
      // 4. شرائط النوافذ الجانبية والخلفية الغامقة (Accent window bands)
      else if (matName.includes("plaster.002")) {
        mat.color.setHex(0x363c46);
        mat.roughness = 0.85;
        mat.metalness = 0.02;
      }
      // 5. أنابيب التهوية الفضية فوق المداخن بالسطح (Shiny Silver Vent Pipes on Roof)
      else if (meshName.includes("cylinder.004") || meshName.includes("cylinder.005") || meshName.includes("cylinder.006") || meshName.includes("cylinder.007") || meshName.includes("cylinder.001") || meshName.includes("cylinder.002") || meshName.includes("cylinder.003") || matName.includes("steel dirty")) {
        mat.color.setHex(0xe4ebf2);
        mat.metalness = 0.95;
        mat.roughness = 0.14;
        mat.envMapIntensity = 2.4;
      }
      // 6. المداخن الثلاثة بالسطح (3 Black Roof Chimneys)
      else if (meshName.includes("cylinder.008") || meshName.includes("cylinder.010") || meshName.includes("cylinder.011") || meshName.includes("cylinder.012") || meshName.includes("cylinder.020") || meshName.includes("cylinder.022") || meshName.includes("cylinder.023") || meshName.includes("cylinder.024") || matName.includes("black")) {
        mat.color.setHex(0x20242a);
        mat.roughness = 0.55;
        mat.metalness = 0.2;
      }
      // 7. سطح المبنى وإطار الكورنيش (Roof Surface & Perimeter Cornice Trim)
      else if (matName.includes("roof") || matName.includes("schody") || meshName.includes("cube.010") || meshName.includes("cube.021")) {
        mat.color.setHex(0x2e333b);
        mat.roughness = 0.72;
        mat.metalness = 0.15;
      }
      // 8. الزجاج والواجهة الزجاجية وبلكونات الزجاج (Glass Panels)
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
      // 10. إطارات النوافذ والأبواب والدرابزين الأسود (Black Window Frames & Railings)
      else if (matName.includes("pvc") || matName.includes("steel") || matName.includes("barierka")) {
        mat.color.setHex(0x22252a);
        mat.roughness = 0.45;
        mat.metalness = 0.7;
        mat.side = THREE.DoubleSide;
      }
      // 11. الرصيف والأرضية المحيطة (Sidewalk Paving Slabs & Gravel)
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

function switchFormat(format) {
  if (currentFormat === format) return;
  currentFormat = format;

  DOM.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.format === format);
  });

  if (format === "glb") loadGLB();
  else if (format === "obj") loadOBJ();
  else if (format === "fbx") loadFBX();
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

  DOM.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchFormat(btn.dataset.format);
    });
  });
}

/* ---------- 6) التشغيل ---------- */
try {
  initScene();
  loadGLB();
  initUI();
  animate();
} catch (err) {
  console.error("[Architecture Viewer] Init Error:", err);
  showError(`تعذر بدء العارض ثلاثي الأبعاد: ${err.message}`);
}
