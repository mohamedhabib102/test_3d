import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

/* ============================================================
   Villa 3D Viewer — FBX version (villa+fbx.fbx)
   ============================================================ */

const CONFIG = {
  fbxPath: "villa+fbx.fbx",
  camera: { fov: 55, near: 0.05, far: 8000 },
};

const DOM = {
  loader: document.getElementById("loader"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  loaderError: document.getElementById("loader-error"),
  errorMessage: document.getElementById("error-message"),
  canvas: document.getElementById("scene"),
  fps: document.getElementById("fps"),
  btnRotate: document.getElementById("btn-rotate"),
  btnReset: document.getElementById("btn-reset"),
  btnWireframe: document.getElementById("btn-wireframe"),
  toast: document.getElementById("toast"),
};

let scene, camera, renderer, controls, model;
let clock, fpsFrames = 0, fpsTime = 0;
let initialCamState;

/* ---------- 1) المشهد ---------- */
function initScene() {
  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.FogExp2(0x1a1836, 0.0004);

  camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, innerWidth / innerHeight, CONFIG.camera.near, CONFIG.camera.far);
  camera.position.set(80, 60, 80);

  renderer = new THREE.WebGLRenderer({
    canvas: DOM.canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  setupEnvironment();
  setupLights();
  setupControls();

  clock = new THREE.Clock();
  addEventListener("resize", onResize);
}

/* إضاءة بيئية PBR حتى لو التكسترات ناقصة تفضل الشكل واقعي */
function setupEnvironment() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironmentLite(), 0.04);
}

class RoomEnvironmentLite extends THREE.Scene {
  constructor() {
    super();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(100, 100, 100),
      new THREE.MeshBasicMaterial({ color: 0xbfd4ff, side: THREE.BackSide })
    );
    this.add(box);
    const main = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    main.position.set(20, 40, 20);
    const warm = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffe0b3 }));
    warm.position.set(-30, 25, -20);
    this.add(main, warm);
  }
}

function setupLights() {
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x40384f, 0.7));

  const sun = new THREE.DirectionalLight(0xfff2d9, 2.0);
  sun.position.set(120, 180, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.5; // يمنع الارتعاش (shadow acne)
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x8899ff, 0.35);
  fill.position.set(-90, 50, -110);
  scene.add(fill);

  // أرضية شفافة لاستقبال الظل فقط
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.ShadowMaterial({ opacity: 0.25 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.minDistance = 1;      // يدخل جوه الموديل لأي مسافة
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
}

/* ---------- 2) تحميل FBX ---------- */
function loadModel() {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => {
    if (total > 0) updateProgress(loaded / total);
  };

  const fbxLoader = new FBXLoader(manager);
  fbxLoader.load(
    CONFIG.fbxPath,
    (object) => {
      model = object;
      prepareModel(model);
      normalizeScale(model);
      scene.add(model);
      frameCamera(model);
      finishLoading();
      showToast("✓ تم تحميل الموديل بنجاح", false);
    },
    (xhr) => { if (xhr.total > 0) updateProgress(xhr.loaded / xhr.total); },
    () => showError("فشل تحميل assets/model/villa.fbx — شغّل المشروع عبر خادم محلي وتأكد من وجود الملف.")
  );
}

/* تكسترات ناقصة؟ نختار لون واقعي ذكي بناءً على اسم المادة (grass → أخضر، water → ماء... إلخ) */
const MATERIAL_COLORS = [
  { keys: ["grass", "lawn", "turf"], color: 0x4a7c2f },
  { keys: ["water", "pool"], color: 0x2e8ba8, opacity: 0.75 },
  { keys: ["glass", "window"], color: 0x9fc4d8, opacity: 0.35 },
  { keys: ["wood", "floor", "deck"], color: 0x8a6238 },
  { keys: ["leaf", "tree", "plant", "flower"], color: 0x3f6b2a },
  { keys: ["trunk"], color: 0x5c4426 },
  { keys: ["asphalt", "road", "street"], color: 0x3d4045 },
  { keys: ["concrete", "cement", "pavement"], color: 0xa8a49a },
  { keys: ["marble", "stone"], color: 0xd8d3ca },
  { keys: ["brick"], color: 0x9c5b43 },
  { keys: ["metal", "steel", "iron"], color: 0x9aa1a8, metalness: true },
  { keys: ["roof"], color: 0x6e4a38 },
  { keys: ["wall", "stucco", "plaster"], color: 0xe3ddd2 },
  { keys: ["sand", "soil", "dirt"], color: 0xb59a6e },
  { keys: ["carpet", "rug", "fabric"], color: 0x77655a },
];

function pickMaterialColor(mat) {
  const name = ((mat.name || "") + " " + (childName(mat) || "")).toLowerCase();
  for (const entry of MATERIAL_COLORS) {
    if (entry.keys.some((k) => name.includes(k))) return entry;
  }
  return null;
}

let _currentChild = null;
function childName() { return _currentChild ? _currentChild.name : ""; }

function prepareModel(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    _currentChild = child;
    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat) => {
      if (!mat) return;
      // DoubleSide عشان لما تدخل جوه البيت الحيطان تفضل باينة
      mat.side = THREE.DoubleSide;

      if (mat.map && mat.map.image === undefined) {
        mat.map = null;
      }
      if (!mat.map) {
        const match = pickMaterialColor(mat);
        if (match) {
          mat.color.setHex(match.color);
          if (match.opacity !== undefined) {
            mat.transparent = true;
            mat.opacity = match.opacity;
          }
          if (match.metalness && "metalness" in mat) mat.metalness = 0.8;
        } else if (mat.color.getHex() === 0xffffff) {
          // مادة من غير اسم واضح → بيج معماري محايد
          mat.color.setHex(0xcac3b6);
        }
      }
      mat.needsUpdate = true;
    });
  });
  _currentChild = null;
}

