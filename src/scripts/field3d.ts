/* Signature hero: lanskap senja berlapis ala ilustrasi vektor — langit membakar
   ke emas di horizon, matahari besar pucat, empat lapis punggungan dari oranye
   terang ke marun tua, tebing pendaki di kiri, pinus, dan kawanan burung.
   PARALLAX: tiap lapisan bergeser mengikuti pointer dengan kecepatan berbeda
   (makin dekat makin cepat). Isi-daya (tahan klik) menyalakan matahari dan
   memberi alpenglow di puncak; lepas penuh memicu cincin kejut hangat.
   Semua warna dari token CSS. Statis bila reduced-motion, berhenti off-screen. */
import * as THREE from 'three';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function init(): void {
  const wrap = document.getElementById('hero-field');
  if (!wrap) return;

  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return;
  }
  const DPR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const CAM = new THREE.Vector3(0, 1.6, 20);
  camera.position.copy(CAM);
  camera.lookAt(0, 1.6, 0);

  /* Baca token CSS → warna */
  const pc = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  pc!.canvas.width = pc!.canvas.height = 1;
  const rgb = (v: string): [number, number, number] => {
    const c = getComputedStyle(root).getPropertyValue(v).trim();
    const g = pc!;
    g.clearRect(0, 0, 1, 1);
    g.fillStyle = '#000';
    if (c) g.fillStyle = c;
    g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };

  const uSun = { value: new THREE.Color() };
  const uSkyTop = { value: new THREE.Color() };
  const uSkyMid = { value: new THREE.Color() };
  const uSkyHor = { value: new THREE.Color() };
  const uBg = { value: new THREE.Color() };
  const uScroll = { value: 0 };
  const blend: Array<THREE.Material> = [];
  const birdTint = new THREE.Color();

  /* Satu mode: senja. Warna dibaca sekali — tanpa penukaran tema. */
  {
    const set = (u: { value: THREE.Color }, t: string) => {
      const c = rgb(t);
      u.value.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
    };
    set(uSun, '--dusk-sun');
    set(uSkyTop, '--sky-top');
    set(uSkyMid, '--sky-mid');
    set(uSkyHor, '--sky-horizon');
    set(uBg, '--background');
  }

  /* ---------- langit senja: tiga titik gradasi + pantulan hangat di bawah horizon ---------- */
  {
    const geo = new THREE.PlaneGeometry(150, 80);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uSkyTop, uSkyMid, uSkyHor, uBg, uScroll },
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uSkyTop, uSkyMid, uSkyHor, uBg;
        uniform float uScroll;
        varying vec2 vUv;
        void main() {
          float hy = 0.425; /* y dunia 0 pada plane ini */
          vec3 sky = mix(uSkyMid, uSkyTop, smoothstep(0.56, 0.85, vUv.y));
          sky = mix(uSkyHor, sky, smoothstep(hy, 0.6, vUv.y));
          /* langit atas meredup menuju malam seiring progres scroll */
          sky = mix(sky, sky * vec3(0.78, 0.74, 0.9), uScroll * smoothstep(0.55, 1.0, vUv.y));
          vec3 ground = mix(uSkyHor, uBg, smoothstep(hy, 0.12, vUv.y));
          gl_FragColor = vec4(vUv.y >= hy ? sky : ground, 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 6, -70);
    scene.add(mesh);
  }

  /* ---------- matahari besar pucat, mengambang di kiri-tengah horizon ---------- */
  const sun = new THREE.Group();
  sun.position.set(-3.1, 2.4, -58);
  scene.add(sun);
  {
    const geo = new THREE.PlaneGeometry(9.5, 9.5);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uSun },
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uSun;
        varying vec2 vUv;
        void main() {
          float d = length(vUv * 2.0 - 1.0);
          float disc = smoothstep(0.5, 0.41, d);
          float halo = exp(-max(d - 0.44, 0.0) * 3.4) * 0.3;
          float a = clamp(disc + halo * (1.0 - disc), 0.0, 1.0);
          if (a < 0.01) discard;
          gl_FragColor = vec4(uSun, a);
        }`,
    });
    blend.push(mat);
    sun.add(new THREE.Mesh(geo, mat));
  }

  /* ---------- punggungan berlapis: makin dekat makin marun; pinus tumbuh
     dari profil; alpenglow jingga di puncak saat isi-daya ---------- */
  const pine = (x: number, c: number, w: number, h: number) =>
    Math.abs(x - c) < w ? h * (1 - Math.abs(x - c) / w) : 0;
  const ridged = (x: number, f: number, p: number, a: number) => a * (1 - Math.abs(Math.sin(x * f + p)));
  const buildRidge = (profile: (x: number) => number, z: number, token: string) => {
    const SEG = 220, X0 = -75, X1 = 75;
    const pos: number[] = [];
    const peak: number[] = [];
    const idx: number[] = [];
    let yMin = Infinity, yMax = -Infinity;
    const ys: number[] = [];
    for (let i = 0; i <= SEG; i++) {
      const y = profile(X0 + ((X1 - X0) * i) / SEG);
      ys.push(y);
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
    for (let i = 0; i <= SEG; i++) {
      const x = X0 + ((X1 - X0) * i) / SEG;
      const pk = clamp((ys[i] - yMin) / Math.max(0.001, yMax - yMin), 0, 1);
      pos.push(x, ys[i], z, x, -34, z);
      peak.push(pk, 0);
    }
    for (let i = 0; i < SEG; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const c = rgb(token);
    const uColor = { value: new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255) };
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor, uBg },
      vertexShader: `
        varying float vY;
        void main() {
          vY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor, uBg;
        varying float vY;
        void main() {
          /* badan lapisan melebur ke latar halaman di bawah — tanpa seam */
          float fade = smoothstep(-7.0, -1.6, vY);
          gl_FragColor = vec4(mix(uBg, uColor, fade), 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
  };
  /* puncak besar di kanan + bahu, seperti referensi */
  const farProfile = (x: number) => 1.15 + ridged(x, 0.13, 1.0, 1.5) + ridged(x, 0.31, 3.2, 0.5);
  const midProfile = (x: number) =>
    0.75 + ridged(x, 0.105, 2.2, 2.1) + ridged(x, 0.28, 5.1, 0.8)
    + pine(x, 17.5, 1.5, 1.15) + pine(x, 26, 1.2, 0.9) + pine(x, -19, 1.3, 1.0);
  const nearProfile = (x: number) =>
    0.35 + ridged(x, 0.085, 4.1, 2.9) + ridged(x, 0.21, 1.3, 0.95)
    + pine(x, -13, 1.7, 1.5) + pine(x, 6.5, 1.5, 1.25) + pine(x, 12.5, 1.4, 1.1) + pine(x, -30, 1.6, 1.35);
  const frontProfile = (x: number) =>
    -1.15 + ridged(x, 0.065, 5.6, 1.9) + ridged(x, 0.17, 2.8, 0.6)
    - 0.9 * Math.exp(-Math.pow(x / 6.5, 2))
    + pine(x, -24, 2.0, 1.7) + pine(x, 14, 1.8, 1.5) + pine(x, 26, 1.9, 1.6);
  const skyMesh = scene.children[0] as THREE.Mesh;
  const r1 = buildRidge(farProfile, -50, '--ridge-1');
  const r2 = buildRidge(midProfile, -42, '--ridge-2');
  const r3 = buildRidge(nearProfile, -32, '--ridge-3');
  const r4 = buildRidge(frontProfile, -20, '--ridge-4');

  /* ---------- tebing pendaki di kiri: massif gelap dengan tebing curam,
     siluet pendaki (ransel + tangan ke dahi) berdiri di puncaknya ---------- */
  const cliffProfile = (x: number) => {
    if (x <= -8) return 5.05 + ridged(x, 0.85, 0.4, 0.3) + ridged(x, 0.23, 2.0, 0.5);
    if (x <= -5.6) {
      const u = (x + 8) / 2.4;
      return 5.05 - u * u * 19.5;
    }
    return -15;
  };
  const cliffMesh = buildRidge(cliffProfile, -10, '--cliff');
  const hiker = new THREE.Group();
  {
    const shape = new THREE.Shape();
    const P: [number, number][] = [
      [-0.16, 0], [-0.12, 0.4], [-0.26, 0.52], [-0.3, 0.72], [-0.14, 0.74],
      [-0.06, 0.8], [0.14, 1.02], [0.2, 0.95], [0.05, 0.72], [0.02, 0.44],
      [0.1, 0.42], [0.18, 0.04], [0.08, 0],
    ];
    shape.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < P.length; i++) shape.lineTo(P[i][0], P[i][1]);
    shape.closePath();
    const cc = rgb('--cliff');
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cc[0] / 255, cc[1] / 255, cc[2] / 255) });
    const body = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.095, 20), mat);
    head.position.set(0.055, 0.9, 0);
    hiker.add(body, head);
    const baseY = cliffProfile(-10.6);
    hiker.position.set(-10.6, baseY - 0.03, -9.8);
    hiker.scale.setScalar(2.4);
    scene.add(hiker);
  }

  /* ---------- kawanan burung: siluet lima titik yang mengepak ---------- */
  const BIRDS = 7;
  const SEG_PER_BIRD = 4;
  const birdGeo = new THREE.BufferGeometry();
  const birdPos = new Float32Array(BIRDS * SEG_PER_BIRD * 2 * 3);
  birdGeo.setAttribute('position', new THREE.BufferAttribute(birdPos, 3));
  const birdMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  blend.push(birdMat);
  const birdLines = new THREE.LineSegments(birdGeo, birdMat);
  birdLines.frustumCulled = false;
  scene.add(birdLines);
  const flock = Array.from({ length: BIRDS }, (_, i) => ({
    off: i / BIRDS + Math.random() * 0.08,
    y: 3.2 + Math.random() * 3.4,
    wob: Math.random() * 6.28,
    v: 0.022 + Math.random() * 0.016,
    fs: 4.2 + Math.random() * 2.8,
    fp: Math.random() * 6.28,
    w: 0.24 + Math.random() * 0.16,
    z: -12 - Math.random() * 14,
  }));
  const stepBirds = (t: number) => {
    flock.forEach((b, i) => {
      const x = ((b.off + t * b.v) % 1) * 52 - 28;
      const y = b.y + Math.sin(t * 0.5 + b.wob) * 0.5;
      const flap = Math.sin(t * b.fs + b.fp);
      const s = b.w * (1 + (b.z + 24) * 0.02);
      const tipY = flap * s * 0.55;
      const midY = flap * s * 0.14;
      const p = [
        [x - s * 1.2, y + tipY, b.z],
        [x - s * 0.55, y + midY, b.z],
        [x, y, b.z],
        [x + s * 0.55, y + midY, b.z],
        [x + s * 1.2, y + tipY, b.z],
      ];
      const o = i * SEG_PER_BIRD * 2 * 3;
      let k = o;
      for (let j = 0; j < 4; j++) {
        birdPos[k++] = p[j][0]; birdPos[k++] = p[j][1]; birdPos[k++] = p[j][2];
        birdPos[k++] = p[j + 1][0]; birdPos[k++] = p[j + 1][1]; birdPos[k++] = p[j + 1][2];
      }
    });
    birdGeo.attributes.position.needsUpdate = true;
  };

  /* ---------- warna burung: siluet marun dari token tebing ---------- */
  birdMat.color.copy(birdTint.set(rgb('--cliff')[0] / 255, rgb('--cliff')[1] / 255, rgb('--cliff')[2] / 255));

  /* ---------- parallax pointer + scroll: tiap lapisan bergeser dengan
     kecepatan sendiri; scroll membuat foreground tenggelam dan matahari naik
     (sunrise) selama fase pin ---------- */
  const parallax: { obj: THREE.Object3D; k: number; sk: number; baseX: number; baseY: number }[] = [
    { obj: skyMesh, k: 0.05, sk: 0, baseX: 0, baseY: 6 },
    { obj: sun, k: 0.16, sk: -0.9, baseX: sun.position.x, baseY: sun.position.y },
    { obj: r1, k: 0.28, sk: 0.6, baseX: 0, baseY: 0 },
    { obj: r2, k: 0.5, sk: 1.3, baseX: 0, baseY: 0 },
    { obj: r3, k: 0.85, sk: 2.2, baseX: 0, baseY: 0 },
    { obj: r4, k: 1.35, sk: 3.3, baseX: 0, baseY: 0 },
    { obj: cliffMesh, k: 2.0, sk: 4.6, baseX: 0, baseY: 0 },
    { obj: hiker, k: 2.0, sk: 4.6, baseX: hiker.position.x, baseY: hiker.position.y },
  ];

  const resize = () => {
    const w = wrap.clientWidth || 1;
    const h = wrap.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const clock = new THREE.Clock();
  let raf = 0;
  const off = { x: 0, y: 0 };
  const offT = { x: 0, y: 0 };
  const render = () => {
    renderer.render(scene, camera);
  };
  const tick = () => {
    const dt = Math.min(0.05, clock.getDelta() || 0.016);
    const t = clock.elapsedTime;
    stepBirds(t);
    off.x += (offT.x - off.x) * 0.06;
    off.y += (offT.y - off.y) * 0.06;
    sProg += (sTarget - sProg) * 0.08;
    uScroll.value = sProg;
    for (const l of parallax) {
      l.obj.position.x = l.baseX + off.x * l.k + Math.sin(t * 0.1 + l.k) * 0.12;
      l.obj.position.y = l.baseY - off.y * l.k * 0.3 - l.sk * sProg;
    }
    render();
    raf = requestAnimationFrame(tick);
  };

  const host = wrap.parentElement!;
  host.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect();
    offT.x = ((e.clientX - r.left) / r.width * 2 - 1);
    offT.y = -((e.clientY - r.top) / r.height * 2 - 1);
  });
  host.addEventListener('pointerleave', () => { offT.x = 0; offT.y = 0; });

  /* Progres scroll fase pin: 0 di puncak wrapper, 1 saat wrapper habis */
  let sTarget = 0;
  let sProg = 0;
  const measureScroll = () => {
    const pr = host.getBoundingClientRect();
    const span = Math.max(1, pr.height - wrap.clientHeight);
    sTarget = clamp(-pr.top / span, 0, 1);
  };
  measureScroll();
  addEventListener('scroll', measureScroll, { passive: true });

  resize();
  new ResizeObserver(() => { resize(); if (!raf) render(); }).observe(wrap);

  if (reduce) {
    stepBirds(3.2);
    render();
    return;
  }

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !raf) {
      clock.getDelta();
      raf = requestAnimationFrame(tick);
    } else if (!e.isIntersecting && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }).observe(wrap);
}

init();
