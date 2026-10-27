/* Konfigurasi konten portfolio — SATU FILE UNTUK SEMUA KONTEN.
   Data asli diambil live dari Supabase milik portfolio lama
   (my-new-portfolio-five-rouge.vercel.app): tabel `profile` dan `projects`.
   Semua proyek, deskripsi, dan fakta di bawah adalah milik Dika Pangestu. */

export interface Project {
  title: string;
  summary: string; // satu kalimat: apa yang dibangun + hasilnya
  kind?: string; // jenis proyek, mis. "Aplikasi PWA"
  year?: string; // tahun pengerjaan
  description?: string[]; // paragraf untuk halaman detail proyek
  href?: string; // path halaman detail internal (auto)
  external?: string; // link live demo / repo (external)
  image?: string; // path screenshot asli (public/images/projects/)
  badges?: string[]; // stack/teknologi
  metrics?: { label: string; value: string }[]; // hanya angka yang bisa dibuktikan
}

export interface Capability {
  title: string;
  description: string;
  tools?: string[]; // chip teknologi di kartu
  viz?: "code" | "api" | "design" | "perf"; // sketsa canvas di kartu
}

export const site = {
  name: "Dika Pangestu",
  role: "Full-Stack Developer",
  tagline:
    "Membangun web modern, interaktif, dan responsif dengan fokus desain dan performa.",
  status: "Terbuka untuk proyek baru",
  email: "dikaphangestu@gmail.com",
  location: "Malang, Indonesia",
  links: [
    { label: "GitHub", href: "https://github.com/Kay2fd" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/dika-pangestu/" },
  ],
};

/* Proyek asli dari Supabase (tabel projects) — 6 proyek nyata */
export const projects: Project[] = [
  {
    title: "Game Hosting Template Company",
    summary:
      "Template landing page responsif untuk perusahaan hosting server game.",
    kind: "Template web",
    year: "2025",
    description: [
      "Template landing page responsif untuk perusahaan fiktif penyedia hosting server game. Dibangun dengan React, Vite, dan Tailwind CSS, template ini menyajikan antarmuka yang ramping dan penuh tampilan gaming.",
      "Fokus proyek ini adalah kecepatan render dan fleksibilitas komponen — setiap bagian dapat dipakai ulang dan disesuaikan untuk klien nyata.",
    ],
    href: "/projek/game-hosting-template-company",
    external: "https://game-host-app.vercel.app",
    image: "/images/projects/game-hosting-template-company.png",
    badges: ["React", "Vite", "Tailwind"],
  },
  {
    title: "Antam Audithink",
    summary:
      "Aplikasi audit internal yang mendigitalisasi alur kerja audit.",
    kind: "Aplikasi internal",
    year: "2025",
    description: [
      "Audithink adalah aplikasi audit internal menyeluruh untuk menyederhanakan dan mempercepat proses audit dalam lingkungan perusahaan melalui digitalisasi menyeluruh.",
      "Sistem mencakup seluruh siklus hidup audit — perencanaan, pelaksanaan, dokumentasi, dan pelaporan — dalam satu alur kerja digital. Auditor dapat mengelola jadwal, melacak temuan, menugaskan pekerjaan, dan menyusun laporan terstruktur.",
      "Dengan meminimalkan prosedur manual, aplikasi ini menurunkan beban operasional sekaligus meningkatkan kepatuhan dan ketertelusuran.",
    ],
    href: "/projek/antam-audithink",
    image: "/images/projects/antam-audithink.png",
    badges: ["React", "Material UI", "Laravel"],
  },
  {
    title: "Evolearn",
    summary:
      "Platform edukasi digital dengan e-learning dan bootcamp.",
    kind: "Platform edukasi",
    year: "2025",
    description: [
      "Evolearn adalah platform pembelajaran digital modern yang dirancang untuk menghadirkan pendidikan yang fleksibel dan relevan dengan industri melalui berbagai format: e-learning mandiri, bootcamp imersif, dan pelatihan berbasis proyek.",
      "Platform ini memberdayakan pengguna untuk membangun keterampilan dunia nyata dengan pengalaman belajar yang adaptif dan langsung terhubung dengan kebutuhan industri.",
    ],
    href: "/projek/evolearn",
    image: "/images/projects/evolearn.png",
    badges: ["Next.js", "Tailwind", "Laravel"],
  },
  {
    title: "Coffe-Shop Template Company",
    summary:
      "Website pemesanan kopi minimalis dan responsif.",
    kind: "Template web",
    year: "2025",
    description: [
      "KayFee Shop adalah website pemesanan kopi minimalis. Pengguna dapat menelusuri dan memilih minuman kopi dengan mudah lewat antarmuka yang intuitif.",
      "Proyek berfokus pada UI yang bersih, performa, dan praktik front-end modern.",
    ],
    href: "/projek/coffe-shop-template-company",
    external: "https://coffe-shop-nine-mu.vercel.app",
    image: "/images/projects/coffe-shop-template-company.png",
    badges: ["React", "Tailwind"],
  },
  {
    title: "Nitro Game Hosting",
    summary:
      "Template hosting game futuristik dengan tata letak responsif.",
    kind: "Template web",
    year: "2026",
    description: [
      "Nitro Game Host adalah template hosting web yang sepenuhnya responsif dan modern, dirancang khusus untuk bisnis penyedia server game dan platform layanan digital.",
      "Dibangun dengan React, Next.js, TypeScript, dan Tailwind CSS, template ini menampilkan desain UI yang ramping, tata letak adaptif, dan elemen interaktif bernuansa gaming.",
    ],
    href: "/projek/nitro-game-hosting",
    external: "https://nitro-game-host.vercel.app",
    image: "/images/projects/nitro-game-hosting.png",
    badges: ["React", "Next.js", "TypeScript", "Tailwind"],
  },
  {
    title: "PTPN Audithink",
    summary:
      "Aplikasi audit internal untuk PTPN.",
    kind: "Aplikasi internal",
    year: "2026",
    description: [
      "Audithink untuk PTPN adalah aplikasi audit internal yang mendigitalisasi alur kerja audit agar lebih efisien, akurat, dan transparan.",
      "Aplikasi ini dirancang untuk tim audit perusahaan: mengelola jadwal, melacak temuan, dan menyusun laporan dalam satu alur kerja terpadu.",
    ],
    href: "/projek/ptpn-audithink",
    image: "/images/projects/ptpn-audithink.png",
    badges: ["React", "TypeScript", "Bootstrap", "Laravel"],
  },
];

/* Dipetakan dari "What I Do" portfolio lama (6 item) ke 4 kartu */
export const capabilities: Capability[] = [
  {
    title: "Pengembangan web",
    description:
      "Kode rapi dan mudah dipelihara, dari komponen antarmuka sampai halaman responsif di semua ukuran layar.",
    tools: ["React", "TypeScript", "Next.js", "Tailwind"],
    viz: "code",
  },
  {
    title: "API & integrasi",
    description:
      "Menghubungkan aplikasi dengan layanan pihak ketiga untuk memperluas fungsionalitas.",
    tools: ["Node.js", "Laravel", "MySQL"],
    viz: "api",
  },
  {
    title: "UI/UX & design system",
    description:
      "Antarmuka intuitif dengan fokus pada pengalaman dan aksesibilitas pengguna.",
    tools: ["Figma", "Design token"],
    viz: "design",
  },
  {
    title: "Optimasi & performa",
    description:
      "Aplikasi cepat dan efisien, dari MVP sampai solusi yang siap tumbuh.",
    tools: ["Lighthouse", "Cypress", "Vercel"],
    viz: "perf",
  },
];

/* Tentang — dari tabel profile Supabase (bio asli, diterjemahkan ringkas) */
export const about: string[] = [
  "Frontend Engineer berpengalaman membangun aplikasi web responsif dan interaktif dengan React serta Tailwind.",
  "Perjalanan saya mulai dari rasa penasaran cara kerja website hingga kegemaran membangun antarmuka yang presisi.",
];

/* Fakta singkat — dari quick_facts Supabase + halaman About lama */
export const funFacts: string[] = [
  "Di tahun terakhir kuliah Software Engineering",
  "Magang Frontend Developer di startup teknologi",
  "Gitar & drum",
  "Pendaki gunung",
  "Pembaca rajin",
  "Penikmat kopi",
];

export function projectSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
