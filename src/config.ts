/* Konfigurasi konten portfolio — SATU FILE UNTUK SEMUA KONTEN.
   Identitas, tentang, kapabilitas, dan tautan diambil dari portfolio lama
   (my-new-portfolio-five-rouge.vercel.app) — data asli Dika Pangestu.
   Contoh proyek masih menunggu data asli (halaman Projects portfolio lama error).
   Aturan: jangan menaruh metrik/testimoni yang tidak bisa Anda buktikan. */

export interface Project {
  title: string;
  summary: string;                                   // satu kalimat: apa yang dibangun + hasilnya
  kind?: string;                                     // jenis proyek, mis. "Aplikasi PWA"
  year?: string;                                     // tahun pengerjaan
  description?: string[];                            // paragraf untuk halaman detail proyek
  href?: string;                                     // link live demo / repo (external)
  image?: string;                                    // path screenshot asli, mis. "/images/projek-1.png" (taruh di public/)
  badges?: string[];                                 // stack/teknologi
  metrics?: { label: string; value: string }[];      // hanya angka yang bisa dibuktikan
}

export interface Capability {
  title: string;
  description: string;
  tools?: string[];                                  // chip teknologi di kartu
  viz?: 'code' | 'api' | 'design' | 'perf';          // sketsa canvas di kartu
}

export const site = {
  name: "Dika Pangestu",
  role: "Frontend Developer",
  tagline: "Membangun web modern, interaktif, dan responsif dengan fokus desain dan performa.",
  status: "Terbuka untuk proyek baru",
  email: "dikaphangestu@gmail.com",
  location: "Malang, Indonesia",
  links: [
    { label: "GitHub", href: "https://github.com/Kay2fd" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/dika-pangestu/" },
  ],
};

export const projects: Project[] = [
  // GANTI: halaman Projects portfolio lama error ("There was an error loading projects"),
  // jadi proyek asli belum bisa dipindahkan. Ganti tiga contoh ini dengan proyek Anda
  // (GitHub repo / live demo), atau kosongkan array untuk menyembunyikan section.
  {
    title: "Kasir Pintar",
    summary: "Aplikasi kasir dan manajemen stok berbasis PWA yang tetap jalan tanpa koneksi internet.",
    kind: "Aplikasi PWA",
    year: "2025",
    description: [
      "Kasir Pintar dibangun untuk pemilik warung yang butuh pencatatan transaksi sederhana namun andal. Antarmukanya dirancang agar bisa dipakai satu tangan, dan seluruh data tersinkron otomatis saat koneksi kembali.",
      "Sisi backend menangani stok, laporan harian, dan ekspor pembukuan dalam format spreadsheet.",
    ],
    href: "/projek/kasir-pintar",
    badges: ["Vue 3", "Supabase", "PWA"],
    // image: "/images/kasir-pintar.png",  // taruh screenshot asli di public/images/ lalu aktifkan baris ini
  },
  {
    title: "Lacak Paket",
    summary: "Dasbor pelacakan kiriman dengan peta waktu-nyata dan notifikasi status lewat WhatsApp.",
    kind: "Dasbor web",
    year: "2024",
    description: [
      "Lacak Paket menyatukan data beberapa kurir ke dalam satu dasbor. Pengguna bisa memantau posisi kiriman di peta dan menerima ringkasan status harian tanpa membuka aplikasi.",
    ],
    href: "/projek/lacak-paket",
    badges: ["React", "Node.js", "PostgreSQL"],
    // image: "/images/lacak-paket.png",
  },
  {
    title: "SekolahKu",
    summary: "Sistem informasi sekolah untuk absensi, jadwal, dan rapor yang dipakai guru dan wali murid.",
    kind: "Sistem informasi",
    year: "2023",
    description: [
      "SekolahKu menggantikan pencatatan manual di sekolah: absensi harian, jadwal pelajaran, dan rapor semester tersaji dalam satu tempat dengan hak akses terpisah antara guru, wali murid, dan admin.",
    ],
    href: "/projek/sekolahku",
    badges: ["Laravel", "Filament", "MySQL"],
    // image: "/images/sekolahku.png",
  },
];

/* Dipetakan dari "What I Do" portfolio lama (6 item) ke 4 kartu */
export const capabilities: Capability[] = [
  {
    title: "Pengembangan web",
    description: "Kode rapi dan mudah dipelihara, dari komponen antarmuka sampai halaman responsif di semua ukuran layar.",
    tools: ["React", "TypeScript", "Next.js", "Tailwind"],
    viz: "code",
  },
  {
    title: "API & integrasi",
    description: "Menghubungkan aplikasi dengan layanan pihak ketiga untuk memperluas fungsionalitas.",
    tools: ["Node.js", "Firebase", "Laravel"],
    viz: "api",
  },
  {
    title: "UI/UX & design system",
    description: "Antarmuka intuitif dengan fokus pada pengalaman dan aksesibilitas pengguna.",
    tools: ["Figma", "Design token"],
    viz: "design",
  },
  {
    title: "Optimasi & performa",
    description: "Aplikasi cepat dan efisien, dari MVP sampai solusi yang siap tumbuh.",
    tools: ["Lighthouse", "Web Vitals", "Vercel"],
    viz: "perf",
  },
];

/* Tentang — dari halaman About portfolio lama */
export const about: string[] = [
  "Mahasiswa Software Engineering tingkat akhir yang tengah magang sebagai Frontend Developer di sebuah startup teknologi.",
  "Perjalanan saya mulai dari rasa penasaran cara kerja website, kini tumbuh menjadi kegemaran membangun antarmuka responsif.",
];

/* Fun facts — dari "Fun Facts About Me" portfolio lama */
export const funFacts: string[] = [
  "Gitar & drum",
  "Pendaki gunung",
  "Pembaca rajin",
  "Belajar bahasa Jerman",
  "Ngoding 10 PM sampai 2 AM",
  "Penikmat kopi",
];

export function projectSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