/* توحيد الحجم تلقائياً (الموديل قد يكون بمقياس ضخم أو صغير) */
function normalizeScale(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim <= 0) return;
  const scale = 60 / maxDim;
  object.scale.setScalar(scale);
}

/* كاميرا Fit تلقائية على الموديل */
function frameCamera(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() / 2, 1);

  object.position.sub(center);
  box.setFromObject(object);

  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = (radius / Math.sin(fov / 2)) * 0.95;
  const dir = new THREE.Vector3(1, 0.6, 1).normalize();
  camera.position.copy(dir.multiplyScalar(dist));
  camera.near = Math.max(dist / 100, 0.01);
  camera.far = dist * 20;
  camera.updateProjectionMatrix();

  controls.target.set(0, size.y * 0.15, 0);
  controls.minDistance = radius * 0.05;
  controls.maxDistance = dist * 4;
  controls.update();

  initialCamState = { pos: camera.position.clone(), target: controls.target.clone() };
}

function updateProgress(ratio) {
  const pct = Math.min(100, Math.round(ratio * 100));
  DOM.progressBar.style.width = `${pct}%`;
  DOM.progressText.textContent = `${pct}%`;
}

function finishLoading() {
  updateProgress(1);
  setTimeout(() => {
    DOM.loader.classList.add("done");
    document.body.classList.add("ready");
  }, 350);
}

function showError(msg) {
  DOM.errorMessage.textContent = msg;
  DOM.loaderError.classList.remove("hidden");
  DOM.progressBar.style.background = "#ff4d4d";
  console.error("[Villa Viewer]", msg);
}

let toastTimer;
function showToast(msg, isError) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.remove("hidden");
  DOM.toast.style.borderColor = isError ? "rgba(255,90,90,.5)" : "rgba(120,255,160,.35)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.add("hidden"), 3200);
}

/* ---------- 3) حلقة الرسم ---------- */
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  controls.update();
  renderer.render(scene, camera);

  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    DOM.fps.textContent = `${Math.round(fpsFrames / fpsTime)} FPS`;
    fpsFrames = 0;
    fpsTime = 0;
  }
}

/* ---------- 4) الأحداث ---------- */
function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}

function initUI() {
  DOM.btnRotate.addEventListener("click", () => {
    controls.autoRotate = !controls.autoRotate;
    DOM.btnRotate.classList.toggle("active", controls.autoRotate);
    DOM.btnRotate.setAttribute("aria-pressed", String(controls.autoRotate));
  });

  DOM.btnReset.addEventListener("click", () => {
    camera.position.copy(initialCamState.pos);
    controls.target.copy(initialCamState.target);
    controls.update();
  });

  DOM.btnWireframe.addEventListener("click", () => {
    const enable = !DOM.btnWireframe.classList.contains("active");
    DOM.btnWireframe.classList.toggle("active", enable);
    DOM.btnWireframe.setAttribute("aria-pressed", String(enable));
    model?.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => m && (m.wireframe = enable));
    });
  });
}

/* ---------- 5) البدء ---------- */
try {
  initScene();
  loadModel();
  initUI();
  animate();
} catch (err) {
  console.error("[Villa Viewer] Initialization failed:", err);
  showError(`تعذر بدء العارض: ${err.message}`);
}
