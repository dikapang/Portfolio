# design.md — Referensi Design untuk Portfolio Pribadi

Sumber referensi: **https://daya-arsana.com/** (di-audit 2026-10-24 dengan Hallmark · sloplint + render tier)
Artefak audit: `audit-mirror/` (mirror kode sumber), `audit-mirror/.hallmark/before/` (screenshot 320–1920px), `.hallmark/before.txt` (temuan lengkap).

Dokumen ini adalah sistem design yang diekstraksi dari situs tersebut, sudah disaring dengan temuan audit, dan dipetakan untuk kebutuhan **portfolio pribadi**. Anggap ini "locked system": saat membangun portfolio, semua keputusan visual mengacu ke sini.

---

## 1. Ringkasan audit (the read)

- **Untuk apa halamannya**: studio AI/software B2B menjual jasa engineering; audiensnya founder/CTO; satu aksinya *kontak via WhatsApp/email*. Untuk portfolio pribadi Anda, job berubah menjadi *hire me / lihat pekerjaan*.
- **Yang berhasil dan layak dipertahankan**: disiplin token (semua warna & font lewat `:root`), bahasa kartu yang konsisten, kartu service dengan visual canvas dot-grid (ini "signature"-nya), dark mode yang rapi, header sticky blur, baseline a11y/SEO/security di atas rata-rata.
- **Yang terbaca sebagai generated**: setiap `h2` memakai pola "frasa tegas + fragmen muted" (38iii), eyebrow kapital ber-tracking di atas semua heading (54, 67 — pelanggaran Floor), stats section dengan angka tak bersumber (46a), mockup HP digambar CSS alih-alih screenshot asli (81/84), dan bentuk halaman template AI-studio generik: hero → bento services → case → testimonial → stats → CTA (8, 85).
- **Yang rusak/perlu diperbaiki**: hero tidak mengisi layar pertama di 1440×900 (konten berakhir ~520px, ada dead band 380px — 44c/79), alamat footer wrap 3–4 baris di 320/768px (49b), fokus ring memudar (15), tombol disabled hanya via opacity (39a), tinggi kontrol 40px di bawah standar sentuh 44px (39b), kontras destructive 2.89:1 (40), emoji ★ sebagai ikon (30a), em dash di copy (19), em dash bahkan di title tag.

**Skor linter**: 32 FAIL · 31 REFLEX · 19 WARN (1 FAIL — logo.png — adalah artefak mirror lokal; di situs live logo termuat, di-*dismiss*).

---

## 2. Tech stack — "framework apa yang digunakan?"

**Jawaban singkat: tidak ada framework.** Ini situs statis tulen, HTML/CSS/JS yang ditulis tangan.

