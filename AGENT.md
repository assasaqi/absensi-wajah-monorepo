# AGENT.MD — Panduan & Aturan AI Coding Agent

Dokumen ini berisi panduan teknis, aturan arsitektur, dan pedoman kerja untuk AI Coding Agent yang bekerja pada repositori **Aplikasi Absensi Pengenalan Wajah**.

---

## 1. Ringkasan Proyek & Arsitektur

* **Jenis Proyek:** Monorepo aplikasi absensi sekolah berbasis pengenalan biometrik wajah.
* **Target Antarmuka:** *Mobile-First Web Browser* (responsif pada viewport mobile phone / tablet, terpusat pada desktop).
* **Frontend (`app/`):**
  * React 19, Vite, TanStack Router (file-based routing pada `app/routes/`), TanStack Query.
  * Tailwind CSS dengan tema warna utama Emerald Hijau (`#146350`, `#E2F2EC`, `#E9F4EF`) dan abu-abu netral (`#E6E4DD`, `#6E6D68`).
  * Ikon: `lucide-react`.
* **Backend (`server/`):**
  * Node.js, Express.js (REST API pada prefix `/api/`).
  * Prisma ORM (`prisma/schema.prisma`) menghubungkan ke MySQL.
  * Autentikasi: JWT Bearer Token dengan role `GURU` dan `ADMIN`.
  * Validasi Payload: Zod (`server/schemas/validation.ts`).

---

## 2. Aturan Anti-AI Slop (Kualitas Kode & Desain)

Setiap agen yang memodifikasi atau menambahkan kode dalam repositori ini **WAJIB** mematuhi aturan berikut:

### 2.1 Jangan Menggunakan Teks Teknis Backend / Database pada UI
* **DILARANG** menampilkan istilah internal seperti *"disimpan di MySQL"*, *"data dari MySQL"*, *"query backend"*, *"Prisma error"*, atau detail infrastruktur lain pada tampilan pengguna (UI).
* Gunakan bahasa berorientasi pengguna dan pendidikan yang natural (misal: *"Status kehadiran berhasil disimpan"*, *"Memuat data presensi..."*).

### 2.2 Hindari "AI Boilerplate Slop" & Abstraksi Berlebihan
* Jangan menambahkan library utilitas, wrapper fungsi generic, factory class, atau mocking layer yang tidak dibutuhkan.
* Jangan menulis komentar kode basa-basi (misal: `// ini fungsi render button`, `// handle click button`). Tulis komentar hanya jika menjelaskan logika bisnis atau algoritma non-trivial.
* Jangan menambahkan notifikasi popup atau modal konfirmasi yang tidak diminta (misal: dilarang menampilkan notifikasi *"Login Berhasil"* yang mengganggu transisi pengguna).

### 2.3 Desain & Tipografi Ringkas (Mobile-First)
* Pertahankan ukuran font yang proporsional dan kompak sesuai arahan proyek (`text-xs`, `text-sm`, `text-[10px]` s/d `text-[11px]` untuk label/metadata).
* Selalu gunakan komponen **`CustomDropdown`** untuk semua pilihan dropdown. **DILARANG** menggunakan tag `<select>` native HTML karena merusak konsistensi tema emerald.
* Lencana status kehadiran harus menggunakan komponen standar **`StatusBadge`** (`hadir`, `izin`, `sakit`, `alpa`, `belum_tercatat`).

### 2.4 Tidak Mengubah Logika Tanpa Izin
* Pertahankan struktur data dan aturan bisnis:
  * Jam batas absensi (07.30 WIB).
  * Status kehadiran: `HADIR`, `IZIN`, `SAKIT`, `ALPA`, `BELUM_TERCATAT`.
  * Guru hanya memiliki akses kelasnya sendiri, sedangkan `ADMIN` memiliki hak akses semua kelas (`Akses Semua Kelas`).
* Jangan meng-hardcode status kehadiran (misal: dilarang meng-hardcode `'hadir'` saat menyimpan konfirmasi jika pengguna memilih status lain seperti `'sakit'`).

### 2.5 DILARANG Menjalankan `npm run build` Secara Otomatis
* Agen **DILARANG KERAS** mengeksekusi perintah `npm run build`, `vite build`, `npx vite build`, atau build script lainnya secara otomatis setelah menyelesaikan pengeditan kode, kecuali diminta secara eksplisit oleh pengguna.
* Menjalankan build secara otomatis memakan waktu dan berpotensi hang / memicu timeout pada sandbox terminal.
* Cukup pastikan kode bersih, tipe data TypeScript valid, dan komponen terintegrasi dengan benar tanpa perlu memicu proses build otomatis.

---

## 3. Struktur Rute & Konvensi UI Frontend

Semua rute berada di folder `app/routes/`:

