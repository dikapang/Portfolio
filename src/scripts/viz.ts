/* Sketsa canvas untuk kartu kapabilitas — desain orisinal, hidup sendiri:
   tiap sketsa mengalir terus (paket di bus layout, request sink ke hub, titik
   menyusuri kurva vektor, oscilloscope sinyal hidup) dengan readout status
   monospace, DAN merespons posisi pointer di dalam kartu. Kartu juga miring
   halus (tilt 3D) mengikuti pointer. Berhenti saat off-screen, statis bila
   reduced-motion, dan tilt hanya untuk pointer presisi. */
type RGB = [number, number, number];
type Pt = { x: number; y: number } | null;
type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, pt: Pt) => void;
type Sketch = () => Draw; /* pabrik: tiap host mendapat fase/keadaan sendiri */

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const pc = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
pc!.canvas.width = pc!.canvas.height = 1;

const rgb = (v: string): RGB => {
  const c = getComputedStyle(root).getPropertyValue(v).trim();
  const ctx = pc!;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000';
  if (c) ctx.fillStyle = c;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
};

let C = { fg: [0, 0, 0] as RGB, mute: [0, 0, 0] as RGB, brand: [0, 0, 0] as RGB };
const theme = () => { C = { fg: rgb('--foreground'), mute: rgb('--muted-foreground'), brand: rgb('--brand') }; };
theme();

const A = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const MONO = '"Geist Mono", ui-monospace, monospace';
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const hex4 = () => Array.from({ length: 4 }, () => '0123456789abcdef'[(Math.random() * 16) | 0]).join('');
const readout = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
  ctx.font = '500 10px ' + MONO;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = A(C.mute, 0.6);
  ctx.fillText(text, x, y);
};

