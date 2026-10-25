/* Isi-daya di hero: klik kiri ditahan → dunia WebGL mengisi daya (uniform uCharge),
   suara riser naik disintesis langsung dengan Web Audio API (tanpa file audio),
   cincin progres tipis mengikuti kursor. Lepas sebelum penuh: meluruh.
   Lepas tepat saat penuh (atau tahan lebih): voli meteor + cincin kejut + chime.
   Gate: pointer presisi saja, bukan pada tautan/tombol, hormati reduced-motion
   untuk efek visual (suara tetap halus tanpa ledakan). */
const HOLD_MS = 1300;

/* ---------- audio: disintesis, dibuat malas setelah gestur pertama ---------- */
let actx: AudioContext | null = null;
let riser: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
/* default mati: audio hanya aktif setelah pengguna menyalakannya */
let muted = true;

const ensureCtx = (): AudioContext | null => {
  if (muted) return null;
  if (!actx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx.state === 'suspended') void actx.resume();
  return actx;
};

const startRiser = () => {
  const ctx = ensureCtx();
  if (!ctx || riser) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc2.type = 'triangle';
  osc.frequency.setValueAtTime(72, now);
  osc.frequency.exponentialRampToValueAtTime(310, now + HOLD_MS / 1000 + 0.4);
  osc2.frequency.setValueAtTime(144, now);
  osc2.frequency.exponentialRampToValueAtTime(620, now + HOLD_MS / 1000 + 0.4);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(3400, now + HOLD_MS / 1000 + 0.4);
  filter.Q.value = 6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.11, now + 0.12);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc2.start();
  riser = { osc, osc2, gain, filter };
};

const stopRiser = (released: boolean) => {
  if (!riser) return;
  const ctx = actx!;
  const now = ctx.currentTime;
  const { osc, osc2, gain, filter } = riser;
  riser = null;
  const end = now + (released ? 0.35 : 0.18);
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  if (released) {
    filter.frequency.cancelScheduledValues(now);
    filter.frequency.setValueAtTime(filter.frequency.value, now);
    filter.frequency.exponentialRampToValueAtTime(120, end);
  }
  osc.frequency.cancelScheduledValues(now);
  osc2.frequency.cancelScheduledValues(now);
  osc.stop(end);
  osc2.stop(end);
};

const chime = () => {
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = i < 2 ? 'triangle' : 'sine';
    o.frequency.value = f;
    const t0 = now + i * 0.07;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + 0.65);
  });
};

/* ---------- UI cincin progres ---------- */
const R = 17;
const ringHtml =
  '<div class="hold-ring" aria-hidden="true"><svg viewBox="0 0 44 44">' +
  `<circle class="hold-ring-track" cx="22" cy="22" r="${R}"/>` +
  `<circle class="hold-ring-arc" cx="22" cy="22" r="${R}"/></svg></div>`;

function init(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  const field = document.getElementById('hero-field');
  const fine = matchMedia('(pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const host = document.createElement('div');
  host.className = 'hold-host';
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = ringHtml;
  hero.appendChild(host);
  const arc = host.querySelector<SVGCircleElement>('.hold-ring-arc');
  const CIRC = 2 * Math.PI * R;
  if (arc) {
    arc.style.strokeDasharray = String(CIRC);
    arc.style.strokeDashoffset = String(CIRC);
  }
  let ringX = -100, ringY = -100, shown = false;

  const place = (e: PointerEvent) => {
    ringX = e.clientX;
    ringY = e.clientY;
    if (!shown) {
      host.classList.add('is-on');
      shown = true;
    }
    host.style.transform = `translate(${ringX}px, ${ringY}px)`;
  };
  const hide = () => {
    host.classList.remove('is-on');
    shown = false;
  };

  let raf = 0;
  let charge = 0;
  let holding = false;
  let done = false;
  let last = 0;

  const emit = (name: 'hero:charge' | 'hero:burst', v = 0) => {
    (field ?? hero).dispatchEvent(new CustomEvent(name, { detail: { v }, bubbles: true }));
  };

  const loop = (now: number) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (holding) {
      charge = Math.min(1, charge + dt / (HOLD_MS / 1000));
      if (charge >= 1 && !done) {
        done = true;
        stopRiser(true);
        chime();
        emit('hero:burst');
        host.classList.add('is-done');
      }
    } else {
      charge = Math.max(0, charge - dt / 0.45);
      if (charge === 0 && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        emit('hero:charge', 0);
      }
    }
    if (arc) arc.style.strokeDashoffset = String(CIRC * (1 - charge));
    emit('hero:charge', charge);
    if (raf || charge > 0) raf = requestAnimationFrame(loop);
    else raf = 0;
  };
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };

  const interactive = (e: PointerEvent) =>
    !!(e.target as HTMLElement | null)?.closest('a, button, [role="button"], input, textarea, select');

  hero.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || interactive(e) || !fine) return;
    holding = true;
    done = false;
    host.classList.remove('is-done');
    if (!reduce) place(e);
    startRiser();
    kick();
  });
  hero.addEventListener('pointermove', (e) => {
    if (holding && !reduce) place(e);
  });
  const release = (full: boolean) => {
    if (!holding) return;
    holding = false;
    if (done) {
      done = false;
      charge = 0;
      if (arc) arc.style.strokeDashoffset = String(CIRC);
      hide();
      window.setTimeout(() => host.classList.remove('is-done'), 650);
      return;
    }
    stopRiser(full && charge > 0.05);
    if (!full) hide();
  };
  hero.addEventListener('pointerup', () => release(false));
  hero.addEventListener('pointercancel', () => release(false));
  hero.addEventListener('pointerleave', () => release(false));

  /* Pintasan keyboard: tahan Enter/Spasi saat fokus di hero (bukan di kontrol) */
  hero.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if ((e.key === 'Enter' || e.key === ' ') && !interactive(e as unknown as PointerEvent)) {
      e.preventDefault();
      holding = true;
      done = false;
      startRiser();
      kick();
    }
  });
  hero.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') release(false);
  });

  /* Saklar suara: satu-satunya kontrol audio, disimpan di localStorage */
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hold-sound btn';
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = 'Suara: mati';
  btn.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem('hero-sound', muted ? '0' : '1');
    btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
    btn.textContent = muted ? 'Suara: mati' : 'Suara: nyala';
    if (muted && riser) stopRiser(false);
    if (!muted) ensureCtx();
  });
  if (localStorage.getItem('hero-sound') === '1') {
    muted = false;
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = 'Suara: nyala';
  } else {
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'Suara: mati';
  }
  const actions = hero.querySelector('.actions');
  if (actions) actions.appendChild(btn);
  else hero.appendChild(btn);
}

init();
