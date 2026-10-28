# Aplikasi Presensi Siswa Berbasis Pengenalan Wajah

Aplikasi web presensi siswa modern berbasis *biometric face recognition* dengan arsitektur monorepo (Express.js + React 19). Dirancang dengan prinsip **Mobile-First**, antarmuka intuitif bertema *Emerald Green*, serta performa tinggi untuk kemudahan guru dalam mencatat kehadiran kelas secara otomatis maupun manual.

---

## 🌟 Fitur Utama

- 📸 **Pemindaian Biometrik Wajah Real-Time:** Integrasi langsung dengan kamera perangkat via HTML5 WebRTC (`MediaDevices.getUserMedia`) dilengkapi *reticle frame* pembidik dan kontrol senter (*flashlight*).
- ⚡ **Konfirmasi Presensi Dinamis:** Sistem pengenalan otomatis dengan fleksibilitas pemilihan status (**Hadir**, **Izin**, **Sakit**, **Alpa**) langsung pada kartu konfirmasi sebelum disimpan.
- 📝 **Presensi Manual & Fleksibel:** Opsi pencatatan manual jika pengenalan wajah siswa terkendala, lengkap dengan input keterangan (*Surat sakit*, *Surat izin*, dll.).
- 👤 **Pendaftaran Citra Wajah Siswa:** Modul pendaftaran data biometrik siswa (*Face Enrollment*) dengan filter murid yang belum memiliki rekaman wajah.
- 📊 **Metrik & Filter Kehadiran Instan:** Kartu statistik numerik interaktif pada halaman absensi harian yang berfungsi ganda sebagai tombol filter daftar siswa.
- 📈 **Rekapitulasi Bulanan:** Laporan kehadiran per kelas dan periode bulan/tahun, persentase kehadiran kelas, tabel rincian harian, dan tombol ekspor rekap.
- 🔐 **Autentikasi & RBAC:** Sistem autentikasi berbasis JWT dengan pemisahan hak akses antara akun **GURU** (wali kelas) dan **ADMIN** (akses menyeluruh ke semua kelas).
- 📱 **Mobile-First Experience:** Tampilan dioptimalkan untuk browser ponsel guru dengan tipografi proporsional, kontrol *BottomNavigation*, dan komponen dropdown custom bertema emerald.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

### Frontend (`app/`)
* **Framework:** [React 19](https://react.dev/)
* **Build Tool:** [Vite 6](https://vitejs.dev/)
* **Routing:** [TanStack Router](https://tanstack.com/router) (File-based routing)
* **Data Fetching & State:** [TanStack Query](https://tanstack.com/query)
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
* **Ikon:** [Lucide React](https://lucide.dev/)
* **Hardware API:** WebRTC Camera Stream

### Backend (`server/`)
* **Runtime:** Node.js (v20+)
* **Framework:** [Express.js](https://expressjs.com/)
* **ORM:** [Prisma ORM 6](https://www.prisma.io/)
* **Database:** MySQL
* **Autentikasi:** JSON Web Token (JWT) & BcryptJS
* **Validasi Skema:** [Zod](https://zod.dev/)

---

## 📁 Struktur Direktori

```text
absensi-wajah-monorepo/
├── app/                      # Source code Frontend (React 19 + TanStack)
│   ├── components/           # Komponen UI reusable (Button, CustomDropdown, Modals, dll.)
│   ├── lib/                  # Klien API (fetch wrapper, storage helper, toast)
│   ├── routes/               # Halaman aplikasi (beranda, absensi, rekap, profil, pindai)
│   ├── types/                # Definisi TypeScript untuk presensi dan profil
│   ├── main.tsx              # Entry point aplikasi frontend
│   └── styles.css            # Konfigurasi Tailwind CSS & global styling
├── server/                   # Source code Backend (Node.js + Express)
│   ├── db/                   # Inisialisasi Prisma & Repository Database
│   ├── middleware/           # Auth JWT, RBAC check, rate limiting, validasi Zod
│   ├── routes/               # REST API endpoints (auth, classes, students, attendance)
│   ├── schemas/              # Skema validasi payload Zod
│   ├── utils/                # Utilitas pencocokan wajah & ekstraksi vektor
│   ├── app.ts                # Konfigurasi Express app
│   └── index.ts              # Server entry point (Port 3001)
├── prisma/                   # Skema database & seeder
│   ├── schema.prisma         # Model Teacher, Class, Student, Session, Record
│   └── seed.ts               # Data awal guru, kelas, dan siswa
├── AGENT.md                  # Panduan teknis & standar kualitas kode AI Agent
├── prd_frontend_aplikasi_absensi.md # Spesifikasi fungsionalitas UI frontend
├── prd_backend_aplikasi_absensi.md  # Spesifikasi teknis REST API backend
└── vite.config.ts            # Konfigurasi Vite & TanStack Router plugin
```

---

## 🚀 Memulai Proyek (Getting Started)

### 1. Prasyarat Sistem
* [Node.js](https://nodejs.org/) versi 20 ke atas
* [MySQL](https://www.mysql.com/) server (XAMPP, MySQL Server, atau Docker)
* Git

### 2. Kloning Repository
```bash
git clone https://github.com/assasaqi/absensi-wajah-monorepo.git
cd absensi-wajah-monorepo
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi database MySQL Anda di dalam file `.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/absensi_wajah"
JWT_SECRET="hadir-absensi-wajah-super-secret-jwt-key-2026"
PORT=3001
NODE_ENV="development"
```

### 5. Migrasi & Seeding Database
Jalankan perintah sinkronisasi skema Prisma dan pengisian data dummy awal:
```bash
npm run db:push
npm run db:seed
```

### 6. Menjalankan Aplikasi
Jalankan server backend Express dan frontend Vite secara bersamaan:
```bash
npm run dev
```
- **Aplikasi Frontend Web:** `http://localhost:5173`
- **Server Backend API:** `http://localhost:3001`

---

## 🔑 Kredensial Akun Percobaan (Seeded)

| Peran (Role) | NIP / Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **GURU** | `198501102010011002` | `guru123` | Siti Rahmawati, S.Pd. (Wali Kelas XII IPS 1) |
| **GURU** | `198204241990022001` | `guru123` | Budi Santoso, S.Pd. (Wali Kelas XI IPA 1) |
| **ADMIN** | `198001012005011003` | `admin123` | Admin Sekolah (Akses Penuh Semua Kelas) |

---

## 📜 Perintah NPM yang Tersedia

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan backend API & frontend Vite secara bersamaan (*concurrently*) |
| `npm run dev:web` | Menjalankan server pengembangan frontend Vite saja |
| `npm run dev:api` | Menjalankan server backend Express dengan hot-reload (*tsx watch*) |
| `npm run db:push` | Mendorong perubahan skema Prisma ke database MySQL |
| `npm run db:seed` | Menjalankan script seeder data awal guru, murid, dan kelas |
| `npm run db:migrate`| Membuat migrasi SQL resmi dari skema Prisma |
| `npm run test` | Menjalankan unit test dengan Vitest |

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
