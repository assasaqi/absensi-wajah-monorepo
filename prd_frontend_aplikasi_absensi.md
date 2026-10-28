# Product Requirements Document (PRD)

**Nama Produk:** Aplikasi Web Absensi Pengenalan Wajah (Frontend)  
**Status:** Aktif & Diperbarui  
**Target Platform:** Mobile Web Browser (Responsif Mobile-First)  

---

## 1. Tujuan Dokumen
Mendefinisikan spesifikasi fungsionalitas antarmuka pengguna (UI), arsitektur komponen, serta alur interaksi pengguna untuk frontend aplikasi web absensi sekolah berbasis pengenalan biometrik wajah.

---

## 2. Tumpukan Teknologi
* **Runtime & Bundler:** Vite 6, Node.js.
* **Framework:** React 19.
* **Routing:** TanStack Router (File-based routing pada direktori `app/routes/`).
* **Styling:** Tailwind CSS 4 dengan tema warna utama Emerald Green (`#146350`, `#E2F2EC`, `#E9F4EF`) dan palet netral (`#E6E4DD`, `#6E6D68`, `#171D1B`).
* **Ikonografi:** Lucide React (`lucide-react`).
* **Media/Hardware API:** HTML5 WebRTC `MediaDevices.getUserMedia()` untuk integrasi kamera ponsel/laptop.

---

## 3. Spesifikasi Rute dan Antarmuka Pengguna (UI/UX)

### 3.1. Beranda Guru (`/beranda`)
* **Header:**
  * **Sisi Kiri:** Avatar profil guru (lingkaran inisial dengan link navigasi langsung ke `/profil`).
  * **Samping Avatar:** Teks sapaan (*Selamat pagi* untuk guru / *Selamat datang* untuk admin) dan nama guru (`text-base font-extrabold`).
* **Kartu Kelas Aktif:**
  * Menampilkan tanggal hari ini (uppercase), ikon kalender, label *Kelas aktif*, nama kelas (contoh: *XI IPA 1*), dan lencana jumlah siswa.
  * Tampil bersih dan terfokus tanpa tombol presensi duplikat atau daftar kelas redundant di bawahnya.
* **Navigasi Bawah:** Bar navigasi `BottomNavigation` dengan tab aktif pada *Beranda*.

### 3.2. Pemindaian Wajah Kamera (`/pindai`)
* **Layar Kamera Penuh:** Mengakses kamera perangkat secara langsung via WebRTC menggunakan komponen `CameraViewport`.
* **Overlay Pembidik:** Bingkai target wajah, status kamera aktif, dan instruksi penyesuaian wajah.
* **Kontrol Kamera:**
  * Tombol kontrol hidup/mati senter (*Flashlight*).
  * Tombol uji simulasi perizinan kamera (*permission simulation*).
* **Fallback Presensi Manual:**
  * Tautan *"Pengenalan gagal? Absen manual"* yang membuka `ManualAttendanceModal`.
  * Saat siswa dan status dipilih manual, status disimpan ke database dan diarahkan ke rute konfirmasi.

### 3.3. Konfirmasi Kehadiran Siswa (`/pindai/konfirmasi`)
* **Pemicu:** Tampil otomatis setelah kamera mendeteksi wajah siswa atau setelah pemilihan manual dari kamera.
* **Informasi Siswa:** Menampilkan nama siswa, NIS, nomor absen, tanggal, waktu scan, nama kelas, dan metode absensi (*Pengenalan wajah* / *Input manual*).
* **Pemilih Status Interaktif (Hadir, Izin, Sakit, Alpa):**
  * Guru dapat memilih status kehadiran langsung pada kartu sebelum menyimpan.
  * Lencana status (*StatusBadge*) langsung berubah secara *real-time* mengikuti pilihan guru.
* **Aksi Konfirmasi Dinamis:**
  * Tombol utama: **"Konfirmasi [Status] & Selesai"** (contoh: *Konfirmasi Hadir & Selesai* atau *Konfirmasi Sakit & Selesai*).
  * Tombol sekunder: **"Konfirmasi & Pindai Siswa Berikutnya"**.
  * Tombol *"Tolak / pindai ulang"* (kembali ke `/pindai`).
  * Tombol *"Pilih manual"* untuk memilih siswa lain dari modal.

### 3.4. Absensi Kelas Harian (`/absensi`)
* **Header & Tanggal:** Menampilkan nama guru, informasi kelas wali, tanggal bahasa Indonesia, dan jam batas masuk (07.30 WIB).
* **Filter Kelas Kustom:** Menggunakan komponen bertema `CustomDropdown` (tanpa `<select>` native HTML).
* **Aksi Cepat:** Tombol *Pindai wajah* yang mengarahkan langsung ke kamera `/pindai`.
* **4 Kartu Metrik Interaktif (`StatCard`):**
  * Angka jumlah **Hadir**, **Izin**, **Sakit**, dan **Alpa**.
  * Berfungsi sebagai tombol filter instan untuk menyaring daftar siswa di bawahnya.