| Lapisan | Teknologi | Bukti |
| --- | --- | --- |
| Markup | HTML statis per-halaman, tanpa templating/bundler | path relatif `css/…`, `js/…`; header `last-modified`; tidak ada `_next/`, `__nuxt`, `astro`, `wp-content`, hash bundle |
| CSS | Vanilla CSS, 4 file berlapis: `tokens.css` → `ui.css` → `site.css` → `pages.css` (subpage) | komentar header file; urutan `@import`-less `<link>` berurutan |
| Design system | **Konvensi shadcn / shadcn-vue** (zinc base + brand orange), nama token semantik Tailwind-style (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--ring`…), warna **OKLCH** | komentar `tokens.css` baris 1: *"shadcn-vue compatible (zinc base + brand orange)"* |
| JS | Vanilla JS (IIFE), 3 file: `site.js` (ikon SVG inline, tema, menu, tabs, TOC, GSAP), `hero-3d.js`, `viz.js` | tidak ada import/export di site.js; `window.DA` global |
| Library eksternal | **Three.js r128** (hero dot-field, custom GLSL shader), **GSAP 3.12.5 + ScrollTrigger** — via cdnjs | tag `<script>` CDN |
| Font | **Geist** + **Geist Mono** via Google Fonts (400/500/600/700 + mono 400/500) | link fonts.googleapis.com |
| Ikon | SVG inline gaya **lucide** — path di-inject JS dari map `ICONS` | `i[data-icon]` → `site.js` |
| Tema | Light/dark via class `.dark` di `<html>`, `localStorage` + `prefers-color-scheme`, script inline anti-FOUC di `<head>` | script pertama di head |
| Hosting | **Cloudflare** (kemungkinan Cloudflare Pages), static | `server: cloudflare`, `cf-cache-status: DYNAMIC` |
| Security | CSP ketat, HSTS preload, `x-frame-options: DENY`, `permissions-policy`, `referrer-policy` | response headers |
| SEO | `sitemap.xml` (32 URL: 1 home + 6 service + 1 case study + 14 detail + halaman lain), `robots.txt` Cloudflare-managed yang memblokir AI crawler, OG/Twitter meta lengkap 1200×630 | curl robots/sitemap |
| Lain-lain | Ada rute admin (`/admin-login`, `/admin-cms` di robots.txt `Disallow`) — indikasi CMS custom ringan di balik situs statis ini | robots.txt |

**Implikasi untuk portfolio Anda** — tiga jalur yang masuk akal:

1. **Vanilla static (seperti sumber)** — paling mudah meniru hasilnya 1:1; hosting gratis di Cloudflare Pages/GitHub Pages; tanpa build step. Cocok kalau Anda nyaman menulis HTML/CJS langsung.
2. **Astro (rekomendasi)** — tetap menghasilkan HTML statis nol-JS-sebagian-besar, tapi dapat templating komponen untuk halaman project/case-study yang berulang; token CSS yang sama bisa dipakai apa adanya.
3. **Next.js + shadcn/ui** — kalau Anda ingin ekosistem React; sistem token sumber ini memang kompatibel shadcn sehingga migrasi token hampir gratis. Bayar dengan kompleksitas build.

Yang **tidak perlu** ditiru: Three.js r128 (versi 2021) — kalau mau hero 3D serupa, pakai Three.js modern atau versi ringan; atau ganti signature dengan canvas 2D yang jauh lebih ringan (lihat §5.3).

---

## 3. Sistem design (ekstraksi)

### 3.1 Warna — token `:root` (OKLCH asli; hex ≈ padanan zinc Tailwind)

Netralnya persis keluarga **zinc**; satu-satunya warna adalah **oranye brand**. Prinsip: *neutral base + satu aksen*. Untuk portfolio, ganti hue aksen tapi pertahankan disiplin ini.

| Token | Light (OKLCH) | ≈ Hex | Dark (OKLCH) | ≈ Hex | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| `--background` | `oklch(1 0 0)` | `#ffffff` | `oklch(.141 .005 285.823)` | `#09090b` | latar halaman |
| `--foreground` | `oklch(.141 .005 285.823)` | `#09090b` | `oklch(.985 0 0)` | `#fafafa` | teks utama |
| `--card` | `oklch(1 0 0)` | `#ffffff` | `oklch(.21 .006 285.885)` | `#18181b` | permukaan kartu |
| `--primary` | `oklch(.21 .006 285.885)` | `#18181b` | `oklch(.92 .004 286.32)` | `#e4e4e7` | tombol utama (invers antar mode) |
| `--secondary` / `--muted` | `oklch(.967 .001 286.375)` | `#f4f4f5` | `oklch(.274 .006 286.033)` | `#27272a` | chip, permukaan lembut |
| `--muted-foreground` | `oklch(.552 .016 285.938)` | `#71717a` | `oklch(.705 .015 286.067)` | `#a1a1aa` | teks sekunder |
| `--border` | `oklch(.92 .004 286.32)` | `#e4e4e7` | `oklch(1 0 0 / 10%)` | — | garis 1px |
| `--ring` | `oklch(.705 .015 286.067)` | `#a1a1aa` | `oklch(.552 .016 285.938)` | `#71717a` | focus ring |
| `--brand` | `oklch(.7 .176 49.3)` | ≈ `#f97316` | `oklch(.72 .176 49.3)` | — | **satu-satunya aksen** |
| `--brand-text` | `oklch(.555 .16 47)` | ≈ `#b45309` | `oklch(.76 .155 52)` | — | aksen di atas background, angka stat |
| `--destructive` | `oklch(.577 .245 27.325)` | ≈ `#dc2626` | `oklch(.704 .191 22.216)` | — | error (⚠ kontras 2.89:1 — perbaiki) |

Aturan pemakaian aksen (pelajari dari sumber): brand hanya di titik kecil — dot eyebrow, `::selection` (mix 28%), badge brand (fill 12% + border 30%), unit angka statistik, tombol WhatsApp. Aksen ≤ ~5% viewport. **Jangan** meniru: kata "muted" di tiap `h2` memakai `--muted-foreground` (38iii) — di portfolio Anda, heading satu warna penuh.

Trick yang layak dicuri: `color-mix(in oklch, var(--brand) 12%, transparent)` untuk tint; canvas/3D membaca token via `getComputedStyle` + canvas 1×1px, jadi visual ikut ganti tema otomatis.

### 3.2 Tipografi — 2 keluarga saja

**Geist** (semua) + **Geist Mono** (label/kode/angka indeks saja — tapi lihat catatan audit 64: kurangi mono sebagai "label costume"; di portfolio cukup pakai mono untuk kode dan angka).

| Kelas | Ukuran | Weight | Tracking | Line-height |
| --- | --- | --- | --- | --- |
| `.display` (hero) | `clamp(2.75rem, 6.6vw, 5.25rem)` | 600 | −0.045em | 1 |
| `.h1` | `clamp(2.5rem, 5.4vw, 4.25rem)` | 600 | −0.042em | 1.03 |
| `.h2` (section) | `clamp(2rem, 4.2vw, 3.25rem)` | 600 | −0.038em | 1.06 |
| `.h3` (kartu) | `1.25rem` | 600 | −0.02em | 1.3 |
| `.lead` | `1.125rem` | 400 | — | 1.7, muted |
| body | `1rem` | 400 | — | 1.5 (prosa 1.7) |
| `.small` | `.875rem` | — | — | 1.55 |
| angka besar | `clamp(2.75rem, 5vw, 4rem)` | 600 | −0.05em | 1, `tabular-nums` |

Kewajiban `text-wrap: balance` di heading dan `pretty` di body sudah benar di sumber — pertahankan. Heading **satu weight, satu warna** (beda dengan sumbernya yang memecah warna).

### 3.3 Skala, radius, shadow, gerak

```css
:root {
  --radius: .625rem;            /* 10px; sm 6 · md 8 · lg 10 · xl 14 · 2xl 18 */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / .05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);
  --ease-out: cubic-bezier(.22, 1, .36, 1);
}
.container  { max-width: 1200px; margin-inline: auto; padding-inline: 1.25rem; }  /* 2rem ≥768px */
.section    { padding-block: clamp(5rem, 10vw, 8rem); }
```

- Spasi pakai skala 4px (sumber melanggar sekali: `padding: 3px` di tabs — jangan ditiru).
- Radius: kontrol 8px (`--radius-md`), kartu 14px (`--radius-xl`), CTA block 18px. Pill hanya untuk kontrol/chip — bukan kotak dekoratif.
- Hover kartu: border menguat + shadow naik satu tingkat (`--shadow-sm` → `md`). Satu sinyal per elemen.

### 3.4 Komponen inti (spesifikasi ringkas)

- **Button** — tinggi 36px default / 40px sm / 44px lg (**naikkan ke 44–48px untuk marketing**; sumber hanya 40px dan kena temuan 39b). Varian: `default` (fill primary), `outline`, `secondary`, `ghost`, `brand` (fill oranye), `inverse` (di atas panel gelap), `link`. Radius 8px, font 500 .875rem, ikon 16px. Focus: `box-shadow: 0 0 0 3px color-mix(ring 50%)` — tapi **tanpa transisi pada ring** (temuan 15).
- **Badge** — 12px/500, radius 8px, padding 2/8px. Varian `outline` (chip capability), `secondary` (chip stack), `brand` (tint 12%).
- **Card** — radius 14px, border 1px, `--shadow-sm`, struktur `card-header / card-content / card-footer` padding-inline 1.5rem, gap internal 1.5rem, flex-column. Hover: border `color-mix(foreground 22%)` + shadow-md.
- **Card service (signature)** — visual canvas 16:9 di atas (dots-bg: radial-gradient dot 18×18px di atas muted), lalu meta ikon+kode, judul, deskripsi, deretan badge outline, footer link-arrow. Ini komposisi paling khas situs ini.
- **Metrics grid** — grid 2 kolom dipisah garis 1px ( teknik `gap:1px; background:var(--border)`), dt kecil muted, dd 1.5rem/600/tabular-nums.
- **Header** — sticky 4rem, `backdrop-filter: saturate(1.5) blur(12px)`, background 82% transparan, border muncul setelah scroll 8px. Brand kiri, nav tengah-kiri, actions kanan (theme toggle + CTA sm + hamburger <900px → sheet mobile fullscreen dengan Escape + lock scroll).
- **CTA block** — panel `--primary` (gelap di light mode, terang di dark — invers), pola grid 56px via gradient + mask radial dari pojok, radius 18px, heading + lead + 2 tombol.
- **Footer** — grid `2fr 1fr 1fr auto`: brand+alamat, Services, Company, Connect; baris copyright terpisah. Font .875rem, link muted → foreground on hover.
- Lain: accordion `<details>` native, tabs ARIA dengan arrow-key nav, table, alert, switch, kbd, avatar fallback inisial.

### 3.5 Anatomi halaman & responsive

Urutan sumber: hero → services bento (6 kartu) → work (1 case unggulan) → testimonials (4 quote) → stats (4 angka) → CTA → footer. *(Untuk portfolio, ganti — lihat §5.1.)*

- **Bento**: grid 6 kolom `minmax(0,1fr)`, kartu `span-2`, gap 16px; ≥2 kolom di ≤1023, 1 kolom di ≤639 (anak terakhir ganjil melebar penuh).
- **Hero**: min-height `min(60rem, 100svh − 4rem)`, konten center, display max 13em, lead max 38rem, tombol wrap-center; strip indeks 6 layanan di kaki hero (grid 6 → horizontal scroll-snap `proximity` di ≤1099).
- Breakpoints: 1179/1099 (strip), 1023 (bento), 899 (nav, case 2→1 kolom, stats 4→2), 767 (grid-2, footer), 639, 479 (tombol full-width, hyphens), 359 (gutter 1rem). Plus `pointer:coarse` (touch target naik 44px) — bagus, pertahankan.
- Text lengkung: `html { scroll-behavior: smooth; scroll-padding-top: 5rem }`.

### 3.6 Motion (resep yang bisa dicuri)

- **Reveal on scroll** (GSAP ScrollTrigger, `once:true`, trigger `top 88%`): `y:24, autoAlpha:0 → 0, durasi .8s, ease power3.out`. Stagger anak grid `.07s`. Hero masuk `y:22, stagger .08, .9s`. **Semua hanya transform+opacity.**
- **Count-up angka**: 1.8s power3.out saat masuk viewport.
- **Parallax hero**: background `yPercent:14` scrub.
- **`prefers-reduced-motion`**: JS early-return (GSAP + Three.js + viz mati total). Tambahkan juga fallback CSS (temuan 27).
- **Hero 3D** (Three.js): grid titik 190×84, custom ShaderMaterial — gelombang sin di vertex, ~2% titik jadi aksen oranye, riak mengikuti pointer (raycast ke plane), warna dibaca dari token CSS, render pause saat off-screen (IntersectionObserver), DPR cap 2, mask gradient vertikal.
- **Viz kartu**: canvas 2D per kartu (mock editor kode, diagram flow, roadmap, neural, shield, custody) — menggambar ulang saat tema berubah (MutationObserver).
- Micro: ikon arrow geser `translateX(3px)` on hover; nav pill hover.

### 3.7 Baseline non-visual (pertahankan semua)

Meta title/description + OG/Twitter 1200×630, `sitemap.xml`, theme-color, anti-FOUC script, focus-visible global, `aria-expanded`/`aria-controls` di menu, label di semua kontrol ikon, canvas `aria-hidden`, `::selection` bertema, CSP + HSTS, `loading` gambar, ikon satu library.

---

## 4. Temuan audit → daftar larangan untuk portfolio Anda

Hal-hal ini **ada di sumber dan jangan dibawa** ke portfolio (nomor gate Hallmark):

**Floor (wajib dihindari):**
1. **Eyebrow** ("Services" kecil di atas h2) — buka section dengan cara lain: pernyataan besar, angka, kalimat pengantar, atau langsung heading (54).
2. **Label kapital ber-tracking / mono-caps** di semua label (67, 64) — label = body face, satu step lebih kecil, sentence case, tanpa tracking.
3. **>80 kata per layar** — sumber ada 232 kata di satu layar dan 674 total; portfolio: satu ide per layar, hero = headline ≤7 kata + satu kalimat ≤12 kata + aksi (58).
4. **Kata beraksen di heading** ("Our boldest **builds.**" muted) (38iii) — heading satu warna.
5. **Emoji sebagai ikon** (4.6★) — SVG (30a).
6. **Focus ring yang memudar / transisi box-shadow** (15) — ring instan.
7. **Disabled via opacity saja** (39a) — tiga kanal: opacity, `cursor:not-allowed`, atribut.
8. **Middle-dot meta** ("01 · Development") (63) — pisah dengan kolom/hairline/spasi.
9. **Em/en dash di copy** (19) — koma, titik, kurung; termasuk di title tag.
10. **Angka/testimoni yang tidak bisa Anda buktikan** (46a) — untuk portfolio: hanya metrik project yang nyata (GitHub stars, uptime, hasil ukur). Section "The numbers nobody shares" sumbernya persis pelanggaran ini — jangan direplikasi.
11. **`overflow-x: clip` di html dan body** (34) — sumber hanya di body.
12. **Form palsu yang "terkirim"** (70) — form kontak portfolio: pakai `mailto:`/layanan nyata (sumber benar: WhatsApp + mailto).

**Reflex (perbaiki, bukan tiru):**
13. **Hero harus mengisi layar pertama** di 1440×900 (44c/79) — sumber: konten berhenti di 520px lalu kosong 380px. Solusi untuk portfolio: headline+visual lebih besar, atau posture hero yang menempel fold.
14. **Tombol 44–52px** di halaman marketing (39b); `:active` state juga (26b).
15. **Mockup HP CSS alih-alih screenshot asli** (81/84) — untuk portfolio ini fatal: **tunjukkan screenshot/gambar project asli Anda**, bukan kotak "Screen 01".
16. **Link alamat panjang** wrap 3–4 baris di mobile (49b) — pemendek/nowrap.
17. Kontras destructive 2.89:1 → ≥4.5:1 (40); measure 22ch/30ch → ≥45ch untuk prosa (25); heading level jangan lompat h2→h4 (F21); tabular-nums di semua angka display (F6); satu tombol filled per layar (F4 — hero sumber punya 2); quote tipografis “ ” ’ bukan lurus (F1).
18. **Anatomi template** (8/85): hero→3 fitur→CTA adalah bentuk default AI. Portfolio punya anatomi sendiri (§5.1).

---

## 5. Adaptasi ke portfolio pribadi

### 5.1 Anatomi yang disarankan (bukan salinan urutan sumber)

1. **Hero** — nama + satu kalimat posisi ("Frontend engineer yang …"), satu CTA "Lihat pekerjaan" (filled) + satu link sekunder. Tanpa badge, tanpa strip indeks kalau memenuhi layar sudah cukup.
2. **Selected work (3–5 project)** — kartu besar bergambar **screenshot asli**, per project: judul + 1 kalimat hasil + badge stack + 1–2 metrik nyata (atau tanpa metrik). Ini bagian terbesar halaman — gambar memimpin, bukan teks.
3. **What I do** — adaptasi bento service: 2–4 kartu kemampuan dengan visual canvas/IL kecil (boleh curi pola kartu service §3.4).
4. **About** — foto + 3–4 kalimat + fakta (lokasi, sekarang di mana, buka untuk apa).
5. **Kontak/CTA** — panel invers ala sumber (grid pattern + mask): email + satu channel (LinkedIn/GitHub).
6. **Footer** — 2 kolom saja untuk personal: identitas + links.

Total section 5–6; ≤450 kata seluruh halaman.

### 5.2 Pengganti signature

Signature sumber = dot-field 3D + kartu canvas. Untuk portfolio, pilih **satu**:
- versi ringan dot-field 2D canvas (y:~30 baris JS, tanpa Three.js), atau
- kartu project dengan hover yang menonjolkan screenshot, atau
- tipografi nama yang sangat besar sebagai pembuka.

Jangan pakai ketiganya sekaligus.

### 5.3 Rekomendasi stack final

- Simpel & cepat rilis: **HTML statis + CSS token (salin §3.1–3.3) + GSAP** — deploy Cloudflare Pages.
- Skalabel (banyak case study): **Astro**, token CSS yang sama, zero-JS default.
- Kalau ingin React: **Next.js + shadcn/ui**, token langsung kompatibel.
- Font: Geist gratis di Google Fonts — sah dipakai; alternatif personal: Space Grotesk/General Sans sebagai display + Inter/Geist body.

### 5.4 Checklist sebelum rilis

- [ ] Semua warna/font lewat token `:root`; tidak ada literal hex di luar blok token.
- [ ] `overflow-x: clip` di html **dan** body; grid gambar `minmax(0,1fr)`.
- [ ] Setiap interaktif punya `:focus-visible` instan + `:active`.
- [ ] Semua animasi punya fallback `prefers-reduced-motion`; konten terlihat tanpa JS.
- [ ] Screenshot project asli di setiap kartu work (bukan mockup/gradient kosong).
- [ ] Metrik hanya yang terverifikasi; tanpa testimoni/testimoni nyata saja.
- [ ] Tanpa eyebrow, tanpa label tracked-caps, tanpa middle-dot, tanpa em dash, tanpa emoji ikon.
- [ ] Heading satu warna/weight; satu tombol filled per layar.
- [ ] Cek di 375 / 768 / 1280 / 1440×900 / 1920: hero mengisi layar pertama, tidak ada wrap jelek.
- [ ] Meta OG + sitemap + `robots.txt`; uji Lighthouse target ≥95.

---

## 6. Diferensiasi dari referensi (wajib dipertahankan)

Prinsip: **sistem** (disiplin token, struktur komponen) dipelajari dari audit, tetapi **ekspresi** adalah milik portfolio ini. Yang sengaja dibuat berbeda dari daya-arsana.com:

| Elemen | Referensi (daya-arsana) | Portfolio ini |
| --- | --- | --- |
| Hero background | Dot-field 3D Three.js: grid titik seragam 190×84 di bidang datar, gelombang sinus + riak pointer, kamera statis | **Lanskap senja berlapis ala ilustrasi vektor** (three.js, kamera frontal): langit membakar tiga titik gradasi ke emas di horizon, matahari pucat besar, 4 punggungan flat dari oranye terang ke marun tua, **tebing + siluet pendaki di kiri** (ransel, tangan ke dahi), pinus dari profil, kawanan burung mengepak. **Parallax pointer**: tiap lapisan bergeser dengan kecepatan beda (langit .05 → tebing 2.0) + drift idle |
| Scroll parallax (pin) | Chapter sticky berlapis: scene 100dvh `position:sticky` dalam wrapper tinggi, konten chapter mengalir di atasnya, scroll memutar progres | **Pola sama, tanpa ruang kosong**: wrapper `.scene-wrap` 240dvh — layar 1: nama (kiri-bawah) di atas lanskap; layar 2: **chapter Profil menumpang di scene yang masih pinned** (`position: absolute` dalam wrapper), masuk **dari kanan** (`data-plx-x`); scroll = progres sunrise (matahari naik, foreground tenggelam, langit meredup); nama memudar lebih awal memberi panggung |
| Konten | Proyek contoh palsu + bio lama | **Data asli dari Supabase portfolio lama** (tabel `profile` + `projects`): 6 proyek nyata (Game Hosting Template, Antam Audithink, Evolearn, Coffe-Shop Template, Nitro Game Hosting, PTPN Audithink) dengan thumbnail asli di `public/images/projects/`, repo/demo, dan stack; bio Frontend Engineer + fakta singkat; tombol "Kunjungi proyek" hanya muncul bila ada demo/repo |
| Parallax section | Reveal vertikal seragam | **Semua section bergerak horizontal bergantian kiri/kanan** (`data-plx-x`): section-head, cover & media kartu pekerjaan, visual kapabilitas, panel CTA — masuk dari sisi berselang-seling dengan fade, scrub mengikuti scroll; strip indeks tetap vertikal (`data-plx`) |
| Kursor | Default OS | **Kursor kustom** di dalam hero saja: titik presisi + cincin tertinggal + bracket kardinal saat di atas elemen interaktif (pointer presisi saja; reduced-motion tanpa lag) |
| Aksen warna | Oranye tunggal `oklch(.7 .176 49.3)` di atas netral zinc | **Sistem senja tunggal** (tanpa dark/light — toggle dihapus): seluruh situs satu palet marun hangat dengan aksen jingga `oklch(.74 .16 52)`; palet lanskap ber-token (`--sky-top/mid/horizon`, `--dusk-sun`, `--ridge-1..4`, `--cliff`) satu keluarga dengan section; badan tiap lapisan melebur ke latar halaman di bawah sehingga hero → section tanpa seam |
| Parameter gerak GSAP | power3.out, y 22–28, stagger .07–.08, trigger 85–88% | power2.out, y 18–24, stagger .09, trigger 86–90% |
| Strip indeks di kaki hero | Kartu kotak dengan backdrop blur + border | Baris tautan bergaris rambut atas, tanpa kotak |
| Pola CTA | Grid 56px + mask radial dari pojok kanan atas | **Titik 26px** + mask linear dari kiri bawah |
| Tekstur kartu kapabilitas | Dots 18px | Grid halus 28px |
| Sketsa canvas kartu | Editor kode mock, flow hub-spoke, dsb. | Sketsa reaktif kursor: baris terminal menyala, node git tertandai, baseline mengikuti, crosshair grafik; kartu miring (tilt 3D maks 3°) mengikuti pointer |
| Kartu bergerak sendiri | Editor yang mengetik + terminal deploy, partikel mengalir ke kotak AI, grafik neural | Aliran otonom v3 bergaya live-ops (mekanik sendiri, bukan tiruan): **layout + bus paket** (blok menyusun diri ke 3 tata letak, paket inspeksi mengalir di bus dan blok yang dilewati menyala, readout `lint N`), **orbit + sink** (paket request meluncur node→hub dan respons kembali, readout `sink N · id xxxx` bergilir), **path vektor berpenghuni** (Bézier menggambar dirinya + bermorfosis A↔B sementara titik penyusir berjalan terus, readout fase), **oscilloscope** (sinyal bergulir deterministik, penanda puncak, tick bergulir, probe kursor, readout `puncak 0.xx`) |
| Benda langit & pendaki | Tidak ada | Matahari besar pucat kiri-tengah dengan halo lembut; 7 burung siluet lima-titik mengepak (fase & ukuran acak); **pendaki berdiri di ujung tebing kiri** — bentuk Shape prosedural (ransel + tangan ke dahi), sama gelap dengan tebing |
| Interaksi klik-dan-tahan | Hold-to-charge 5 dtk memuat shader `intensity` + loader radial + musik riser Howler (mp3), lepas penuh membuka showreel Vimeo | (dihapus atas permintaan — scene kini murni scroll & pointer; tak ada interaksi tahan) |
| Navigasi | Header sticky standar: kiri logo + tautan, kanan CTA | **Header ala Forge, transparan penuh**: fixed tepi atas — tautan sosial kiri, wordmark **di tengah**, tombol menu kanan dengan **teks bergulir Menu↔Tutup + dua garis jadi X** (grid-stack, tanpa teks terpotong); menu = **overlay fullscreen** blur senja berisi 3 tautan besar bernomor + catatan + email/lokasi; clip-path wipe, link stagger; Esc/resize menutup |
| Animasi section | Reveal seragam | Tiga lapis: (1) reveal/stagger per elemen, (2) **parallax scrub** `data-plx`/`data-plx-cover` — cover kartu, visual kapabilitas, panel profil, dan strip indeks bergeser maju-mundur dengan kecepatan beda per kolom, (3) **bara senja** (three.js, 130 partikel aditif) di layer fixed paling belakang — tersembunyi selama fase pin, hidup di belakang section setelahnya dan ikut bergeser mengikuti scroll |
| Pembuka (opening) | Tidak ada | Loader CSS murni ~1,9 dtk: wordmark + garis jingga terisi lalu tirai naik; aman tanpa JS (animasi CSS), hilang saat reduced-motion; teks hero langsung beranimasi saat tirai terangkat |
| Hero (posisi) | Tengah simetris | **Komposisi kiri-bawah editorial**: status pill, nama besar, tagline, dan aksi rata kiri di atas lembah senja; strip indeks proyek tetap memenuhi kaki; foot naik-turun dengan parallax halus |
| Pembuka (opening) | Tidak ada | Loader CSS murni ~2,3 dtk: wordmark + garis jingga terisi lalu tirai naik; aman tanpa JS (animasi CSS), hilang saat reduced-motion; intro hero ditunda hingga tirai terangkat |
| Scrollbar | Default | Disembunyikan seluruh browser (`scrollbar-width: none` + `::-webkit-scrollbar`), scroll tetap berfungsi |

Font Geist dan pola umum (sticky header, kartu ber-border) adalah konvensi umum yang bukan milik siapa pun; komposisi lanskap, palet marun berlapis, dan parameter di atas semuanya orisinal — referensi gambar pengguna bersifat mood (lanskap senja berlapis), bukan penjiplakan bentuk.

---

*Dokumen dibuat dari audit live 2026-10-24. Mirror sumber tersimpan di `audit-mirror/` untuk dibandingkan langsung; screenshot before di `audit-mirror/.hallmark/before/` (desktop 1280/1440/1920 + mobile 375 per-3000px).*