1. **`/beranda` (`beranda.tsx`):**
   * Header: Avatar foto/inisial di sebelah kiri, sapaan (*Selamat pagi / Selamat datang*) dan nama guru di sebelah kanan avatar.
   * Banner Kelas Aktif: Menampilkan tanggal, nama kelas aktif, dan jumlah siswa. Bersih tanpa tombol presensi ganda atau daftar murid yang tidak diperlukan.
   * Navigasi Bawah: `BottomNavigation` aktif di tab Beranda.

2. **`/absensi` (`absensi.tsx`):**
   * Filter kelas menggunakan `CustomDropdown`.
   * 4 Kartu Metrik Kehadiran (`StatCard`: Hadir, Izin, Sakit, Alpa) yang berfungsi ganda sebagai filter klik.
   * Pencarian nama/nomor absen siswa secara *real-time*.
   * Daftar siswa dengan klik baris untuk membuka `StudentDetailModal`, yang dapat membuka `ManualAttendanceModal` atau `FaceEnrollmentModal`.

3. **`/pindai` (`pindai.index.tsx`):**
   * Kamera viewport WebRTC (`CameraViewport`) untuk mendeteksi wajah siswa secara real-time.
   * Tombol kontrol senter (*flashlight*).
   * Tautan fallback presensi manual jika kamera gagal mengenali siswa.

4. **`/pindai/konfirmasi` (`pindai.konfirmasi.tsx`):**
   * Tampil setelah wajah dikenali atau siswa dipilih manual dari kamera.
   * **Wajib** menyediakan tombol pemilih status (**Hadir**, **Izin**, **Sakit**, **Alpa**) langsung pada kartu.
   * Tombol aksi utama dinamis (`Konfirmasi [Status] & Selesai` dan `Konfirmasi & Pindai Siswa Berikutnya`). Status yang disimpan harus sesuai dengan yang dipilih guru.

5. **`/sesi/tinjau` (`sesi.tinjau.tsx`):**
   * Tinjauan hasil akhir pemindaian sesi aktif.
   * Input catatan guru dan tombol konfirmasi penyelesaian sesi (mengubah sisa siswa belum tercatat menjadi `ALPA`).

6. **`/rekap` (`rekap.tsx`):**
   * Rekapitulasi bulanan menggunakan dua `CustomDropdown` (Kelas dan Bulan/Tahun).
   * Persentase kehadiran kelas, total akumulasi, rincian hari, dan tombol ekspor laporan.

7. **`/profil` (`profil.tsx`):**
   * Header: Avatar inisial di sisi kiri, nama guru (`text-base font-extrabold`) dan NIP di bawah nama.
   * Badge peran/mata pelajaran di sisi kanan atas (contoh: *GURU SOSIOLOGI* / *ADMIN*).
   * Tombol utama **"Pendaftaran Wajah Siswa"** yang membuka `FaceEnrollmentListModal`.
   * Menu navigasi cepat ke rute-rute utama.
   * Tombol **Keluar** diletakkan di **paling bawah sebelah kiri** dengan konfirmasi dialog `ConfirmModal`.

---

## 4. Konvensi Backend & Database

* **ORM:** Prisma Client diinisialisasi secara tersentral di `server/db/prisma.ts`.
* **Repository Pattern:** Semua interaksi database MySQL dieksekusi melalui metode di `server/db/repository.ts`.
* **Keamanan:**
  * Endpoint `/api/classes/*`, `/api/students/*`, dan `/api/attendance/*` diproteksi middleware `authenticateJWT`.
  * Cek otorisasi kelas guru menggunakan helper `checkClassAccess`.
* **Upsert Presensi:**
  * Penginputan status presensi harus menyertakan catatan standar:
    * `HADIR`: `'Wajah cocok'` atau `'Hadir manual'`
    * `IZIN`: `'Surat izin'` atau keterangan dari guru
    * `SAKIT`: `'Surat sakit'`
    * `ALPA`: `'Tanpa keterangan'`

---

## 5. Menjalankan & Memvalidasi Proyek

* **Menjalankan Dev Server:**
  ```bash
  npm run dev          # Menjalankan backend Express (port 3001) & frontend Vite secara bersamaan
  npm run dev:web      # Menjalankan frontend Vite saja
  npm run dev:api      # Menjalankan backend Express saja
  ```
* **Database & Prisma:**
  ```bash
  npm run db:push      # Push skema Prisma ke database MySQL
  npm run db:seed      # Seed data awal guru, kelas, dan murid
  ```
* **Build (Hanya Jika Diminta Eksplisit Oleh Pengguna):**
  * Agen dilarang menjalankan perintah ini secara otomatis.
  ```bash
  npm run build        # Build Vite & validasi TypeScript (HANYA jika diperintahkan pengguna)
  ```