* **Pencarian Real-Time:** Input pencarian berdasarkan nama, NIS, atau nomor absen siswa dilengkapi tombol reset.
* **Daftar Status Siswa:**
  * Menampilkan inisial avatar berwarna, nama siswa, nomor absen, catatan kehadiran, dan `StatusBadge`.
  * Klik pada baris siswa membuka modal detail siswa (`StudentDetailModal`).
* **Modal Interaktif Terkait:**
  * `StudentDetailModal`: Informasi profil siswa, persentase kehadiran, dan riwayat presensi individual.
  * `ManualAttendanceModal`: Ubah status kehadiran siswa secara manual.
  * `FaceEnrollmentModal`: Pendaftaran data foto/biometrik wajah siswa.

### 3.5. Tinjauan Sesi Absensi (`/sesi/tinjau`)
* **Header:** Menampilkan nama kelas dan tanggal sesi.
* **Progress Bar Kehadiran:** Menampilkan persentase kehadiran kelas secara visual.
* **Statistik Numerik:** Total Hadir, Izin, Sakit, dan Belum Tercatat.
* **Daftar Siswa Terpindai:** Baris siswa yang dapat diklik untuk mengubah status kehadiran jika terdapat kekeliruan.
* **Catatan Guru:** Textarea untuk menambahkan catatan penutup sesi.
* **Aksi Utama:** Tombol *"Simpan hasil sesi"* yang menyelesaikan sesi absensi (mengubah siswa *Belum Tercatat* menjadi *Alpa*).

### 3.6. Rekap Absensi Bulanan (`/rekap`)
* **Filter Ganda Kustom:** Dua `CustomDropdown` untuk pemilihan Kelas dan Periode Bulan/Tahun.
* **Metrik Utama:** Kartu persentase kehadiran bulanan dan rasio kehadiran total kelas.
* **Statistik Akumulasi:** Total akumulasi Hadir, Izin, Sakit, dan Alpa dalam satu bulan.
* **Rincian Harian:** Tabel/daftar kehadiran per tanggal sekolah.
* **Aksi Unduh:** Tombol ekspor laporan absensi.

### 3.7. Profil Guru & Pengaturan (`/profil`)
* **Header Profil:**
  * Avatar inisial di sebelah kiri.
  * Nama guru (`text-base font-extrabold`) dan NIP di bawah nama.
  * Lencana peran/mata pelajaran di sisi kanan atas (contoh: *GURU SOSIOLOGI* atau *ADMIN*).
* **Pendaftaran Wajah Siswa:**
  * Tombol mandiri yang membuka `FaceEnrollmentListModal`.
  * Modal menyediakan tab filter *"Belum Discan"* dan *"Semua Murid"*, pencarian murid, serta opsi membuka kamera pendaftaran biometrik.
* **Kartu Navigasi Pintas:** Tautan cepat menuju rute Pindai Wajah, Tinjau Sesi, Absensi Kelas, dan Rekap Absensi.
* **Tombol Keluar:** Diletakkan di **paling bawah sebelah kiri** dengan dialog konfirmasi `ConfirmModal` sebelum menghapus sesi login.

---

## 4. Arsitektur Komponen Reusable (`app/components/`)
1. **`BottomNavigation`:** Bar navigasi bawah mobile dengan indikator tab aktif.
2. **`CustomDropdown`:** Dropdown menu custom dengan styling hijau emerald dan animasi popover (pengganti tag `<select>`).
3. **`StatusBadge`:** Lencana status kehadiran (`hadir`, `izin`, `sakit`, `alpa`, `belum_tercatat`) dengan varian style *daily* dan *session*.
4. **`StatCard`:** Kartu statistik numerik dengan background warna dinamis sesuai status kehadiran.
5. **`CameraViewport`:** Komponen wrapper kamera WebRTC dengan animasi garis pembidik biometrik.
6. **`Button`:** Komponen tombol dengan varian `primary`, `secondary`, `outline`, dan `ghost`.
7. **`ManualAttendanceModal`:** Modal pemilihan murid dan status kehadiran secara manual dengan visual feedback langsung.
8. **`StudentDetailModal`:** Modal profil dan riwayat presensi individual murid.
9. **`FaceEnrollmentModal`:** Modal pendaftaran dan penangkapan citra biometrik wajah siswa via kamera/kanvas simulasi.
10. **`FaceEnrollmentListModal`:** Modal daftar filter siswa yang belum memiliki data scan wajah.
11. **`ConfirmModal`:** Dialog konfirmasi tindakan penting (seperti logout sesi).

---

## 5. Pedoman Kualitas & Standar Desain
* **Bebas AI Slop:** Dilarang mencantumkan teks teknis database (seperti *"MySQL"*) pada elemen UI yang dilihat oleh guru/pengguna.
* **Mobile-First & Clean:** Tampilan dibatasi pada kontainer `max-w-[440px]` di desktop dengan bayangan halus untuk mensimulasikan layar ponsel secara elegan.
* **Tipografi Proporsional:** Menggunakan ukuran font ringkas (`text-[10px]` hingga `text-base`) agar tata letak tidak berdesakan di layar ponsel.
