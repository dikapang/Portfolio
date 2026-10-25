/* Bara senja melayang: partikel three.js di layer tetap paling belakang —
   tak terlihat selama fase pin (tertutup lanskap), lalu hidup di belakang
   section saat halaman mengalir. Naik perlahan dengan sway, ikut bergeser
   mengikuti scroll (parallax), statis saat reduced-motion. */
import * as THREE from 'three';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function init(): void {
  if (document.getElementById('embers-field')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.id = 'embers-field';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.body.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const root = document.documentElement;
  const pc = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  pc.canvas.width = pc.canvas.height = 1;
  const tokenRGB = (v: string): [number, number, number] => {
    const c = getComputedStyle(root).getPropertyValue(v).trim();
    pc.clearRect(0, 0, 1, 1);
    pc.fillStyle = c ? c : '#888';
    pc.fillRect(0, 0, 1, 1);
    const d = pc.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const [sr, sg, sb] = tokenRGB('--dusk-sun');
  const [br, bg2, bb] = tokenRGB('--brand');

  const N = 130;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  const size = new Float32Array(N);
  const warm = new Float32Array(N);
  const speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * 26;
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * 15;
    pos[i * 3 + 2] = -6 - Math.random() * 14;
    seed[i] = Math.random() * 6.28;
    size[i] = 2 + Math.random() * 5;
    warm[i] = Math.random() < 0.55 ? 1 : 0;
    speed[i] = 0.25 + Math.random() * 0.55;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aWarm', new THREE.BufferAttribute(warm, 1));
  const uSun = { value: new THREE.Color(sr / 255, sg / 255, sb / 255) };
  const uBrand = { value: new THREE.Color(br / 255, bg2 / 255, bb / 255) };
  const uTime = { value: 0 };
  const uScroll = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSun, uBrand, uTime, uScroll },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uScroll;
      attribute float aSeed, aSize, aWarm;
      varying float vA, vWarm;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * 0.35 * aSeed + 15.0, 30.0) - 15.0;
        p.x += sin(uTime * 0.4 + aSeed * 3.0) * 0.9;
        p.y += uScroll * 2.4;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aSize * (10.0 / -mv.z), 1.0, 7.0);
        float tw = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 0.4) + aSeed * 5.0);
        vA = tw * smoothstep(16.0, 9.0, abs(p.y));
        vWarm = aWarm;
      }`,
    fragmentShader: `
      uniform vec3 uSun, uBrand;
      varying float vA, vWarm;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        vec3 col = mix(uBrand, uSun, vWarm);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.1, r) * vA * 0.55);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  const resize = () => {
    const w = innerWidth || 1;
    const h = innerHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);

  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  const clock = new THREE.Clock();
  const tick = () => {
    const t = clock.getElapsedTime();
    uTime.value = reduce ? 3.0 : t;
    uScroll.value = reduce ? 0 : clamp(scrollY / (document.body.scrollHeight - innerHeight || 1), 0, 1.4);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

init();
