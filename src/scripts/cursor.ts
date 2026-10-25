/* Kursor kustom futuristik — hanya di dalam section hero, hanya untuk pointer presisi.
   Titik presisi + cincin tertinggal (lerp) + bracket kardinal yang muncul di atas
   elemen interaktif. Semua gerakan via transform; native cursor disembunyikan di hero. */
function init(): void {
  if (!matchMedia('(pointer: fine)').matches) return;
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.innerHTML = '<span class="tick tick-n"></span><span class="tick tick-e"></span><span class="tick tick-s"></span><span class="tick tick-w"></span>';
  document.body.append(dot, ring);
  hero.classList.add('has-cursor');

  let x = -100, y = -100;          // posisi asli (dot)
  let rx = -100, ry = -100;        // posisi cincin (lerp)
  let scale = 1, targetScale = 1;
  let visible = false;
  let down = false;

  const interactive = (el: EventTarget | null): boolean =>
    el instanceof Element && !!el.closest('a, button');

  hero.addEventListener('pointerenter', (e) => {
    visible = true;
    x = rx = e.clientX;
    y = ry = e.clientY;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
    targetScale = interactive(e.target) ? 1.9 : 1;
  });
  hero.addEventListener('pointerleave', () => {
    visible = false;
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    targetScale = 1;
  });
  hero.addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    targetScale = down ? 0.75 : interactive(e.target) ? 1.9 : 1;
    ring.classList.toggle('is-hover', interactive(e.target));
  });
  hero.addEventListener('pointerdown', () => { down = true; targetScale = 0.75; });
  addEventListener('pointerup', () => {
    down = false;
    targetScale = interactive(document.elementFromPoint(x, y)) ? 1.9 : 1;
  });

  const follow = reduce ? 1 : 0.16;
  const loop = () => {
    rx += (x - rx) * follow;
    ry += (y - ry) * follow;
    scale += (targetScale - scale) * 0.2;
    dot.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
    ring.style.transform = `translate3d(${rx - 17}px, ${ry - 17}px, 0) scale(${scale})`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

init();