const sketches: Record<string, Sketch> = {
  /* Layout hidup: blok komponen menyusun diri ke 3 tata letak bergilir dengan
     garis sapuan, sementara paket inspeksi mengalir terus di bus horizontal —
     blok yang dilewati paket menyala. Readout penghitung lintasan di kiri bawah.
     Kursor menyorot blok terdekat dengan garis aksen */
  code() {
    /* tiap preset: [x, y, w, h] fraksi area dalam; 1 = blok aksen */
    const presets = [
      [[0, 0, 1, 0.16], [0, 0.22, 0.3, 0.78, 1], [0.36, 0.22, 0.62, 0.38], [0.36, 0.66, 0.3, 0.34], [0.7, 0.66, 0.28, 0.34]],
      [[0, 0, 0.62, 0.6, 1], [0.66, 0, 0.34, 0.6], [0, 0.66, 0.3, 0.34], [0.34, 0.66, 0.3, 0.34], [0.68, 0.66, 0.32, 0.34]],
      [[0, 0, 0.55, 0.55], [0.58, 0, 0.42, 1, 1], [0, 0.58, 0.26, 0.42], [0.29, 0.58, 0.26, 0.42]],
    ];
    const APPEAR = 0.17, GROW = 0.28, HOLD = 1.5, FADE = 0.3, SWEEP = 0.6;
    const per = presets.map((p) => p.length * APPEAR + SWEEP + 0.2 + HOLD + FADE);
    const CY = per.reduce((a, b) => a + b, 0);
    const ease = (u: number) => 1 - Math.pow(1 - u, 3);
    const pk: { u: number; v: number }[] = [];
    let last = 0, spawn = 0, passed = 0;
    return (ctx, w, h, t, pt) => {
      const dt = last ? Math.min(0.05, t - last) : 0;
      last = t;
      const m = Math.min(w, h) * 0.09;
      const iw = w - m * 2, ih = h - m * 2;
      let tt = t % CY, k = 0;
      while (tt > per[k]) { tt -= per[k]; k++; }
      const blocks = presets[k];
      const placed = Math.min(blocks.length, Math.floor(tt / APPEAR) + 1);
      const fade = 1 - clamp((tt - (per[k] - FADE)) / FADE, 0, 1);
      const sweepP = clamp((tt - blocks.length * APPEAR - 0.1) / SWEEP, -0.2, 1.2);
      const rects = blocks.map((b, i) => {
        const x = m + b[0] * iw, y = m + b[1] * ih, bw = b[2] * iw, bh = b[3] * ih;
        return { x, y, w: bw, h: bh, cx: x + bw / 2, cy: y + bh / 2, acc: b[4] === 1, i };
      });
      let hot = -1;
      if (pt) {
        let best = Infinity;
        for (const r of rects) { const d = Math.hypot(r.cx - pt.x, r.cy - pt.y); if (d < best) { best = d; hot = r.i; } }
      }
      /* bus aliran paket: garis horizontal menembus layout */
      const busY = m + ih * 0.56;
      ctx.strokeStyle = A(C.mute, 0.25);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(m, busY); ctx.lineTo(m + iw, busY); ctx.stroke();
      ctx.setLineDash([]);
      if (!reduce) {
        spawn -= dt;
        if (spawn <= 0) { spawn = 0.4 + Math.random() * 0.3; pk.push({ u: 0, v: 0.26 + Math.random() * 0.2 }); }
        for (let i = pk.length - 1; i >= 0; i--) {
          pk[i].u += pk[i].v * dt;
          if (pk[i].u > 1.04) { pk.splice(i, 1); passed++; }
        }
      }
      for (const r of rects) {
        if (r.i >= placed) continue;
        const g = ease(clamp((tt - r.i * APPEAR) / GROW, 0, 1));
        if (g <= 0) continue;
        const isHot = r.i === hot;
        const sw = Math.max(0, 1 - Math.abs(r.cx - (m + iw * sweepP)) / (iw * 0.09));
        /* paket yang sedang melewati blok membuatnya menyala */
        let flow = 0;
        for (const q of pk) flow = Math.max(flow, Math.max(0, 1 - Math.abs(r.cx - (m + iw * q.u)) / 26));
        let bw = r.w * (0.72 + 0.28 * g), bh = r.h * (0.72 + 0.28 * g);
        if (isHot) { bw += 3; bh += 3; }
        const x = r.cx - bw / 2, y = r.cy - bh / 2;
        ctx.globalAlpha = g * fade;
        ctx.fillStyle = A(r.acc || isHot ? C.brand : C.fg, (r.acc ? 0.14 : isHot ? 0.1 : 0.07) + flow * 0.08);
        ctx.strokeStyle = A(r.acc || isHot || sw > 0.3 ? C.brand : C.fg, (r.acc ? 0.85 : 0.2) + sw * 0.4 + flow * 0.5);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, Math.min(5, bh * 0.2)); else ctx.rect(x, y, bw, bh);
        ctx.fill(); ctx.stroke();
        if (bh > 22) {
          ctx.strokeStyle = A(r.acc ? C.brand : C.fg, 0.16);
          ctx.lineWidth = 1;
          const ly = y + bh * 0.34;
          ctx.beginPath(); ctx.moveTo(x + 5, ly); ctx.lineTo(x + bw - 5 - bw * 0.25, ly); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      /* paket: titik aksen + jejak pendek */
      for (const q of pk) {
        for (let s = 2; s >= 0; s--) {
          const uu = q.u - s * 0.018;
          if (uu < 0) continue;
          ctx.fillStyle = A(C.brand, s === 0 ? 0.95 : 0.32 / s);
          ctx.beginPath();
          ctx.arc(m + iw * uu, busY, s === 0 ? 2.3 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      /* garis sapuan aksen */
      if (sweepP > 0 && sweepP < 1) {
        ctx.strokeStyle = A(C.brand, 0.65 * fade);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(m + iw * sweepP, m - 3);
        ctx.lineTo(m + iw * sweepP, m + ih + 3);
        ctx.stroke();
      }
      readout(ctx, 'lint ' + passed, m, h - m * 0.4);
    };
  },
  /* Sistem orbit hidup: node permintaan berkeliling di dua cincin putus
     berlawanan; paket request meluncur dari node ke hub (dan respons kembali),
     hub menelan dengan riak, node kedip saat dihubungi, readout sinkron + tag
     hex bergilir. Kursor menandai node terdekat dengan cincin aksen */
  api() {
    const phase = Math.random() * Math.PI * 2;
    const BEACON = -Math.PI / 2;
    const pk: { from: number[]; to: number[]; p: number; v: number; back: boolean }[] = [];
    let last = 0, spawn = 0, sink = 0, tagT = -9, tag = '';
    return (ctx, w, h, t, pt) => {
      const dt = last ? Math.min(0.05, t - last) : 0;
      last = t;
      if (t - tagT > 4.5) { tagT = t; tag = hex4(); }
      const cx = w * 0.5, cy = h * 0.52;
      const R = Math.min(h * 0.38, w * 0.3);
      const rings: [number, number][] = [[R * 0.62, 0.1], [R, -0.08]];
      for (const [r, sp] of rings) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * sp);
        ctx.setLineDash([3, 6]);
        ctx.strokeStyle = A(C.mute, 0.4);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash([]);
      const nodes: { x: number; y: number; a: number }[] = [];
      for (let i = 0; i < 3; i++) {
        const a = phase + i * 2.094 + t * 0.5;
        nodes.push({ x: cx + Math.cos(a) * R * 0.62, y: cy + Math.sin(a) * R * 0.62, a });
      }
      for (let i = 0; i < 2; i++) {
        const a = -phase + i * 3.1416 + t * -0.34;
        nodes.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a });
      }
      let hot = -1;
      if (pt) {
        let best = Infinity;
        nodes.forEach((n, i) => {
          const d = Math.hypot(n.x - pt.x, n.y - pt.y);
          if (d < best) { best = d; hot = i; }
        });
      }
      /* luncurkan paket: node→hub (request) atau hub→node (respons) */
      if (!reduce) {
        spawn -= dt;
        if (spawn <= 0 && nodes.length) {
          spawn = 0.55 + Math.random() * 0.6;
          const n = nodes[(Math.random() * nodes.length) | 0];
          const back = Math.random() < 0.3;
          pk.push({
            from: back ? [cx, cy] : [n.x, n.y],
            to: back ? [n.x, n.y] : [cx, cy],
            p: 0, v: 1.6 + Math.random() * 0.9, back,
          });
        }
        for (let i = pk.length - 1; i >= 0; i--) {
          pk[i].p += pk[i].v * dt;
          if (pk[i].p >= 1) { if (!pk[i].back) sink++; pk.splice(i, 1); }
        }
      }
      /* uplink beacon tetap samar */
      for (const n of nodes) {
        const d = Math.atan2(Math.sin(n.a - BEACON), Math.cos(n.a - BEACON));
        const near = Math.max(0, 1 - Math.abs(d) / 0.55);
        if (near > 0 && !reduce) {
          ctx.strokeStyle = A(C.brand, near * 0.3);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
      }
      /* hub bernapas */
      if (!reduce) {
        const p = (t * 0.6) % 1;
        ctx.strokeStyle = A(C.brand, (1 - p) * 0.4);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, 6 + p * 13, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = A(C.brand, 0.95);
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
      /* node */
      for (const [i, n] of nodes.entries()) {
        const isHot = i === hot;
        const d = Math.atan2(Math.sin(n.a - BEACON), Math.cos(n.a - BEACON));
        const lit = Math.max(0, 1 - Math.abs(d) / 0.55);
        ctx.fillStyle = isHot || lit > 0 ? A(C.brand, isHot ? 0.95 : 0.6 + lit * 0.35) : A(C.fg, 0.7);
        ctx.beginPath(); ctx.arc(n.x, n.y, isHot ? 5 : 4, 0, Math.PI * 2); ctx.fill();
        if (isHot) {
          ctx.strokeStyle = A(C.brand, 0.75);
          ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, Math.PI * 2); ctx.stroke();
        }
      }
      /* paket terbang + jejak */
      for (const q of pk) {
        const e = q.p * q.p * (3 - 2 * q.p);
        const x = q.from[0] + (q.to[0] - q.from[0]) * e;
        const y = q.from[1] + (q.to[1] - q.from[1]) * e;
        ctx.strokeStyle = A(C.brand, 0.3);
        ctx.lineWidth = 1.4;
        const e0 = Math.max(0, q.p - 0.1);
        const e0s = e0 * e0 * (3 - 2 * e0);
        ctx.beginPath();
        ctx.moveTo(q.from[0] + (q.to[0] - q.from[0]) * e0s, q.from[1] + (q.to[1] - q.from[1]) * e0s);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = A(q.back ? C.fg : C.brand, 0.95);
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      /* tanda beacon */
      ctx.fillStyle = A(C.brand, 0.8);
      ctx.fillRect(cx - 2, cy - R - 11, 4, 4);
      readout(ctx, 'sink ' + sink + ' · id ' + tag, w * 0.06, h - 10);
    };
  },
  /* Path vektor yang dilalui terus: kurva Bézier menggambar dirinya lalu
     bermorfosis A↔B, sementara titik-titik penyusir berjalan terus menerus
     sepanjang kurva dengan kecepatan berbeda, jangkar berdenyut. Kursor jadi
     magnet: handle terdekat tertarik sehingga kurva melengkung mengikuti */
  design() {
    const SHAPE_A = { p0: [0.1, 0.7], c1: [0.32, 0.06], c2: [0.68, 0.98], p1: [0.9, 0.28] };
    const SHAPE_B = { p0: [0.1, 0.28], c1: [0.3, 0.96], c2: [0.66, 0.04], p1: [0.9, 0.72] };
    const DRAW = 1.6, HOLD = 0.75, MORPH = 1.15;
    const CY = DRAW + HOLD + MORPH + HOLD + MORPH;
    const phase = Math.random() * CY;
    const ants = Array.from({ length: 6 }, (_, i) => ({ u: i / 6, v: 0.16 + ((i * 0.37) % 0.14) }));
    let last = 0;
    return (ctx, w, h, t, pt) => {
      const dt = last ? Math.min(0.05, t - last) : 0;
      last = t;
      const tt = (t + phase) % CY;
      const lerped = (a: number[], b: number[], u: number) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
      let S = SHAPE_A, u = 1, drawP = 1, fase = 'tahan';
      if (tt < DRAW) { S = SHAPE_A; drawP = tt / DRAW; fase = 'gambar'; }
      else if (tt < DRAW + HOLD) { S = SHAPE_A; drawP = 1; }
      else if (tt < DRAW + HOLD + MORPH) {
        u = (tt - DRAW - HOLD) / MORPH;
        u = u * u * (3 - 2 * u);
        S = { p0: lerped(SHAPE_A.p0, SHAPE_B.p0, u), c1: lerped(SHAPE_A.c1, SHAPE_B.c1, u), c2: lerped(SHAPE_A.c2, SHAPE_B.c2, u), p1: lerped(SHAPE_A.p1, SHAPE_B.p1, u) };
        fase = 'morfosis';
      } else if (tt < DRAW + HOLD * 2 + MORPH) { S = SHAPE_B; drawP = 1; }
      else {
        u = (tt - DRAW - HOLD * 2 - MORPH) / MORPH;
        u = u * u * (3 - 2 * u);
        S = { p0: lerped(SHAPE_B.p0, SHAPE_A.p0, u), c1: lerped(SHAPE_B.c1, SHAPE_A.c1, u), c2: lerped(SHAPE_B.c2, SHAPE_A.c2, u), p1: lerped(SHAPE_B.p1, SHAPE_A.p1, u) };
        fase = 'morfosis';
      }
      const P0 = [S.p0[0] * w, S.p0[1] * h], P1 = [S.p1[0] * w, S.p1[1] * h];
      let C1 = [S.c1[0] * w, S.c1[1] * h], C2 = [S.c2[0] * w, S.c2[1] * h];
      let pulled = -1;
      if (pt) {
        const cand = [C1, C2];
        let best = Infinity;
        cand.forEach((c, i) => {
          const d = Math.hypot(c[0] - pt.x, c[1] - pt.y);
          if (d < best) { best = d; pulled = i; }
        });
        const c = cand[pulled];
        const dx = clamp(pt.x - c[0], -w * 0.18, w * 0.18), dy = clamp(pt.y - c[1], -h * 0.3, h * 0.3);
        if (pulled === 0) C1 = [C1[0] + dx * 0.6, C1[1] + dy * 0.6];
        else C2 = [C2[0] + dx * 0.6, C2[1] + dy * 0.6];
      }
      const bez = (x: number): [number, number] => {
        const iu = 1 - x;
        return [
          iu * iu * iu * P0[0] + 3 * iu * iu * x * C1[0] + 3 * iu * x * x * C2[0] + x * x * x * P1[0],
          iu * iu * iu * P0[1] + 3 * iu * iu * x * C1[1] + 3 * iu * x * x * C2[1] + x * x * x * P1[1],
        ];
      };
      /* gagang */
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = A(C.mute, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.lineTo(C1[0], C1[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(P1[0], P1[1]); ctx.lineTo(C2[0], C2[1]); ctx.stroke();
      ctx.setLineDash([]);
      for (const [c, i] of [[C1, 0], [C2, 1]] as [number[], number][]) {
        const on = pulled === i;
        ctx.fillStyle = on ? A(C.brand, 0.9) : A(C.mute, 0.6);
        ctx.beginPath(); ctx.arc(c[0], c[1], on ? 3.5 : 2.5, 0, Math.PI * 2); ctx.fill();
      }
      /* kurva progresif */
      const N = 44;
      ctx.strokeStyle = A(C.brand, 0.9);
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(P0[0], P0[1]);
      for (let i = 1; i <= N * drawP; i++) {
        const q = bez(i / N);
        ctx.lineTo(q[0], q[1]);
      }
      ctx.stroke();
      /* penyusur kurva: titik berjalan terus + jejak */
      if (!reduce) {
        for (const a of ants) a.u = (a.u + a.v * dt) % 1;
      }
      ants.forEach((a, i) => {
        if (a.u > drawP) return;
        const q = bez(a.u);
        const q0 = bez(Math.max(0, a.u - 0.045));
        ctx.strokeStyle = A(i % 3 === 0 ? C.brand : C.fg, 0.3);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        ctx.fillStyle = A(i % 3 === 0 ? C.brand : C.fg, 0.9);
        ctx.beginPath(); ctx.arc(q[0], q[1], 2.1, 0, Math.PI * 2); ctx.fill();
      });
      /* titik pemimpin saat menggambar */
      if (drawP < 1) {
        const q = bez(drawP);
        ctx.fillStyle = A(C.brand, 0.95);
        ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, Math.PI * 2); ctx.fill();
      }
      /* jangkar berdenyut */
      const pu = 2.5 + (reduce ? 0 : Math.sin(t * 3) * 1.1);
      ctx.fillStyle = A(C.fg, 0.85);
      ctx.fillRect(P0[0] - pu, P0[1] - pu, pu * 2, pu * 2);
      if (drawP >= 1) ctx.fillRect(P1[0] - pu, P1[1] - pu, pu * 2, pu * 2);
      readout(ctx, fase, w * 0.06, h - 10);
    };
  },
  /* Oscilloscope hidup: sinyal bergulir terus dari kanan ke kiri (deterministik
     dari waktu, tanpa buffer), garis bantu, tick minor bergulir, penanda puncak,
     readout puncak nyata. Kursor menjadi probe: crosshair pada X-nya dengan
     titik nilai di kurva */
  perf() {
    const phase = Math.random() * 9;
    const sample = (i: number) =>
      0.5 + 0.3 * Math.sin(i * 0.055 + phase) + 0.14 * Math.sin(i * 0.021 + 1.7 + phase) + 0.05 * Math.sin(i * 0.13 + 0.5);
    return (ctx, w, h, t, pt) => {
      const m = w * 0.07;
      const midY = h * 0.48, amp = h * 0.27;
      const span = 46;
      const off = t * 7;
      const vy = (x: number) => midY - (sample(off + ((x - m) / (w - 2 * m)) * span) - 0.5) * amp * 2;
      /* garis bantu horizontal */
      ctx.strokeStyle = A(C.mute, 0.14);
      ctx.lineWidth = 1;
      for (const f of [-0.6, 0, 0.6]) {
        const y = midY - f * amp;
        ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(w - m, y); ctx.stroke();
      }
      /* tick minor bergulir di dasar */
      const tw = w - 2 * m;
      ctx.strokeStyle = A(C.mute, 0.3);
      for (let k = -1; k < tw / 26 + 1; k++) {
        const x = m + ((k * 26 - t * 30) % tw + tw) % tw;
        ctx.beginPath(); ctx.moveTo(x, h * 0.86); ctx.lineTo(x, h * 0.86 + 4); ctx.stroke();
      }
      /* kurva sinyal */
      ctx.beginPath();
      ctx.moveTo(m, vy(m));
      for (let x = m + 2; x <= w - m; x += 2) ctx.lineTo(x, vy(x));
      ctx.strokeStyle = A(C.brand, 0.9);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      /* isian tipis di bawah kurva */
      ctx.lineTo(w - m, h * 0.86);
      ctx.lineTo(m, h * 0.86);
      ctx.closePath();
      ctx.fillStyle = A(C.brand, 0.07);
      ctx.fill();
      /* penanda puncak: titik tertinggi terlihat */
      let peakV = -1, peakX = m;
      for (let x = m; x <= w - m; x += 2) {
        const v = sample(off + ((x - m) / (w - 2 * m)) * span);
        if (v > peakV) { peakV = v; peakX = x; }
      }
      const py = midY - (peakV - 0.5) * amp * 2;
      ctx.strokeStyle = A(C.mute, 0.3);
      ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(m, py); ctx.lineTo(w - m, py); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = A(C.fg, 0.9);
      ctx.beginPath(); ctx.arc(peakX, py, 2.4, 0, Math.PI * 2); ctx.fill();
      /* probe kursor */
      if (pt && pt.x > m && pt.x < w - m) {
        const cy = vy(pt.x);
        ctx.strokeStyle = A(C.mute, 0.4);
        ctx.beginPath(); ctx.moveTo(pt.x, h * 0.12); ctx.lineTo(pt.x, h * 0.86); ctx.stroke();
        ctx.fillStyle = A(C.brand, 0.95);
        ctx.beginPath(); ctx.arc(pt.x, cy, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = A(C.brand, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(pt.x, cy, 6.5, 0, Math.PI * 2); ctx.stroke();
      }
      /* readout: indikator hidup + puncak nyata */
      const live = reduce ? 0.7 : 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3));
      ctx.fillStyle = A(C.brand, live);
      ctx.beginPath(); ctx.arc(m + 3, h - 13, 2.6, 0, Math.PI * 2); ctx.fill();
      readout(ctx, 'puncak ' + peakV.toFixed(2), m + 11, h - 10);
    };
  },
  /* Sampul proyek: tekstur grid halus + bracket pojok (aksen) di belakang monogram (statis) */
  cover() {
    return (ctx, w, h) => {
    ctx.strokeStyle = A(C.mute, 0.16);
    ctx.lineWidth = 1;
    for (let x = 28; x < w; x += 28) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 28; y < h; y += 28) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    const i = 10, l = 13;
    ctx.strokeStyle = A(C.brand, 0.65);
    ctx.lineWidth = 1.5;
    const corners: [number, number, number, number][] = [
      [i, i + l, i, i], [i, i, i + l, i],
      [w - i - l, i, w - i, i], [w - i, i, w - i, i + l],
      [i, h - i - l, i, h - i], [i, h - i, i + l, h - i],
      [w - i - l, h - i, w - i, h - i], [w - i, h - i - l, w - i, h - i],
    ];
    for (const [x1, y1, x2, y2] of corners) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    };
  },
};

const canvases = Array.from(document.querySelectorAll<HTMLElement>('[data-viz]'));
if (canvases.length) {
  /* Posisi kursor per host (relatif kanvas) */
  const pts = new Map<HTMLElement, Pt>();
  const painters = canvases.map((host) => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    const make = sketches[host.dataset.viz ?? ''];
    const draw = make ? make() : null;
    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pts.set(host, { x: e.clientX - r.left, y: e.clientY - r.top });
    });
    host.addEventListener('pointerleave', () => pts.set(host, null));
    return { host, canvas, ctx, draw };
  }).filter((p) => p.draw);

  const size = () => painters.forEach(({ canvas }) => {
    const r = canvas.parentElement!.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = r.width * d; canvas.height = r.height * d;
    canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
  });
  size();
  new ResizeObserver(size).observe(canvases[0].parentElement!);

  const render = (t: number) => painters.forEach(({ host, canvas, ctx, draw }) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(canvas.width / canvas.clientWidth || 1, 0, 0, canvas.height / canvas.clientHeight || 1, 0, 0);
    draw(ctx, canvas.clientWidth, canvas.clientHeight, t, pts.get(host) ?? null);
  });

  /* Tilt kartu mengikuti pointer: maks 3 derajat, dilembutkan tiap frame */
  const tilts: { el: Element; rx: number; ry: number; tx: number; ty: number }[] = [];
  if (fine && !reduce) {
    for (const { host } of painters) {
      const card = host.closest('.cap-card');
      if (!card) continue;
      const st = { el: card, rx: 0, ry: 0, tx: 0, ty: 0 };
      tilts.push(st);
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        st.tx = (((e.clientY - r.top) / r.height - 0.5) * -6);
        st.ty = (((e.clientX - r.left) / r.width - 0.5) * 6);
      });
      card.addEventListener('pointerleave', () => { st.tx = 0; st.ty = 0; });
    }
  }
  const applyTilt = () => {
    for (const s of tilts) {
      s.rx += (s.tx - s.rx) * 0.12;
      s.ry += (s.ty - s.ry) * 0.12;
      (s.el as HTMLElement).style.transform =
        s.rx === 0 && s.ry === 0 ? '' : `perspective(900px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
    }
  };

  new MutationObserver(() => { theme(); render(0); }).observe(root, { attributes: true, attributeFilter: ['class'] });

  render(2);
  if (reduce) {
    /* statis: satu gambar final saja */
  } else {
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      render((performance.now() - t0) / 1000);
      applyTilt();
      raf = requestAnimationFrame(tick);
    };
    /* raf hidup selama ada satu host terlihat; tiap host diamati sendiri */
    const visible = new Set<HTMLElement>();
    const sync = () => {
      if (!raf && visible.size) raf = requestAnimationFrame(tick);
      else if (!visible.size && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    for (const { host } of painters) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) visible.add(host);
        else visible.delete(host);
        sync();
      }).observe(host);
    }
  }
}
